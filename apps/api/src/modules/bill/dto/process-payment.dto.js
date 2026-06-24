import { __decorate, __metadata } from "tslib";
import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../../common/shared';
export class ProcessPaymentDto {
    amount;
    method;
    reference;
}
__decorate([
    ApiProperty({ example: 150000, description: 'Total amount paid in kobo (1 NGN = 100 kobo)' }),
    IsNotEmpty(),
    IsNumber(),
    __metadata("design:type", Number)
], ProcessPaymentDto.prototype, "amount", void 0);
__decorate([
    ApiProperty({
        example: PaymentMethod.CARD,
        description: 'Payment method',
        enum: PaymentMethod,
    }),
    IsNotEmpty(),
    IsEnum(PaymentMethod),
    __metadata("design:type", String)
], ProcessPaymentDto.prototype, "method", void 0);
__decorate([
    ApiProperty({ example: 'TXN123456789', description: 'Transaction reference (optional)', required: false }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], ProcessPaymentDto.prototype, "reference", void 0);
//# sourceMappingURL=process-payment.dto.js.map