import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { Table, TableStatus } from '../table/entities/table.entity';
import { Tab } from '../tab/entities/tab.entity';
import { Bill } from '../bill/entities/bill.entity';
import { Order } from '../order/entities/order.entity';
import { User } from '../user/entities/user.entity';
import { UserRole } from '../../common/shared';

@Injectable()
export class BranchService {
  private readonly logger = new Logger(BranchService.name);

  constructor(
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(Tab)
    private tabRepository: Repository<Tab>,
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createDto: any) {
    const branch = this.branchRepository.create(createDto);
    return this.branchRepository.save(branch);
  }

  async findAllByBusiness(businessId: string) {
    return this.branchRepository.find({
      where: { business_id: businessId },
    });
  }

  async findOne(id: string, businessId: string) {
    const branch = await this.branchRepository.findOne({
      where: { id, business_id: businessId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return branch;
  }

  async update(id: string, businessId: string, updateDto: any) {
    const branch = await this.findOne(id, businessId);
    Object.assign(branch, updateDto);
    return this.branchRepository.save(branch);
  }

  async remove(id: string, businessId: string) {
    const branch = await this.findOne(id, businessId);
    return this.branchRepository.remove(branch);
  }

  async getDashboardStats(branchId: string) {
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

      // Waiter performance — batch queries instead of per-waiter loop
      const waiters = await this.userRepository.find({
        where: { branch_id: branchId, role: UserRole.WAITER, is_active: true },
        select: ['id', 'full_name', 'email', 'avatar_url'],
      });

      let waiterPerformance: any[] = [];
      if (waiters.length > 0) {
        const waiterIds = waiters.map(w => w.id);
        const closedTabs = await this.tabRepository.find({
          where: { branch_id: branchId, waiter_id: In(waiterIds), closed_at: Between(today, tomorrow) },
        });

        const bills = closedTabs.length > 0
          ? await this.billRepository.find({ where: { tab_id: In(closedTabs.map(t => t.id)) } })
          : [];

        const tabsByWaiter = new Map<string, typeof closedTabs>();
        for (const tab of closedTabs) {
          const list = tabsByWaiter.get(tab.waiter_id) || [];
          list.push(tab);
          tabsByWaiter.set(tab.waiter_id, list);
        }

        const revenueByTab = new Map(bills.map(b => [b.tab_id, b.total_kobo]));

        waiterPerformance = waiters.map(waiter => {
          const waiterTabs = tabsByWaiter.get(waiter.id) || [];
          return {
            waiter,
            tabs_count: waiterTabs.length,
            revenue_kobo: waiterTabs.reduce((sum, t) => sum + (revenueByTab.get(t.id) || 0), 0),
          };
        });
      }

      // Order history
      const recentOrders = await this.orderRepository
        .createQueryBuilder('o')
        .innerJoin(Tab, 'tab', '"tab"."id"::varchar = "o"."tab_id"::varchar')
        .where('"tab"."branch_id"::varchar = :branchId', { branchId })
        .orderBy('"o"."created_at"', 'DESC')
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
    } catch (error) {
      this.logger.error('Error fetching dashboard stats', error instanceof Error ? error.stack : undefined);
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
}
