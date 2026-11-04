import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthSessionToken } from './auth-session-token.entity';
import { TypeOrmDatabaseRepository } from '../../database/database.repository';

@Injectable()
export class AuthSessionTokenRepository extends TypeOrmDatabaseRepository<AuthSessionToken> {
  constructor(
    @InjectRepository(AuthSessionToken)
    repository: Repository<AuthSessionToken>,
  ) {
    super(repository);
  }
}
