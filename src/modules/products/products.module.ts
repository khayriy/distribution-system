import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductPackaging } from './product-packaging.entity';
import { UnitOfMeasure } from './unit-of-measure.entity';
import { ProductPackagingRepository } from './product-packaging.repository';
import { ProductRepository } from './product.repository';
import { UnitOfMeasureRepository } from './unit-of-measure.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, UnitOfMeasure, ProductPackaging]),
  ],
  providers: [
    ProductRepository,
    UnitOfMeasureRepository,
    ProductPackagingRepository,
  ],
  exports: [
    ProductRepository,
    UnitOfMeasureRepository,
    ProductPackagingRepository,
  ],
})
export class ProductsModule {}
