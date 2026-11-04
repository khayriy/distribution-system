import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>,
  ) {}

  findById(id: string): Promise<AuditLog | null> {
    return this.repository.findOneBy({ id });
  }

  findMany(options: FindManyOptions<AuditLog> = {}): Promise<AuditLog[]> {
    return this.repository.find(options);
  }

  append(record: Omit<DeepPartial<AuditLog>, 'id'>): Promise<AuditLog> {
    return this.repository.save(this.repository.create(record), {
      listeners: false,
    });
  }
}
