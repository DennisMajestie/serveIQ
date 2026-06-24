import { __decorate, __metadata } from "tslib";
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateOrderItemDto {
    menu_item_id;
    quantity;
    notes;
}
__decorate([
    ApiProperty({ example: 'menu-item-uuid-123', description: 'UUID of the menu item' }),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], CreateOrderItemDto.prototype, "menu_item_id", void 0);
__decorate([
    ApiProperty({ example: 2, description: 'Quantity ordered' }),
    IsNotEmpty(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateOrderItemDto.prototype, "quantity", void 0);
__decorate([
    ApiProperty({ example: 'No onions', description: 'Special instructions for this item', required: false }),
    IsString(),
    __metadata("design:type", String)
], CreateOrderItemDto.prototype, "notes", void 0);
//# sourceMappingURL=create-order-item.dto.js.map