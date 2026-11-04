import { validateEnvironment } from './validation';

export interface ApplicationConfiguration {
  port: number;
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean;
    logging: boolean;
  };
}

export default function configuration(): ApplicationConfiguration {
  const environment = validateEnvironment(process.env);

  return {
    port: Number(environment['PORT']),
    database: {
      host: environment['DB_HOST']!,
      port: Number(environment['DB_PORT']),
      username: environment['DB_USERNAME']!,
      password: environment['DB_PASSWORD']!,
      database: environment['DB_DATABASE']!,
      ssl: environment['DB_SSL'] === 'true',
      logging: environment['DB_LOGGING'] === 'true',
    },
  };
}
