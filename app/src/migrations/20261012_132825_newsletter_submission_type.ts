import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_submissions_type" ADD VALUE 'newsletter';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "submissions" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum_submissions_type";
  CREATE TYPE "public"."enum_submissions_type" AS ENUM('news_tip', 'business_registration', 'ad_inquiry');
  ALTER TABLE "submissions" ALTER COLUMN "type" SET DATA TYPE "public"."enum_submissions_type" USING "type"::"public"."enum_submissions_type";`)
}
