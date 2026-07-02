import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PosTerminal } from './entities/pos-terminal.entity';

@Injectable()
export class PosTerminalService {
  constructor(
    @InjectRepository(PosTerminal)
    private posTerminalRepository: Repository<PosTerminal>,
  ) {}

  async create(createDto: any) {
    const terminal = this.posTerminalRepository.create(createDto);
    return this.posTerminalRepository.save(terminal);
  }

  async findAll(branchId: string) {
    return this.posTerminalRepository.find({
      where: { branch_id: branchId, deleted_at: null },
      order: { created_at: 'ASC' },
    });
  }

  async findActive(branchId: string) {
    return this.posTerminalRepository.find({
      where: { branch_id: branchId, is_active: true, deleted_at: null },
      order: { created_at: 'ASC' },
    });
  }

  async findOne(id: string, branchId: string) {
    const terminal = await this.posTerminalRepository.findOne({
      where: { id, branch_id: branchId, deleted_at: null },
    });
    if (!terminal) throw new NotFoundException('POS terminal not found');
    return terminal;
  }

  async update(id: string, branchId: string, updateDto: any) {
    const terminal = await this.findOne(id, branchId);
    Object.assign(terminal, updateDto);
    return this.posTerminalRepository.save(terminal);
  }

  async remove(id: string, branchId: string) {
    const terminal = await this.findOne(id, branchId);
    return this.posTerminalRepository.softRemove(terminal);
  }
}
