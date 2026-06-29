import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Table, TableStatus } from './entities/table.entity';
import { Branch } from '../branch/entities/branch.entity';
import { paginate, getPaginationParams } from '../../common/pagination';

@Injectable()
export class TableService {
  constructor(
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
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

  async findAll(businessId: string, branchId?: string, page?: number, perPage?: number) {
    let where: any;
    if (branchId) {
      where = { branch_id: branchId };
    } else {
      const branches = await this.branchRepository.find({ where: { business_id: businessId } });
      where = { branch_id: In(branches.map(b => b.id)) };
    }

    if (page || perPage) {
      const params = getPaginationParams(page, perPage);
      return paginate(this.tableRepository, { where }, params);
    }

    return this.tableRepository.find({ where });
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
