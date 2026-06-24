import { __decorate, __metadata, __param } from "tslib";
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { Table, TableStatus } from '../table/entities/table.entity';
import { Tab } from '../tab/entities/tab.entity';
import { Bill } from '../bill/entities/bill.entity';
import { Order } from '../order/entities/order.entity';
import { User } from '../user/entities/user.entity';
let BranchService = class BranchService {
    branchRepository;
    tableRepository;
    tabRepository;
    billRepository;
    orderRepository;
    userRepository;
    constructor(branchRepository, tableRepository, tabRepository, billRepository, orderRepository, userRepository) {
        this.branchRepository = branchRepository;
        this.tableRepository = tableRepository;
        this.tabRepository = tabRepository;
        this.billRepository = billRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }
    async create(createDto) {
        const branch = this.branchRepository.create(createDto);
        return this.branchRepository.save(branch);
    }
    async findAllByBusiness(businessId) {
        return this.branchRepository.find({
            where: { business_id: businessId },
        });
    }
    async findOne(id, businessId) {
        const branch = await this.branchRepository.findOne({
            where: { id, business_id: businessId },
        });
        if (!branch) {
            throw new NotFoundException('Branch not found');
        }
        return branch;
    }
    async update(id, businessId, updateDto) {
        const branch = await this.findOne(id, businessId);
        Object.assign(branch, updateDto);
        return this.branchRepository.save(branch);
    }
    async remove(id, businessId) {
        const branch = await this.findOne(id, businessId);
        return this.branchRepository.remove(branch);
    }
    async getDashboardStats(branchId) {
        if (!branchId) {
            return {
                real_time_sales: 0,
                active_tables: 0,
                total_tables: 0,
                open_tabs: 0,
                daily_revenue: 0,
                today_tabs_count: 0,
                waiter_performance: [],
                recent_orders: [],
            };
        }
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            // Tables stats
            const totalTables = await this.tableRepository.count({ where: { branch_id: branchId } });
            const activeTables = await this.tableRepository.count({
                where: { branch_id: branchId, status: TableStatus.OCCUPIED },
            });
            // Tabs stats
            const openTabs = await this.tabRepository.count({ where: { branch_id: branchId, status: 'open' } });
            // Today's bills
            const todayBills = await this.billRepository
                .createQueryBuilder('bill')
                .innerJoin(Tab, 'tab', 'tab.id::varchar = bill.tab_id::varchar')
                .where('tab.branch_id::varchar = :branchId', { branchId })
                .andWhere('bill.paid_at >= :today', { today })
                .andWhere('bill.paid_at < :tomorrow', { tomorrow })
                .getMany();
            const dailyRevenue = todayBills.reduce((sum, bill) => sum + bill.total_kobo, 0);
            const todayTabsCount = todayBills.length;
            // Waiter performance
            const waiters = await this.userRepository.find({ where: { branch_id: branchId } });
            const waiterPerformance = [];
            for (const waiter of waiters) {
                const waiterTabs = await this.tabRepository.find({
                    where: {
                        branch_id: branchId,
                        waiter_id: waiter.id,
                        closed_at: Between(today, tomorrow),
                    },
                });
                let waiterRevenue = 0;
                for (const tab of waiterTabs) {
                    const bill = await this.billRepository.findOne({ where: { tab_id: tab.id } });
                    if (bill) {
                        waiterRevenue += bill.total_kobo;
                    }
                }
                waiterPerformance.push({
                    waiter,
                    tabs_count: waiterTabs.length,
                    revenue_kobo: waiterRevenue,
                });
            }
            // Order history
            const recentOrders = await this.orderRepository
                .createQueryBuilder('order')
                .innerJoin(Tab, 'tab', 'tab.id::varchar = order.tab_id::varchar')
                .where('tab.branch_id::varchar = :branchId', { branchId })
                .orderBy('order.created_at', 'DESC')
                .limit(20)
                .getMany();
            return {
                real_time_sales: dailyRevenue,
                active_tables: activeTables,
                total_tables: totalTables,
                open_tabs: openTabs,
                daily_revenue: dailyRevenue,
                today_tabs_count: todayTabsCount,
                waiter_performance: waiterPerformance,
                recent_orders: recentOrders,
            };
        }
        catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return {
                real_time_sales: 0,
                active_tables: 0,
                total_tables: 0,
                open_tabs: 0,
                daily_revenue: 0,
                today_tabs_count: 0,
                waiter_performance: [],
                recent_orders: [],
            };
        }
    }
};
BranchService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Branch)),
    __param(1, InjectRepository(Table)),
    __param(2, InjectRepository(Tab)),
    __param(3, InjectRepository(Bill)),
    __param(4, InjectRepository(Order)),
    __param(5, InjectRepository(User)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        Repository])
], BranchService);
export { BranchService };
//# sourceMappingURL=branch.service.js.map