---
name: new-migration
description: Create a Payload database migration in app/ after a collection or global changed — pnpm migrate:create, generate:types, review the output, commit src/migrations/. Use only when the user asks for a migration.
disable-model-invocation: true
---

# New Payload migration (app/)

Schema changes reach Neon only through migrations: `push` works against the local database only
(`payload.config.ts`). Local development uses `pnpm db`, which must be running.

## Steps

1. **Confirm there is a schema change.** Run `git diff -- app/src/collections app/src/globals`.
   Do not create a migration for a change that only touches a hook, an access rule, or UI.
2. **Create the migration** from `app/`: `pnpm migrate:create <snake_case_name>`. Name it after
   the change, as existing migrations are: `stage3_listings_moderation`, `header_sub_links`.
3. **Regenerate the types**: `pnpm generate:types`. This updates `src/payload-types.ts`.
4. **Review the generated `.ts` migration before committing.**
   - Look for `DROP COLUMN`, `DROP TABLE`, or a `NOT NULL` added without a default. On a database
     with data these lose data or fail. Stop and tell the user before continuing.
   - Each migration is a `.ts` file plus a `.json` snapshot; keep both.
5. **Apply locally** with `pnpm migrate` and check the admin still loads (`pnpm dev`).
6. **Commit** `app/src/migrations/` and `app/src/payload-types.ts` together with the collection
   change. Do not commit `importMap.js`; it is a dev-server artifact.

## Deploy order

The Vercel build runs `pnpm migrate && pnpm build` (`vercel-build`), so a migration ships with
the next deploy and runs against Neon before the new code starts. Code that needs a new column
must not deploy before its migration exists in `src/migrations/`.

Source: `app/CLAUDE.md` (commands, Rules), `app/README.md` ("Deploying", "Current setup").
