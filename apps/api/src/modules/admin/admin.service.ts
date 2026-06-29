import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity';
import { Branch } from '../branch/entities/branch.entity';
import { User } from '../user/entities/user.entity';
import { UserRole } from '../../common/shared';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAllBusinesses(page?: number, perPage?: number) {
    const query = this.businessRepository
      .createQueryBuilder('b')
      .leftJoinAndMapMany('b.branches', Branch, 'br', 'br.business_id = b.id')
      .leftJoinAndMapOne('b.owner', User, 'u', 'u.id = b.owner_id')
      .select([
        'b.id',
        'b.name',
        'b.slug',
        'b.type',
        'b.email',
        'b.phone',
        'b.address',
        'b.currency',
        'b.subscription_plan',
        'b.is_active',
        'b.created_at',
        'br.id',
        'br.name',
        'u.id',
        'u.full_name',
        'u.email',
      ])
      .orderBy('b.created_at', 'DESC');

    if (page && perPage) {
      query.skip((page - 1) * perPage).take(perPage);
    }

    const [businesses, total] = await query.getManyAndCount();

    return {
      data: businesses,
      meta: { total, page: page || 1, perPage: perPage || businesses.length },
    };
  }

  async findBusinessById(id: string) {
    const business = await this.businessRepository.findOne({
      where: { id },
      relations: { branches: true },
    });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async updateBusiness(id: string, updateDto: any) {
    const business = await this.findBusinessById(id);
    Object.assign(business, updateDto);
    return this.businessRepository.save(business);
  }

  async toggleBusinessActive(id: string) {
    const business = await this.findBusinessById(id);
    business.is_active = !business.is_active;
    return this.businessRepository.save(business);
  }

  async getAggregatedStats() {
    const totalBusinesses = await this.businessRepository.count();
    const activeBusinesses = await this.businessRepository.count({ where: { is_active: true } });
    const totalBranches = await this.branchRepository.count();
    const totalUsers = await this.userRepository.count({ where: { role: UserRole.WAITER } });

    return {
      total_businesses: totalBusinesses,
      active_businesses: activeBusinesses,
      total_branches: totalBranches,
      total_waiters: totalUsers,
    };
  }
}
