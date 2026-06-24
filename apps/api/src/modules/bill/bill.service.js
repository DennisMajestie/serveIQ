import { __decorate, __metadata, __param } from "tslib";
import { Injectable, NotFoundException } from '@nestjs/common';
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
let BillService = class BillService {
    billRepository;
    tabRepository;
    orderRepository;
    tableRepository;
    menuItemRepository;
    userRepository;
    branchRepository;
    businessRepository;
    dataSource;
    constructor(billRepository, tabRepository, orderRepository, tableRepository, menuItemRepository, userRepository, branchRepository, businessRepository, dataSource) {
        this.billRepository = billRepository;
        this.tabRepository = tabRepository;
        this.orderRepository = orderRepository;
        this.tableRepository = tableRepository;
        this.menuItemRepository = menuItemRepository;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.businessRepository = businessRepository;
        this.dataSource = dataSource;
    }
    async generateBill(tabId, userId, generateBillDto) {
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
    async processPayment(tabId, paymentDto) {
        const bill = await this.billRepository.findOne({ where: { tab_id: tabId } });
        if (!bill)
            throw new NotFoundException('Bill not found');
        bill.payment_method = paymentDto.method;
        if (paymentDto.reference) {
            bill.payment_reference = paymentDto.reference;
        }
        bill.paid_at = new Date();
        await this.billRepository.save(bill);
        // Update Tab Status
        await this.tabRepository.update(tabId, { status: 'paid', closed_at: new Date() });
        return bill;
    }
    async getReceipt(tabId) {
        const tab = await this.tabRepository.findOne({ where: { id: tabId } });
        if (!tab)
            throw new NotFoundException('Tab not found');
        const bill = await this.billRepository.findOne({ where: { tab_id: tabId } });
        if (!bill)
            throw new NotFoundException('Bill not found');
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
};
BillService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Bill)),
    __param(1, InjectRepository(Tab)),
    __param(2, InjectRepository(Order)),
    __param(3, InjectRepository(Table)),
    __param(4, InjectRepository(MenuItem)),
    __param(5, InjectRepository(User)),
    __param(6, InjectRepository(Branch)),
    __param(7, InjectRepository(Business)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        DataSource])
], BillService);
export { BillService };
//# sourceMappingURL=bill.service.js.map