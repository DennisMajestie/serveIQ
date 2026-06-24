import { __decorate } from "tslib";
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { MenuItem } from './entities/menu-item.entity';
let MenuModule = class MenuModule {
};
MenuModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([MenuItem])],
        providers: [MenuService],
        controllers: [MenuController],
        exports: [MenuService],
    })
], MenuModule);
export { MenuModule };
//# sourceMappingURL=menu.module.js.map