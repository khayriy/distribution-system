import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from '../users/user.entity';

@Entity('auth_sessions')
@Check('CHK_auth_sessions_expiration', '"expiresAt" <= "absoluteExpiresAt"')
@Index('IDX_auth_sessions_user', ['userId'])
@Index('IDX_auth_sessions_token_family', ['tokenFamilyId'])
@Index('IDX_auth_sessions_expires_at', ['expiresAt'])
export class AuthSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'userId',
    foreignKeyConstraintName: 'FK_auth_sessions_user',
  })
  user!: User;

  @Column({ type: 'uuid' })
  tokenFamilyId!: string;

  @Column({ type: 'varchar' })
  @Exclude({ toPlainOnly: true })
  refreshTokenHash!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz' })
  absoluteExpiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar', nullable: true })
  deviceName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  ipAddress!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
