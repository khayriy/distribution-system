import { createDatabaseOptions } from './database.config';

describe('createDatabaseOptions', () => {
  const environment = {
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    DB_USERNAME: 'shipping',
    DB_PASSWORD: 'secure-password',
    DB_DATABASE: 'shipping_test',
  };

  it('requires explicit PostgreSQL credentials and disables synchronization', () => {
    const options = createDatabaseOptions(environment);

    expect(options.type).toBe('postgres');
    expect(options.synchronize).toBe(false);
    expect(options.migrationsRun).toBe(false);
    expect(options.password).toBe('secure-password');
  });

  it('rejects missing credentials', () => {
    expect(() =>
      createDatabaseOptions({ ...environment, DB_PASSWORD: '' }),
    ).toThrow('Missing required environment variable: DB_PASSWORD');
  });

  it('rejects invalid ports and TLS values', () => {
    expect(() =>
      createDatabaseOptions({ ...environment, DB_PORT: '70000' }),
    ).toThrow('DB_PORT must be an integer between 1 and 65535');
    expect(() =>
      createDatabaseOptions({ ...environment, DB_SSL: 'yes' }),
    ).toThrow('DB_SSL must be either true or false');
    expect(() =>
      createDatabaseOptions({ ...environment, DB_LOGGING: 'yes' }),
    ).toThrow('DB_LOGGING must be either true or false');
  });
});
