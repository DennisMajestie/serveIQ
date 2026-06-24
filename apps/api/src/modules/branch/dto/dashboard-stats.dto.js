import { __decorate, __metadata } from "tslib";
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';
import { Order } from '../../order/entities/order.entity';
class WaiterPerformanceDto {
    waiter;
    tabs_count;
    revenue_kobo;
}
__decorate([
    ApiProperty({ type: () => User }),
    __metadata("design:type", User)
], WaiterPerformanceDto.prototype, "waiter", void 0);
__decorate([
    ApiProperty({ example: 5 }),
    __metadata("design:type", Number)
], WaiterPerformanceDto.prototype, "tabs_count", void 0);
__decorate([
    ApiProperty({ example: 25000 }),
    __metadata("design:type", Number)
], WaiterPerformanceDto.prototype, "revenue_kobo", void 0);
export class DashboardStatsDto {
    real_time_sales;
    active_tables;
    total_tables;
    open_tabs;
    daily_revenue;
    today_tabs_count;
    waiter_performance;
    recent_orders;
}
__decorate([
    ApiProperty({ example: 150000 }),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "real_time_sales", void 0);
__decorate([
    ApiProperty({ example: 8 }),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "active_tables", void 0);
__decorate([
    ApiProperty({ example: 20 }),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "total_tables", void 0);
__decorate([
    ApiProperty({ example: 4 }),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "open_tabs", void 0);
__decorate([
    ApiProperty({ example: 350000 }),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "daily_revenue", void 0);
__decorate([
    ApiProperty({ example: 12 }),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "today_tabs_count", void 0);
__decorate([
    ApiProperty({ type: [WaiterPerformanceDto] }),
    __metadata("design:type", Array)
], DashboardStatsDto.prototype, "waiter_performance", void 0);
__decorate([
    ApiProperty({ type: [Order] }),
    __metadata("design:type", Array)
], DashboardStatsDto.prototype, "recent_orders", void 0);
//# sourceMappingURL=dashboard-stats.dto.js.map