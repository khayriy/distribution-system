import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './company.entity';
import { CompanyRepository } from './company.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Company])],
  providers: [CompanyRepository],
  exports: [CompanyRepository],
})
export class CompanyModule {}
