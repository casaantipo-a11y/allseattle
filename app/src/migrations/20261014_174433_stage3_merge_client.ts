import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

// No SQL on purpose. stage3 and the client branch of 15.10.2026 (site_notes) were built
// in parallel, so the last schema snapshot (site_notes) lacked every stage 3 table and a
// new migrate:create would have re-created them. This migration only carries the merged
// snapshot (its .json); the tables come from the stage3_* migrations and site_notes.
export async function up(_args: MigrateUpArgs): Promise<void> {}

export async function down(_args: MigrateDownArgs): Promise<void> {}
