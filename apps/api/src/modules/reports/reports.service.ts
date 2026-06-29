import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../order/entities/order.entity';
import { Tab } from '../tab/entities/tab.entity';
import { Bill } from '../bill/entities/bill.entity';
import { PeakHoursEntryDto } from './dto/peak-hours.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Tab)
    private readonly tabRepository: Repository<Tab>,
    @InjectRepository(Bill)
    private readonly billRepository: Repository<Bill>,
  ) {}

  async getPeakHours(
    branchId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<PeakHoursEntryDto[]> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .select('EXTRACT(HOUR FROM order.created_at)::int', 'hour')
      .addSelect('COUNT(order.id)::int', 'order_count')
      .addSelect('SUM(bill.total_kobo)', 'revenue_kobo')
      .innerJoin(Tab, 'tab', 'tab.id::varchar = order.tab_id::varchar')
      .innerJoin(Bill, 'bill', 'bill.tab_id::varchar = tab.id::varchar')
      .where('tab.branch_id::varchar = :branchId', { branchId })
      .andWhere('bill.paid_at IS NOT NULL')
      .groupBy('EXTRACT(HOUR FROM order.created_at)')
      .orderBy('hour', 'ASC');

    if (dateFrom) {
      query.andWhere('order.created_at >= :dateFrom::timestamp', { dateFrom });
    }
    if (dateTo) {
      query.andWhere(
        'order.created_at < (:dateTo::timestamp + INTERVAL \'1 day\')',
        { dateTo },
      );
    }

    const raw = await query.getRawMany<{ hour: number; order_count: number; revenue_kobo: number | null }>();

    const results: PeakHoursEntryDto[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const found = raw.find((r) => Number(r.hour) === hour);
      results.push({
        hour,
        order_count: found ? Number(found.order_count) : 0,
        revenue_kobo: found ? Number(found.revenue_kobo) : 0,
      });
    }
    return results;
  }
}
