import 'dotenv/config';
import { AppDataSource } from '../data-source';
import {
  ActionSeeder,
  CompanySeeder,
  ModuleSeeder,
  PermissionSeeder,
  RoleSeeder,
  Seeder,
  SuperAdminBootstrapSeeder,
  UnitOfMeasureSeeder,
} from './seeders';

const SEEDERS: readonly Seeder[] = [
  new CompanySeeder(),
  new ModuleSeeder(),
  new ActionSeeder(),
  new PermissionSeeder(),
  new RoleSeeder(),
  new UnitOfMeasureSeeder(),
  new SuperAdminBootstrapSeeder(),
];

async function runSeeds(): Promise<void> {
  await AppDataSource.initialize();
  try {
    await AppDataSource.transaction(async (manager) => {
      for (const seeder of SEEDERS) {
        await seeder.run(manager);
      }
    });
  } finally {
    await AppDataSource.destroy();
  }
}

void runSeeds().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'An unknown error occurred.';
  console.error(`Database seeding failed: ${message}`);
  process.exitCode = 1;
});
