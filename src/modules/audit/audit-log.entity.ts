import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Branch } from '../branches/branch.entity';
import { Warehouse } from '../warehouses/warehouse.entity';
import { User } from '../users/user.entity';

@Entity('audit_logs')
@Index('IDX_audit_logs_actor', ['actorUserId'])
@Index('IDX_audit_logs_branch', ['branchId'])
@Index('IDX_audit_logs_warehouse', ['warehouseId'])
@Index('IDX_audit_logs_created_at', ['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  actorUserId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'actorUserId',
    foreignKeyConstraintName: 'FK_audit_logs_actor',
  })
  actor!: User | null;

  @Column({ type: 'uuid', nullable: true })
  branchId!: string | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'branchId',
    foreignKeyConstraintName: 'FK_audit_logs_branch',
  })
  branch!: Branch | null;

  @Column({ type: 'uuid', nullable: true })
  warehouseId!: string | null;

  @ManyToOne(() => Warehouse, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'warehouseId',
    foreignKeyConstraintName: 'FK_audit_logs_warehouse',
  })
  warehouse!: Warehouse | null;

  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ type: 'varchar', length: 100 })
  module!: string;

  @Column({ type: 'varchar', length: 100 })
  entityType!: string;

  @Column({ type: 'uuid', nullable: true })
  entityId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  oldValues!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  newValues!: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @Column({ type: 'varchar', nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
