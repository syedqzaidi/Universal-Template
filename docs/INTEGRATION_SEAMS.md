# Integration Seams Registry

This document maps every tool-to-tool connection point in the template. When updating any tool, check this document to understand what else might break.

---

### Payload CMS <-> Supabase Postgres

**Connection point:** `DATABASE_URL` environment variable pointing to Supabase local Postgres on port 54322. Payload uses this to create and manage its own tables inside the same Postgres instance that Supabase manages.

**Files involved:**
- `templates/next-app/src/payload.config.ts`
- `.env.template` (root)
- `supabase/migrations/20260407032625_enable_rls_payload_tables.sql`
- `supabase/migrations/20260407061746_rls_policy_templates.sql`

**What can break:**
- Payload attempts table creation before the RLS event trigger migration has run, leaving Payload tables without RLS enabled
- Connection string mismatch (wrong port, wrong password) causes Payload to fail silently or crash on startup
- Running `supabase db reset` drops Payload tables; the next `pnpm dev` recreates them but without the seeded content

**How to verify:**
```bash
# 1. Start the Next.js dev server and confirm /admin loads
pnpm --filter next-app dev

# 2. Check the RLS event trigger is present
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT evtname, evtevent, evtenabled FROM pg_event_trigger WHERE evtname = 'auto_enable_rls_trigger';"
```

**Last verified:** Supabase CLI local stack (port 54322), Payload CMS 3.x

---

### Payload CMS <-> Next.js App Router

**Connection point:** `withPayload()` wrapper in `next.config.ts` wires Payload into the Next.js build; the `(payload)` route group exposes `/admin`; `@payload-config` path alias in `tsconfig.json` lets Payload internals resolve the config at build and runtime.

**Files involved:**
- `templates/next-app/next.config.ts`
- `templates/next-app/tsconfig.json`
- `templates/next-app/src/app/(payload)/layout.tsx`
- `templates/next-app/src/app/(payload)/admin/[[...segments]]/page.tsx`
- `templates/next-app/src/app/(payload)/importMap.ts`

**What can break:**
- Removing the `(payload)` route group or placing a root `layout.tsx` that wraps `<html>`/`<body>` around it causes duplicate `<html>`/`<body>` tags in the admin response
- Deleting or renaming the `@payload-config` alias causes `Module not found` errors at build time
- Stale `importMap.ts` after adding a new Payload plugin causes "unknown component" errors in the admin UI

**How to verify:**
```bash
# Admin must return HTTP 200
curl -o /dev/null -s -w "%{http_code}" http://localhost:3000/admin

# Confirm exactly one <html> and one <body> tag in the admin response
curl -s http://localhost:3000/admin | grep -o '<html' | wc -l   # expect 1
curl -s http://localhost:3000/admin | grep -o '<body' | wc -l   # expect 1
```

**Last verified:** Next.js 15, Payload CMS 3.x, `@payloadcms/next` adapter

---

### Payload CMS <-> Next.js CSS

**Connection point:** `import '@payloadcms/next/css'` in the `(payload)` layout file injects Payload's admin panel stylesheet. Without it the admin panel renders completely unstyled.

**Files involved:**
- `templates/next-app/src/app/(payload)/layout.tsx`

**What can break:**
- Removing or moving the import causes an unstyled admin panel (no errors, just broken visuals)
- Placing the import in the root `(app)` layout instead of the `(payload)` layout either does nothing (import not found from that context) or pollutes app styles

**How to verify:**
```bash
# Check the import is present in the payload layout
grep -n "payloadcms/next/css" \
  "templates/next-app/src/app/(payload)/layout.tsx"

# Visual check: open http://localhost:3000/admin and confirm the panel is styled
```

**Last verified:** `@payloadcms/next` 3.x

---

### Payload CMS <-> Server Functions

**Connection point:** `_serverFunction.ts` creates the server action that Payload's admin UI calls for server-side operations. It must import both `config` (via `@payload-config`) and `importMap`, then pass them to `handleServerFunctions`. The file must be an async function.

**Files involved:**
- `templates/next-app/src/app/(payload)/_serverFunction.ts`
- `templates/next-app/src/app/(payload)/importMap.ts`
- `templates/next-app/src/payload.config.ts` (resolved via `@payload-config` alias)

**What can break:**
- Making the handler synchronous causes a runtime crash with "payload config is required"
- Forgetting to pass `importMap` causes admin UI components (custom fields, blocks) to fail to render
- Changing the export name or signature breaks the internal Payload routing for server actions

**How to verify:**
```bash
# Navigate to /admin in a browser and confirm no console errors
# Specifically look for "payload config is required" in the server logs
pnpm --filter next-app dev 2>&1 | grep -i "payload config"
```

**Last verified:** Payload CMS 3.x, Next.js 15 server actions

---

### Sentry <-> Next.js

**Connection point:** `withSentryConfig()` wraps the Next.js config object and adds the Sentry webpack plugin. Separate `sentry.client.config.ts` and `sentry.server.config.ts` files initialize the SDK on their respective runtimes.

