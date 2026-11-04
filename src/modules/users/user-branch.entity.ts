import {
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
import { User } from './user.entity';
import { BranchAccessLevel } from './branch-access-level.enum';

@Entity('user_branches')
@Index('UQ_user_branches_user_branch', ['userId', 'branchId'], { unique: true })
@Index('IDX_user_branches_branch', ['branchId'])
export class UserBranch {
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
    foreignKeyConstraintName: 'FK_user_branches_user',
  })
  user!: User;

  @Column({ type: 'uuid' })
  branchId!: string;

  @ManyToOne(() => Branch, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'branchId',
    foreignKeyConstraintName: 'FK_user_branches_branch',
  })
  branch!: Branch;

  @Column({
    type: 'enum',
    enum: BranchAccessLevel,
    enumName: 'branch_access_level_enum',
  })
  accessLevel!: BranchAccessLevel;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
