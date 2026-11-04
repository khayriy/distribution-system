import { validateEnvironment } from './validation';

describe('validateEnvironment', () => {
  const environment = {
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    DB_USERNAME: 'shipping',
    DB_PASSWORD: 'secure-password',
    DB_DATABASE: 'shipping_test',
  };

  it('applies defaults to optional environment values', () => {
    expect(validateEnvironment(environment)).toMatchObject({
      PORT: '3000',
      DB_PORT: '5432',
      DB_SSL: 'false',
      DB_LOGGING: 'false',
    });
  });

  it('rejects invalid API and database ports', () => {
    expect(() => validateEnvironment({ ...environment, PORT: '0' })).toThrow(
      'PORT must be an integer between 1 and 65535',
    );
    expect(() =>
      validateEnvironment({ ...environment, DB_PORT: '70000' }),
    ).toThrow('DB_PORT must be an integer between 1 and 65535');
  });

  it('rejects missing credentials and malformed boolean values', () => {
    expect(() =>
      validateEnvironment({ ...environment, DB_PASSWORD: '' }),
    ).toThrow('Missing required environment variable: DB_PASSWORD');
    expect(() =>
      validateEnvironment({ ...environment, DB_SSL: 'yes' }),
    ).toThrow('DB_SSL must be either true or false');
  });
});