**Files involved:**
- `templates/next-app/next.config.ts`
- `templates/next-app/sentry.client.config.ts`
- `templates/next-app/sentry.server.config.ts`

**What can break:**
- Misconfiguring the `withSentryConfig` options (e.g., wrong `org` or `project`) causes build-time errors when `SENTRY_AUTH_TOKEN` is set
- Sourcemap upload fails if `SENTRY_AUTH_TOKEN` is set but incorrect; omitting the token is safe (sourcemaps simply will not upload)
- Dev server starts cleanly when `SENTRY_DSN` is empty — Sentry silently no-ops

**How to verify:**
```bash
# Dev server should start without Sentry-related errors when DSN is unset
SENTRY_DSN="" pnpm --filter next-app dev 2>&1 | grep -i sentry
```

**Last verified:** `@sentry/nextjs` 8.x, Next.js 15

---

### Sentry <-> Astro

**Connection point:** The Sentry Astro integration is registered in `astro.config.mjs` and reads the DSN from `process.env` (not `import.meta.env`). Client-side initialization is handled separately in `sentry.client.config.ts`.

**Files involved:**
- `templates/astro-site/astro.config.mjs`
- `templates/astro-site/sentry.client.config.ts`
- `templates/astro-site/sentry.server.config.ts`

**What can break:**
- Using `import.meta.env.SENTRY_DSN` inside `astro.config.mjs` returns `undefined` at config-parse time; must use `process.env.SENTRY_DSN`
- DSN is split: the integration in `astro.config.mjs` controls server-side capture; `sentry.client.config.ts` controls browser-side capture — missing either half means partial error coverage
- Dev server starts cleanly when DSN is empty; no errors are thrown

**How to verify:**
```bash
# Dev server should start without Sentry errors when DSN is unset
SENTRY_DSN="" pnpm --filter astro-site dev 2>&1 | grep -i sentry
```

**Last verified:** `@sentry/astro` 8.x, Astro 5.x

---

### Supabase <-> Next.js SSR

**Connection point:** `@supabase/ssr` provides browser and server client factories. The Next.js middleware in `proxy.ts` intercepts every request, refreshes the session cookie, and forwards it. Server components use the server client; client components use the browser client.

**Files involved:**
- `packages/shared/src/supabase/client.ts`
- `templates/next-app/src/proxy.ts`

**What can break:**
- Removing the middleware (`proxy.ts`) causes session tokens to go stale after the JWT expiry window; users appear logged out mid-session without being redirected
- Using the browser client in a server component (or vice versa) causes either hydration errors or missing auth context
- Changing the Supabase URL/anon key in `.env` without updating both the shared package and the middleware breaks the cookie domain

**How to verify:**
```bash
# Confirm the middleware matcher covers the expected routes
grep -n "matcher" "templates/next-app/src/proxy.ts"

# End-to-end: sign in, navigate away, confirm session persists across page loads
```

**Last verified:** `@supabase/ssr` 0.x, Next.js 15 middleware

---

### Supabase <-> RLS Auto-Enable

**Connection point:** A Postgres event trigger fires on every `CREATE TABLE` in the `public` schema and automatically executes `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. This ensures Payload CMS tables get RLS enabled even though Payload creates them programmatically (not via migration).

**Files involved:**
- `supabase/migrations/20260407032625_enable_rls_payload_tables.sql`

**What can break:**
- If the migration has not run yet when Payload first creates its tables, those tables will have RLS disabled and no trigger will retroactively fix them; re-run the migration or manually enable RLS on each table
- `supabase db reset` removes all migrations and re-applies them in order; the trigger is always in place before the Next.js dev server (and thus Payload) runs, so this is the safe path

**How to verify:**
```sql
-- Run against local Supabase Postgres (port 54322)
SELECT evtname, evtevent, evtenabled
FROM pg_event_trigger
WHERE evtname = 'auto_enable_rls_trigger';

