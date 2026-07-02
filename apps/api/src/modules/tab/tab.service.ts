import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tab } from './entities/tab.entity';
import { Table, TableStatus } from '../table/entities/table.entity';
import { User } from '../user/entities/user.entity';
import { Order } from '../order/entities/order.entity';
import { paginate, getPaginationParams } from '../../common/pagination';

@Injectable()
export class TabService {
  constructor(
    @InjectRepository(Tab)
    private tabRepository: Repository<Tab>,
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private dataSource: DataSource,
  ) {}

  async openTab(createDto: any) {
    // Prevent duplicate: reject if an open tab already exists for this table
    const existing = await this.tabRepository.findOne({
      where: { table_id: createDto.table_id, status: 'open' },
    });
    if (existing) {
      throw new BadRequestException('An open tab already exists for this table');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newTab = this.tabRepository.create({
        ...createDto,
        status: 'open',
        opened_at: new Date(),
        tab_number: `TAB-${Date.now()}`,
      });
      const savedTab = (await queryRunner.manager.save(newTab)) as unknown as Tab;

      await queryRunner.manager.update(Table, savedTab.table_id, {
        status: TableStatus.OCCUPIED,
      });

      await queryRunner.commitTransaction();
      return savedTab;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: string, branchId: string) {
    const tab = await this.tabRepository.findOne({
      where: { id, branch_id: branchId },
    });
    if (!tab) {
      throw new NotFoundException('Tab not found');
    }
    return tab;
  }

  async findAllByBranch(branchId: string, status?: string, page?: number, perPage?: number) {
    const where: any = { branch_id: branchId };
    if (status) {
      where.status = status;
    }

    const enrichTabs = async (tabs: Tab[]) => {
      const enriched = [];
      for (const tab of tabs) {
        const table = await this.tableRepository.findOne({ where: { id: tab.table_id } });
        const waiter = await this.userRepository.findOne({ where: { id: tab.waiter_id } });
        const orders = await this.orderRepository.find({ where: { tab_id: tab.id } });
        const total = orders.reduce((sum, order) => sum + order.subtotal_kobo, 0);
        enriched.push({ ...tab, table, waiter, orders, total_kobo: total });
      }
      return enriched;
    };

    if (page || perPage) {
      const params = getPaginationParams(page, perPage);
      const result = await paginate(this.tabRepository, { where, order: { opened_at: 'DESC' } }, params);
      return { ...result, data: await enrichTabs(result.data) };
    }

    const tabs = await this.tabRepository.find({
      where,
      order: { opened_at: 'DESC' },
    });

    return enrichTabs(tabs);
  }

  async voidTab(id: string, branchId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tab = await queryRunner.manager.findOne(Tab, {
        where: { id, branch_id: branchId },
      });
      if (!tab || tab.status !== 'open') {
        throw new NotFoundException('Only open tabs can be voided');
      }

      tab.status = 'voided';
      tab.closed_at = new Date();

      await queryRunner.manager.update(Table, tab.table_id, {
        status: TableStatus.AVAILABLE,
      });

      await queryRunner.manager.save(tab);
      await queryRunner.commitTransaction();
      return tab;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async transferTab(id: string, targetTableId: string, branchId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tab = await queryRunner.manager.findOne(Tab, {
        where: { id, branch_id: branchId },
      });
      if (!tab || tab.status !== 'open') {
        throw new NotFoundException('Only open tabs can be transferred');
      }

      const targetTable = await queryRunner.manager.findOne(Table, { where: { id: targetTableId } });
      if (!targetTable) {
        throw new NotFoundException('Target table not found');
      }
      if (targetTable.branch_id !== branchId) {
        throw new NotFoundException('Target table must be in the same branch');
      }
      if (targetTable.status !== TableStatus.AVAILABLE) {
        throw new NotFoundException('Target table is not available');
      }

      // Release old table
      await queryRunner.manager.update(Table, tab.table_id, {
        status: TableStatus.AVAILABLE,
      });

      // Occupy target table
      await queryRunner.manager.update(Table, targetTableId, {
        status: TableStatus.OCCUPIED,
      });

      // Update tab's table reference
      tab.table_id = targetTableId;
      const saved = await queryRunner.manager.save(tab);
      await queryRunner.commitTransaction();
      return saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async closeTab(id: string, branchId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tab = await queryRunner.manager.findOne(Tab, {
        where: { id, branch_id: branchId },
      });
      if (!tab || tab.status !== 'open') {
        throw new NotFoundException('Only open tabs can be closed');
      }

      tab.status = 'paid';
      tab.closed_at = new Date();

      await queryRunner.manager.update(Table, tab.table_id, {
        status: TableStatus.AVAILABLE,
      });

      await queryRunner.manager.save(tab);
      await queryRunner.commitTransaction();
      return tab;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, branchId: string, updateDto: any) {
    const tab = await this.findOne(id, branchId);
    Object.assign(tab, updateDto);
    return this.tabRepository.save(tab);
  }

  async remove(id: string, branchId: string) {
    const tab = await this.findOne(id, branchId);
    return this.tabRepository.remove(tab);
  }
}
