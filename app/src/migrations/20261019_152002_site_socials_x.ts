import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Site settings: an X (Twitter) link next to Instagram and Facebook (client, 19.10.2026).
// The generator also wanted `ALTER TABLE "media" DROP COLUMN "_objectkey"` — that column
// belongs to the R2 storage plugin, which is off locally; it holds the file keys on
// production and must stay.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "socials_x" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "socials_x";`)
}
