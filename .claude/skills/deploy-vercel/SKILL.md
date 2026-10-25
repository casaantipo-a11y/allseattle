---
name: deploy-vercel
description: Deploy app/ to production on Vercel (npx vercel deploy --prod) with the pre-deploy checks from app/CLAUDE.md and app/README.md. Use only when the user asks for a deploy.
disable-model-invocation: true
---

# Deploy app/ to Vercel

Deploy is outward-facing: it replaces the live site. Run it only because the user asked for it
in this conversation, and state what will ship (branch, last commit) before the command.

Deploys go from this machine, not from GitHub: the repository belongs to a friend's account, so
Vercel cannot import it. The project is `allseattle` under the `mijckela-4959` Vercel account.

## Steps

1. **Stop `pnpm dev`** if it is running. Its child `start-server.js` keeps port 3000 after the
   parent stops, so stop the child too.
2. **Check the generated files.** Run `git status --porcelain -- "app/src/app/(payload)/admin/importMap.js" app/src/payload-types.ts`.
   The `vercel-deploy-guard` hook refuses the deploy when either is modified, because the CLI
   uploads the working tree, not the commit. If they are modified:
   - `git diff` them. If the diff is only regeneration from `pnpm dev`, run
     `git checkout -- <files>`.
   - If the diff contains anything else, stop and ask the user. Do not restore it.
3. **Deploy** from `app/`:
   - In PowerShell (the user's shell): `npx.cmd vercel deploy --prod`. Plain `npx` fails here
     because PowerShell script execution is disabled.
   - In bash: `npx vercel deploy --prod`.
4. **Verify.** After a `vercel deploy` the CLI may print `Error: spawn EPERM`. That is its
   telemetry, not the deploy. Confirm with `npx.cmd vercel inspect <deployment url>` and look
   for `Ready`.
5. **Restart `pnpm dev`** if you stopped it.

## Do not

- Do not `source` the `.env*` files in a shell. The Neon URL contains `&`, which the shell treats
  as "run in background", so `DATABASE_URL` silently falls back to the local database.
- Do not commit the regenerated `importMap.js` or `payload-types.ts`.
- Do not run `pnpm migrate` by hand against Neon. The Vercel build (`vercel-build`) applies
  pending migrations; a migration that is not in `src/migrations/` will not run there.

Source: `app/CLAUDE.md` (Rules), `app/README.md` ("Current setup").
