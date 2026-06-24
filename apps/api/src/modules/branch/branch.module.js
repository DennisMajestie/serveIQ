import { __decorate } from "tslib";
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchService } from './branch.service';
import { BranchController } from './branch.controller';
import { Branch } from './entities/branch.entity';
import { Table } from '../table/entities/table.entity';
import { Tab } from '../tab/entities/tab.entity';
import { Bill } from '../bill/entities/bill.entity';
import { Order } from '../order/entities/order.entity';
import { User } from '../user/entities/user.entity';
let BranchModule = class BranchModule {
};
BranchModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([Branch, Table, Tab, Bill, Order, User])],
        providers: [BranchService],
        controllers: [BranchController],
        exports: [BranchService],
    })
], BranchModule);
export { BranchModule };
//# sourceMappingURL=branch.module.js.map