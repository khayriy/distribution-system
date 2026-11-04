import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './permission.entity';
import { TypeOrmDatabaseRepository } from '../../database/database.repository';

@Injectable()
export class PermissionRepository extends TypeOrmDatabaseRepository<Permission> {
  constructor(
    @InjectRepository(Permission) repository: Repository<Permission>,
  ) {
    super(repository);
  }
}
