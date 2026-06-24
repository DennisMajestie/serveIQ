import { __decorate } from "tslib";
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { Branch } from '../branch/entities/branch.entity';
let UserModule = class UserModule {
};
UserModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([User, Branch])],
        providers: [UserService],
        controllers: [UserController],
        exports: [UserService],
    })
], UserModule);
export { UserModule };
//# sourceMappingURL=user.module.js.map