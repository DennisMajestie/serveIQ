import { __decorate, __metadata } from "tslib";
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateMenuItemDto {
    name;
    category;
    price_kobo;
    price;
    unit;
    sku;
    barcode;
    image_url;
    is_available;
}
__decorate([
    ApiProperty({ example: 'Heineken' }),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateMenuItemDto.prototype, "name", void 0);
__decorate([
    ApiProperty({ example: 'Drinks' }),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateMenuItemDto.prototype, "category", void 0);
__decorate([
    ApiProperty({ example: 5000, description: 'Price in kobo (1 NGN = 100 kobo)', required: false }),
    IsNumber(),
    Min(0),
    IsOptional(),
    __metadata("design:type", Number)
], CreateMenuItemDto.prototype, "price_kobo", void 0);
__decorate([
    ApiProperty({ example: 50, description: 'Price in Naira', required: false }),
    IsNumber(),
    Min(0),
    IsOptional(),
    __metadata("design:type", Number)
], CreateMenuItemDto.prototype, "price", void 0);
__decorate([
    ApiProperty({ example: 'bottle', required: false }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateMenuItemDto.prototype, "unit", void 0);
__decorate([
    ApiProperty({ example: 'SKU123', required: false }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateMenuItemDto.prototype, "sku", void 0);
__decorate([
    ApiProperty({ example: 'BAR123', required: false }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateMenuItemDto.prototype, "barcode", void 0);
__decorate([
    ApiProperty({ example: 'https://example.com/image.jpg', required: false }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateMenuItemDto.prototype, "image_url", void 0);
__decorate([
    ApiProperty({ example: true, required: false }),
    IsBoolean(),
    IsOptional(),
    __metadata("design:type", Boolean)
], CreateMenuItemDto.prototype, "is_available", void 0);
//# sourceMappingURL=create-menu-item.dto.js.map