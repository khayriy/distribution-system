# Shipping & Distribution Management API

NestJS, TypeORM, and PostgreSQL foundation for the Shipping & Distribution
Management System. Database changes are managed exclusively by migrations;
TypeORM synchronization is disabled.

## Requirements

- Node.js 20 or newer
- pnpm
- PostgreSQL 13 or newer

## First-time setup

1. Create a PostgreSQL database and application user.
2. Copy `.env.example` to `.env` and set database credentials, initial company
   values, and a secure initial administrator password. Do not commit `.env`.
3. Install dependencies:

   ```sh
   pnpm install
   ```

4. Apply the schema and seed reference data:

   ```sh
   pnpm database:setup
   ```

5. Start the API:

   ```sh
   pnpm start:dev
   ```

Swagger UI is available at `http://localhost:3000/api/docs`; the starter health
endpoint is `GET /api/health`.

The seed command is transactional and safe to rerun. It does not reset an
existing administrator password. See [database setup and ERD](./docs/database.md)
for environment variables, migration commands, repository usage, data
constraints, and credential rotation guidance.

Persistence is organized by feature under `src/modules/`; each module owns its
repositories and entity files. PostgreSQL setup, migrations, and seed runners
live under `src/database/`, while environment validation and configuration
factories live under `src/config/`.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm build` | Compile the NestJS application |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run end-to-end tests |
| `pnpm test:database` | Run PostgreSQL integration tests (requires `DB_INTEGRATION_TESTS=true` and a disposable `*_test` database) |
| `pnpm migration:run` | Apply pending TypeORM migrations |
| `pnpm migration:revert` | Revert the latest migration |
| `pnpm migration:generate -- src/database/migrations/Name` | Generate a migration from entity changes |
| `pnpm migration:create -- src/database/migrations/Name` | Create an empty migration |
| `pnpm seed` | Run the ordered, idempotent seeders |
| `pnpm database:setup` | Apply migrations and then seed |

`pnpm database:setup` requires the database to be reachable and the initial
company and administrator environment variables to be configured.
