import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { InitialDatabaseFoundation1730500000000 } from './migrations/1730500000000-InitialDatabaseFoundation';
import { DATABASE_ENTITIES } from './entities';
import { validateEnvironment } from '../config/validation';

export function createDatabaseOptions(
  environment: NodeJS.ProcessEnv = process.env,
): PostgresConnectionOptions {
  const validatedEnvironment = validateEnvironment(environment);

  return {
    type: 'postgres',
    host: validatedEnvironment['DB_HOST']!,
    port: Number(validatedEnvironment['DB_PORT']),
    username: validatedEnvironment['DB_USERNAME']!,
    password: validatedEnvironment['DB_PASSWORD']!,
    database: validatedEnvironment['DB_DATABASE']!,
    ssl:
      validatedEnvironment['DB_SSL'] === 'true'
        ? { rejectUnauthorized: true }
        : false,
    entities: [...DATABASE_ENTITIES],
    migrations: [InitialDatabaseFoundation1730500000000],
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    migrationsRun: false,
    logging: validatedEnvironment['DB_LOGGING'] === 'true',
  };
}
