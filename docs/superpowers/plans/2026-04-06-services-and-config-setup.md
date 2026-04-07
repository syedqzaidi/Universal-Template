# Services & Configuration Setup Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start all Docker services (Supabase local, Twenty CRM) and create configuration files (Payload CMS, Sentry) so every tool in the monorepo is fully functional and verified.

**Architecture:** Sequential tasks — each service/config is set up, then immediately tested before moving on. Docker services must be running before Payload can be tested (it needs Postgres). Sentry configs are independent and come last.

**Tech Stack:** Supabase CLI 2.85.0, Docker Compose, Payload CMS 3.81.0, @sentry/astro 10.47.0, @sentry/nextjs 10.47.0

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Modify | `templates/next-app/next.config.ts` | Wrap with `withPayload()` and `withSentryConfig()` |
| Create | `templates/next-app/src/payload.config.ts` | Payload CMS collection definitions and DB config |
| Create | `templates/next-app/src/app/(payload)/admin/[[...segments]]/page.tsx` | Payload admin panel catch-all route |
| Create | `templates/next-app/src/app/(payload)/admin/[[...segments]]/not-found.tsx` | Payload admin 404 |
| Create | `templates/next-app/src/app/(payload)/layout.tsx` | Payload admin layout (isolates from main app layout) |
| Create | `templates/next-app/src/app/api/[...payload]/route.ts` | Payload REST API catch-all route |
| Create | `templates/next-app/sentry.client.config.ts` | Sentry browser-side init |
| Create | `templates/next-app/sentry.server.config.ts` | Sentry server-side init |
| Modify | `templates/astro-site/astro.config.mjs` | Add Sentry integration |
| Create | `templates/astro-site/sentry.client.config.ts` | Sentry browser-side init for Astro |

---

## Task 1: Start Supabase Local Dev Environment

**Prereqs:** Docker Desktop must be running.

**Context:** `pnpm supabase init` was already run — the `supabase/config.toml` exists. Supabase local dev spins up ~8 Docker containers: Postgres (port 54322), Auth (GoTrue), Storage, Realtime, PostgREST API (port 54321), Studio (port 54323), Inbucket email testing (port 54324), and Edge Runtime.

- [ ] **Step 1: Verify Docker is running**

Run: `docker info > /dev/null 2>&1 && echo "Docker OK" || echo "Docker NOT running"`
Expected: `Docker OK`

- [ ] **Step 2: Start Supabase local stack**

Run from project root:
```bash
cd "/Users/syber/Desktop/AI Projects/Websites/Website Template" && pnpm supabase start
```
Expected: Downloads images on first run (may take 2-5 minutes), then prints a status table with URLs and keys for all services.

- [ ] **Step 3: Verify Supabase is running**

Run:
```bash
cd "/Users/syber/Desktop/AI Projects/Websites/Website Template" && pnpm supabase status
```
Expected output includes:
- `API URL: http://127.0.0.1:54321`
- `DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- `Studio URL: http://127.0.0.1:54323`
- `anon key:` (a JWT string)
- `service_role key:` (a JWT string)

- [ ] **Step 4: Verify Postgres is accepting connections**

Run:
```bash
docker exec -it $(docker ps -qf "name=supabase_db") pg_isready -U postgres
```
Expected: `localhost:5432 - accepting connections`

- [ ] **Step 5: Verify Studio UI is accessible**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:54323
```
Expected: `200` (or `301`/`302` redirect — any non-error code)

---

## Task 2: Start Twenty CRM Docker Stack

**Context:** Twenty CRM runs on port 3001 (mapped from container port 3000). It has its own Postgres instance (`twenty-db`) separate from Supabase. First start takes time as it runs database migrations.

- [ ] **Step 1: Start Twenty CRM containers**

Run:
```bash
cd "/Users/syber/Desktop/AI Projects/Websites/Website Template/docker/twenty" && docker compose up -d
```
Expected: Both `twenty` and `twenty-db` containers start. `twenty-db` must become healthy before `twenty` starts.

- [ ] **Step 2: Wait for database healthcheck and migrations**

Run (poll until healthy, max 120s):
```bash
for i in $(seq 1 24); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' $(docker ps -qf "name=twenty-twenty-1") 2>/dev/null || echo "starting")
  echo "Attempt $i: twenty container status = $STATUS"
  if [ "$STATUS" = "healthy" ]; then break; fi
  sleep 5
