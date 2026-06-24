import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table, TableStatus } from './entities/table.entity';

@Injectable()
export class TableService {
  constructor(
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
  ) {}

  async create(createDto: any) {
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

  async findAllByBranch(branchId: string) {
    return this.tableRepository.find({
      where: { branch_id: branchId },
    });
  }

  async findOne(id: string, branchId: string) {
    const table = await this.tableRepository.findOne({
      where: { id, branch_id: branchId },
    });
    if (!table) {
      throw new NotFoundException('Table not found');
    }
    return table;
  }

  async updateStatus(id: string, branchId: string, status: TableStatus) {
    const table = await this.findOne(id, branchId);
    table.status = status;
    return this.tableRepository.save(table);
  }

  async update(id: string, branchId: string, updateDto: any) {
    const table = await this.findOne(id, branchId);
    Object.assign(table, updateDto);
    return this.tableRepository.save(table);
  }

  async remove(id: string, branchId: string) {
    const table = await this.findOne(id, branchId);
    return this.tableRepository.remove(table);
  }
}
