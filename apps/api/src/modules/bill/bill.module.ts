import { Module } from '@nestjs/common';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BillService } from './bill.service';
import { BillController } from './bill.controller';
import { Bill } from './entities/bill.entity';
import { Tab } from '../tab/entities/tab.entity';
import { Order } from '../order/entities/order.entity';
import { Table } from '../table/entities/table.entity';
import { MenuItem } from '../menu/entities/menu-item.entity';
import { User } from '../user/entities/user.entity';
import { Branch } from '../branch/entities/branch.entity';
import { Business } from '../business/entities/business.entity';
import { PosTerminal } from '../pos/entities/pos-terminal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bill, Tab, Order, Table, MenuItem, User, Branch, Business, PosTerminal])],
  providers: [
    BillService,
    {
      provide: DataSource,
      useExisting: getDataSourceToken(),
    },
  ],
  controllers: [BillController],
  exports: [BillService],
})
export class BillModule {}
