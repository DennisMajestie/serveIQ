import { __decorate, __metadata } from "tslib";
import { PartialType } from '@nestjs/swagger';
import { InviteUserDto } from './invite-user.dto';
import { IsOptional, IsBoolean } from 'class-validator';
export class UpdateUserDto extends PartialType(InviteUserDto) {
    is_active;
}
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateUserDto.prototype, "is_active", void 0);
//# sourceMappingURL=update-user.dto.js.map