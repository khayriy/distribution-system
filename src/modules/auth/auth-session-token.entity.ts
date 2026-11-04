import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { AuthSession } from './auth-session.entity';

@Entity('auth_session_tokens')
@Index('UQ_auth_session_tokens_hash', ['tokenHash'], { unique: true })
@Index('IDX_auth_session_tokens_session', ['sessionId'])
@Index('IDX_auth_session_tokens_replacement', ['replacedByTokenId'])
export class AuthSessionToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  sessionId!: string;

  @ManyToOne(() => AuthSession, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'sessionId',
    foreignKeyConstraintName: 'FK_auth_session_tokens_session',
  })
  session!: AuthSession;

  @Column({ type: 'varchar' })
  @Exclude({ toPlainOnly: true })
  tokenHash!: string;

  @Column({ type: 'timestamptz', nullable: true })
  consumedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  replacedByTokenId!: string | null;

  @ManyToOne(() => AuthSessionToken, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'replacedByTokenId',
    foreignKeyConstraintName: 'FK_auth_session_tokens_replacement',
  })
  replacedBy!: AuthSessionToken | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
