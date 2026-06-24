import { __decorate, __metadata, __param } from "tslib";
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';
let BusinessService = class BusinessService {
    businessRepository;
    constructor(businessRepository) {
        this.businessRepository = businessRepository;
    }
    async findOne(id) {
        const business = await this.businessRepository.findOne({
            where: { id },
            relations: {
                branches: true,
            },
        });
        if (!business) {
            throw new NotFoundException('Business not found');
        }
        return business;
    }
    async update(id, updateDto) {
        const business = await this.findOne(id);
        Object.assign(business, updateDto);
        return this.businessRepository.save(business);
    }
};
BusinessService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Business)),
    __metadata("design:paramtypes", [Repository])
], BusinessService);
export { BusinessService };
//# sourceMappingURL=business.service.js.map