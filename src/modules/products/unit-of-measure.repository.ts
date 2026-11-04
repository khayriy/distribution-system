import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitOfMeasure } from './unit-of-measure.entity';
import { TypeOrmDatabaseRepository } from '../../database/database.repository';

@Injectable()
export class UnitOfMeasureRepository extends TypeOrmDatabaseRepository<UnitOfMeasure> {
  constructor(
    @InjectRepository(UnitOfMeasure)
    repository: Repository<UnitOfMeasure>,
  ) {
    super(repository);
  }
}
