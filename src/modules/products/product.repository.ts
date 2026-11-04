import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { TypeOrmDatabaseRepository } from '../../database/database.repository';

@Injectable()
export class ProductRepository extends TypeOrmDatabaseRepository<Product> {
  constructor(@InjectRepository(Product) repository: Repository<Product>) {
    super(repository);
  }
}