done
```

If Twenty doesn't have a healthcheck, use logs instead:
```bash
docker compose -f "/Users/syber/Desktop/AI Projects/Websites/Website Template/docker/twenty/docker-compose.yml" logs --tail 30 twenty
```
Expected: Look for migration completion messages or "Server is running" / "Listening on port 3000".

- [ ] **Step 3: Verify Twenty API responds**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001
```
Expected: `200` (or `301`/`302`) — the Twenty UI loads.

- [ ] **Step 4: Verify both containers are running**

Run:
```bash
docker compose -f "/Users/syber/Desktop/AI Projects/Websites/Website Template/docker/twenty/docker-compose.yml" ps
```
Expected: Both `twenty` and `twenty-db` show state `Up` (and `healthy` for twenty-db).

---

## Task 3: Create Payload CMS Configuration

**Context:** Payload CMS v3 runs inside Next.js. It needs: (1) a config file defining collections and database, (2) Next.js config wrapped with `withPayload()`, (3) catch-all routes for admin UI and REST API. The database points at Supabase's local Postgres on port 54322.

**Files:**
- Create: `templates/next-app/src/payload.config.ts`
- Create: `templates/next-app/src/app/(payload)/admin/[[...segments]]/page.tsx`
- Create: `templates/next-app/src/app/(payload)/admin/[[...segments]]/not-found.tsx`
- Create: `templates/next-app/src/app/(payload)/layout.tsx`
- Create: `templates/next-app/src/app/api/[...payload]/route.ts`
- Modify: `templates/next-app/next.config.ts`

- [ ] **Step 1: Create Payload config**

Create `templates/next-app/src/payload.config.ts`:

```typescript
import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: "pages",
      admin: { useAsTitle: "title" },
      fields: [
        { name: "title", type: "text", required: true },
        { name: "slug", type: "text", required: true, unique: true },
        { name: "content", type: "richText" },
        { name: "status", type: "select", options: ["draft", "published"], defaultValue: "draft" },
      ],
    },
    {
      slug: "media",
      upload: true,
      fields: [
        { name: "alt", type: "text", required: true },
      ],
    },
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "DEVELOPMENT-SECRET-CHANGE-ME",
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    },
  }),
});
```

- [ ] **Step 2: Create Payload admin catch-all page route**

Create `templates/next-app/src/app/(payload)/admin/[[...segments]]/page.tsx`:

```tsx
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from "next";
import config from "@payload-config";
import { RootPage, generatePageMetadata } from "@payloadcms/next/views";
import { importMap } from "../importMap";

type Args = { params: Promise<{ segments: string[] }>; searchParams: Promise<Record<string, string | string[]>> };

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams });

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, params, searchParams, importMap });

export default Page;
```

- [ ] **Step 3: Create Payload admin not-found route**

Create `templates/next-app/src/app/(payload)/admin/[[...segments]]/not-found.tsx`:

```tsx
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from "next";
import config from "@payload-config";
import { NotFoundPage, generatePageMetadata } from "@payloadcms/next/views";
import { importMap } from "../importMap";

type Args = { params: Promise<{ segments: string[] }>; searchParams: Promise<Record<string, string | string[]>> };

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams });

const NotFound = ({ params, searchParams }: Args) =>
  NotFoundPage({ config, params, searchParams, importMap });

export default NotFound;
```

- [ ] **Step 4: Create Payload admin layout**

Create `templates/next-app/src/app/(payload)/layout.tsx`:

```tsx
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from "@payload-config";
import { RootLayout } from "@payloadcms/next/layouts";
import { importMap } from "./importMap";
import "./custom.css";

import React from "react";

type Args = { children: React.ReactNode };

const Layout = ({ children }: Args) =>
  RootLayout({ children, config, importMap });

export default Layout;
```

