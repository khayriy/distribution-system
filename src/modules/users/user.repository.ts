import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { TypeOrmDatabaseRepository } from '../../database/database.repository';

@Injectable()
export class UserRepository extends TypeOrmDatabaseRepository<User> {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {
    super(userRepository);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email: email.trim().toLowerCase() });
  }

  findByEmailForAuthentication(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.trim().toLowerCase() })
      .getOne();
  }
}
