export function validateEnvironment<T extends NodeJS.ProcessEnv>(
  environment: T,
): T {
  for (const name of ['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE']) {
    if (!environment[name]?.trim()) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }

  const port = Number(environment['PORT'] ?? '3000');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  const databasePort = Number(environment['DB_PORT'] ?? '5432');
  if (
    !Number.isInteger(databasePort) ||
    databasePort < 1 ||
    databasePort > 65535
  ) {
    throw new Error('DB_PORT must be an integer between 1 and 65535');
  }

  for (const name of ['DB_SSL', 'DB_LOGGING']) {
    const value = environment[name] ?? 'false';
    if (value !== 'true' && value !== 'false') {
      throw new Error(`${name} must be either true or false`);
    }
  }

  return {
    ...environment,
    PORT: String(port),
    DB_PORT: String(databasePort),
    DB_SSL: environment['DB_SSL'] ?? 'false',
    DB_LOGGING: environment['DB_LOGGING'] ?? 'false',
  };
}
