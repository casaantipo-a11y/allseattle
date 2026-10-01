import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ad_slots_page" AS ENUM('home', 'news', 'directory', 'shopping', 'leisure', 'business', 'events', 'cars', 'jobs', 'weather', 'all');
  CREATE TYPE "public"."enum_ad_slots_position" AS ENUM('leaderboard', 'sidebar', 'in-feed');
  CREATE TYPE "public"."enum_ad_slots_desktop_size" AS ENUM('970x250', '728x90', '300x250', '300x600', '320x100');
  CREATE TYPE "public"."enum_ad_slots_mobile_size" AS ENUM('970x250', '728x90', '300x250', '300x600', '320x100');
  CREATE TYPE "public"."enum_banners_status" AS ENUM('draft', 'published');
  CREATE TABLE "ad_slots" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"name" varchar,
  	"page" "enum_ad_slots_page" NOT NULL,
  	"position" "enum_ad_slots_position" NOT NULL,
  	"desktop_size" "enum_ad_slots_desktop_size" NOT NULL,
  	"mobile_size" "enum_ad_slots_mobile_size",
  	"weekly_price" numeric DEFAULT 0 NOT NULL,
  	"sort_order" numeric DEFAULT 0,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "banners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"advertiser" varchar NOT NULL,
  	"link_url" varchar NOT NULL,
  	"image_desktop_id" integer NOT NULL,
  	"image_mobile_id" integer,
  	"start_at" timestamp(3) with time zone NOT NULL,
  	"end_at" timestamp(3) with time zone NOT NULL,
  	"status" "enum_banners_status" DEFAULT 'draft' NOT NULL,
  	"is_demo" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "banners_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"ad_slots_id" integer
  );
  
  CREATE TABLE "banner_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"banner_id" integer NOT NULL,
  	"date" varchar NOT NULL,
  	"impressions" numeric DEFAULT 0 NOT NULL,
  	"clicks" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ad_slots_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "banners_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "banner_stats_id" integer;
  ALTER TABLE "banners" ADD CONSTRAINT "banners_image_desktop_id_media_id_fk" FOREIGN KEY ("image_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "banners" ADD CONSTRAINT "banners_image_mobile_id_media_id_fk" FOREIGN KEY ("image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "banners_rels" ADD CONSTRAINT "banners_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."banners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "banners_rels" ADD CONSTRAINT "banners_rels_ad_slots_fk" FOREIGN KEY ("ad_slots_id") REFERENCES "public"."ad_slots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "banner_stats" ADD CONSTRAINT "banner_stats_banner_id_banners_id_fk" FOREIGN KEY ("banner_id") REFERENCES "public"."banners"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "ad_slots_code_idx" ON "ad_slots" USING btree ("code");
  CREATE INDEX "ad_slots_page_idx" ON "ad_slots" USING btree ("page");
  CREATE INDEX "ad_slots_updated_at_idx" ON "ad_slots" USING btree ("updated_at");
  CREATE INDEX "ad_slots_created_at_idx" ON "ad_slots" USING btree ("created_at");
  CREATE INDEX "banners_image_desktop_idx" ON "banners" USING btree ("image_desktop_id");
  CREATE INDEX "banners_image_mobile_idx" ON "banners" USING btree ("image_mobile_id");
  CREATE INDEX "banners_start_at_idx" ON "banners" USING btree ("start_at");
  CREATE INDEX "banners_end_at_idx" ON "banners" USING btree ("end_at");
  CREATE INDEX "banners_status_idx" ON "banners" USING btree ("status");
  CREATE INDEX "banners_is_demo_idx" ON "banners" USING btree ("is_demo");
  CREATE INDEX "banners_updated_at_idx" ON "banners" USING btree ("updated_at");
  CREATE INDEX "banners_created_at_idx" ON "banners" USING btree ("created_at");
  CREATE INDEX "banners_rels_order_idx" ON "banners_rels" USING btree ("order");
  CREATE INDEX "banners_rels_parent_idx" ON "banners_rels" USING btree ("parent_id");
  CREATE INDEX "banners_rels_path_idx" ON "banners_rels" USING btree ("path");
  CREATE INDEX "banners_rels_ad_slots_id_idx" ON "banners_rels" USING btree ("ad_slots_id");
  CREATE INDEX "banner_stats_banner_idx" ON "banner_stats" USING btree ("banner_id");
  CREATE INDEX "banner_stats_date_idx" ON "banner_stats" USING btree ("date");
  CREATE INDEX "banner_stats_updated_at_idx" ON "banner_stats" USING btree ("updated_at");
  CREATE INDEX "banner_stats_created_at_idx" ON "banner_stats" USING btree ("created_at");
  CREATE UNIQUE INDEX "banner_date_idx" ON "banner_stats" USING btree ("banner_id","date");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ad_slots_fk" FOREIGN KEY ("ad_slots_id") REFERENCES "public"."ad_slots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_banners_fk" FOREIGN KEY ("banners_id") REFERENCES "public"."banners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_banner_stats_fk" FOREIGN KEY ("banner_stats_id") REFERENCES "public"."banner_stats"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_ad_slots_id_idx" ON "payload_locked_documents_rels" USING btree ("ad_slots_id");
  CREATE INDEX "payload_locked_documents_rels_banners_id_idx" ON "payload_locked_documents_rels" USING btree ("banners_id");
  CREATE INDEX "payload_locked_documents_rels_banner_stats_id_idx" ON "payload_locked_documents_rels" USING btree ("banner_stats_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ad_slots" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "banners" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "banners_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "banner_stats" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ad_slots" CASCADE;
  DROP TABLE "banners" CASCADE;
  DROP TABLE "banners_rels" CASCADE;
  DROP TABLE "banner_stats" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ad_slots_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_banners_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_banner_stats_fk";
  
  DROP INDEX "payload_locked_documents_rels_ad_slots_id_idx";
  DROP INDEX "payload_locked_documents_rels_banners_id_idx";
  DROP INDEX "payload_locked_documents_rels_banner_stats_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ad_slots_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "banners_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "banner_stats_id";
  DROP TYPE "public"."enum_ad_slots_page";
  DROP TYPE "public"."enum_ad_slots_position";
  DROP TYPE "public"."enum_ad_slots_desktop_size";
  DROP TYPE "public"."enum_ad_slots_mobile_size";
  DROP TYPE "public"."enum_banners_status";`)
}
