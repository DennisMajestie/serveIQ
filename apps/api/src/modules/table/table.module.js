import { __decorate } from "tslib";
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableService } from './table.service';
import { TableController } from './table.controller';
import { Table } from './entities/table.entity';
let TableModule = class TableModule {
};
TableModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([Table])],
        providers: [TableService],
        controllers: [TableController],
        exports: [TableService],
    })
], TableModule);
export { TableModule };
//# sourceMappingURL=table.module.js.map