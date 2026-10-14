import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_businesses_subscription_status" AS ENUM('active', 'canceling', 'past_due', 'canceled');
  ALTER TABLE "businesses" ADD COLUMN "subscription_status" "enum_businesses_subscription_status";
  ALTER TABLE "businesses" ADD COLUMN "stripe_subscription_id" varchar;
  CREATE INDEX "businesses_stripe_subscription_id_idx" ON "businesses" USING btree ("stripe_subscription_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "businesses_stripe_subscription_id_idx";
  ALTER TABLE "businesses" DROP COLUMN "subscription_status";
  ALTER TABLE "businesses" DROP COLUMN "stripe_subscription_id";
  DROP TYPE "public"."enum_businesses_subscription_status";`)
}
