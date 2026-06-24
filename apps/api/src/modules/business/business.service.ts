import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
  ) {}

  async findOne(id: string) {
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

  async update(id: string, updateDto: any) {
    const business = await this.findOne(id);
    Object.assign(business, updateDto);
    return this.businessRepository.save(business);
  }
}
