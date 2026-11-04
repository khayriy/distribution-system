import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthSession } from './auth-session.entity';
import { TypeOrmDatabaseRepository } from '../../database/database.repository';

@Injectable()
export class AuthSessionRepository extends TypeOrmDatabaseRepository<AuthSession> {
  constructor(
    @InjectRepository(AuthSession) repository: Repository<AuthSession>,
  ) {
    super(repository);
  }
}