Note: We also need to create the importMap file and a minimal custom.css (plain CSS, no sass needed).

- [ ] **Step 5: Create Payload importMap file**

Create `templates/next-app/src/app/(payload)/importMap.ts`:

```typescript
// Payload import map — will be auto-generated on first build
// This file maps component paths for the admin UI
export const importMap = {};
```

- [ ] **Step 6: Create Payload custom CSS (empty placeholder)**

Create `templates/next-app/src/app/(payload)/custom.css`:

```css
/* Custom Payload admin styles — add overrides here */
```

- [ ] **Step 7: Create Payload REST API route**

Create `templates/next-app/src/app/api/[...payload]/route.ts`:

```typescript
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from "@payload-config";
import { REST_DELETE, REST_GET, REST_PATCH, REST_POST, REST_PUT } from "@payloadcms/next/routes";

export const GET = REST_GET(config);
export const POST = REST_POST(config);
export const DELETE = REST_DELETE(config);
export const PATCH = REST_PATCH(config);
export const PUT = REST_PUT(config);
```

- [ ] **Step 8: Wrap Next.js config with withPayload and withSentryConfig**

Modify `templates/next-app/next.config.ts` to include both Payload and Sentry wrapping (avoids rewriting this file later in Task 5):

```typescript
import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(withPayload(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
```

- [ ] **Step 9: Add payload-config path alias to tsconfig**

Check `templates/next-app/tsconfig.json` and add `@payload-config` path alias if not present:

Add to `compilerOptions.paths`:
```json
"@payload-config": ["./src/payload.config.ts"]
```

- [ ] **Step 10: Verify Payload by starting Next.js dev server**

Run:
```bash
cd "/Users/syber/Desktop/AI Projects/Websites/Website Template" && pnpm --filter @template/next-app dev
```

Wait for compilation, then test:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin
```
Expected: `200` (Payload admin panel loads). First load runs DB migrations automatically.

Also test the REST API:
```bash
curl -s http://localhost:3000/api/pages | head -c 200
```
Expected: JSON response (empty collection or Payload API response).

- [ ] **Step 11: Stop the dev server after verification**

Kill the dev server process.

---

## Task 4: Configure Sentry for Astro Template

**Context:** `@sentry/astro` is an Astro integration — it's added to `astro.config.mjs`. It also needs a client config file. DSN is left as placeholder (configured per-project via env vars).

**Files:**
- Modify: `templates/astro-site/astro.config.mjs`
- Create: `templates/astro-site/sentry.client.config.ts`

- [ ] **Step 1: Add Sentry integration to Astro config**

Modify `templates/astro-site/astro.config.mjs` to:

```javascript
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sentry from '@sentry/astro';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [
    react(),
    sentry({
      dsn: process.env.SENTRY_DSN || '',
      project: process.env.SENTRY_PROJECT || 'astro-site',
      authToken: process.env.SENTRY_AUTH_TOKEN || '',
      sourcemaps: {
        disable: !process.env.SENTRY_AUTH_TOKEN,
      },
      enabled: !!process.env.SENTRY_DSN,
    }),
  ],
});
```

- [ ] **Step 2: Create Sentry client config for Astro**

Create `templates/astro-site/sentry.client.config.ts`:

```typescript
import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN || "",
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enabled: !!import.meta.env.PUBLIC_SENTRY_DSN,
});
```

- [ ] **Step 3: Verify Astro still builds with Sentry**

Run:
```bash
cd "/Users/syber/Desktop/AI Projects/Websites/Website Template" && pnpm --filter @template/astro-site dev
```
Start dev server, wait for it to be ready, then:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4321
```
Expected: `200` — site still loads without a DSN configured (Sentry is disabled when DSN is empty).

- [ ] **Step 4: Stop the Astro dev server after verification**

Kill the dev server process.

---

## Task 5: Configure Sentry for Next.js Template

