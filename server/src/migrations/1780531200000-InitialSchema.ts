import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1780531200000 implements MigrationInterface {
  name = 'InitialSchema1780531200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" text NOT NULL,
        "password_hash" text NOT NULL,
        "role" text NOT NULL DEFAULT 'user',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "sections" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" text NOT NULL,
        "name" text NOT NULL,
        "layout" text NOT NULL,
        "is_public" boolean NOT NULL DEFAULT true,
        "display_order" integer NOT NULL DEFAULT 0,
        "icon" text,
        "created_by" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sections" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_sections_slug" ON "sections" ("slug")`,
    );

    await queryRunner.query(`
      CREATE TABLE "entries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "section_id" character varying NOT NULL,
        "status" text NOT NULL DEFAULT 'draft',
        "data" text NOT NULL,
        "published_at" character varying,
        "created_by" character varying,
        "display_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_entries" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_entries_section_status" ON "entries" ("section_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_entries_section_created_at" ON "entries" ("section_id", "created_at")`,
    );

    await queryRunner.query(`
      CREATE TABLE "layout_templates" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "description" text,
        "layout" text NOT NULL,
        "created_by" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_layout_templates" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "form_schemas" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "schema" text NOT NULL,
        "created_by" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_form_schemas" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "table_definitions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "columns" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_table_definitions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "table_rows" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "table_id" character varying NOT NULL,
        "data" text NOT NULL,
        "order_index" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_table_rows" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_table_rows_table_order" ON "table_rows" ("table_id", "order_index")`,
    );

    await queryRunner.query(`
      CREATE TABLE "dashboard_widgets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "type" text NOT NULL,
        "title" text NOT NULL,
        "data_endpoint" text NOT NULL,
        "config" text,
        "order_index" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dashboard_widgets" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "dynamic_endpoints" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "method" text NOT NULL,
        "path" text NOT NULL,
        "mode" text NOT NULL,
        "response_template" text,
        "db_query_config" text,
        "enabled" boolean NOT NULL DEFAULT true,
        "created_by" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dynamic_endpoints" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_dynamic_endpoints_method_path" ON "dynamic_endpoints" ("method", "path")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "dynamic_endpoints"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dashboard_widgets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "table_rows"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "table_definitions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "form_schemas"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "layout_templates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "entries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sections"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
