import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { DataSource } from 'typeorm';
import { createDatabaseOptions } from '../src/database/database.config';
import {
  ActionEntity,
  AuditLog,
  AuthSession,
  AuthSessionToken,
  BranchAccessLevel,
  Branch,
  Company,
  ModuleEntity,
  Permission,
  Product,
  ProductPackaging,
  Role,
  RolePermission,
  UnitOfMeasure,
  User,
  UserBranch,
  UserRole,
  Warehouse,
  WarehouseOperationalStatus,
} from '../src/database/entities';
import {
  ActionSeeder,
  CompanySeeder,
  ModuleSeeder,
  PermissionSeeder,
  RoleSeeder,
  Seeder,
  SuperAdminBootstrapSeeder,
  UnitOfMeasureSeeder,
} from '../src/database/seeds/seeders';

const enabled = process.env['DB_INTEGRATION_TESTS'] === 'true';
const databaseSuite = enabled ? describe : describe.skip;

databaseSuite('PostgreSQL database foundation', () => {
  let dataSource: DataSource | undefined;
  let adminClient: Client | undefined;
  const schema = `shipping_test_${randomUUID().replaceAll('-', '')}`;
  const originalSeedEnvironment = new Map<string, string | undefined>();
  const seedEnvironment = {
    INITIAL_COMPANY_NAME: 'Integration Test Company',
    INITIAL_COMPANY_CODE: 'TEST_MAIN',
    INITIAL_ADMIN_NAME: 'Integration Test Administrator',
    INITIAL_ADMIN_EMAIL: 'admin@integration.example',
    INITIAL_ADMIN_PASSWORD: 'integration-test-password-not-for-production',
  } as const;
  const seeders: readonly Seeder[] = [
    new CompanySeeder(),
    new ModuleSeeder(),
    new ActionSeeder(),
    new PermissionSeeder(),
    new RoleSeeder(),
    new UnitOfMeasureSeeder(),
    new SuperAdminBootstrapSeeder(),
  ];

  function getDataSource(): DataSource {
    if (!dataSource?.isInitialized) {
      throw new Error(
        'PostgreSQL integration test data source is not initialized.',
      );
    }
    return dataSource;
  }

  async function seedAll(): Promise<void> {
    await getDataSource().transaction(async (manager) => {
      for (const seeder of seeders) {
        await seeder.run(manager);
      }
    });
  }

  async function createBranch(code = `BR-${randomUUID()}`): Promise<Branch> {
    const repository = getDataSource().getRepository(Branch);
    const company = await getDataSource()
      .getRepository(Company)
      .findOneByOrFail({ code: seedEnvironment.INITIAL_COMPANY_CODE });
    return repository.save(
      repository.create({ companyId: company.id, name: code, code }),
    );
  }

  async function createWarehouse(
    branchId: string,
    code = `WH-${randomUUID()}`,
  ): Promise<Warehouse> {
    const repository = getDataSource().getRepository(Warehouse);
    return repository.save(
      repository.create({
        branchId,
        name: code,
        code,
        operationalStatus: WarehouseOperationalStatus.AVAILABLE,
      }),
    );
  }

  async function createUser(
    email = `${randomUUID()}@example.test`,
  ): Promise<User> {
    const repository = getDataSource().getRepository(User);
    return repository.save(
      repository.create({
        fullName: 'Integration Test User',
        email,
        passwordHash: 'argon2id$integration-test-hash',
        isActive: true,
        isSuperAdmin: false,
      }),
    );
  }

  async function createRole(code = `ROLE_${randomUUID()}`): Promise<Role> {
    const repository = getDataSource().getRepository(Role);
    return repository.save(
      repository.create({ name: code, code, isSystem: false, isActive: true }),
    );
  }

  async function expectForeignKeyFailure(
    operation: Promise<unknown>,
  ): Promise<void> {
    await expect(operation).rejects.toMatchObject({
      driverError: { code: '23503' },
    });
  }

  beforeAll(async () => {
    if (!process.env['DB_DATABASE']?.toLowerCase().endsWith('_test')) {
      throw new Error(
        'Database integration tests require DB_DATABASE to end with _test.',
      );
    }

    for (const [name, value] of Object.entries(seedEnvironment)) {
      originalSeedEnvironment.set(name, process.env[name]);
      process.env[name] = value;
    }

    const ssl = process.env['DB_SSL'] === 'true';
    adminClient = new Client({
      host: process.env['DB_HOST'],
      port: Number(process.env['DB_PORT'] ?? 5432),
      user: process.env['DB_USERNAME'],
      password: process.env['DB_PASSWORD'],
      database: process.env['DB_DATABASE'],
      ssl: ssl ? { rejectUnauthorized: true } : false,
    });
    await adminClient.connect();
    await adminClient.query(`CREATE SCHEMA "${schema}"`);

    dataSource = new DataSource({
      ...createDatabaseOptions(),
      schema,
      extra: { options: `-c search_path=${schema}` },
    });
    await dataSource.initialize();
    await dataSource.runMigrations();
    await seedAll();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    if (adminClient) {
      await adminClient.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await adminClient.end();
    }
    for (const [name, value] of originalSeedEnvironment) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  });

  it('creates every required foreign key and unique/check constraint', async () => {
    const rows = await getDataSource().query<Array<{ conname: string }>>(
      `SELECT "conname" FROM "pg_constraint"
       WHERE "connamespace" = current_schema()::regnamespace`,
    );
    const names = new Set(rows.map((row) => row.conname));
    const indexRows = await getDataSource().query<Array<{ indexname: string }>>(
      `SELECT "indexname" FROM "pg_indexes"
       WHERE "schemaname" = current_schema()`,
    );
    const indexNames = new Set(indexRows.map((row) => row.indexname));
    const expected = [
      'FK_branches_company',
      'FK_warehouses_branch',
      'FK_user_branches_user',
      'FK_user_branches_branch',
      'FK_user_roles_user',
      'FK_user_roles_role',
      'FK_permissions_module',
      'FK_permissions_action',
      'FK_role_permissions_role',
      'FK_role_permissions_permission',
      'FK_auth_sessions_user',
      'FK_auth_session_tokens_session',
      'FK_auth_session_tokens_replacement',
      'FK_audit_logs_actor',
      'FK_audit_logs_branch',
      'FK_audit_logs_warehouse',
      'FK_product_packagings_product',
      'FK_product_packagings_unit',
      'UQ_companies_code',
      'UQ_branches_company_code',
      'UQ_warehouses_branch_code',
      'UQ_users_email',
      'UQ_user_branches_user_branch',
      'UQ_user_roles_user_role',
      'UQ_permissions_code',
      'UQ_permissions_module_action',
      'UQ_role_permissions_role_permission',
      'UQ_roles_code',
      'UQ_modules_code',
      'UQ_actions_code',
      'UQ_products_code',
      'UQ_units_of_measure_code',
      'UQ_product_packagings_product_code',
      'CHK_warehouses_usable_area',
      'CHK_warehouses_nonnegative_capacity',
      'CHK_warehouses_warning_threshold',
      'CHK_auth_sessions_expiration',
      'CHK_product_packagings_positive_values',
      'CHK_product_packagings_volume_source',
      'CHK_product_packagings_dimensions_unit',
      'CHK_product_packagings_calculated_volume_dimensions',
    ];
    for (const name of expected) {
      expect(names.has(name)).toBe(true);
    }
    expect(indexNames.has('UQ_product_packagings_active_default')).toBe(true);
  });

  it('rejects invalid foreign keys across the entity relationships', async () => {
    const invalidId = randomUUID();
    const user = await createUser();
    const branch = await createBranch();
    const role = await createRole();
    const module = await getDataSource()
      .getRepository(ModuleEntity)
      .findOneByOrFail({ code: 'CUSTOMERS' });
    const action = await getDataSource()
      .getRepository(ActionEntity)
      .findOneByOrFail({ code: 'OVERRIDE' });
    const permissionRepository = getDataSource().getRepository(Permission);
    const permission = await permissionRepository.save(
      permissionRepository.create({
        moduleId: module.id,
        actionId: action.id,
        code: `fk-test.${randomUUID()}`,
      }),
    );
    const product = await getDataSource()
      .getRepository(Product)
      .save({
        code: `FK-PROD-${randomUUID()}`,
        name: 'Foreign Key Test Product',
      });
    const unit = await getDataSource()
      .getRepository(UnitOfMeasure)
      .findOneByOrFail({ code: 'PIECE' });
    const userId = invalidId;
    const roleId = invalidId;
    const createdAt = new Date();

    await expectForeignKeyFailure(
      getDataSource()
        .getRepository(Branch)
        .insert({
          companyId: invalidId,
          name: 'Invalid branch',
          code: `BR-${randomUUID()}`,
        }),
    );
    await expectForeignKeyFailure(
      getDataSource()
        .getRepository(Warehouse)
        .insert({
          branchId: invalidId,
          name: 'Invalid warehouse',
          code: `WH-${randomUUID()}`,
        }),
    );
    await expectForeignKeyFailure(
      getDataSource().getRepository(UserBranch).insert({
        userId,
        branchId: branch.id,
        accessLevel: BranchAccessLevel.FULL,
      }),
    );
    await expectForeignKeyFailure(
      getDataSource().getRepository(UserBranch).insert({
        userId: user.id,
        branchId: invalidId,
        accessLevel: BranchAccessLevel.FULL,
      }),
    );
    await expectForeignKeyFailure(
      getDataSource()
        .getRepository(UserRole)
        .insert({ userId, roleId: role.id }),
    );
    await expectForeignKeyFailure(
      getDataSource()
        .getRepository(UserRole)
        .insert({ userId: user.id, roleId }),
    );
    await expectForeignKeyFailure(
      permissionRepository.insert({
        moduleId: invalidId,
        actionId: action.id,
        code: `invalid.${randomUUID()}`,
      }),
    );
    await expectForeignKeyFailure(
      permissionRepository.insert({
        moduleId: module.id,
        actionId: invalidId,
        code: `invalid.${randomUUID()}`,
      }),
    );
    await expectForeignKeyFailure(
      getDataSource().getRepository(RolePermission).insert({
        roleId: invalidId,
        permissionId: permission.id,
      }),
    );
    await expectForeignKeyFailure(
      getDataSource().getRepository(RolePermission).insert({
        roleId: role.id,
        permissionId: invalidId,
      }),
    );
    await expectForeignKeyFailure(
      getDataSource().getRepository(AuthSession).insert({
        userId,
        tokenFamilyId: invalidId,
        refreshTokenHash: 'argon2id$test-hash',
        expiresAt: createdAt,
        absoluteExpiresAt: createdAt,
      }),
    );
    await expectForeignKeyFailure(
      getDataSource().getRepository(AuthSessionToken).insert({
        sessionId: invalidId,
        tokenHash: 'argon2id$test-token-hash',
      }),
    );
    const validSession = await getDataSource()
      .getRepository(AuthSession)
      .save({
        userId: user.id,
        tokenFamilyId: randomUUID(),
        refreshTokenHash: `argon2id$${randomUUID()}`,
        expiresAt: new Date(Date.now() + 60_000),
        absoluteExpiresAt: new Date(Date.now() + 120_000),
      });
    await expectForeignKeyFailure(
      getDataSource()
        .getRepository(AuthSessionToken)
        .insert({
          sessionId: validSession.id,
          tokenHash: `argon2id$${randomUUID()}`,
          replacedByTokenId: invalidId,
        }),
    );
    await expectForeignKeyFailure(
      getDataSource().getRepository(AuditLog).insert({
        actorUserId: invalidId,
        action: 'TEST',
        module: 'TEST',
        entityType: 'TEST',
      }),
    );
    await expectForeignKeyFailure(
      getDataSource().getRepository(AuditLog).insert({
        actorUserId: user.id,
        branchId: invalidId,
        action: 'TEST',
        module: 'TEST',
        entityType: 'TEST',
      }),
    );
    await expectForeignKeyFailure(
      getDataSource().getRepository(AuditLog).insert({
        actorUserId: user.id,
        branchId: branch.id,
        warehouseId: invalidId,
        action: 'TEST',
        module: 'TEST',
        entityType: 'TEST',
      }),
    );
    await expectForeignKeyFailure(
      getDataSource()
        .getRepository(ProductPackaging)
        .insert({
          productId: invalidId,
          unitOfMeasureId: unit.id,
          name: 'Invalid package',
          packagingCode: `PKG-${randomUUID()}`,
          quantityInBaseUnit: '1',
        }),
    );
    await expectForeignKeyFailure(
      getDataSource()
        .getRepository(ProductPackaging)
        .insert({
          productId: product.id,
          unitOfMeasureId: invalidId,
          name: 'Invalid unit',
          packagingCode: `PKG-${randomUUID()}`,
          quantityInBaseUnit: '1',
        }),
    );
    expect(await getDataSource().getRepository(ModuleEntity).count()).toBe(14);
    expect(
      await getDataSource().getRepository(ActionEntity).count(),
    ).toBeGreaterThan(12);
  });

  it('enforces user email and branch/warehouse uniqueness', async () => {
    await expect(
      getDataSource()
        .getRepository(Company)
        .insert({
          name: 'Unexpected Second Company',
          code: `COMPANY-${randomUUID()}`,
        }),
    ).rejects.toMatchObject({ driverError: { code: 'P0001' } });

    const email = `${randomUUID()}@example.test`;
    await createUser(email);
    await expect(
      getDataSource().getRepository(User).insert({
        fullName: 'Duplicate User',
        email,
        passwordHash: 'argon2id$test-hash',
      }),
    ).rejects.toMatchObject({ driverError: { code: '23505' } });

    const branch = await createBranch();
    await expect(
      getDataSource().getRepository(Branch).insert({
        companyId: branch.companyId,
        name: 'Duplicate Branch',
        code: branch.code,
      }),
    ).rejects.toMatchObject({ driverError: { code: '23505' } });

    const warehouse = await createWarehouse(branch.id);
    await expect(
      getDataSource().getRepository(Warehouse).insert({
        branchId: branch.id,
        name: 'Duplicate Warehouse',
        code: warehouse.code,
      }),
    ).rejects.toMatchObject({ driverError: { code: '23505' } });
  });

  it('enforces unique user-branch, user-role, permission, and role-permission assignments', async () => {
    const user = await createUser();
    const branch = await createBranch();
    await getDataSource().getRepository(UserBranch).insert({
      userId: user.id,
      branchId: branch.id,
      accessLevel: BranchAccessLevel.FULL,
    });
    await expect(
      getDataSource().getRepository(UserBranch).insert({
        userId: user.id,
        branchId: branch.id,
        accessLevel: 'RESTRICTED',
      }),
    ).rejects.toMatchObject({ driverError: { code: '23505' } });

    const role = await createRole();
    await getDataSource().getRepository(UserRole).insert({
      userId: user.id,
      roleId: role.id,
    });
    await expect(
      getDataSource().getRepository(UserRole).insert({
        userId: user.id,
        roleId: role.id,
      }),
    ).rejects.toMatchObject({ driverError: { code: '23505' } });

    const module = await getDataSource()
      .getRepository(ModuleEntity)
      .findOneByOrFail({
        code: 'CUSTOMERS',
      });
    const action = await getDataSource()
      .getRepository(ActionEntity)
      .findOneByOrFail({
        code: 'MANAGE',
      });
    const permissionRepository = getDataSource().getRepository(Permission);
    const permission = await permissionRepository.save(
      permissionRepository.create({
        moduleId: module.id,
        actionId: action.id,
        code: `test.${randomUUID()}`,
      }),
    );
    await expect(
      permissionRepository.insert({
        moduleId: module.id,
        actionId: action.id,
        code: `test.${randomUUID()}`,
      }),
    ).rejects.toMatchObject({ driverError: { code: '23505' } });
    const otherModule = await getDataSource()
      .getRepository(ModuleEntity)
      .findOneByOrFail({ code: 'DRIVERS' });
    await expect(
      permissionRepository.insert({
        moduleId: otherModule.id,
        actionId: action.id,
        code: permission.code,
      }),
    ).rejects.toMatchObject({ driverError: { code: '23505' } });

    const rolePermissionRepository =
      getDataSource().getRepository(RolePermission);
    await rolePermissionRepository.insert({
      roleId: role.id,
      permissionId: permission.id,
    });
    await expect(
      rolePermissionRepository.insert({
        roleId: role.id,
        permissionId: permission.id,
      }),
    ).rejects.toMatchObject({ driverError: { code: '23505' } });
  });

  it('enforces warehouse measurement bounds and reference-delete restrictions', async () => {
    const branch = await createBranch();
    const repository = getDataSource().getRepository(Warehouse);
    await expect(
      repository.insert({
        branchId: branch.id,
        name: 'Invalid floor area',
        code: `WH-${randomUUID()}`,
        floorArea: '-1',
      }),
    ).rejects.toMatchObject({ driverError: { code: '23514' } });
    await expect(
      repository.insert({
        branchId: branch.id,
        name: 'Invalid usable area',
        code: `WH-${randomUUID()}`,
        floorArea: '10',
        usableStorageArea: '11',
      }),
    ).rejects.toMatchObject({ driverError: { code: '23514' } });
    await expect(
      repository.insert({
        branchId: branch.id,
        name: 'Invalid threshold',
        code: `WH-${randomUUID()}`,
        capacityWarningThreshold: '100.01',
      }),
    ).rejects.toMatchObject({ driverError: { code: '23514' } });

    await createWarehouse(branch.id);
    await expect(
      getDataSource().getRepository(Branch).delete(branch.id),
    ).rejects.toMatchObject({ driverError: { code: '23503' } });
  });

  it('enforces packaging checks, default uniqueness, and product/unit deletion restrictions', async () => {
    const productRepository = getDataSource().getRepository(Product);
    const product = await productRepository.save(
      productRepository.create({
        code: `PROD-${randomUUID()}`,
        name: 'Integration Test Product',
      }),
    );
    const unit = await getDataSource()
      .getRepository(UnitOfMeasure)
      .findOneByOrFail({ code: 'PIECE' });
    const packagingRepository = getDataSource().getRepository(ProductPackaging);
    await expect(
      packagingRepository.insert({
        productId: product.id,
        unitOfMeasureId: unit.id,
        name: 'Invalid quantity',
        packagingCode: `PKG-${randomUUID()}`,
        quantityInBaseUnit: '0',
      }),
    ).rejects.toMatchObject({ driverError: { code: '23514' } });
    await expect(
      packagingRepository.insert({
        productId: product.id,
        unitOfMeasureId: unit.id,
        name: 'Incomplete dimensions',
        packagingCode: `PKG-${randomUUID()}`,
        quantityInBaseUnit: '1',
        length: '2',
        dimensionUnit: 'CM',
      }),
    ).rejects.toMatchObject({ driverError: { code: '23514' } });
    await expect(
      packagingRepository.insert({
        productId: product.id,
        unitOfMeasureId: unit.id,
        name: 'Calculated volume without dimensions',
        packagingCode: `PKG-${randomUUID()}`,
        quantityInBaseUnit: '1',
        volumeCubicMeters: '0.1',
        volumeSource: 'CALCULATED',
      }),
    ).rejects.toMatchObject({ driverError: { code: '23514' } });

    const first = await packagingRepository.save(
      packagingRepository.create({
        productId: product.id,
        unitOfMeasureId: unit.id,
        name: 'Default package',
        packagingCode: `PKG-${randomUUID()}`,
        quantityInBaseUnit: '1',
        isDefault: true,
        isActive: true,
      }),
    );
    await expect(
      packagingRepository.insert({
        productId: product.id,
        unitOfMeasureId: unit.id,
        name: 'Second default',
        packagingCode: `PKG-${randomUUID()}`,
        quantityInBaseUnit: '2',
        isDefault: true,
        isActive: true,
      }),
    ).rejects.toMatchObject({ driverError: { code: '23505' } });

    await expect(productRepository.delete(product.id)).rejects.toMatchObject({
      driverError: { code: '23503' },
    });
    await expect(
      getDataSource().getRepository(UnitOfMeasure).delete(unit.id),
    ).rejects.toMatchObject({ driverError: { code: '23503' } });
    await packagingRepository.update(first.id, { isActive: false });
  });

  it('preserves refresh rotation history and makes audit records append-only', async () => {
    const user = await createUser();
    const sessionRepository = getDataSource().getRepository(AuthSession);
    const session = await sessionRepository.save(
      sessionRepository.create({
        userId: user.id,
        tokenFamilyId: randomUUID(),
        refreshTokenHash: 'argon2id$refresh-hash',
        expiresAt: new Date(Date.now() + 60_000),
        absoluteExpiresAt: new Date(Date.now() + 120_000),
      }),
    );
    const tokenRepository = getDataSource().getRepository(AuthSessionToken);
    const token = await tokenRepository.save(
      tokenRepository.create({
        sessionId: session.id,
        tokenHash: 'argon2id$rotation-hash',
      }),
    );
    await expect(sessionRepository.delete(session.id)).rejects.toMatchObject({
      driverError: { code: '23503' },
    });
    await expect(
      getDataSource().getRepository(User).delete(user.id),
    ).rejects.toMatchObject({ driverError: { code: '23503' } });

    const auditRepository = getDataSource().getRepository(AuditLog);
    const audit = await auditRepository.save(
      auditRepository.create({
        actorUserId: user.id,
        action: 'TEST',
        module: 'TEST',
        entityType: 'TEST',
      }),
    );
    await expect(
      auditRepository.update(audit.id, { reason: 'mutation' }),
    ).rejects.toMatchObject({ driverError: { code: 'P0001' } });
    await tokenRepository.update(token.id, { consumedAt: new Date() });
  });

  it('seeds idempotently, preserves administrator credentials, and protects the last active Super Admin', async () => {
    const userRepository = getDataSource().getRepository(User);
    const bootstrapAdmin = await userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', {
        email: seedEnvironment.INITIAL_ADMIN_EMAIL,
      })
      .getOneOrFail();
    const originalHash = bootstrapAdmin.passwordHash;

    await seedAll();
    const repeatedAdmin = await userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', {
        email: seedEnvironment.INITIAL_ADMIN_EMAIL,
      })
      .getOneOrFail();
    expect(repeatedAdmin.passwordHash).toBe(originalHash);
    expect(repeatedAdmin.passwordHash.startsWith('$argon2id$')).toBe(true);
    await expect(
      userRepository.insert({
        fullName: 'Unauthorized Admin',
        email: `unauthorized-${randomUUID()}@example.test`,
        passwordHash: 'argon2id$test-hash',
        isSuperAdmin: true,
      }),
    ).rejects.toMatchObject({ driverError: { code: 'P0001' } });
    await expect(
      userRepository.update(repeatedAdmin.id, { isActive: false }),
    ).rejects.toMatchObject({ driverError: { code: 'P0001' } });
    const systemRole = await getDataSource()
      .getRepository(Role)
      .findOneByOrFail({ code: 'BRANCH_MANAGER' });
    await expect(
      getDataSource().getRepository(Role).delete(systemRole.id),
    ).rejects.toMatchObject({ driverError: { code: 'P0001' } });

    const ordinaryUser = await createUser(
      `blocked-bootstrap-${randomUUID()}@example.test`,
    );
    const originalEmail = process.env['INITIAL_ADMIN_EMAIL'];
    process.env['INITIAL_ADMIN_EMAIL'] = ordinaryUser.email;
    try {
      await expect(
        getDataSource().transaction((manager) =>
          new SuperAdminBootstrapSeeder().run(manager),
        ),
      ).rejects.toThrow('already belongs to a non-Super Admin');
    } finally {
      if (originalEmail === undefined) {
        delete process.env['INITIAL_ADMIN_EMAIL'];
      } else {
        process.env['INITIAL_ADMIN_EMAIL'] = originalEmail;
      }
    }
  });
});
