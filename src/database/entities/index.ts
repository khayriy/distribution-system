import { Company } from '../../modules/company/company.entity';
import { Branch } from '../../modules/branches/branch.entity';
import { User } from '../../modules/users/user.entity';
import { UserBranch } from '../../modules/users/user-branch.entity';
import { Role } from '../../modules/roles/role.entity';
import { UserRole } from '../../modules/roles/user-role.entity';
import { ModuleEntity } from '../../modules/permissions/module.entity';
import { ActionEntity } from '../../modules/permissions/action.entity';
import { Permission } from '../../modules/permissions/permission.entity';
import { RolePermission } from '../../modules/roles/role-permission.entity';
import { AuthSession } from '../../modules/auth/auth-session.entity';
import { AuthSessionToken } from '../../modules/auth/auth-session-token.entity';
import { AuditLog } from '../../modules/audit/audit-log.entity';
import { Product } from '../../modules/products/product.entity';
import { UnitOfMeasure } from '../../modules/products/unit-of-measure.entity';
import { ProductPackaging } from '../../modules/products/product-packaging.entity';
import { Warehouse } from '../../modules/warehouses/warehouse.entity';
export { Company } from '../../modules/company/company.entity';
export { Branch } from '../../modules/branches/branch.entity';
export { User } from '../../modules/users/user.entity';
export { UserBranch } from '../../modules/users/user-branch.entity';
export { Role } from '../../modules/roles/role.entity';
export { UserRole } from '../../modules/roles/user-role.entity';
export { ModuleEntity } from '../../modules/permissions/module.entity';
export { ActionEntity } from '../../modules/permissions/action.entity';
export { Permission } from '../../modules/permissions/permission.entity';
export { RolePermission } from '../../modules/roles/role-permission.entity';
export { AuthSession } from '../../modules/auth/auth-session.entity';
export { AuthSessionToken } from '../../modules/auth/auth-session-token.entity';
export { AuditLog } from '../../modules/audit/audit-log.entity';
export { Product } from '../../modules/products/product.entity';
export { UnitOfMeasure } from '../../modules/products/unit-of-measure.entity';
export { ProductPackaging } from '../../modules/products/product-packaging.entity';
export { Warehouse } from '../../modules/warehouses/warehouse.entity';
export { WarehouseOperationalStatus } from '../../modules/warehouses/warehouse-operational-status.enum';
export { BranchAccessLevel } from '../../modules/users/branch-access-level.enum';
export { PackagingDimensionUnit } from '../../modules/products/packaging-dimension-unit.enum';
export { PackagingVolumeSource } from '../../modules/products/packaging-volume-source.enum';

export const DATABASE_ENTITIES = [
  Company,
  Branch,
  Warehouse,
  User,
  UserBranch,
  Role,
  UserRole,
  ModuleEntity,
  ActionEntity,
  Permission,
  RolePermission,
  AuthSession,
  AuthSessionToken,
  AuditLog,
  Product,
  UnitOfMeasure,
  ProductPackaging,
] as const;
