import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_ad_slots_page" ADD VALUE 'map' BEFORE 'all';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ad_slots" ALTER COLUMN "page" SET DATA TYPE text;
  DROP TYPE "public"."enum_ad_slots_page";
  CREATE TYPE "public"."enum_ad_slots_page" AS ENUM('home', 'news', 'directory', 'shopping', 'leisure', 'business', 'events', 'cars', 'jobs', 'weather', 'all');
  ALTER TABLE "ad_slots" ALTER COLUMN "page" SET DATA TYPE "public"."enum_ad_slots_page" USING "page"::"public"."enum_ad_slots_page";`)
}
