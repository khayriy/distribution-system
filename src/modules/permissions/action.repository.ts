import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActionEntity } from './action.entity';
import { TypeOrmDatabaseRepository } from '../../database/database.repository';

@Injectable()
export class ActionRepository extends TypeOrmDatabaseRepository<ActionEntity> {
  constructor(
    @InjectRepository(ActionEntity) repository: Repository<ActionEntity>,
  ) {
    super(repository);
  }
}
