import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem } from './entities/menu-item.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuItem)
    private menuRepository: Repository<MenuItem>,
  ) {}

  async create(createDto: any) {
    const item = this.menuRepository.create(createDto);
    return this.menuRepository.save(item);
  }

  async findAllByBranch(branchId: string) {
    return this.menuRepository.find({
      where: { branch_id: branchId, is_available: true },
    });
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
