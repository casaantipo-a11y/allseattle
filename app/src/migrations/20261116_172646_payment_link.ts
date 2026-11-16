import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "businesses" ADD COLUMN "payment_link_token" varchar;
  ALTER TABLE "businesses" ADD COLUMN "payment_link_package_id" integer;
  ALTER TABLE "businesses" ADD COLUMN "payment_link_sent_to" varchar;
  ALTER TABLE "businesses" ADD COLUMN "payment_link_sent_at" timestamp(3) with time zone;
  ALTER TABLE "businesses" ADD CONSTRAINT "businesses_payment_link_package_id_packages_id_fk" FOREIGN KEY ("payment_link_package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "businesses_payment_link_token_idx" ON "businesses" USING btree ("payment_link_token");
  CREATE INDEX "businesses_payment_link_package_idx" ON "businesses" USING btree ("payment_link_package_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "businesses" DROP CONSTRAINT "businesses_payment_link_package_id_packages_id_fk";
  
  DROP INDEX "businesses_payment_link_token_idx";
  DROP INDEX "businesses_payment_link_package_idx";
  ALTER TABLE "businesses" DROP COLUMN "payment_link_token";
  ALTER TABLE "businesses" DROP COLUMN "payment_link_package_id";
  ALTER TABLE "businesses" DROP COLUMN "payment_link_sent_to";
  ALTER TABLE "businesses" DROP COLUMN "payment_link_sent_at";`)
}
