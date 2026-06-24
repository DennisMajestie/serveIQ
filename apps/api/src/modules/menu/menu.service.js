import { __decorate, __metadata, __param } from "tslib";
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem } from './entities/menu-item.entity';
let MenuService = class MenuService {
    menuRepository;
    constructor(menuRepository) {
        this.menuRepository = menuRepository;
    }
    async create(createDto) {
        const item = this.menuRepository.create(createDto);
        return this.menuRepository.save(item);
    }
    async findAllByBranch(branchId) {
        return this.menuRepository.find({
            where: { branch_id: branchId, is_available: true },
        });
    }
    async findOne(id, branchId) {
        const item = await this.menuRepository.findOne({
            where: { id, branch_id: branchId },
        });
        if (!item) {
            throw new NotFoundException('Menu item not found');
        }
        return item;
    }
    async update(id, branchId, updateDto) {
        const item = await this.findOne(id, branchId);
        Object.assign(item, updateDto);
        return this.menuRepository.save(item);
    }
    async remove(id, branchId) {
        const item = await this.findOne(id, branchId);
        return this.menuRepository.remove(item);
    }
};
MenuService = __decorate([
    Injectable(),
    __param(0, InjectRepository(MenuItem)),
    __metadata("design:paramtypes", [Repository])
], MenuService);
export { MenuService };
//# sourceMappingURL=menu.service.js.map