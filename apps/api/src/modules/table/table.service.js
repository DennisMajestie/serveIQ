import { __decorate, __metadata, __param } from "tslib";
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table } from './entities/table.entity';
let TableService = class TableService {
    tableRepository;
    constructor(tableRepository) {
        this.tableRepository = tableRepository;
    }
    async create(createDto) {
        if (createDto.table_number) {
            const existing = await this.tableRepository.findOne({
                where: { table_number: createDto.table_number, branch_id: createDto.branch_id },
            });
            if (existing) {
                throw new BadRequestException(`Table number '${createDto.table_number}' already exists in this branch.`);
            }
        }
        const table = this.tableRepository.create(createDto);
        return this.tableRepository.save(table);
    }
    async findAllByBranch(branchId) {
        return this.tableRepository.find({
            where: { branch_id: branchId },
        });
    }
    async findOne(id, branchId) {
        const table = await this.tableRepository.findOne({
            where: { id, branch_id: branchId },
        });
        if (!table) {
            throw new NotFoundException('Table not found');
        }
        return table;
    }
    async updateStatus(id, branchId, status) {
        const table = await this.findOne(id, branchId);
        table.status = status;
        return this.tableRepository.save(table);
    }
    async update(id, branchId, updateDto) {
        const table = await this.findOne(id, branchId);
        Object.assign(table, updateDto);
        return this.tableRepository.save(table);
    }
    async remove(id, branchId) {
        const table = await this.findOne(id, branchId);
        return this.tableRepository.remove(table);
    }
};
TableService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Table)),
    __metadata("design:paramtypes", [Repository])
], TableService);
export { TableService };
//# sourceMappingURL=table.service.js.map