-- Confirm Payload tables have RLS on
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'payload%';
```

**Last verified:** Supabase CLI local stack, migration `20260407032625`

---

### Tailwind <-> Astro

**Connection point:** Tailwind is wired in via the `@tailwindcss/vite` Vite plugin (not the deprecated `@astrojs/tailwind` integration). The plugin is registered in `astro.config.mjs`. The global CSS file must be imported in the root layout; without that import, Tailwind's `@import "tailwindcss"` directive never runs.

**Files involved:**
- `templates/astro-site/astro.config.mjs`
- `templates/astro-site/src/styles/global.css`
- `templates/astro-site/src/layouts/Layout.astro`

**What can break:**
- Using `@astrojs/tailwind` instead of `@tailwindcss/vite` causes duplicate or conflicting CSS injection
- Removing `global.css` from `Layout.astro` means no Tailwind base styles or utilities are emitted
- Scoped `<style>` blocks inside `.astro` components do not pick up Tailwind unless the global sheet is also present

**How to verify:**
```bash
# Build and confirm Tailwind utility classes appear in output CSS
pnpm --filter astro-site build
grep -r "text-" dist/assets/*.css | head -5
```

**Last verified:** Tailwind CSS 4.x (`@tailwindcss/vite`), Astro 5.x

---

### Tailwind <-> Next.js

**Connection point:** Tailwind is processed by PostCSS via the `@tailwindcss/postcss` plugin, configured in `postcss.config.mjs`. The `globals.css` file contains `@import "tailwindcss"` and must be imported in the root app layout; without it no Tailwind styles reach the browser.

**Files involved:**
- `templates/next-app/postcss.config.mjs`
- `templates/next-app/src/app/globals.css`
- `templates/next-app/src/app/(app)/layout.tsx`

**What can break:**
- Removing `globals.css` from the `(app)` layout causes the entire app to lose Tailwind styles (no error, just missing CSS)
- Using `@tailwindcss/vite` instead of `@tailwindcss/postcss` is incompatible with Next.js's PostCSS pipeline
- Adding Tailwind directives only to the `(payload)` layout makes styles bleed into the admin panel unexpectedly

**How to verify:**
```bash
# Build and confirm Tailwind classes are present in the output
pnpm --filter next-app build
grep -r "flex" .next/static/css/*.css | head -5
```

**Last verified:** Tailwind CSS 4.x (`@tailwindcss/postcss`), Next.js 15

---

### shadcn/ui <-> Both Templates

**Connection point:** `components.json` tells the shadcn CLI where to place components and which CSS variable strategy to use. The `cn()` utility in `src/lib/utils.ts` merges Tailwind classes. CSS custom properties (defined in each template's global CSS) power the component color tokens.

**Files involved:**
- `templates/next-app/components.json`
- `templates/next-app/src/lib/utils.ts`
- `templates/next-app/src/app/globals.css`
- `templates/astro-site/components.json`
- `templates/astro-site/src/lib/utils.ts`
- `templates/astro-site/src/styles/global.css`

**What can break:**
- Missing CSS variable definitions (e.g., `--background`, `--foreground`) cause components to render with transparent or wrong colors — no error is thrown
- Changing the `aliases.utils` path in `components.json` without updating existing component imports breaks all shadcn components
- Adding components with the CLI to the wrong template root installs them into an unintended directory

**How to verify:**
```bash
# Confirm cn() resolves correctly
node -e "const {cn} = require('./templates/next-app/src/lib/utils'); console.log(cn('px-4', 'px-4'))"

# Visual check: render any shadcn component (Button, Card, etc.) and confirm colors match design tokens
```

**Last verified:** shadcn/ui (New York style), Tailwind CSS 4.x

---

### Twenty CRM <-> Docker

**Connection point:** `docker-compose.yml` defines three services: the Twenty app server, a Postgres database, and Redis. All three must be healthy for the UI to load. The `.env` file next to the compose file supplies secrets and must not contain placeholder values.

**Files involved:**
- `docker/twenty/docker-compose.yml`
- `docker/twenty/.env` (not committed; sourced from `.env.template`)

**What can break:**
- Missing Redis service causes Twenty to fail at startup with a queue/worker connection error
- Wrong or placeholder `APP_SECRET` value causes JWT signing failures and prevents login
- Stale Docker volumes from a previous run with different credentials cause Postgres to refuse new connections; prune volumes with `docker volume prune` after credential changes
- Pinned image tag going out of date causes schema drift if the DB was initialized with a newer version

**How to verify:**
```bash
cd docker/twenty && docker compose up -d
# All 3 containers should reach "healthy" status
docker compose ps

# UI should load at http://localhost:3001
curl -o /dev/null -s -w "%{http_code}" http://localhost:3001
```

**Last verified:** Twenty CRM (docker-compose.yml in `docker/twenty/`), Docker Compose v2

---

### Shared Package <-> Both Templates

**Connection point:** The `packages/shared` package is consumed by both templates via `workspace:*` dependency declarations in each template's `package.json`. The shared package's `exports` field in its own `package.json` controls which paths are importable.

**Files involved:**
- `packages/shared/package.json`
- `templates/next-app/package.json`
- `templates/astro-site/package.json`
- `packages/shared/src/supabase/client.ts`
- `packages/shared/src/types/`
- `packages/shared/src/posthog/`
- `packages/shared/src/resend/`
- `packages/shared/src/sentry/`

**What can break:**
- Renaming or removing an `exports` entry in `packages/shared/package.json` without updating all import sites in both templates causes `Module not found` errors at build time
- Changing a TypeScript type in the shared package without bumping the consuming templates causes type errors that only surface during `tsc` or build, not at runtime
- Running `pnpm install` only inside one template (not from the workspace root) can leave the symlink stale

**How to verify:**
```bash
# Install from workspace root to ensure symlinks are correct
pnpm install

# Build both templates to confirm no import resolution errors
pnpm --filter next-app build
pnpm --filter astro-site build
```

**Last verified:** pnpm workspaces, `packages/shared` with `workspace:*` references
