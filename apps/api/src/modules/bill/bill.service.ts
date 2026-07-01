import { Injectable, NotFoundException } from '@nestjs/common';
import { TableStatus } from '../../common/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Bill } from './entities/bill.entity';
import { Tab } from '../tab/entities/tab.entity';
import { Order } from '../order/entities/order.entity';
import { Table } from '../table/entities/table.entity';
import { MenuItem } from '../menu/entities/menu-item.entity';
import { User } from '../user/entities/user.entity';
import { Branch } from '../branch/entities/branch.entity';
import { Business } from '../business/entities/business.entity';
import { GenerateBillDto } from './dto/generate-bill.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';

@Injectable()
export class BillService {
  constructor(
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    @InjectRepository(Tab)
    private tabRepository: Repository<Tab>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(MenuItem)
    private menuItemRepository: Repository<MenuItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
    private dataSource: DataSource,
  ) {}

  async generateBill(tabId: string, userId: string, generateBillDto?: GenerateBillDto) {
    const orders = await this.orderRepository.find({ where: { tab_id: tabId } });
    const subtotal = orders.reduce((sum, order) => sum + order.subtotal_kobo, 0);
    
    // Use provided service charge percent or default to 10%
    const serviceChargePercent = generateBillDto?.service_charge_percent ?? 10;
    const serviceCharge = Math.round(subtotal * (serviceChargePercent / 100));
    const discount = generateBillDto?.discount_kobo ?? 0;
    const total = subtotal + serviceCharge - discount;

    const bill = this.billRepository.create({
      tab_id: tabId,
      subtotal_kobo: subtotal,
      service_charge_kobo: serviceCharge,
      discount_kobo: discount,
      total_kobo: total,
      issued_by: userId,
    });

    const savedBill = await this.billRepository.save(bill);
    
    // Update Tab Status
    await this.tabRepository.update(tabId, { status: 'billed', billed_at: new Date() });

    return savedBill;
  }

  async processPayment(tabId: string, paymentDto: ProcessPaymentDto) {
    const bill = await this.billRepository.findOne({ where: { tab_id: tabId } });
    if (!bill) throw new NotFoundException('Bill not found');

    bill.payment_method = paymentDto.method;
    bill.payment_amount_kobo = paymentDto.amount;
    if (paymentDto.reference) {
      bill.payment_reference = paymentDto.reference;
    }
    bill.paid_at = new Date();
    
    await this.billRepository.save(bill);
    
    // Update Tab Status
    await this.tabRepository.update(tabId, { status: 'paid', closed_at: new Date() });

    // Reset table status to available
    const tab = await this.tabRepository.findOne({ where: { id: tabId } });
    if (tab?.table_id) {
      await this.tableRepository.update(tab.table_id, { status: TableStatus.AVAILABLE });
    }

    return bill;
  }

  async getReceipt(tabId: string) {
    const tab = await this.tabRepository.findOne({ where: { id: tabId } });
    if (!tab) throw new NotFoundException('Tab not found');

    const bill = await this.billRepository.findOne({ where: { tab_id: tabId } });
    if (!bill) throw new NotFoundException('Bill not found');

    const orders = await this.orderRepository.find({ where: { tab_id: tabId } });
    
    const orderItems = [];
    for (const order of orders) {
      const menuItem = await this.menuItemRepository.findOne({ where: { id: order.menu_item_id } });
      orderItems.push({
        ...order,
        menu_item: menuItem,
      });
    }

    const table = await this.tableRepository.findOne({ where: { id: tab.table_id } });
    const waiter = await this.userRepository.findOne({ where: { id: tab.waiter_id } });
    const branch = await this.branchRepository.findOne({ where: { id: tab.branch_id } });
    const business = branch ? await this.businessRepository.findOne({ where: { id: branch.business_id } }) : null;

    return {
      business,
      branch,
      tab,
      table,
      waiter,
      bill,
      orders: orderItems,
      receipt_number: `RCP-${Date.now()}`,
    };
  }
}
