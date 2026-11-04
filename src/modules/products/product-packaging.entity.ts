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
import { Product } from './product.entity';
import { UnitOfMeasure } from './unit-of-measure.entity';
import { PackagingDimensionUnit } from './packaging-dimension-unit.enum';
import { PackagingVolumeSource } from './packaging-volume-source.enum';

@Entity('product_packagings')
@Index('UQ_product_packagings_active_default', ['productId'], {
  unique: true,
  where: '"isDefault" = true AND "isActive" = true',
})
@Index('UQ_product_packagings_product_code', ['productId', 'packagingCode'], {
  unique: true,
})
@Index('IDX_product_packagings_unit', ['unitOfMeasureId'])
@Check(
  'CHK_product_packagings_positive_values',
  '"quantityInBaseUnit" > 0 AND ("length" IS NULL OR "length" > 0) AND ("width" IS NULL OR "width" > 0) AND ("height" IS NULL OR "height" > 0) AND ("volumeCubicMeters" IS NULL OR "volumeCubicMeters" > 0)',
)
@Check(
  'CHK_product_packagings_volume_source',
  '("volumeCubicMeters" IS NULL AND "volumeSource" IS NULL) OR ("volumeCubicMeters" IS NOT NULL AND "volumeSource" IS NOT NULL)',
)
@Check(
  'CHK_product_packagings_dimensions_unit',
  '(("length" IS NULL AND "width" IS NULL AND "height" IS NULL AND "dimensionUnit" IS NULL) OR ("length" IS NOT NULL AND "width" IS NOT NULL AND "height" IS NOT NULL AND "dimensionUnit" IS NOT NULL))',
)
@Check(
  'CHK_product_packagings_calculated_volume_dimensions',
  '"volumeSource" IS DISTINCT FROM \'CALCULATED\' OR ("length" IS NOT NULL AND "width" IS NOT NULL AND "height" IS NOT NULL AND "dimensionUnit" IS NOT NULL)',
)
export class ProductPackaging {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'productId',
    foreignKeyConstraintName: 'FK_product_packagings_product',
  })
  product!: Product;

  @Column({ type: 'uuid' })
  unitOfMeasureId!: string;

  @ManyToOne(() => UnitOfMeasure, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'unitOfMeasureId',
    foreignKeyConstraintName: 'FK_product_packagings_unit',
  })
  unitOfMeasure!: UnitOfMeasure;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 80 })
  packagingCode!: string;

  @Column({ type: 'numeric', precision: 18, scale: 6 })
  quantityInBaseUnit!: string;

  @Column({ type: 'numeric', precision: 14, scale: 4, nullable: true })
  length!: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 4, nullable: true })
  width!: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 4, nullable: true })
  height!: string | null;

  @Column({
    type: 'enum',
    enum: PackagingDimensionUnit,
    enumName: 'packaging_dimension_unit_enum',
    nullable: true,
  })
  dimensionUnit!: PackagingDimensionUnit | null;

  @Column({ type: 'numeric', precision: 18, scale: 8, nullable: true })
  volumeCubicMeters!: string | null;

  @Column({
    type: 'enum',
    enum: PackagingVolumeSource,
    enumName: 'packaging_volume_source_enum',
    nullable: true,
  })
  volumeSource!: PackagingVolumeSource | null;

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
