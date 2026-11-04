import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Permission } from '../permissions/permission.entity';

@Entity('role_permissions')
@Index('UQ_role_permissions_role_permission', ['roleId', 'permissionId'], {
  unique: true,
})
@Index('IDX_role_permissions_permission', ['permissionId'])
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  roleId!: string;

  @ManyToOne(() => Role, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'roleId',
    foreignKeyConstraintName: 'FK_role_permissions_role',
  })
  role!: Role;

  @Column({ type: 'uuid' })
  permissionId!: string;

  @ManyToOne(() => Permission, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'permissionId',
    foreignKeyConstraintName: 'FK_role_permissions_permission',
  })
  permission!: Permission;
}
