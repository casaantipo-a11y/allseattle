import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "header_menu_sub_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  ALTER TABLE "header_menu_sub_links" ADD CONSTRAINT "header_menu_sub_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header_menu"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "header_menu_sub_links_order_idx" ON "header_menu_sub_links" USING btree ("_order");
  CREATE INDEX "header_menu_sub_links_parent_id_idx" ON "header_menu_sub_links" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "header_menu_sub_links" CASCADE;`)
}
