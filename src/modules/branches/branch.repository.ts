import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './branch.entity';
import { TypeOrmDatabaseRepository } from '../../database/database.repository';

@Injectable()
export class BranchRepository extends TypeOrmDatabaseRepository<Branch> {
  constructor(@InjectRepository(Branch) repository: Repository<Branch>) {
    super(repository);
  }
}
