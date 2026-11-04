import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmDatabaseRepository } from '../../database/database.repository';
import { Warehouse } from './warehouse.entity';

@Injectable()
export class WarehouseRepository extends TypeOrmDatabaseRepository<Warehouse> {
  constructor(@InjectRepository(Warehouse) repository: Repository<Warehouse>) {
    super(repository);
  }
}
