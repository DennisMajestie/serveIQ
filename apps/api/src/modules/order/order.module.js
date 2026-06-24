import { __decorate } from "tslib";
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './entities/order.entity';
import { MenuItem } from '../menu/entities/menu-item.entity';
let OrderModule = class OrderModule {
};
OrderModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([Order, MenuItem])],
        providers: [OrderService],
        controllers: [OrderController],
        exports: [OrderService],
    })
], OrderModule);
export { OrderModule };
//# sourceMappingURL=order.module.js.map