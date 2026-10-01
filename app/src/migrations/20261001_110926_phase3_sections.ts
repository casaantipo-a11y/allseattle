import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_car_listings_transmission" AS ENUM('Automatic', 'CVT Automatic', 'Manual');
  CREATE TYPE "public"."enum_car_listings_fuel_type" AS ENUM('Gasoline', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric');
  CREATE TYPE "public"."enum_car_listings_drivetrain" AS ENUM('FWD', 'RWD', 'AWD', '4WD');
  CREATE TYPE "public"."enum_car_listings_body_type" AS ENUM('sedan', 'suv', 'truck', 'hatchback', 'coupe', 'convertible', 'wagon', 'van');
  CREATE TYPE "public"."enum_car_listings_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_car_listings_source" AS ENUM('admin', 'user');
  CREATE TYPE "public"."enum_jobs_open_to" AS ENUM('noExperience', 'students', 'accessible', 'fiftyPlus');
  CREATE TYPE "public"."enum_jobs_employment_type" AS ENUM('full-time', 'part-time', 'contract', 'temporary');
  CREATE TYPE "public"."enum_jobs_work_mode" AS ENUM('on-site', 'hybrid', 'remote');
  CREATE TYPE "public"."enum_jobs_salary_period" AS ENUM('hour', 'year');
  CREATE TYPE "public"."enum_jobs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_jobs_source" AS ENUM('admin', 'user');
  CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_contests_status" AS ENUM('upcoming', 'active', 'finished');
  CREATE TABLE "car_listings_slug_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL
  );
  
  CREATE TABLE "car_listings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"make_id" integer NOT NULL,
  	"model" varchar NOT NULL,
  	"year" numeric NOT NULL,
  	"price" numeric NOT NULL,
  	"mileage" numeric NOT NULL,
  	"engine" varchar,
  	"transmission" "enum_car_listings_transmission" NOT NULL,
  	"fuel_type" "enum_car_listings_fuel_type" NOT NULL,
  	"drivetrain" "enum_car_listings_drivetrain",
  	"body_type" "enum_car_listings_body_type" NOT NULL,
  	"exterior_color" varchar,
  	"vin" varchar,
  	"description" varchar,
  	"seller_name" varchar NOT NULL,
  	"seller_phone" varchar NOT NULL,
  	"dealer_id" integer,
  	"slug" varchar,
  	"status" "enum_car_listings_status" DEFAULT 'draft' NOT NULL,
  	"is_featured" boolean DEFAULT false,
  	"bumped_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone,
  	"source" "enum_car_listings_source" DEFAULT 'admin' NOT NULL,
  	"is_demo" boolean DEFAULT false,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "car_listings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "car_makes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "car_makes_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "jobs_open_to" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_jobs_open_to",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "jobs_slug_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL
  );
  
  CREATE TABLE "jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"business_id" integer,
  	"company_name" varchar,
  	"category_id" integer NOT NULL,
  	"employment_type" "enum_jobs_employment_type" NOT NULL,
  	"work_mode" "enum_jobs_work_mode" DEFAULT 'on-site',
  	"salary_min" numeric,
  	"salary_max" numeric,
  	"salary_period" "enum_jobs_salary_period" DEFAULT 'hour',
  	"location" varchar,
  	"description" jsonb,
  	"summary" varchar,
  	"how_to_apply" varchar NOT NULL,
  	"is_urgent" boolean,
  	"is_featured" boolean,
  	"slug" varchar,
  	"status" "enum_jobs_status" DEFAULT 'draft' NOT NULL,
  	"expires_at" timestamp(3) with time zone,
  	"source" "enum_jobs_source" DEFAULT 'admin',
  	"is_demo" boolean DEFAULT false,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jobs_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "job_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"is_demo" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "events_slug_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"start_at" timestamp(3) with time zone NOT NULL,
  	"end_at" timestamp(3) with time zone,
  	"category_id" integer NOT NULL,
  	"venue_name" varchar NOT NULL,
  	"address" varchar,
  	"lat" numeric,
  	"lng" numeric,
  	"geocode_note" varchar,
  	"is_free" boolean DEFAULT false,
  	"price" varchar,
  	"ticket_url" varchar,
  	"image_id" integer,
  	"summary" varchar,
  	"description" jsonb,
  	"slug" varchar,
  	"status" "enum_events_status" DEFAULT 'draft' NOT NULL,
  	"is_demo" boolean DEFAULT false,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "event_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"order" numeric DEFAULT 0,
  	"is_demo" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contests_entries" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"participant_first_name" varchar NOT NULL,
  	"participant_age" numeric NOT NULL,
  	"parent_consent" boolean DEFAULT false NOT NULL
  );
  
  CREATE TABLE "contests_slug_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL
  );
  
  CREATE TABLE "contests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"rules" jsonb,
  	"start_at" timestamp(3) with time zone,
  	"end_at" timestamp(3) with time zone,
  	"slug" varchar,
  	"status" "enum_contests_status" DEFAULT 'upcoming' NOT NULL,
  	"is_demo" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "search" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"priority" numeric,
  	"url" varchar,
  	"excerpt" varchar,
  	"kind" varchar,
  	"keywords" varchar,
  	"is_published" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "search_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"news_id" integer,
  	"businesses_id" integer,
  	"car_listings_id" integer,
  	"jobs_id" integer,
  	"events_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "car_listings_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "car_makes_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "jobs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "job_categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "events_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "event_categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "contests_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "search_id" integer;
  ALTER TABLE "car_listings_slug_history" ADD CONSTRAINT "car_listings_slug_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."car_listings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "car_listings" ADD CONSTRAINT "car_listings_make_id_car_makes_id_fk" FOREIGN KEY ("make_id") REFERENCES "public"."car_makes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "car_listings" ADD CONSTRAINT "car_listings_dealer_id_businesses_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "car_listings" ADD CONSTRAINT "car_listings_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "car_listings_rels" ADD CONSTRAINT "car_listings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."car_listings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "car_listings_rels" ADD CONSTRAINT "car_listings_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "car_makes_texts" ADD CONSTRAINT "car_makes_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."car_makes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs_open_to" ADD CONSTRAINT "jobs_open_to_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs_slug_history" ADD CONSTRAINT "jobs_slug_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs" ADD CONSTRAINT "jobs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jobs" ADD CONSTRAINT "jobs_category_id_job_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."job_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jobs" ADD CONSTRAINT "jobs_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jobs_texts" ADD CONSTRAINT "jobs_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_slug_history" ADD CONSTRAINT "events_slug_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_category_id_event_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."event_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contests_entries" ADD CONSTRAINT "contests_entries_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contests_entries" ADD CONSTRAINT "contests_entries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contests_slug_history" ADD CONSTRAINT "contests_slug_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_businesses_fk" FOREIGN KEY ("businesses_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_car_listings_fk" FOREIGN KEY ("car_listings_id") REFERENCES "public"."car_listings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_jobs_fk" FOREIGN KEY ("jobs_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "car_listings_slug_history_order_idx" ON "car_listings_slug_history" USING btree ("_order");
  CREATE INDEX "car_listings_slug_history_parent_id_idx" ON "car_listings_slug_history" USING btree ("_parent_id");
  CREATE INDEX "car_listings_make_idx" ON "car_listings" USING btree ("make_id");
  CREATE INDEX "car_listings_dealer_idx" ON "car_listings" USING btree ("dealer_id");
  CREATE UNIQUE INDEX "car_listings_slug_idx" ON "car_listings" USING btree ("slug");
  CREATE INDEX "car_listings_status_idx" ON "car_listings" USING btree ("status");
  CREATE INDEX "car_listings_expires_at_idx" ON "car_listings" USING btree ("expires_at");
  CREATE INDEX "car_listings_is_demo_idx" ON "car_listings" USING btree ("is_demo");
  CREATE INDEX "car_listings_meta_meta_image_idx" ON "car_listings" USING btree ("meta_image_id");
  CREATE INDEX "car_listings_updated_at_idx" ON "car_listings" USING btree ("updated_at");
  CREATE INDEX "car_listings_created_at_idx" ON "car_listings" USING btree ("created_at");
  CREATE INDEX "car_listings_rels_order_idx" ON "car_listings_rels" USING btree ("order");
  CREATE INDEX "car_listings_rels_parent_idx" ON "car_listings_rels" USING btree ("parent_id");
  CREATE INDEX "car_listings_rels_path_idx" ON "car_listings_rels" USING btree ("path");
  CREATE INDEX "car_listings_rels_media_id_idx" ON "car_listings_rels" USING btree ("media_id");
  CREATE UNIQUE INDEX "car_makes_name_idx" ON "car_makes" USING btree ("name");
  CREATE INDEX "car_makes_updated_at_idx" ON "car_makes" USING btree ("updated_at");
  CREATE INDEX "car_makes_created_at_idx" ON "car_makes" USING btree ("created_at");
  CREATE INDEX "car_makes_texts_order_parent" ON "car_makes_texts" USING btree ("order","parent_id");
  CREATE INDEX "jobs_open_to_order_idx" ON "jobs_open_to" USING btree ("order");
  CREATE INDEX "jobs_open_to_parent_idx" ON "jobs_open_to" USING btree ("parent_id");
  CREATE INDEX "jobs_slug_history_order_idx" ON "jobs_slug_history" USING btree ("_order");
  CREATE INDEX "jobs_slug_history_parent_id_idx" ON "jobs_slug_history" USING btree ("_parent_id");
  CREATE INDEX "jobs_business_idx" ON "jobs" USING btree ("business_id");
  CREATE INDEX "jobs_category_idx" ON "jobs" USING btree ("category_id");
  CREATE UNIQUE INDEX "jobs_slug_idx" ON "jobs" USING btree ("slug");
  CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");
  CREATE INDEX "jobs_expires_at_idx" ON "jobs" USING btree ("expires_at");
  CREATE INDEX "jobs_is_demo_idx" ON "jobs" USING btree ("is_demo");
  CREATE INDEX "jobs_meta_meta_image_idx" ON "jobs" USING btree ("meta_image_id");
  CREATE INDEX "jobs_updated_at_idx" ON "jobs" USING btree ("updated_at");
  CREATE INDEX "jobs_created_at_idx" ON "jobs" USING btree ("created_at");
  CREATE INDEX "jobs_texts_order_parent" ON "jobs_texts" USING btree ("order","parent_id");
  CREATE UNIQUE INDEX "job_categories_slug_idx" ON "job_categories" USING btree ("slug");
  CREATE INDEX "job_categories_is_demo_idx" ON "job_categories" USING btree ("is_demo");
  CREATE INDEX "job_categories_updated_at_idx" ON "job_categories" USING btree ("updated_at");
  CREATE INDEX "job_categories_created_at_idx" ON "job_categories" USING btree ("created_at");
  CREATE INDEX "events_slug_history_order_idx" ON "events_slug_history" USING btree ("_order");
  CREATE INDEX "events_slug_history_parent_id_idx" ON "events_slug_history" USING btree ("_parent_id");
  CREATE INDEX "events_start_at_idx" ON "events" USING btree ("start_at");
  CREATE INDEX "events_category_idx" ON "events" USING btree ("category_id");
  CREATE INDEX "events_image_idx" ON "events" USING btree ("image_id");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_status_idx" ON "events" USING btree ("status");
  CREATE INDEX "events_is_demo_idx" ON "events" USING btree ("is_demo");
  CREATE INDEX "events_meta_meta_image_idx" ON "events" USING btree ("meta_image_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE UNIQUE INDEX "event_categories_slug_idx" ON "event_categories" USING btree ("slug");
  CREATE INDEX "event_categories_is_demo_idx" ON "event_categories" USING btree ("is_demo");
  CREATE INDEX "event_categories_updated_at_idx" ON "event_categories" USING btree ("updated_at");
  CREATE INDEX "event_categories_created_at_idx" ON "event_categories" USING btree ("created_at");
  CREATE INDEX "contests_entries_order_idx" ON "contests_entries" USING btree ("_order");
  CREATE INDEX "contests_entries_parent_id_idx" ON "contests_entries" USING btree ("_parent_id");
  CREATE INDEX "contests_entries_image_idx" ON "contests_entries" USING btree ("image_id");
  CREATE INDEX "contests_slug_history_order_idx" ON "contests_slug_history" USING btree ("_order");
  CREATE INDEX "contests_slug_history_parent_id_idx" ON "contests_slug_history" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "contests_slug_idx" ON "contests" USING btree ("slug");
  CREATE INDEX "contests_is_demo_idx" ON "contests" USING btree ("is_demo");
  CREATE INDEX "contests_updated_at_idx" ON "contests" USING btree ("updated_at");
  CREATE INDEX "contests_created_at_idx" ON "contests" USING btree ("created_at");
  CREATE INDEX "search_kind_idx" ON "search" USING btree ("kind");
  CREATE INDEX "search_is_published_idx" ON "search" USING btree ("is_published");
  CREATE INDEX "search_updated_at_idx" ON "search" USING btree ("updated_at");
  CREATE INDEX "search_created_at_idx" ON "search" USING btree ("created_at");
  CREATE INDEX "search_rels_order_idx" ON "search_rels" USING btree ("order");
  CREATE INDEX "search_rels_parent_idx" ON "search_rels" USING btree ("parent_id");
  CREATE INDEX "search_rels_path_idx" ON "search_rels" USING btree ("path");
  CREATE INDEX "search_rels_news_id_idx" ON "search_rels" USING btree ("news_id");
  CREATE INDEX "search_rels_businesses_id_idx" ON "search_rels" USING btree ("businesses_id");
  CREATE INDEX "search_rels_car_listings_id_idx" ON "search_rels" USING btree ("car_listings_id");
  CREATE INDEX "search_rels_jobs_id_idx" ON "search_rels" USING btree ("jobs_id");
  CREATE INDEX "search_rels_events_id_idx" ON "search_rels" USING btree ("events_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_car_listings_fk" FOREIGN KEY ("car_listings_id") REFERENCES "public"."car_listings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_car_makes_fk" FOREIGN KEY ("car_makes_id") REFERENCES "public"."car_makes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_jobs_fk" FOREIGN KEY ("jobs_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_job_categories_fk" FOREIGN KEY ("job_categories_id") REFERENCES "public"."job_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_event_categories_fk" FOREIGN KEY ("event_categories_id") REFERENCES "public"."event_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contests_fk" FOREIGN KEY ("contests_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_search_fk" FOREIGN KEY ("search_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_car_listings_id_idx" ON "payload_locked_documents_rels" USING btree ("car_listings_id");
  CREATE INDEX "payload_locked_documents_rels_car_makes_id_idx" ON "payload_locked_documents_rels" USING btree ("car_makes_id");
  CREATE INDEX "payload_locked_documents_rels_jobs_id_idx" ON "payload_locked_documents_rels" USING btree ("jobs_id");
  CREATE INDEX "payload_locked_documents_rels_job_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("job_categories_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_event_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("event_categories_id");
  CREATE INDEX "payload_locked_documents_rels_contests_id_idx" ON "payload_locked_documents_rels" USING btree ("contests_id");
  CREATE INDEX "payload_locked_documents_rels_search_id_idx" ON "payload_locked_documents_rels" USING btree ("search_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "car_listings_slug_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "car_listings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "car_listings_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "car_makes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "car_makes_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "jobs_open_to" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "jobs_slug_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "jobs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "jobs_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "job_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_slug_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contests_entries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contests_slug_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contests" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "search" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "search_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "car_listings_slug_history" CASCADE;
  DROP TABLE "car_listings" CASCADE;
  DROP TABLE "car_listings_rels" CASCADE;
  DROP TABLE "car_makes" CASCADE;
  DROP TABLE "car_makes_texts" CASCADE;
  DROP TABLE "jobs_open_to" CASCADE;
  DROP TABLE "jobs_slug_history" CASCADE;
  DROP TABLE "jobs" CASCADE;
  DROP TABLE "jobs_texts" CASCADE;
  DROP TABLE "job_categories" CASCADE;
  DROP TABLE "events_slug_history" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "event_categories" CASCADE;
  DROP TABLE "contests_entries" CASCADE;
  DROP TABLE "contests_slug_history" CASCADE;
  DROP TABLE "contests" CASCADE;
  DROP TABLE "search" CASCADE;
  DROP TABLE "search_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_car_listings_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_car_makes_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_jobs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_job_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_event_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_contests_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_search_fk";
  
  DROP INDEX "payload_locked_documents_rels_car_listings_id_idx";
  DROP INDEX "payload_locked_documents_rels_car_makes_id_idx";
  DROP INDEX "payload_locked_documents_rels_jobs_id_idx";
  DROP INDEX "payload_locked_documents_rels_job_categories_id_idx";
  DROP INDEX "payload_locked_documents_rels_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_event_categories_id_idx";
  DROP INDEX "payload_locked_documents_rels_contests_id_idx";
  DROP INDEX "payload_locked_documents_rels_search_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "car_listings_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "car_makes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "jobs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "job_categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "event_categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "contests_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "search_id";
  DROP TYPE "public"."enum_car_listings_transmission";
  DROP TYPE "public"."enum_car_listings_fuel_type";
  DROP TYPE "public"."enum_car_listings_drivetrain";
  DROP TYPE "public"."enum_car_listings_body_type";
  DROP TYPE "public"."enum_car_listings_status";
  DROP TYPE "public"."enum_car_listings_source";
  DROP TYPE "public"."enum_jobs_open_to";
  DROP TYPE "public"."enum_jobs_employment_type";
  DROP TYPE "public"."enum_jobs_work_mode";
  DROP TYPE "public"."enum_jobs_salary_period";
  DROP TYPE "public"."enum_jobs_status";
  DROP TYPE "public"."enum_jobs_source";
  DROP TYPE "public"."enum_events_status";
  DROP TYPE "public"."enum_contests_status";`)
}
