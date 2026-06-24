import { __decorate, __metadata } from "tslib";
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateBranchDto {
    name;
    address;
    phone_number;
    location;
}
__decorate([
    ApiProperty({ example: 'Abuja Central Branch', description: 'Name of the branch' }),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "name", void 0);
__decorate([
    ApiProperty({ example: '123 Gwarinpa Estate, Abuja', description: 'Address of the branch' }),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "address", void 0);
__decorate([
    ApiProperty({ example: '+234 801 234 5678', description: 'Contact phone number' }),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "phone_number", void 0);
__decorate([
    ApiProperty({ example: 'Downtown Abuja', description: 'Location details', required: false }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "location", void 0);
//# sourceMappingURL=create-branch.dto.js.map