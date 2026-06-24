import { __decorate, __metadata } from "tslib";
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TableStatus } from '../../../common/shared';
export class UpdateTableStatusDto {
    status;
}
__decorate([
    ApiProperty({ enum: TableStatus, example: TableStatus.AVAILABLE }),
    IsEnum(TableStatus),
    IsNotEmpty(),
    __metadata("design:type", String)
], UpdateTableStatusDto.prototype, "status", void 0);
//# sourceMappingURL=update-table-status.dto.js.map