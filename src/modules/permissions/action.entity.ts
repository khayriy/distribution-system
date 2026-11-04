import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('actions')
@Index('UQ_actions_code', ['code'], { unique: true })
export class ActionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
