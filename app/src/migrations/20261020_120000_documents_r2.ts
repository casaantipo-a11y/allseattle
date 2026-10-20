// Documents (price lists, certificates) go to R2 like Media (client, 20.10.2026: on
// production every upload failed — without the storage plugin the file was written to
// the server's read-only disk). The plugin adds `_objectkey` and, with the `documents/`
// prefix, `prefix`. IF NOT EXISTS / IF EXISTS: locally the plugin is off and the columns
// may be missing or present.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;
   ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "prefix" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "documents" DROP COLUMN IF EXISTS "prefix";
   ALTER TABLE "documents" DROP COLUMN IF EXISTS "_objectkey";`)
}
