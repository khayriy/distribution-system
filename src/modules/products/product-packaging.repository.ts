import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductPackaging } from './product-packaging.entity';
import { TypeOrmDatabaseRepository } from '../../database/database.repository';

@Injectable()
export class ProductPackagingRepository extends TypeOrmDatabaseRepository<ProductPackaging> {
  constructor(
    @InjectRepository(ProductPackaging)
    repository: Repository<ProductPackaging>,
  ) {
    super(repository);
  }
}
