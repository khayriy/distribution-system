import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionEntity } from './action.entity';
import { ModuleEntity } from './module.entity';
import { Permission } from './permission.entity';
import { ActionRepository } from './action.repository';
import { ModuleRepository } from './module.repository';
import { PermissionRepository } from './permission.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ModuleEntity, ActionEntity, Permission])],
  providers: [ModuleRepository, ActionRepository, PermissionRepository],
  exports: [ModuleRepository, ActionRepository, PermissionRepository],
})
export class PermissionsModule {}
