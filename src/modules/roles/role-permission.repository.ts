import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { TypeOrmDatabaseRepository } from '../../database/database.repository';

@Injectable()
export class RolePermissionRepository extends TypeOrmDatabaseRepository<RolePermission> {
  constructor(
    @InjectRepository(RolePermission)
    repository: Repository<RolePermission>,
  ) {
    super(repository);
  }
}
