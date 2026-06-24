import { __decorate, __metadata } from "tslib";
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class GenerateLogicDto {
    prompt;
}
__decorate([
    ApiProperty({
        example: 'How to automatically calculate service charge based on party size',
        description: 'The prompt for generating business logic',
    }),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], GenerateLogicDto.prototype, "prompt", void 0);
//# sourceMappingURL=generate-logic.dto.js.map