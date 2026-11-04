import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from '../config/configuration';
import { validateEnvironment } from '../config/validation';
import { createDatabaseOptions } from './database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => createDatabaseOptions(),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
