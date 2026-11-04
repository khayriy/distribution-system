import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { TypeOrmDatabaseRepository } from '../../database/database.repository';

@Injectable()
export class RoleRepository extends TypeOrmDatabaseRepository<Role> {
  constructor(@InjectRepository(Role) repository: Repository<Role>) {
    super(repository);
  }
}
