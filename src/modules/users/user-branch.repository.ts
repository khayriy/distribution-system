import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBranch } from './user-branch.entity';
import { TypeOrmDatabaseRepository } from '../../database/database.repository';

@Injectable()
export class UserBranchRepository extends TypeOrmDatabaseRepository<UserBranch> {
  constructor(
    @InjectRepository(UserBranch) repository: Repository<UserBranch>,
  ) {
    super(repository);
  }
}
