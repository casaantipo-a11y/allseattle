import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_notes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"author_id" integer,
  	"resolved" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "site_notes_id" integer;
  ALTER TABLE "site_notes" ADD CONSTRAINT "site_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "site_notes_path_idx" ON "site_notes" USING btree ("path");
  CREATE INDEX "site_notes_author_idx" ON "site_notes" USING btree ("author_id");
  CREATE INDEX "site_notes_resolved_idx" ON "site_notes" USING btree ("resolved");
  CREATE INDEX "site_notes_updated_at_idx" ON "site_notes" USING btree ("updated_at");
  CREATE INDEX "site_notes_created_at_idx" ON "site_notes" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_site_notes_fk" FOREIGN KEY ("site_notes_id") REFERENCES "public"."site_notes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_site_notes_id_idx" ON "payload_locked_documents_rels" USING btree ("site_notes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_notes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "site_notes" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_site_notes_fk";
  
  DROP INDEX "payload_locked_documents_rels_site_notes_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "site_notes_id";`)
}
