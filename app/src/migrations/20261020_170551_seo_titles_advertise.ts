// SEO titles per section and the Advertising tab (client's second SEO batch, 20.10.2026). The
// generator's media/documents R2-column drops removed by hand (the plugin is off locally).
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "seo_texts" ADD COLUMN "home_meta_title" varchar;
  ALTER TABLE "seo_texts" ADD COLUMN "news_meta_title" varchar;
  ALTER TABLE "seo_texts" ADD COLUMN "directory_meta_title" varchar;
  ALTER TABLE "seo_texts" ADD COLUMN "shopping_meta_title" varchar;
  ALTER TABLE "seo_texts" ADD COLUMN "leisure_meta_title" varchar;
  ALTER TABLE "seo_texts" ADD COLUMN "events_meta_title" varchar;
  ALTER TABLE "seo_texts" ADD COLUMN "jobs_meta_title" varchar;
  ALTER TABLE "seo_texts" ADD COLUMN "cars_meta_title" varchar;
  ALTER TABLE "seo_texts" ADD COLUMN "car_services_meta_title" varchar;
  ALTER TABLE "seo_texts" ADD COLUMN "weather_meta_title" varchar;
  ALTER TABLE "seo_texts" ADD COLUMN "map_meta_title" varchar;
  ALTER TABLE "seo_texts" ADD COLUMN "advertise_meta_title" varchar;
  ALTER TABLE "seo_texts" ADD COLUMN "advertise_heading" varchar;
  ALTER TABLE "seo_texts" ADD COLUMN "advertise_body" varchar;
  ALTER TABLE "seo_texts" ADD COLUMN "advertise_meta_description" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "seo_texts" DROP COLUMN "home_meta_title";
  ALTER TABLE "seo_texts" DROP COLUMN "news_meta_title";
  ALTER TABLE "seo_texts" DROP COLUMN "directory_meta_title";
  ALTER TABLE "seo_texts" DROP COLUMN "shopping_meta_title";
  ALTER TABLE "seo_texts" DROP COLUMN "leisure_meta_title";
  ALTER TABLE "seo_texts" DROP COLUMN "events_meta_title";
  ALTER TABLE "seo_texts" DROP COLUMN "jobs_meta_title";
  ALTER TABLE "seo_texts" DROP COLUMN "cars_meta_title";
  ALTER TABLE "seo_texts" DROP COLUMN "car_services_meta_title";
  ALTER TABLE "seo_texts" DROP COLUMN "weather_meta_title";
  ALTER TABLE "seo_texts" DROP COLUMN "map_meta_title";
  ALTER TABLE "seo_texts" DROP COLUMN "advertise_meta_title";
  ALTER TABLE "seo_texts" DROP COLUMN "advertise_heading";
  ALTER TABLE "seo_texts" DROP COLUMN "advertise_body";
  ALTER TABLE "seo_texts" DROP COLUMN "advertise_meta_description";`)
}
