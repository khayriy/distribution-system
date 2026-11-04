import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';
import { TypeOrmDatabaseRepository } from '../../database/database.repository';

@Injectable()
export class CompanyRepository extends TypeOrmDatabaseRepository<Company> {
  constructor(@InjectRepository(Company) repository: Repository<Company>) {
    super(repository);
  }
}
