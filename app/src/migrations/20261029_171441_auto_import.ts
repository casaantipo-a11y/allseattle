import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_news_origin" AS ENUM('manual', 'import');
  CREATE TYPE "public"."enum_events_origin" AS ENUM('manual', 'import');
  CREATE TYPE "public"."enum_import_sources_type" AS ENUM('ticketmaster', 'ics', 'rss');
  CREATE TYPE "public"."enum_import_sources_target" AS ENUM('events', 'news');
  CREATE TABLE "import_sources" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"type" "enum_import_sources_type" NOT NULL,
  	"target" "enum_import_sources_target" NOT NULL,
  	"url" varchar,
  	"enabled" boolean DEFAULT true,
  	"max_items_per_run" numeric DEFAULT 20,
  	"last_run_at" timestamp(3) with time zone,
  	"last_result" varchar,
  	"last_error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "import_sources_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"event_categories_id" integer,
  	"news_categories_id" integer
  );
  
  ALTER TABLE "news" ADD COLUMN "origin" "enum_news_origin" DEFAULT 'manual';
  ALTER TABLE "news" ADD COLUMN "import_source_id" integer;
  ALTER TABLE "news" ADD COLUMN "external_id" varchar;
  ALTER TABLE "events" ADD COLUMN "origin" "enum_events_origin" DEFAULT 'manual';
  ALTER TABLE "events" ADD COLUMN "import_source_id" integer;
  ALTER TABLE "events" ADD COLUMN "external_id" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "import_sources_id" integer;
  ALTER TABLE "import_sources_rels" ADD CONSTRAINT "import_sources_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."import_sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "import_sources_rels" ADD CONSTRAINT "import_sources_rels_event_categories_fk" FOREIGN KEY ("event_categories_id") REFERENCES "public"."event_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "import_sources_rels" ADD CONSTRAINT "import_sources_rels_news_categories_fk" FOREIGN KEY ("news_categories_id") REFERENCES "public"."news_categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "import_sources_updated_at_idx" ON "import_sources" USING btree ("updated_at");
  CREATE INDEX "import_sources_created_at_idx" ON "import_sources" USING btree ("created_at");
  CREATE INDEX "import_sources_rels_order_idx" ON "import_sources_rels" USING btree ("order");
  CREATE INDEX "import_sources_rels_parent_idx" ON "import_sources_rels" USING btree ("parent_id");
  CREATE INDEX "import_sources_rels_path_idx" ON "import_sources_rels" USING btree ("path");
  CREATE INDEX "import_sources_rels_event_categories_id_idx" ON "import_sources_rels" USING btree ("event_categories_id");
  CREATE INDEX "import_sources_rels_news_categories_id_idx" ON "import_sources_rels" USING btree ("news_categories_id");
  ALTER TABLE "news" ADD CONSTRAINT "news_import_source_id_import_sources_id_fk" FOREIGN KEY ("import_source_id") REFERENCES "public"."import_sources"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_import_source_id_import_sources_id_fk" FOREIGN KEY ("import_source_id") REFERENCES "public"."import_sources"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_import_sources_fk" FOREIGN KEY ("import_sources_id") REFERENCES "public"."import_sources"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "news_origin_idx" ON "news" USING btree ("origin");
  CREATE INDEX "news_import_source_idx" ON "news" USING btree ("import_source_id");
  CREATE UNIQUE INDEX "importSource_externalId_idx" ON "news" USING btree ("import_source_id","external_id");
  CREATE INDEX "events_origin_idx" ON "events" USING btree ("origin");
  CREATE INDEX "events_import_source_idx" ON "events" USING btree ("import_source_id");
  CREATE UNIQUE INDEX "importSource_externalId_1_idx" ON "events" USING btree ("import_source_id","external_id");
  CREATE INDEX "payload_locked_documents_rels_import_sources_id_idx" ON "payload_locked_documents_rels" USING btree ("import_sources_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "import_sources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "import_sources_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "import_sources" CASCADE;
  DROP TABLE "import_sources_rels" CASCADE;
  ALTER TABLE "news" DROP CONSTRAINT IF EXISTS "news_import_source_id_import_sources_id_fk";

  ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_import_source_id_import_sources_id_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_import_sources_fk";
  
  DROP INDEX "news_origin_idx";
  DROP INDEX "news_import_source_idx";
  DROP INDEX "importSource_externalId_idx";
  DROP INDEX "events_origin_idx";
  DROP INDEX "events_import_source_idx";
  DROP INDEX "importSource_externalId_1_idx";
  DROP INDEX "payload_locked_documents_rels_import_sources_id_idx";
  ALTER TABLE "news" DROP COLUMN "origin";
  ALTER TABLE "news" DROP COLUMN "import_source_id";
  ALTER TABLE "news" DROP COLUMN "external_id";
  ALTER TABLE "events" DROP COLUMN "origin";
  ALTER TABLE "events" DROP COLUMN "import_source_id";
  ALTER TABLE "events" DROP COLUMN "external_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "import_sources_id";
  DROP TYPE "public"."enum_news_origin";
  DROP TYPE "public"."enum_events_origin";
  DROP TYPE "public"."enum_import_sources_type";
  DROP TYPE "public"."enum_import_sources_target";`)
}
