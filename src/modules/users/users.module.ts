import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserBranch } from './user-branch.entity';
import { UserBranchRepository } from './user-branch.repository';
import { UserRepository } from './user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserBranch])],
  providers: [UserRepository, UserBranchRepository],
  exports: [UserRepository, UserBranchRepository],
})
export class UsersModule {}
