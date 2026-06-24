import { Module } from '@nestjs/common';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TabService } from './tab.service';
import { TabController } from './tab.controller';
import { Tab } from './entities/tab.entity';
import { Table } from '../table/entities/table.entity';
import { User } from '../user/entities/user.entity';
import { Order } from '../order/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tab, Table, User, Order])],
  providers: [
    TabService,
    {
      provide: DataSource,
      useExisting: getDataSourceToken(),
    },
  ],
  controllers: [TabController],
  exports: [TabService],
})
export class TabModule {}
