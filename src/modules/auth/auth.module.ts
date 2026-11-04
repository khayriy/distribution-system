import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSession } from './auth-session.entity';
import { AuthSessionToken } from './auth-session-token.entity';
import { AuthSessionRepository } from './auth-session.repository';
import { AuthSessionTokenRepository } from './auth-session-token.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AuthSession, AuthSessionToken])],
  providers: [AuthSessionRepository, AuthSessionTokenRepository],
  exports: [AuthSessionRepository, AuthSessionTokenRepository],
})
export class AuthModule {}
