import { __decorate } from "tslib";
import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
let AiModule = class AiModule {
};
AiModule = __decorate([
    Module({
        providers: [AiService],
        controllers: [AiController],
        exports: [AiService],
    })
], AiModule);
export { AiModule };
//# sourceMappingURL=ai.module.js.map