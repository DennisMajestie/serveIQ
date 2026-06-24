import { __decorate, __metadata, __param } from "tslib";
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tab } from './entities/tab.entity';
import { Table, TableStatus } from '../table/entities/table.entity';
import { User } from '../user/entities/user.entity';
import { Order } from '../order/entities/order.entity';
let TabService = class TabService {
    tabRepository;
    tableRepository;
    userRepository;
    orderRepository;
    dataSource;
    constructor(tabRepository, tableRepository, userRepository, orderRepository, dataSource) {
        this.tabRepository = tabRepository;
        this.tableRepository = tableRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.dataSource = dataSource;
    }
    async openTab(createDto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            // 1. Create Tab
            const newTab = this.tabRepository.create({
                ...createDto,
                status: 'open',
                opened_at: new Date(),
                tab_number: `TAB-${Date.now()}`,
            });
            const savedTab = (await queryRunner.manager.save(newTab));
            // 2. Update Table Status
            await queryRunner.manager.update(Table, savedTab.table_id, {
                status: TableStatus.OCCUPIED,
            });
            await queryRunner.commitTransaction();
            return savedTab;
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async findOne(id, branchId) {
        const tab = await this.tabRepository.findOne({
            where: { id, branch_id: branchId },
        });
        if (!tab) {
            throw new NotFoundException('Tab not found');
        }
        return tab;
    }
    async findAllByBranch(branchId, status) {
        const where = { branch_id: branchId };
        if (status) {
            where.status = status;
        }
        const tabs = await this.tabRepository.find({
            where,
            order: { opened_at: 'DESC' },
        });
        const tabsWithDetails = [];
        for (const tab of tabs) {
            const table = await this.tableRepository.findOne({ where: { id: tab.table_id } });
            const waiter = await this.userRepository.findOne({ where: { id: tab.waiter_id } });
            const orders = await this.orderRepository.find({ where: { tab_id: tab.id } });
            const total = orders.reduce((sum, order) => sum + order.subtotal_kobo, 0);
            tabsWithDetails.push({
                ...tab,
                table,
                waiter,
                orders,
                total_kobo: total,
            });
        }
        return tabsWithDetails;
    }
    async closeTab(id, branchId) {
        const tab = await this.findOne(id, branchId);
        tab.status = 'paid';
        tab.closed_at = new Date();
        // Also release table
        await this.tableRepository.update(tab.table_id, {
            status: TableStatus.AVAILABLE,
        });
        return this.tabRepository.save(tab);
    }
    async update(id, branchId, updateDto) {
        const tab = await this.findOne(id, branchId);
        Object.assign(tab, updateDto);
        return this.tabRepository.save(tab);
    }
    async remove(id, branchId) {
        const tab = await this.findOne(id, branchId);
        return this.tabRepository.remove(tab);
    }
};
TabService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Tab)),
    __param(1, InjectRepository(Table)),
    __param(2, InjectRepository(User)),
    __param(3, InjectRepository(Order)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository,
        DataSource])
], TabService);
export { TabService };
//# sourceMappingURL=tab.service.js.map