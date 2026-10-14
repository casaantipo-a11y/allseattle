import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_businesses_status" ADD VALUE 'pending' BEFORE 'published';
  ALTER TYPE "public"."enum_businesses_status" ADD VALUE 'rejected';
  ALTER TABLE "businesses" ADD COLUMN "owner_id" integer;
  ALTER TABLE "businesses" ADD COLUMN "moderation_note" varchar;
  ALTER TABLE "media" ADD COLUMN "uploaded_by_id" integer;
  ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_id_customers_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_id_customers_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "businesses_owner_idx" ON "businesses" USING btree ("owner_id");
  CREATE INDEX "media_uploaded_by_idx" ON "media" USING btree ("uploaded_by_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "businesses" DROP CONSTRAINT "businesses_owner_id_customers_id_fk";
  
  ALTER TABLE "media" DROP CONSTRAINT "media_uploaded_by_id_customers_id_fk";
  
  ALTER TABLE "businesses" ALTER COLUMN "status" SET DATA TYPE text;
  UPDATE "businesses" SET "status" = 'draft' WHERE "status" IN ('pending', 'rejected');
  ALTER TABLE "businesses" ALTER COLUMN "status" SET DEFAULT 'draft'::text;
  DROP TYPE "public"."enum_businesses_status";
  CREATE TYPE "public"."enum_businesses_status" AS ENUM('draft', 'published');
  ALTER TABLE "businesses" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."enum_businesses_status";
  ALTER TABLE "businesses" ALTER COLUMN "status" SET DATA TYPE "public"."enum_businesses_status" USING "status"::"public"."enum_businesses_status";
  DROP INDEX "businesses_owner_idx";
  DROP INDEX "media_uploaded_by_idx";
  ALTER TABLE "businesses" DROP COLUMN "owner_id";
  ALTER TABLE "businesses" DROP COLUMN "moderation_note";
  ALTER TABLE "media" DROP COLUMN "uploaded_by_id";`)
}
