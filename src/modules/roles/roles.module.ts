import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './role.entity';
import { RolePermission } from './role-permission.entity';
import { UserRole } from './user-role.entity';
import { RolePermissionRepository } from './role-permission.repository';
import { RoleRepository } from './role.repository';
import { UserRoleRepository } from './user-role.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Role, UserRole, RolePermission])],
  providers: [RoleRepository, UserRoleRepository, RolePermissionRepository],
  exports: [RoleRepository, UserRoleRepository, RolePermissionRepository],
})
export class RolesModule {}
