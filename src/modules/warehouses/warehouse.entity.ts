import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from '../branches/branch.entity';
import { WarehouseOperationalStatus } from './warehouse-operational-status.enum';

@Entity('warehouses')
@Index('IDX_warehouses_branch_active_status', [
  'branchId',
  'isActive',
  'operationalStatus',
])
@Index('UQ_warehouses_branch_code', ['branchId', 'code'], { unique: true })
@Check(
  'CHK_warehouses_usable_area',
  '"usableStorageArea" IS NULL OR "floorArea" IS NULL OR "usableStorageArea" <= "floorArea"',
)
@Check(
  'CHK_warehouses_nonnegative_capacity',
  '("floorArea" IS NULL OR "floorArea" >= 0) AND ("usableStorageArea" IS NULL OR "usableStorageArea" >= 0) AND ("storageCapacityVolume" IS NULL OR "storageCapacityVolume" >= 0) AND ("maxStorageWeight" IS NULL OR "maxStorageWeight" >= 0)',
)
@Check(
  'CHK_warehouses_warning_threshold',
  '"capacityWarningThreshold" IS NULL OR ("capacityWarningThreshold" > 0 AND "capacityWarningThreshold" <= 100)',
)
@Check('CHK_warehouses_phone_format', `"phone" ~ '^01[0125][0-9]{8}$'`)
export class Warehouse {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  branchId!: string;

  @ManyToOne(() => Branch, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'branchId',
    foreignKeyConstraintName: 'FK_warehouses_branch',
  })
  branch!: Branch;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 11 })
  phone!: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 3, nullable: true })
  floorArea!: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 3, nullable: true })
  usableStorageArea!: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 3, nullable: true })
  storageCapacityVolume!: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 3, nullable: true })
  maxStorageWeight!: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  capacityWarningThreshold!: string | null;

  @Column({ type: 'boolean', default: false })
  capacityEnforcementEnabled!: boolean;

  @Column({
    type: 'enum',
    enum: WarehouseOperationalStatus,
    enumName: 'warehouse_operational_status_enum',
    default: WarehouseOperationalStatus.AVAILABLE,
  })
  operationalStatus!: WarehouseOperationalStatus;

  @Column({ type: 'text', nullable: true })
  availabilityReason!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
