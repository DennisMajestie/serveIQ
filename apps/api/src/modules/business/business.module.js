import { __decorate } from "tslib";
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { Business } from './entities/business.entity';
let BusinessModule = class BusinessModule {
};
BusinessModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([Business])],
        providers: [BusinessService],
        controllers: [BusinessController],
        exports: [BusinessService],
    })
], BusinessModule);
export { BusinessModule };
//# sourceMappingURL=business.module.js.map