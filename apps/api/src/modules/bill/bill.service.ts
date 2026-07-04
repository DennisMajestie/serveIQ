import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TableStatus } from '../../common/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Bill } from './entities/bill.entity';
import { Tab } from '../tab/entities/tab.entity';
import { Order } from '../order/entities/order.entity';
import { Table } from '../table/entities/table.entity';
import { MenuItem } from '../menu/entities/menu-item.entity';
import { User } from '../user/entities/user.entity';
import { Branch } from '../branch/entities/branch.entity';
import { Business } from '../business/entities/business.entity';
import { PosTerminal } from '../pos/entities/pos-terminal.entity';
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
    @InjectRepository(PosTerminal)
    private posTerminalRepository: Repository<PosTerminal>,
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

    if (paymentDto.amount < bill.total_kobo) {
      throw new BadRequestException(`Payment amount (${paymentDto.amount} kobo) is less than the bill total (${bill.total_kobo} kobo)`);
    }

    bill.payment_method = paymentDto.method;
    bill.payment_amount_kobo = paymentDto.amount;
    if (paymentDto.reference) {
      bill.payment_reference = paymentDto.reference;
    }
    if (paymentDto.terminal_id) {
      bill.terminal_id = paymentDto.terminal_id;
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
    
    let orderItems: any[] = [];
    if (orders.length > 0) {
      const menuItemIds = [...new Set(orders.map(o => o.menu_item_id))];
      const menuItems = await this.menuItemRepository.find({ where: { id: In(menuItemIds) } });
      const menuItemMap = new Map(menuItems.map(m => [m.id, m]));
      orderItems = orders.map(order => ({ ...order, menu_item: menuItemMap.get(order.menu_item_id) || null }));
    }

    const [table, waiter, branch] = await Promise.all([
      this.tableRepository.findOne({ where: { id: tab.table_id } }),
      tab.waiter_id ? this.userRepository.findOne({ where: { id: tab.waiter_id } }) : Promise.resolve(null),
      this.branchRepository.findOne({ where: { id: tab.branch_id } }),
    ]);

    const business = branch ? await this.businessRepository.findOne({ where: { id: branch.business_id } }) : null;
    let terminal = null;
    if (bill.terminal_id) {
      terminal = await this.posTerminalRepository.findOne({ where: { id: bill.terminal_id } });
    }

    return {
      business,
      branch,
      tab,
      table,
      waiter,
      bill,
      terminal,
      orders: orderItems,
      receipt_number: `RCP-${Date.now()}`,
    };
  }
}
