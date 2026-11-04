import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('units_of_measure')
@Index('UQ_units_of_measure_code', ['code'], { unique: true })
export class UnitOfMeasure {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  unitType!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
