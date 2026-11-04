import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleEntity } from './module.entity';
import { TypeOrmDatabaseRepository } from '../../database/database.repository';

@Injectable()
export class ModuleRepository extends TypeOrmDatabaseRepository<ModuleEntity> {
  constructor(
    @InjectRepository(ModuleEntity) repository: Repository<ModuleEntity>,
  ) {
    super(repository);
  }
}
