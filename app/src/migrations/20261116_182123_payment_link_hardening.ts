import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "businesses" ADD COLUMN "payment_link_price" numeric;
  ALTER TABLE "businesses" ADD COLUMN "welcome_sent_for" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "businesses" DROP COLUMN "payment_link_price";
  ALTER TABLE "businesses" DROP COLUMN "welcome_sent_for";`)
}
