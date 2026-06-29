import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

export interface AuditLogEntry {
  branchId: string;
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  payload?: any;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async log(entry: AuditLogEntry): Promise<AuditLog> {
    const record = this.auditRepository.create(entry);
    return this.auditRepository.save(record);
  }
}
