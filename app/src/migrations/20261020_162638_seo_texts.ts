// SEO texts global (client's AllSeattle_SEO_Texts_English.txt, 20.10.2026). The generator also
// wanted to drop media._objectkey and documents._objectkey / prefix: R2 plugin columns (the
// plugin is off locally); they hold the file keys on production and stay.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "seo_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"home_heading" varchar,
  	"home_body" varchar,
  	"home_meta_description" varchar,
  	"news_heading" varchar,
  	"news_body" varchar,
  	"news_meta_description" varchar,
  	"directory_heading" varchar,
  	"directory_body" varchar,
  	"directory_meta_description" varchar,
  	"shopping_heading" varchar,
  	"shopping_body" varchar,
  	"shopping_meta_description" varchar,
  	"leisure_heading" varchar,
  	"leisure_body" varchar,
  	"leisure_meta_description" varchar,
  	"events_heading" varchar,
  	"events_body" varchar,
  	"events_meta_description" varchar,
  	"jobs_heading" varchar,
  	"jobs_body" varchar,
  	"jobs_meta_description" varchar,
  	"cars_heading" varchar,
  	"cars_body" varchar,
  	"cars_meta_description" varchar,
  	"car_services_heading" varchar,
  	"car_services_body" varchar,
  	"car_services_meta_description" varchar,
  	"weather_heading" varchar,
  	"weather_body" varchar,
  	"weather_meta_description" varchar,
  	"map_heading" varchar,
  	"map_body" varchar,
  	"map_meta_description" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "seo_texts" CASCADE;`)
}
