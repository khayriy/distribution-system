import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ModuleEntity } from './module.entity';
import { ActionEntity } from './action.entity';

@Entity('permissions')
@Index('IDX_permissions_module', ['moduleId'])
@Index('IDX_permissions_action', ['actionId'])
@Index('UQ_permissions_module_action', ['moduleId', 'actionId'], {
  unique: true,
})
@Index('UQ_permissions_code', ['code'], { unique: true })
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  moduleId!: string;

  @ManyToOne(() => ModuleEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'moduleId',
    foreignKeyConstraintName: 'FK_permissions_module',
  })
  module!: ModuleEntity;

  @Column({ type: 'uuid' })
  actionId!: string;

  @ManyToOne(() => ActionEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'actionId',
    foreignKeyConstraintName: 'FK_permissions_action',
  })
  action!: ActionEntity;

  @Column({ type: 'varchar', length: 120 })
  code!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
