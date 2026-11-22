import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_submissions_type" ADD VALUE 'price_request';
  ALTER TABLE "submissions" ADD COLUMN "business_id" integer;
  ALTER TABLE "submissions" ADD CONSTRAINT "submissions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "submissions_business_idx" ON "submissions" USING btree ("business_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "submissions" DROP CONSTRAINT "submissions_business_id_businesses_id_fk";
  
  ALTER TABLE "submissions" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum_submissions_type";
  CREATE TYPE "public"."enum_submissions_type" AS ENUM('news_tip', 'business_registration', 'ad_inquiry', 'newsletter');
  ALTER TABLE "submissions" ALTER COLUMN "type" SET DATA TYPE "public"."enum_submissions_type" USING "type"::"public"."enum_submissions_type";
  DROP INDEX "submissions_business_idx";
  ALTER TABLE "submissions" DROP COLUMN "business_id";`)
}
