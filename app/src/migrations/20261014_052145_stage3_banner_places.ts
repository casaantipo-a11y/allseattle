import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_banners_subscription_status" AS ENUM('active', 'canceling', 'past_due', 'canceled');
  ALTER TYPE "public"."enum_banners_status" ADD VALUE 'pending' BEFORE 'published';
  ALTER TYPE "public"."enum_banners_status" ADD VALUE 'rejected';
  ALTER TABLE "banners" ALTER COLUMN "image_desktop_id" DROP NOT NULL;
  ALTER TABLE "banners" ADD COLUMN "owner_id" integer;
  ALTER TABLE "banners" ADD COLUMN "moderation_note" varchar;
  ALTER TABLE "banners" ADD COLUMN "subscription_status" "enum_banners_subscription_status";
  ALTER TABLE "banners" ADD COLUMN "stripe_subscription_id" varchar;
  ALTER TABLE "banners" ADD CONSTRAINT "banners_owner_id_customers_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "banners_owner_idx" ON "banners" USING btree ("owner_id");
  CREATE INDEX "banners_stripe_subscription_id_idx" ON "banners" USING btree ("stripe_subscription_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "banners" DROP CONSTRAINT "banners_owner_id_customers_id_fk";
  
  ALTER TABLE "banners" ALTER COLUMN "status" SET DATA TYPE text;
  UPDATE "banners" SET "status" = 'draft' WHERE "status" IN ('pending', 'rejected');
  ALTER TABLE "banners" ALTER COLUMN "status" SET DEFAULT 'draft'::text;
  DROP TYPE "public"."enum_banners_status";
  CREATE TYPE "public"."enum_banners_status" AS ENUM('draft', 'published');
  ALTER TABLE "banners" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."enum_banners_status";
  ALTER TABLE "banners" ALTER COLUMN "status" SET DATA TYPE "public"."enum_banners_status" USING "status"::"public"."enum_banners_status";
  DROP INDEX "banners_owner_idx";
  DROP INDEX "banners_stripe_subscription_id_idx";
  DELETE FROM "banners" WHERE "image_desktop_id" IS NULL;
  ALTER TABLE "banners" ALTER COLUMN "image_desktop_id" SET NOT NULL;
  ALTER TABLE "banners" DROP COLUMN "owner_id";
  ALTER TABLE "banners" DROP COLUMN "moderation_note";
  ALTER TABLE "banners" DROP COLUMN "subscription_status";
  ALTER TABLE "banners" DROP COLUMN "stripe_subscription_id";
  DROP TYPE "public"."enum_banners_subscription_status";`)
}
