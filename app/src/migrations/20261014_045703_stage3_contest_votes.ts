import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "contest_votes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contest_id" integer NOT NULL,
  	"entry_id" varchar NOT NULL,
  	"entry_title" varchar,
  	"email" varchar NOT NULL,
  	"token_hash" varchar,
  	"confirmed_at" timestamp(3) with time zone,
  	"ip" varchar,
  	"sent_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "contest_votes_id" integer;
  ALTER TABLE "contest_votes" ADD CONSTRAINT "contest_votes_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "contest_votes_contest_idx" ON "contest_votes" USING btree ("contest_id");
  CREATE INDEX "contest_votes_entry_id_idx" ON "contest_votes" USING btree ("entry_id");
  CREATE INDEX "contest_votes_token_hash_idx" ON "contest_votes" USING btree ("token_hash");
  CREATE INDEX "contest_votes_confirmed_at_idx" ON "contest_votes" USING btree ("confirmed_at");
  CREATE INDEX "contest_votes_ip_idx" ON "contest_votes" USING btree ("ip");
  CREATE INDEX "contest_votes_updated_at_idx" ON "contest_votes" USING btree ("updated_at");
  CREATE INDEX "contest_votes_created_at_idx" ON "contest_votes" USING btree ("created_at");
  CREATE UNIQUE INDEX "contest_email_idx" ON "contest_votes" USING btree ("contest_id","email");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contest_votes_fk" FOREIGN KEY ("contest_votes_id") REFERENCES "public"."contest_votes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_contest_votes_id_idx" ON "payload_locked_documents_rels" USING btree ("contest_votes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "contest_votes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "contest_votes" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_contest_votes_fk";
  
  DROP INDEX "payload_locked_documents_rels_contest_votes_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "contest_votes_id";`)
}
