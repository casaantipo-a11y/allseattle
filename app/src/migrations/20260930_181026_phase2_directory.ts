import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_businesses_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_business_categories_section" AS ENUM('directory', 'shopping', 'leisure');
  CREATE TYPE "public"."enum_packages_currency" AS ENUM('USD');
  CREATE TYPE "public"."enum_submissions_type" AS ENUM('news_tip', 'business_registration', 'ad_inquiry');
  CREATE TYPE "public"."enum_submissions_status" AS ENUM('new', 'in_progress', 'done', 'rejected');
  CREATE TABLE "businesses_hours" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"days" varchar NOT NULL,
  	"time" varchar NOT NULL
  );
  
  CREATE TABLE "businesses_slug_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL
  );
  
  CREATE TABLE "businesses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"logo_id" integer,
  	"cover_id" integer,
  	"summary" varchar,
  	"description" jsonb,
  	"address" varchar,
  	"lat" numeric,
  	"lng" numeric,
  	"geocode_note" varchar,
  	"phone" varchar,
  	"email" varchar,
  	"website" varchar,
  	"socials_facebook" varchar,
  	"socials_instagram" varchar,
  	"socials_x" varchar,
  	"socials_yelp" varchar,
  	"package_id" integer,
  	"package_expires_at" timestamp(3) with time zone,
  	"priority" numeric DEFAULT 0,
  	"subdomain" varchar,
  	"branding_header_image_id" integer,
  	"branding_brand_color" varchar,
  	"slug" varchar,
  	"status" "enum_businesses_status" DEFAULT 'draft' NOT NULL,
  	"views_count" numeric DEFAULT 0,
  	"is_demo" boolean DEFAULT false,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "businesses_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"business_categories_id" integer,
  	"media_id" integer,
  	"documents_id" integer
  );
  
  CREATE TABLE "business_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"section" "enum_business_categories_section" DEFAULT 'directory' NOT NULL,
  	"parent_id" integer,
  	"icon_id" integer,
  	"description" varchar,
  	"order" numeric DEFAULT 0,
  	"is_demo" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "packages_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "packages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"order" numeric DEFAULT 1 NOT NULL,
  	"price_monthly" numeric DEFAULT 0 NOT NULL,
  	"price_yearly" numeric DEFAULT 0 NOT NULL,
  	"currency" "enum_packages_currency" DEFAULT 'USD' NOT NULL,
  	"max_categories" numeric DEFAULT 2 NOT NULL,
  	"max_photos" numeric DEFAULT 10 NOT NULL,
  	"max_listings" numeric DEFAULT 5 NOT NULL,
  	"max_products" numeric DEFAULT 0 NOT NULL,
  	"map_placement" boolean DEFAULT true,
  	"promotions" boolean DEFAULT true,
  	"price_lists" boolean DEFAULT true,
  	"subdomain" boolean DEFAULT false,
  	"priority_placement" boolean DEFAULT false,
  	"category_banner_first_month" boolean DEFAULT false,
  	"branded_page" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "promotions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"business_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"image_id" integer,
  	"valid_from" timestamp(3) with time zone NOT NULL,
  	"valid_until" timestamp(3) with time zone NOT NULL,
  	"is_demo" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"business_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"price" numeric,
  	"image_id" integer,
  	"description" varchar,
  	"is_demo" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_submissions_type" NOT NULL,
  	"status" "enum_submissions_status" DEFAULT 'new' NOT NULL,
  	"name" varchar,
  	"email" varchar,
  	"phone" varchar,
  	"message" varchar,
  	"business_name" varchar,
  	"category_id" integer,
  	"desired_package_id" integer,
  	"desired_slot" varchar,
  	"location" varchar,
  	"internal_notes" varchar,
  	"ip" varchar,
  	"user_agent" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "submissions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"is_demo" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "businesses_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "business_categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "packages_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "promotions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "products_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "submissions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "documents_id" integer;
  ALTER TABLE "businesses_hours" ADD CONSTRAINT "businesses_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "businesses_slug_history" ADD CONSTRAINT "businesses_slug_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "businesses" ADD CONSTRAINT "businesses_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "businesses" ADD CONSTRAINT "businesses_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "businesses" ADD CONSTRAINT "businesses_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "businesses" ADD CONSTRAINT "businesses_branding_header_image_id_media_id_fk" FOREIGN KEY ("branding_header_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "businesses" ADD CONSTRAINT "businesses_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "businesses_rels" ADD CONSTRAINT "businesses_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "businesses_rels" ADD CONSTRAINT "businesses_rels_business_categories_fk" FOREIGN KEY ("business_categories_id") REFERENCES "public"."business_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "businesses_rels" ADD CONSTRAINT "businesses_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "businesses_rels" ADD CONSTRAINT "businesses_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "business_categories" ADD CONSTRAINT "business_categories_parent_id_business_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."business_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "business_categories" ADD CONSTRAINT "business_categories_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "packages_features" ADD CONSTRAINT "packages_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "promotions" ADD CONSTRAINT "promotions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "promotions" ADD CONSTRAINT "promotions_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "submissions" ADD CONSTRAINT "submissions_category_id_business_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."business_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "submissions" ADD CONSTRAINT "submissions_desired_package_id_packages_id_fk" FOREIGN KEY ("desired_package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "submissions_rels" ADD CONSTRAINT "submissions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "submissions_rels" ADD CONSTRAINT "submissions_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "businesses_hours_order_idx" ON "businesses_hours" USING btree ("_order");
  CREATE INDEX "businesses_hours_parent_id_idx" ON "businesses_hours" USING btree ("_parent_id");
  CREATE INDEX "businesses_slug_history_order_idx" ON "businesses_slug_history" USING btree ("_order");
  CREATE INDEX "businesses_slug_history_parent_id_idx" ON "businesses_slug_history" USING btree ("_parent_id");
  CREATE INDEX "businesses_logo_idx" ON "businesses" USING btree ("logo_id");
  CREATE INDEX "businesses_cover_idx" ON "businesses" USING btree ("cover_id");
  CREATE INDEX "businesses_package_idx" ON "businesses" USING btree ("package_id");
  CREATE UNIQUE INDEX "businesses_subdomain_idx" ON "businesses" USING btree ("subdomain");
  CREATE INDEX "businesses_branding_branding_header_image_idx" ON "businesses" USING btree ("branding_header_image_id");
  CREATE UNIQUE INDEX "businesses_slug_idx" ON "businesses" USING btree ("slug");
  CREATE INDEX "businesses_status_idx" ON "businesses" USING btree ("status");
  CREATE INDEX "businesses_is_demo_idx" ON "businesses" USING btree ("is_demo");
  CREATE INDEX "businesses_meta_meta_image_idx" ON "businesses" USING btree ("meta_image_id");
  CREATE INDEX "businesses_updated_at_idx" ON "businesses" USING btree ("updated_at");
  CREATE INDEX "businesses_created_at_idx" ON "businesses" USING btree ("created_at");
  CREATE INDEX "businesses_rels_order_idx" ON "businesses_rels" USING btree ("order");
  CREATE INDEX "businesses_rels_parent_idx" ON "businesses_rels" USING btree ("parent_id");
  CREATE INDEX "businesses_rels_path_idx" ON "businesses_rels" USING btree ("path");
  CREATE INDEX "businesses_rels_business_categories_id_idx" ON "businesses_rels" USING btree ("business_categories_id");
  CREATE INDEX "businesses_rels_media_id_idx" ON "businesses_rels" USING btree ("media_id");
  CREATE INDEX "businesses_rels_documents_id_idx" ON "businesses_rels" USING btree ("documents_id");
  CREATE UNIQUE INDEX "business_categories_slug_idx" ON "business_categories" USING btree ("slug");
  CREATE INDEX "business_categories_section_idx" ON "business_categories" USING btree ("section");
  CREATE INDEX "business_categories_parent_idx" ON "business_categories" USING btree ("parent_id");
  CREATE INDEX "business_categories_icon_idx" ON "business_categories" USING btree ("icon_id");
  CREATE INDEX "business_categories_is_demo_idx" ON "business_categories" USING btree ("is_demo");
  CREATE INDEX "business_categories_updated_at_idx" ON "business_categories" USING btree ("updated_at");
  CREATE INDEX "business_categories_created_at_idx" ON "business_categories" USING btree ("created_at");
  CREATE INDEX "packages_features_order_idx" ON "packages_features" USING btree ("_order");
  CREATE INDEX "packages_features_parent_id_idx" ON "packages_features" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "packages_name_idx" ON "packages" USING btree ("name");
  CREATE INDEX "packages_updated_at_idx" ON "packages" USING btree ("updated_at");
  CREATE INDEX "packages_created_at_idx" ON "packages" USING btree ("created_at");
  CREATE INDEX "promotions_business_idx" ON "promotions" USING btree ("business_id");
  CREATE INDEX "promotions_image_idx" ON "promotions" USING btree ("image_id");
  CREATE INDEX "promotions_valid_until_idx" ON "promotions" USING btree ("valid_until");
  CREATE INDEX "promotions_is_demo_idx" ON "promotions" USING btree ("is_demo");
  CREATE INDEX "promotions_updated_at_idx" ON "promotions" USING btree ("updated_at");
  CREATE INDEX "promotions_created_at_idx" ON "promotions" USING btree ("created_at");
  CREATE INDEX "products_business_idx" ON "products" USING btree ("business_id");
  CREATE INDEX "products_image_idx" ON "products" USING btree ("image_id");
  CREATE INDEX "products_is_demo_idx" ON "products" USING btree ("is_demo");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE INDEX "submissions_type_idx" ON "submissions" USING btree ("type");
  CREATE INDEX "submissions_status_idx" ON "submissions" USING btree ("status");
  CREATE INDEX "submissions_category_idx" ON "submissions" USING btree ("category_id");
  CREATE INDEX "submissions_desired_package_idx" ON "submissions" USING btree ("desired_package_id");
  CREATE INDEX "submissions_ip_idx" ON "submissions" USING btree ("ip");
  CREATE INDEX "submissions_updated_at_idx" ON "submissions" USING btree ("updated_at");
  CREATE INDEX "submissions_created_at_idx" ON "submissions" USING btree ("created_at");
  CREATE INDEX "submissions_rels_order_idx" ON "submissions_rels" USING btree ("order");
  CREATE INDEX "submissions_rels_parent_idx" ON "submissions_rels" USING btree ("parent_id");
  CREATE INDEX "submissions_rels_path_idx" ON "submissions_rels" USING btree ("path");
  CREATE INDEX "submissions_rels_media_id_idx" ON "submissions_rels" USING btree ("media_id");
  CREATE INDEX "documents_is_demo_idx" ON "documents" USING btree ("is_demo");
  CREATE INDEX "documents_updated_at_idx" ON "documents" USING btree ("updated_at");
  CREATE INDEX "documents_created_at_idx" ON "documents" USING btree ("created_at");
  CREATE UNIQUE INDEX "documents_filename_idx" ON "documents" USING btree ("filename");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_businesses_fk" FOREIGN KEY ("businesses_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_business_categories_fk" FOREIGN KEY ("business_categories_id") REFERENCES "public"."business_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_packages_fk" FOREIGN KEY ("packages_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_promotions_fk" FOREIGN KEY ("promotions_id") REFERENCES "public"."promotions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_submissions_fk" FOREIGN KEY ("submissions_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_businesses_id_idx" ON "payload_locked_documents_rels" USING btree ("businesses_id");
  CREATE INDEX "payload_locked_documents_rels_business_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("business_categories_id");
  CREATE INDEX "payload_locked_documents_rels_packages_id_idx" ON "payload_locked_documents_rels" USING btree ("packages_id");
  CREATE INDEX "payload_locked_documents_rels_promotions_id_idx" ON "payload_locked_documents_rels" USING btree ("promotions_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("submissions_id");
  CREATE INDEX "payload_locked_documents_rels_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("documents_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "businesses_hours" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "businesses_slug_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "businesses" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "businesses_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "business_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "packages_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "packages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "promotions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "submissions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "submissions_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "documents" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "businesses_hours" CASCADE;
  DROP TABLE "businesses_slug_history" CASCADE;
  DROP TABLE "businesses" CASCADE;
  DROP TABLE "businesses_rels" CASCADE;
  DROP TABLE "business_categories" CASCADE;
  DROP TABLE "packages_features" CASCADE;
  DROP TABLE "packages" CASCADE;
  DROP TABLE "promotions" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "submissions" CASCADE;
  DROP TABLE "submissions_rels" CASCADE;
  DROP TABLE "documents" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_businesses_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_business_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_packages_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_promotions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_products_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_submissions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_documents_fk";
  
  DROP INDEX "payload_locked_documents_rels_businesses_id_idx";
  DROP INDEX "payload_locked_documents_rels_business_categories_id_idx";
  DROP INDEX "payload_locked_documents_rels_packages_id_idx";
  DROP INDEX "payload_locked_documents_rels_promotions_id_idx";
  DROP INDEX "payload_locked_documents_rels_products_id_idx";
  DROP INDEX "payload_locked_documents_rels_submissions_id_idx";
  DROP INDEX "payload_locked_documents_rels_documents_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "businesses_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "business_categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "packages_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "promotions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "products_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "submissions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "documents_id";
  DROP TYPE "public"."enum_businesses_status";
  DROP TYPE "public"."enum_business_categories_section";
  DROP TYPE "public"."enum_packages_currency";
  DROP TYPE "public"."enum_submissions_type";
  DROP TYPE "public"."enum_submissions_status";`)
}
