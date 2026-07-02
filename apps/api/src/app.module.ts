import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Business } from './modules/business/entities/business.entity';
import { Branch } from './modules/branch/entities/branch.entity';
import { User } from './modules/user/entities/user.entity';
import { Table as RestaurantTable } from './modules/table/entities/table.entity';
import { MenuItem } from './modules/menu/entities/menu-item.entity';
import { Tab } from './modules/tab/entities/tab.entity';
import { Order } from './modules/order/entities/order.entity';
import { Bill } from './modules/bill/entities/bill.entity';
import { PosTerminal } from './modules/pos/entities/pos-terminal.entity';

import { AuthModule } from './modules/auth/auth.module';
import { BusinessModule } from './modules/business/business.module';
import { UserModule } from './modules/user/user.module';
import { BranchModule } from './modules/branch/branch.module';
import { MenuModule } from './modules/menu/menu.module';
import { TableModule } from './modules/table/table.module';
import { TabModule } from './modules/tab/tab.module';
import { OrderModule } from './modules/order/order.module';
import { BillModule } from './modules/bill/bill.module';
import { AiModule } from './modules/ai/ai.module';
import { UploadModule } from './modules/upload/upload.module';
import { AuditModule } from './modules/audit/audit.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AdminModule } from './modules/admin/admin.module';
import { PosTerminalModule } from './modules/pos/pos-terminal.module';
import { SeedService } from './database/seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? undefined : '.env',
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [
        Business,
        Branch,
        User,
        RestaurantTable,
        MenuItem,
        Tab,
        Order,
        Bill,
        PosTerminal,
      ],
      synchronize: true,
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      retryAttempts: 10,
      retryDelay: 3000,
      autoLoadEntities: true,
    }),
    AuthModule,
    BusinessModule,
    UserModule,
    BranchModule,
    MenuModule,
    TableModule,
    TabModule,
    OrderModule,
    BillModule,
    PosTerminalModule,
    AiModule,
    UploadModule,
    AuditModule,
    ReportsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}
