import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from './branch.entity';
import { BranchRepository } from './branch.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Branch])],
  providers: [BranchRepository],
  exports: [BranchRepository],
})
export class BranchesModule {}
