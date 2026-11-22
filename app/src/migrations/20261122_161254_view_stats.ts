import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "view_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" varchar NOT NULL,
  	"doc_id" numeric DEFAULT 0 NOT NULL,
  	"date" varchar NOT NULL,
  	"views" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "view_stats_id" integer;
  CREATE INDEX "view_stats_kind_idx" ON "view_stats" USING btree ("kind");
  CREATE INDEX "view_stats_date_idx" ON "view_stats" USING btree ("date");
  CREATE INDEX "view_stats_updated_at_idx" ON "view_stats" USING btree ("updated_at");
  CREATE INDEX "view_stats_created_at_idx" ON "view_stats" USING btree ("created_at");
  CREATE UNIQUE INDEX "kind_docId_date_idx" ON "view_stats" USING btree ("kind","doc_id","date");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_view_stats_fk" FOREIGN KEY ("view_stats_id") REFERENCES "public"."view_stats"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_view_stats_id_idx" ON "payload_locked_documents_rels" USING btree ("view_stats_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "view_stats" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "view_stats" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_view_stats_fk";
  
  DROP INDEX "payload_locked_documents_rels_view_stats_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "view_stats_id";`)
}
