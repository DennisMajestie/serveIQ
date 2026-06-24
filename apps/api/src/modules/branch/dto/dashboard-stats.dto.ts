import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';
import { Order } from '../../order/entities/order.entity';

class WaiterPerformanceDto {
  @ApiProperty({ type: () => User })
  waiter: User;

  @ApiProperty({ example: 5 })
  tabs_count: number;

  @ApiProperty({ example: 25000 })
  revenue_kobo: number;
}

export class DashboardStatsDto {
  @ApiProperty({ example: 150000 })
  real_time_sales: number;

  @ApiProperty({ example: 8 })
  active_tables: number;

  @ApiProperty({ example: 20 })
  total_tables: number;

  @ApiProperty({ example: 4 })
  open_tabs: number;

  @ApiProperty({ example: 350000 })
  daily_revenue: number;

  @ApiProperty({ example: 12 })
  today_tabs_count: number;

  @ApiProperty({ type: [WaiterPerformanceDto] })
  waiter_performance: WaiterPerformanceDto[];

  @ApiProperty({ type: [Order] })
  recent_orders: Order[];
}
