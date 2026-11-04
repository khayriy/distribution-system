import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Role } from './role.entity';

@Entity('user_roles')
@Index('UQ_user_roles_user_role', ['userId', 'roleId'], { unique: true })
@Index('IDX_user_roles_role', ['roleId'])
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'userId',
    foreignKeyConstraintName: 'FK_user_roles_user',
  })
  user!: User;

  @Column({ type: 'uuid' })
  roleId!: string;

  @ManyToOne(() => Role, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'roleId',
    foreignKeyConstraintName: 'FK_user_roles_role',
  })
  role!: Role;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
