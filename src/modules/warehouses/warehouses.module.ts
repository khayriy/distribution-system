import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseRepository } from './warehouse.repository';
import { Warehouse } from './warehouse.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Warehouse])],
  providers: [WarehouseRepository],
  exports: [WarehouseRepository],
})
export class WarehousesModule {}
