import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_car_listings_status" ADD VALUE 'pending' BEFORE 'published';
  ALTER TYPE "public"."enum_car_listings_status" ADD VALUE 'rejected';
  ALTER TYPE "public"."enum_jobs_status" ADD VALUE 'pending' BEFORE 'published';
  ALTER TYPE "public"."enum_jobs_status" ADD VALUE 'rejected';
  ALTER TABLE "car_listings" ADD COLUMN "owner_id" integer;
  ALTER TABLE "car_listings" ADD COLUMN "moderation_note" varchar;
  ALTER TABLE "car_listings" ADD COLUMN "views_count" numeric DEFAULT 0;
  ALTER TABLE "jobs" ADD COLUMN "owner_id" integer;
  ALTER TABLE "jobs" ADD COLUMN "moderation_note" varchar;
  ALTER TABLE "jobs" ADD COLUMN "views_count" numeric DEFAULT 0;
  ALTER TABLE "car_listings" ADD CONSTRAINT "car_listings_owner_id_customers_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jobs" ADD CONSTRAINT "jobs_owner_id_customers_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "car_listings_owner_idx" ON "car_listings" USING btree ("owner_id");
  CREATE INDEX "jobs_owner_idx" ON "jobs" USING btree ("owner_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "car_listings" DROP CONSTRAINT "car_listings_owner_id_customers_id_fk";
  
  ALTER TABLE "jobs" DROP CONSTRAINT "jobs_owner_id_customers_id_fk";
  
  ALTER TABLE "car_listings" ALTER COLUMN "status" SET DATA TYPE text;
  UPDATE "car_listings" SET "status" = 'draft' WHERE "status" IN ('pending', 'rejected');
  ALTER TABLE "car_listings" ALTER COLUMN "status" SET DEFAULT 'draft'::text;
  DROP TYPE "public"."enum_car_listings_status";
  CREATE TYPE "public"."enum_car_listings_status" AS ENUM('draft', 'published');
  ALTER TABLE "car_listings" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."enum_car_listings_status";
  ALTER TABLE "car_listings" ALTER COLUMN "status" SET DATA TYPE "public"."enum_car_listings_status" USING "status"::"public"."enum_car_listings_status";
  ALTER TABLE "jobs" ALTER COLUMN "status" SET DATA TYPE text;
  UPDATE "jobs" SET "status" = 'draft' WHERE "status" IN ('pending', 'rejected');
  ALTER TABLE "jobs" ALTER COLUMN "status" SET DEFAULT 'draft'::text;
  DROP TYPE "public"."enum_jobs_status";
  CREATE TYPE "public"."enum_jobs_status" AS ENUM('draft', 'published');
  ALTER TABLE "jobs" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."enum_jobs_status";
  ALTER TABLE "jobs" ALTER COLUMN "status" SET DATA TYPE "public"."enum_jobs_status" USING "status"::"public"."enum_jobs_status";
  DROP INDEX "car_listings_owner_idx";
  DROP INDEX "jobs_owner_idx";
  ALTER TABLE "car_listings" DROP COLUMN "owner_id";
  ALTER TABLE "car_listings" DROP COLUMN "moderation_note";
  ALTER TABLE "car_listings" DROP COLUMN "views_count";
  ALTER TABLE "jobs" DROP COLUMN "owner_id";
  ALTER TABLE "jobs" DROP COLUMN "moderation_note";
  ALTER TABLE "jobs" DROP COLUMN "views_count";`)
}