**Context:** `@sentry/nextjs` needs client and server init files at project root. The `withSentryConfig()` wrapping was already added to `next.config.ts` in Task 3, Step 8. DSN is left as placeholder.

**Files:**
- Create: `templates/next-app/sentry.client.config.ts`
- Create: `templates/next-app/sentry.server.config.ts`

Note: `next.config.ts` already includes `withSentryConfig()` from Task 3, Step 8.

- [ ] **Step 1: Create Sentry client config**

Create `templates/next-app/sentry.client.config.ts`:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
```

- [ ] **Step 2: Create Sentry server config**

Create `templates/next-app/sentry.server.config.ts`:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "",
  tracesSampleRate: 1.0,
  enabled: !!process.env.SENTRY_DSN,
});
```

- [ ] **Step 3: Verify Next.js starts with both Payload + Sentry**

Run:
```bash
cd "/Users/syber/Desktop/AI Projects/Websites/Website Template" && pnpm --filter @template/next-app dev
```

Wait for compilation, then:
```bash
# Main app still works
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# Payload admin still works
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin

# API still works
curl -s http://localhost:3000/api/pages | head -c 200
```
Expected: All return `200`. No Sentry errors in console (it's disabled without DSN).

- [ ] **Step 4: Stop the Next.js dev server after verification**

Kill the dev server process.

---

## Task 6: Final End-to-End Verification

Run all services simultaneously and confirm everything works together.

- [ ] **Step 1: Verify all Docker containers are running**

Run:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "supabase|twenty"
```
Expected: Supabase containers (db, auth, rest, storage, studio, realtime, etc.) + Twenty containers all show `Up`.

- [ ] **Step 2: Run pnpm install from root — no errors**

Run:
```bash
cd "/Users/syber/Desktop/AI Projects/Websites/Website Template" && pnpm install
```
Expected: Clean install, no errors.

- [ ] **Step 3: Start both dev servers and verify**

Start Astro:
```bash
pnpm --filter @template/astro-site dev &
```

Start Next.js:
```bash
pnpm --filter @template/next-app dev &
```

Test all endpoints:
```bash
# Astro on :4321
curl -s -o /dev/null -w "Astro: %{http_code}\n" http://localhost:4321

# Next.js on :3000
curl -s -o /dev/null -w "Next.js: %{http_code}\n" http://localhost:3000

# Payload admin on :3000/admin
curl -s -o /dev/null -w "Payload: %{http_code}\n" http://localhost:3000/admin

# Supabase API
curl -s -o /dev/null -w "Supabase API: %{http_code}\n" http://127.0.0.1:54321

# Supabase Studio
curl -s -o /dev/null -w "Supabase Studio: %{http_code}\n" http://127.0.0.1:54323

# Twenty CRM
curl -s -o /dev/null -w "Twenty CRM: %{http_code}\n" http://localhost:3001
```
Expected: All return `200` (or redirect codes).

- [ ] **Step 4: Verify shared package imports work**

Run from shared package directory (pnpm strict isolation means packages resolve from their own node_modules):
```bash
cd "/Users/syber/Desktop/AI Projects/Websites/Website Template/packages/shared" && node -e "
const sb = require.resolve('@supabase/supabase-js');
const re = require.resolve('resend');
console.log('Supabase resolves to:', sb.substring(sb.lastIndexOf('node_modules')));
console.log('Resend resolves to:', re.substring(re.lastIndexOf('node_modules')));
console.log('All shared imports OK');
"
```
Expected: Both resolve to paths within node_modules + `All shared imports OK`.

- [ ] **Step 5: Stop dev servers**

Kill both dev server processes.

- [ ] **Step 6: Print final status summary**

```bash
echo "=== VERIFICATION COMPLETE ==="
echo ""
echo "Services:"
pnpm supabase status 2>/dev/null | head -15
echo ""
docker compose -f docker/twenty/docker-compose.yml ps
echo ""
echo "Dev servers verified: Astro (:4321), Next.js (:3000)"
echo "Payload admin verified: :3000/admin"
echo "All configurations in place."
```
