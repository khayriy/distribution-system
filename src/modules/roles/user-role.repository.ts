import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from './user-role.entity';
import { TypeOrmDatabaseRepository } from '../../database/database.repository';

@Injectable()
export class UserRoleRepository extends TypeOrmDatabaseRepository<UserRole> {
  constructor(@InjectRepository(UserRole) repository: Repository<UserRole>) {
    super(repository);
  }
}
