import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MenuItem } from './entities/menu-item.entity';
import { Branch } from '../branch/entities/branch.entity';
import { paginate, getPaginationParams } from '../../common/pagination';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuItem)
    private menuRepository: Repository<MenuItem>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
  ) {}

  async create(createDto: any) {
    const item = this.menuRepository.create(createDto);
    return this.menuRepository.save(item);
  }

  async findAll(businessId: string, branchId?: string, page?: number, perPage?: number) {
    let where: any;
    if (branchId) {
      where = { branch_id: branchId, is_available: true };
    } else {
      const branches = await this.branchRepository.find({ where: { business_id: businessId } });
      where = { branch_id: In(branches.map(b => b.id)), is_available: true };
    }

    if (page || perPage) {
      const params = getPaginationParams(page, perPage);
      return paginate(this.menuRepository, { where }, params);
    }

    return this.menuRepository.find({ where });
  }

  async findOne(id: string, branchId: string) {
    const item = await this.menuRepository.findOne({
      where: { id, branch_id: branchId },
    });
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }
    return item;
  }

  async update(id: string, branchId: string, updateDto: any) {
    const item = await this.findOne(id, branchId);
    Object.assign(item, updateDto);
    return this.menuRepository.save(item);
  }

  async remove(id: string, branchId: string) {
    const item = await this.findOne(id, branchId);
    return this.menuRepository.remove(item);
  }
}
