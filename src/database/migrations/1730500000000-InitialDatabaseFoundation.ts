import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialDatabaseFoundation1730500000000 implements MigrationInterface {
  name = 'InitialDatabaseFoundation1730500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const statements = [
      `CREATE TYPE "warehouse_operational_status_enum" AS ENUM ('AVAILABLE', 'UNAVAILABLE')`,
      `CREATE TYPE "branch_access_level_enum" AS ENUM ('RESTRICTED', 'FULL')`,
      `CREATE TYPE "packaging_dimension_unit_enum" AS ENUM ('CM', 'M')`,
      `CREATE TYPE "packaging_volume_source_enum" AS ENUM ('CALCULATED', 'MANUAL')`,
      `CREATE TABLE "companies" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(150) NOT NULL,
        "code" varchar(50) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_companies" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_companies_code" UNIQUE ("code")
      )`,
      `CREATE FUNCTION "enforce_single_company"() RETURNS trigger AS $$
        BEGIN
          PERFORM pg_advisory_xact_lock(74002);
          IF EXISTS (SELECT 1 FROM "companies" WHERE "id" <> COALESCE(NEW."id", OLD."id")) THEN
            RAISE EXCEPTION 'Only one company is permitted per deployment';
          END IF;
          RETURN NEW;
        END;
      $$ LANGUAGE plpgsql`,
      `CREATE TRIGGER "TR_companies_singleton" BEFORE INSERT OR UPDATE ON "companies"
        FOR EACH ROW EXECUTE FUNCTION "enforce_single_company"()`,
      `CREATE TABLE "branches" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "companyId" uuid NOT NULL,
        "name" varchar(150) NOT NULL,
        "code" varchar(50) NOT NULL,
        "address" text,
        "phone" varchar,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_branches" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_branches_company_code" UNIQUE ("companyId", "code"),
        CONSTRAINT "FK_branches_company" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT
      )`,
      `CREATE INDEX "IDX_branches_company_active" ON "branches" ("companyId", "isActive")`,
      `CREATE TABLE "warehouses" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "branchId" uuid NOT NULL,
        "name" varchar(150) NOT NULL,
        "code" varchar(50) NOT NULL,
        "address" text,
        "phone" varchar,
        "floorArea" numeric(14,3),
        "usableStorageArea" numeric(14,3),
        "storageCapacityVolume" numeric(14,3),
        "maxStorageWeight" numeric(14,3),
        "capacityWarningThreshold" numeric(5,2),
        "capacityEnforcementEnabled" boolean NOT NULL DEFAULT false,
        "operationalStatus" "warehouse_operational_status_enum" NOT NULL DEFAULT 'AVAILABLE',
        "availabilityReason" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_warehouses" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_warehouses_branch_code" UNIQUE ("branchId", "code"),
        CONSTRAINT "CHK_warehouses_usable_area" CHECK ("usableStorageArea" IS NULL OR "floorArea" IS NULL OR "usableStorageArea" <= "floorArea"),
        CONSTRAINT "CHK_warehouses_nonnegative_capacity" CHECK (("floorArea" IS NULL OR "floorArea" >= 0) AND ("usableStorageArea" IS NULL OR "usableStorageArea" >= 0) AND ("storageCapacityVolume" IS NULL OR "storageCapacityVolume" >= 0) AND ("maxStorageWeight" IS NULL OR "maxStorageWeight" >= 0)),
        CONSTRAINT "CHK_warehouses_warning_threshold" CHECK ("capacityWarningThreshold" IS NULL OR ("capacityWarningThreshold" > 0 AND "capacityWarningThreshold" <= 100)),
        CONSTRAINT "FK_warehouses_branch" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT
      )`,
      `CREATE INDEX "IDX_warehouses_branch_active_status" ON "warehouses" ("branchId", "isActive", "operationalStatus")`,
      `CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "fullName" varchar(150) NOT NULL,
        "email" varchar(255) NOT NULL,
        "passwordHash" varchar NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "isSuperAdmin" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "CHK_users_email_lowercase" CHECK ("email" = lower("email"))
      )`,
      `CREATE FUNCTION "protect_last_active_super_admin"() RETURNS trigger AS $$
        DECLARE remaining_admins integer;
        BEGIN
          IF TG_OP = 'DELETE' THEN
            IF OLD."isSuperAdmin" AND OLD."isActive" THEN
              PERFORM pg_advisory_xact_lock(74001);
              SELECT count(*) INTO remaining_admins FROM "users"
                WHERE "isSuperAdmin" AND "isActive" AND "id" <> OLD."id";
              IF remaining_admins = 0 THEN
                RAISE EXCEPTION 'Cannot remove the last active Super Admin';
              END IF;
            END IF;
            RETURN OLD;
          END IF;
          IF OLD."isSuperAdmin" AND OLD."isActive"
            AND (NEW."isSuperAdmin" IS DISTINCT FROM true OR NEW."isActive" IS DISTINCT FROM true) THEN
            PERFORM pg_advisory_xact_lock(74001);
            SELECT count(*) INTO remaining_admins FROM "users"
              WHERE "isSuperAdmin" AND "isActive" AND "id" <> OLD."id";
            IF remaining_admins = 0 THEN
              RAISE EXCEPTION 'Cannot disable or demote the last active Super Admin';
            END IF;
          END IF;
          RETURN NEW;
        END;
      $$ LANGUAGE plpgsql`,
      `CREATE TRIGGER "TR_users_last_active_super_admin" BEFORE UPDATE OR DELETE ON "users"
        FOR EACH ROW EXECUTE FUNCTION "protect_last_active_super_admin"()`,
      `CREATE FUNCTION "protect_super_admin_assignment"() RETURNS trigger AS $$
        BEGIN
          IF current_setting('app.allow_super_admin_bootstrap', true) IS DISTINCT FROM 'on' THEN
            IF TG_OP = 'INSERT' AND NEW."isSuperAdmin" THEN
              RAISE EXCEPTION 'Super Admin status may only be set by the trusted bootstrap process';
            END IF;
            IF TG_OP = 'UPDATE' AND NEW."isSuperAdmin" IS DISTINCT FROM OLD."isSuperAdmin" THEN
              RAISE EXCEPTION 'Super Admin status may only be changed by a trusted administrative process';
            END IF;
          END IF;
          RETURN NEW;
        END;
      $$ LANGUAGE plpgsql`,
      `CREATE TRIGGER "TR_users_protect_super_admin_assignment" BEFORE INSERT OR UPDATE ON "users"
        FOR EACH ROW EXECUTE FUNCTION "protect_super_admin_assignment"()`,
      `CREATE TABLE "user_branches" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "branchId" uuid NOT NULL,
        "accessLevel" "branch_access_level_enum" NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_branches" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_branches_user_branch" UNIQUE ("userId", "branchId"),
        CONSTRAINT "FK_user_branches_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_branches_branch" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE
      )`,
      `CREATE INDEX "IDX_user_branches_branch" ON "user_branches" ("branchId")`,
      `CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL,
        "code" varchar(50) NOT NULL,
        "description" text,
        "isSystem" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_roles_code" UNIQUE ("code")
      )`,
      `CREATE FUNCTION "protect_system_roles"() RETURNS trigger AS $$
        BEGIN
          IF current_setting('app.allow_system_role_seed', true) IS DISTINCT FROM 'on' THEN
            IF TG_OP = 'INSERT' AND NEW."isSystem" THEN
              RAISE EXCEPTION 'System roles may only be created by the controlled seed process';
            END IF;
            IF TG_OP = 'UPDATE' AND (OLD."isSystem" OR NEW."isSystem") THEN
              RAISE EXCEPTION 'System roles may only be changed by the controlled seed process';
            END IF;
            IF TG_OP = 'DELETE' AND OLD."isSystem" THEN
              RAISE EXCEPTION 'System roles may not be deleted';
            END IF;
          END IF;
          IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
          RETURN NEW;
        END;
      $$ LANGUAGE plpgsql`,
      `CREATE TRIGGER "TR_roles_protect_system" BEFORE INSERT OR UPDATE OR DELETE ON "roles"
        FOR EACH ROW EXECUTE FUNCTION "protect_system_roles"()`,
      `CREATE TABLE "seed_versions" (
        "name" varchar(100) NOT NULL,
        "version" integer NOT NULL,
        CONSTRAINT "PK_seed_versions" PRIMARY KEY ("name"),
        CONSTRAINT "CHK_seed_versions_positive" CHECK ("version" > 0)
      )`,
      `CREATE TABLE "user_roles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "roleId" uuid NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_roles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_roles_user_role" UNIQUE ("userId", "roleId"),
        CONSTRAINT "FK_user_roles_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_roles_role" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE
      )`,
      `CREATE INDEX "IDX_user_roles_role" ON "user_roles" ("roleId")`,
      `CREATE TABLE "modules" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL,
        "code" varchar(50) NOT NULL,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_modules" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_modules_code" UNIQUE ("code")
      )`,
      `CREATE TABLE "actions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL,
        "code" varchar(50) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_actions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_actions_code" UNIQUE ("code")
      )`,
      `CREATE TABLE "permissions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "moduleId" uuid NOT NULL,
        "actionId" uuid NOT NULL,
        "code" varchar(120) NOT NULL,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_permissions_code" UNIQUE ("code"),
        CONSTRAINT "UQ_permissions_module_action" UNIQUE ("moduleId", "actionId"),
        CONSTRAINT "FK_permissions_module" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_permissions_action" FOREIGN KEY ("actionId") REFERENCES "actions"("id") ON DELETE RESTRICT
      )`,
      `CREATE INDEX "IDX_permissions_module" ON "permissions" ("moduleId")`,
      `CREATE INDEX "IDX_permissions_action" ON "permissions" ("actionId")`,
      `CREATE TABLE "role_permissions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "roleId" uuid NOT NULL,
        "permissionId" uuid NOT NULL,
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_role_permissions_role_permission" UNIQUE ("roleId", "permissionId"),
        CONSTRAINT "FK_role_permissions_role" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE
      )`,
      `CREATE INDEX "IDX_role_permissions_permission" ON "role_permissions" ("permissionId")`,
      `CREATE TABLE "auth_sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "tokenFamilyId" uuid NOT NULL,
        "refreshTokenHash" varchar NOT NULL,
        "expiresAt" timestamptz NOT NULL,
        "absoluteExpiresAt" timestamptz NOT NULL,
        "revokedAt" timestamptz,
        "lastUsedAt" timestamptz,
        "userAgent" text,
        "deviceName" varchar,
        "ipAddress" varchar,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_auth_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_auth_sessions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_auth_sessions_expiration" CHECK ("expiresAt" <= "absoluteExpiresAt")
      )`,
      `CREATE INDEX "IDX_auth_sessions_user" ON "auth_sessions" ("userId")`,
      `CREATE INDEX "IDX_auth_sessions_token_family" ON "auth_sessions" ("tokenFamilyId")`,
      `CREATE INDEX "IDX_auth_sessions_expires_at" ON "auth_sessions" ("expiresAt")`,
      `CREATE TABLE "auth_session_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "sessionId" uuid NOT NULL,
        "tokenHash" varchar NOT NULL,
        "consumedAt" timestamptz,
        "replacedByTokenId" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_auth_session_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_auth_session_tokens_hash" UNIQUE ("tokenHash"),
        CONSTRAINT "FK_auth_session_tokens_session" FOREIGN KEY ("sessionId") REFERENCES "auth_sessions"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_auth_session_tokens_replacement" FOREIGN KEY ("replacedByTokenId") REFERENCES "auth_session_tokens"("id") ON DELETE RESTRICT
      )`,
      `CREATE INDEX "IDX_auth_session_tokens_session" ON "auth_session_tokens" ("sessionId")`,
      `CREATE INDEX "IDX_auth_session_tokens_replacement" ON "auth_session_tokens" ("replacedByTokenId")`,
      `CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "actorUserId" uuid,
        "branchId" uuid,
        "warehouseId" uuid,
        "action" varchar(100) NOT NULL,
        "module" varchar(100) NOT NULL,
        "entityType" varchar(100) NOT NULL,
        "entityId" uuid,
        "oldValues" jsonb,
        "newValues" jsonb,
        "reason" text,
        "ipAddress" varchar,
        "userAgent" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_logs_actor" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_audit_logs_branch" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_audit_logs_warehouse" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT
      )`,
      `CREATE INDEX "IDX_audit_logs_actor" ON "audit_logs" ("actorUserId")`,
      `CREATE INDEX "IDX_audit_logs_branch" ON "audit_logs" ("branchId")`,
      `CREATE INDEX "IDX_audit_logs_warehouse" ON "audit_logs" ("warehouseId")`,
      `CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs" ("createdAt")`,
      `CREATE FUNCTION "reject_audit_mutation"() RETURNS trigger AS $$
        BEGIN
          RAISE EXCEPTION 'Audit log records are append-only';
        END;
      $$ LANGUAGE plpgsql`,
      `CREATE TRIGGER "TR_audit_logs_append_only" BEFORE UPDATE OR DELETE ON "audit_logs"
        FOR EACH ROW EXECUTE FUNCTION "reject_audit_mutation"()`,
      `CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" varchar(80) NOT NULL,
        "name" varchar(200) NOT NULL,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_products_code" UNIQUE ("code")
      )`,
      `CREATE TABLE "units_of_measure" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" varchar(50) NOT NULL,
        "name" varchar(100) NOT NULL,
        "unitType" varchar(50) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_units_of_measure" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_units_of_measure_code" UNIQUE ("code")
      )`,
      `CREATE TABLE "product_packagings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "productId" uuid NOT NULL,
        "unitOfMeasureId" uuid NOT NULL,
        "name" varchar(150) NOT NULL,
        "packagingCode" varchar(80) NOT NULL,
        "quantityInBaseUnit" numeric(18,6) NOT NULL,
        "length" numeric(14,4),
        "width" numeric(14,4),
        "height" numeric(14,4),
        "dimensionUnit" "packaging_dimension_unit_enum",
        "volumeCubicMeters" numeric(18,8),
        "volumeSource" "packaging_volume_source_enum",
        "isDefault" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_packagings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_product_packagings_product_code" UNIQUE ("productId", "packagingCode"),
        CONSTRAINT "CHK_product_packagings_positive_values" CHECK ("quantityInBaseUnit" > 0 AND ("length" IS NULL OR "length" > 0) AND ("width" IS NULL OR "width" > 0) AND ("height" IS NULL OR "height" > 0) AND ("volumeCubicMeters" IS NULL OR "volumeCubicMeters" > 0)),
        CONSTRAINT "CHK_product_packagings_volume_source" CHECK (("volumeCubicMeters" IS NULL AND "volumeSource" IS NULL) OR ("volumeCubicMeters" IS NOT NULL AND "volumeSource" IS NOT NULL)),
        CONSTRAINT "CHK_product_packagings_dimensions_unit" CHECK (( "length" IS NULL AND "width" IS NULL AND "height" IS NULL AND "dimensionUnit" IS NULL) OR ("length" IS NOT NULL AND "width" IS NOT NULL AND "height" IS NOT NULL AND "dimensionUnit" IS NOT NULL)),
        CONSTRAINT "CHK_product_packagings_calculated_volume_dimensions" CHECK ("volumeSource" IS DISTINCT FROM 'CALCULATED' OR ("length" IS NOT NULL AND "width" IS NOT NULL AND "height" IS NOT NULL AND "dimensionUnit" IS NOT NULL)),
        CONSTRAINT "FK_product_packagings_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_product_packagings_unit" FOREIGN KEY ("unitOfMeasureId") REFERENCES "units_of_measure"("id") ON DELETE RESTRICT
      )`,
      `CREATE UNIQUE INDEX "UQ_product_packagings_active_default" ON "product_packagings" ("productId") WHERE "isDefault" = true AND "isActive" = true`,
      `CREATE INDEX "IDX_product_packagings_unit" ON "product_packagings" ("unitOfMeasureId")`,
    ];

    for (const statement of statements) {
      await queryRunner.query(statement);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const statements = [
      `DROP TABLE IF EXISTS "product_packagings"`,
      `DROP TABLE IF EXISTS "units_of_measure"`,
      `DROP TABLE IF EXISTS "products"`,
      `DROP TRIGGER IF EXISTS "TR_audit_logs_append_only" ON "audit_logs"`,
      `DROP FUNCTION IF EXISTS "reject_audit_mutation"()`,
      `DROP TABLE IF EXISTS "audit_logs"`,
      `DROP TABLE IF EXISTS "auth_session_tokens"`,
      `DROP TABLE IF EXISTS "auth_sessions"`,
      `DROP TABLE IF EXISTS "role_permissions"`,
      `DROP TABLE IF EXISTS "permissions"`,
      `DROP TABLE IF EXISTS "actions"`,
      `DROP TABLE IF EXISTS "modules"`,
      `DROP TABLE IF EXISTS "user_roles"`,
      `DROP TABLE IF EXISTS "seed_versions"`,
      `DROP TRIGGER IF EXISTS "TR_roles_protect_system" ON "roles"`,
      `DROP FUNCTION IF EXISTS "protect_system_roles"()`,
      `DROP TABLE IF EXISTS "roles"`,
      `DROP TABLE IF EXISTS "user_branches"`,
      `DROP TRIGGER IF EXISTS "TR_users_last_active_super_admin" ON "users"`,
      `DROP TRIGGER IF EXISTS "TR_users_protect_super_admin_assignment" ON "users"`,
      `DROP FUNCTION IF EXISTS "protect_last_active_super_admin"()`,
      `DROP FUNCTION IF EXISTS "protect_super_admin_assignment"()`,
      `DROP TABLE IF EXISTS "users"`,
      `DROP TABLE IF EXISTS "warehouses"`,
      `DROP TABLE IF EXISTS "branches"`,
      `DROP TRIGGER IF EXISTS "TR_companies_singleton" ON "companies"`,
      `DROP FUNCTION IF EXISTS "enforce_single_company"()`,
      `DROP TABLE IF EXISTS "companies"`,
      `DROP TYPE IF EXISTS "packaging_volume_source_enum"`,
      `DROP TYPE IF EXISTS "packaging_dimension_unit_enum"`,
      `DROP TYPE IF EXISTS "branch_access_level_enum"`,
      `DROP TYPE IF EXISTS "warehouse_operational_status_enum"`,
    ];

    for (const statement of statements) {
      await queryRunner.query(statement);
    }
  }
}
