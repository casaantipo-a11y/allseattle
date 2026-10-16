// Local PostgreSQL for development, no system install: the `embedded-postgres`
// package ships the server binaries. Data lives in ./.pgdata (gitignored).
// Production uses Neon — only DATABASE_URL changes.
//
//   pnpm db        start (initialises the cluster and the database on first run)
//
// Keep this running in its own terminal while `pnpm dev` runs.
import EmbeddedPostgres from 'embedded-postgres'
import { existsSync } from 'node:fs'
import path from 'node:path'

const dataDir = path.resolve('.pgdata')
const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'postgres',
  password: 'postgres',
  port: 5433,
  persistent: true,
  // UTF-8, like Neon. Left to itself initdb takes the Windows codepage (WIN1251 on this
  // machine), and the local database then refused text such as "café" (16.10.2026).
  initdbFlags: ['--encoding=UTF8', '--locale=English_United States.1252'],
})

const fresh = !existsSync(path.join(dataDir, 'PG_VERSION'))
if (fresh) await pg.initialise()
await pg.start()
if (fresh) await pg.createDatabase('allseattle')
console.log('PostgreSQL is running on 127.0.0.1:5433 (database "allseattle"). Ctrl+C to stop.')

const stop = async () => {
  await pg.stop()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
