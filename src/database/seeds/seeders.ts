import * as argon2 from 'argon2';
import { EntityManager } from 'typeorm';
import {
  ActionEntity,
  Company,
  ModuleEntity,
  Permission,
  Role,
  RolePermission,
  UnitOfMeasure,
  User,
} from '../entities';
import {
  PERMISSION_MODULE_CODES,
  PERMISSION_SEEDS,
  SPECIFIC_ACTION_CODES,
  STANDARD_ACTION_CODES,
} from '../../modules/permissions/permissions.constants';
import {
  SYSTEM_ROLE_SEED_POLICY_VERSION,
  SYSTEM_ROLE_SEEDS,
} from '../../modules/roles/roles.constants';
import { UNIT_OF_MEASURE_SEEDS } from '../../modules/products/products.constants';

export interface Seeder {
  run(manager: EntityManager): Promise<void>;
}

function requiredValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requiredSecret(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export class CompanySeeder implements Seeder {
  async run(manager: EntityManager): Promise<void> {
    const name = requiredValue('INITIAL_COMPANY_NAME');
    const code = requiredValue('INITIAL_COMPANY_CODE');
    await manager.query('SELECT pg_advisory_xact_lock(74002)');
    const repository = manager.getRepository(Company);
    const existing = await repository.find();

    if (existing.length > 1) {
      throw new Error(
        'Database contains multiple companies; resolve this before seeding.',
      );
    }

    const company = existing[0];
    if (company) {
      if (company.code !== code || company.name !== name) {
        throw new Error(
          'Initial company configuration conflicts with the existing company; no data was changed.',
        );
      }
      return;
    }

    await repository.insert({ name, code, isActive: true });
  }
}

export class ModuleSeeder implements Seeder {
  async run(manager: EntityManager): Promise<void> {
    const repository = manager.getRepository(ModuleEntity);
    for (const code of PERMISSION_MODULE_CODES) {
      const existing = await repository.findOneBy({ code });
      if (!existing) {
        await repository
          .createQueryBuilder()
          .insert()
          .values({
            code,
            name: code
              .split('_')
              .map((part) => part[0] + part.slice(1).toLowerCase())
              .join(' '),
            isActive: true,
          })
          .orIgnore()
          .execute();
      }
    }
  }
}

export class ActionSeeder implements Seeder {
  async run(manager: EntityManager): Promise<void> {
    const repository = manager.getRepository(ActionEntity);
    for (const code of [...STANDARD_ACTION_CODES, ...SPECIFIC_ACTION_CODES]) {
      const existing = await repository.findOneBy({ code });
      if (!existing) {
        await repository
          .createQueryBuilder()
          .insert()
          .values({
            code,
            name: code
              .split('_')
              .map((part) => part[0] + part.slice(1).toLowerCase())
              .join(' '),
            isActive: true,
          })
          .orIgnore()
          .execute();
      }
    }
  }
}

export class PermissionSeeder implements Seeder {
  async run(manager: EntityManager): Promise<void> {
    const permissionRepository = manager.getRepository(Permission);
    for (const [moduleCode, actionCode, permissionCode] of PERMISSION_SEEDS) {
      const module = await manager
        .getRepository(ModuleEntity)
        .findOneBy({ code: moduleCode });
      const action = await manager
        .getRepository(ActionEntity)
        .findOneBy({ code: actionCode });
      if (!module || !action) {
        throw new Error(
          `Cannot seed permission ${permissionCode}: module or action is missing.`,
        );
      }

      const [byCode, byPair] = await Promise.all([
        permissionRepository.findOneBy({ code: permissionCode }),
        permissionRepository.findOneBy({
          moduleId: module.id,
          actionId: action.id,
        }),
      ]);
      if (
        byCode &&
        (byCode.moduleId !== module.id || byCode.actionId !== action.id)
      ) {
        throw new Error(
          `Permission code ${permissionCode} conflicts with existing data.`,
        );
      }
      if (byPair && byPair.code !== permissionCode) {
        throw new Error(
          `Module/action pair ${moduleCode}/${actionCode} is already assigned to ${byPair.code}.`,
        );
      }
      if (!byCode) {
        await permissionRepository
          .createQueryBuilder()
          .insert()
          .values({
            moduleId: module.id,
            actionId: action.id,
            code: permissionCode,
            isActive: true,
          })
          .orIgnore()
          .execute();
      }

      const [verifiedByCode, verifiedByPair] = await Promise.all([
        permissionRepository.findOneBy({ code: permissionCode }),
        permissionRepository.findOneBy({
          moduleId: module.id,
          actionId: action.id,
        }),
      ]);
      if (
        !verifiedByCode ||
        !verifiedByPair ||
        verifiedByCode.id !== verifiedByPair.id
      ) {
        throw new Error(
          `Permission ${permissionCode} conflicts with concurrently seeded data.`,
        );
      }
    }
  }
}

export class RoleSeeder implements Seeder {
  async run(manager: EntityManager): Promise<void> {
    await manager.query(`SET LOCAL app.allow_system_role_seed = 'on'`);
    await manager.query('SELECT pg_advisory_xact_lock(74003)');
    const versions = await manager.query<Array<{ version: number }>>(
      'SELECT "version" FROM "seed_versions" WHERE "name" = $1',
      ['system_roles'],
    );
    if (Number(versions[0]?.version ?? 0) >= SYSTEM_ROLE_SEED_POLICY_VERSION) {
      return;
    }

    const roleRepository = manager.getRepository(Role);
    const assignmentRepository = manager.getRepository(RolePermission);
    for (const seed of SYSTEM_ROLE_SEEDS) {
      let role = await roleRepository.findOneBy({ code: seed.code });
      if (role && !role.isSystem) {
        throw new Error(
          `Role code ${seed.code} is already used by a non-system role; no role was modified.`,
        );
      }
      if (!role) {
        role = roleRepository.create({
          code: seed.code,
          name: seed.name,
          description: seed.description,
          isSystem: true,
          isActive: true,
        });
      } else {
        role.name = seed.name;
        role.description = seed.description;
        role.isSystem = true;
      }
      role = await roleRepository.save(role);

      const permissions = await manager
        .getRepository(Permission)
        .findBy(seed.permissionCodes.map((code) => ({ code })));
      const permissionsByCode = new Map(
        permissions.map((permission) => [permission.code, permission]),
      );
      const missing = seed.permissionCodes.filter(
        (code) => !permissionsByCode.has(code),
      );
      if (missing.length > 0) {
        throw new Error(
          `System role ${seed.code} references missing permissions: ${missing.join(', ')}`,
        );
      }

      await assignmentRepository.delete({ roleId: role.id });
      const assignments = seed.permissionCodes.map((code) => {
        const permission = permissionsByCode.get(code);
        if (!permission) {
          throw new Error(
            `System role ${seed.code} references missing permission ${code}.`,
          );
        }
        return { roleId: role.id, permissionId: permission.id };
      });
      await assignmentRepository.insert(assignments);
    }
    await manager.query(
      `INSERT INTO "seed_versions" ("name", "version") VALUES ($1, $2)
       ON CONFLICT ("name") DO UPDATE SET "version" = EXCLUDED."version"`,
      ['system_roles', SYSTEM_ROLE_SEED_POLICY_VERSION],
    );
  }
}

export class UnitOfMeasureSeeder implements Seeder {
  async run(manager: EntityManager): Promise<void> {
    const repository = manager.getRepository(UnitOfMeasure);
    for (const [code, name, unitType] of UNIT_OF_MEASURE_SEEDS) {
      const existing = await repository.findOneBy({ code });
      if (!existing) {
        await repository
          .createQueryBuilder()
          .insert()
          .values({ code, name, unitType, isActive: true })
          .orIgnore()
          .execute();
      }
    }
  }
}

export class SuperAdminBootstrapSeeder implements Seeder {
  async run(manager: EntityManager): Promise<void> {
    const fullName = requiredValue('INITIAL_ADMIN_NAME');
    const email = requiredValue('INITIAL_ADMIN_EMAIL').toLowerCase();
    const password = requiredSecret('INITIAL_ADMIN_PASSWORD');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('INITIAL_ADMIN_EMAIL must be a valid email address.');
    }
    if (password.trim().length < 16 || password === 'CHANGE_ME_SECURELY') {
      throw new Error(
        'INITIAL_ADMIN_PASSWORD must be a secure, non-placeholder password of at least 16 characters.',
      );
    }

    const repository = manager.getRepository(User);
    const existing = await repository.findOneBy({ email });
    if (existing) {
      if (!existing.isSuperAdmin) {
        throw new Error(
          'The configured administrator email already belongs to a non-Super Admin. Use the documented recovery procedure.',
        );
      }
      return;
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });
    await manager.query(`SET LOCAL app.allow_super_admin_bootstrap = 'on'`);
    await repository
      .createQueryBuilder()
      .insert()
      .values({
        fullName,
        email,
        passwordHash,
        isActive: true,
        isSuperAdmin: true,
      })
      .orIgnore()
      .execute();
    const persistedUser = await repository.findOneBy({ email });
    if (!persistedUser) {
      throw new Error(
        'Super Admin bootstrap did not persist the configured account.',
      );
    }
    if (!persistedUser.isSuperAdmin) {
      throw new Error(
        'The configured administrator email already belongs to a non-Super Admin. Use the documented recovery procedure.',
      );
    }
  }
}
