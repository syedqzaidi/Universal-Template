# Agency Web Stack

Full-stack agency website template with an interactive setup wizard. Choose your services, generate secrets, start Docker — one command.

![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen?logo=node.js)
![pnpm](https://img.shields.io/badge/pnpm-%3E%3D10-orange?logo=pnpm)
![License](https://img.shields.io/badge/license-MIT-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.2.2-black?logo=next.js)
![Astro](https://img.shields.io/badge/Astro-6.1.4-purple?logo=astro)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.2.2-38bdf8?logo=tailwindcss)

---

## What's Included

| Tool | Version | Purpose | Required |
|------|---------|---------|----------|
| Astro | 6.1.4 | SEO/marketing sites, static output with React islands | At least one framework |
| Next.js | 16.2.2 | Dashboards, apps, admin panels | At least one framework |
| Payload CMS | 3.81.0 | Headless CMS with admin UI, embedded in Next.js | Optional (requires Next.js + Supabase) |
| Tailwind CSS | 4.2.2 | Utility-first CSS, configured via CSS `@import` | Included with frameworks |
| shadcn/ui | 4.1.2 | 16 pre-installed UI components | Included with frameworks |
| Motion | 12.38.0 | Animation library (import from `motion/react`) | Included with frameworks |
| Supabase | CLI 2.85 / JS 2.101 | Database + Auth + Storage, full local Docker dev stack | Optional |
| Sentry | 10.47.0 | Error tracking configured in both frameworks | Optional |
| PostHog | 1.364.7 | Product analytics, session recordings, feature flags | Optional |
| Resend | 6.10.0 | Transactional email via API | Optional |
| Vercel CLI | 50.40.0 | Deployment platform | Optional (global install) |
| Twenty CRM | 1.20.0 | Self-hosted open-source CRM via Docker | Optional |
| `@template/shared` | workspace | Shared Supabase, PostHog, and Resend clients | Included |
| AI Website Cloner | — | Tool for cloning and adapting existing sites | Optional |

---

## Quick Start

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | >= 20 | Astro requires >= 22.12.0 |
| pnpm | >= 10 | `npm install -g pnpm` |
| Docker Desktop | latest | Required for Supabase and Twenty CRM |
| Vercel CLI | latest | Optional — `npm install -g vercel` |

### Option 1: npx (recommended after publishing)

```bash
npx @agency/create-site my-project
npx @agency/create-site my-project --preset=marketing
```

### Option 2: Clone + Wizard

```bash
git clone https://github.com/syedqzaidi/agency-web-stack.git my-project
cd my-project
node scripts/create-project.mjs
./scripts/init-project.sh "My Project"
```

### Option 3: Clone + Flags (no wizard)

```bash
git clone https://github.com/syedqzaidi/agency-web-stack.git my-project
cd my-project
node scripts/create-project.mjs my-project --preset=marketing --no-install
./scripts/init-project.sh "My Project"
```

---

## Presets

| Preset | Command | Includes |
|--------|---------|----------|
| `full` | `--preset=full` | Everything |
| `marketing` | `--preset=marketing` | Astro + Supabase + Sentry + PostHog |
| `dashboard` | `--preset=dashboard` | Next.js + Payload CMS + Supabase + Sentry |
| `both-frameworks` | `--preset=both-frameworks` | Astro + Next.js + Supabase + Sentry |
| `minimal` | `--preset=minimal` | Astro only (Tailwind + shadcn) |
| `nextjs-minimal` | `--preset=nextjs-minimal` | Next.js only (Tailwind + shadcn) |

---

## CLI Flags Reference

```
Frameworks:   --astro, --nextjs
Backend:      --supabase, --payload, --twenty
Integrations: --sentry, --posthog, --resend
Options:      --all, --name=<name>, --preset=<name>, --no-install, --no-init, --help
```

---

## Project Structure

```
agency-web-stack/
├── templates/
│   ├── astro-site/          # Astro marketing/SEO template (port 4400)
│   │   └── src/
│   │       ├── components/ui/   # shadcn/ui components
│   │       ├── layouts/
│   │       ├── lib/
│   │       ├── pages/
│   │       └── styles/
│   │
│   └── next-app/            # Next.js app/dashboard template (port 3100)
│       └── src/
│           ├── app/
│           │   ├── (app)/       # Application routes
│           │   ├── (payload)/   # Payload CMS admin routes
│           │   └── api/         # API route handlers
│           ├── components/ui/   # shadcn/ui components
│           ├── lib/
│           └── payload.config.ts
│
├── packages/
│   └── shared/              # @template/shared — shared service clients
│       └── src/
│           ├── supabase/    # SSR-compatible Supabase client
│           ├── posthog/     # PostHog init helper
│           ├── resend/      # Resend client
│           └── types/       # Shared TypeScript types
│
├── supabase/
│   ├── config.toml          # Local Supabase config (ports, auth settings)
│   └── migrations/          # SQL migration files
│
├── docker/
│   └── twenty/
│       ├── docker-compose.yml  # Twenty CRM + Postgres + Redis
│       └── .env                # Twenty APP_SECRET
│
├── scripts/                 # Setup wizard and init scripts
├── tools/
│   └── ai-website-cloner/   # AI-assisted site cloning tool
├── docs/                    # Internal documentation
├── .env.template            # Environment variable reference
├── .mcp.json                # MCP server configuration (10 servers)
├── package.json             # Root workspace scripts
└── pnpm-workspace.yaml      # pnpm workspace definition
```

---

## Service URLs and Ports

| Service | URL | Port | Start Command |
|---------|-----|------|---------------|
| Astro (dev) | http://localhost:4400 | 4400 | `pnpm dev:astro` |
| Next.js (dev) | http://localhost:3100 | 3100 | `pnpm dev:next` |
| Payload CMS Admin | http://localhost:3100/admin | 3100 | `pnpm dev:next` |
| Supabase API | http://localhost:54321 | 54321 | `pnpm dev:supabase` |
| Supabase DB (direct) | localhost:54322 | 54322 | `pnpm dev:supabase` |
| Supabase Studio | http://localhost:54323 | 54323 | `pnpm dev:supabase` |
| Supabase Mailpit | http://localhost:54324 | 54324 | `pnpm dev:supabase` |
| Twenty CRM | http://localhost:3001 | 3001 | `docker compose up -d` (in `docker/twenty/`) |

---

## Environment Variables

Copy `.env.template` into each template directory before starting:

```bash
cp .env.template templates/astro-site/.env
cp .env.template templates/next-app/.env
```

### Supabase

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. Local: `http://localhost:54321` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key — printed by `pnpm dev:supabase` on first start |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) — same output as above |
| `PUBLIC_SUPABASE_URL` | Same as above, Astro prefix (`PUBLIC_`) |
| `PUBLIC_SUPABASE_ANON_KEY` | Same as above, Astro prefix |

### Payload CMS

| Variable | Description |
|----------|-------------|
| `PAYLOAD_SECRET` | Token signing secret. Generate: `openssl rand -hex 32` |
| `DATABASE_URL` | Postgres URL. Default: `postgresql://postgres:postgres@localhost:54322/postgres` |
| `NEXT_PUBLIC_SERVER_URL` | Public Next.js URL. Default: `http://localhost:3100` |

### Sentry

| Variable | Description |
|----------|-------------|
| `SENTRY_DSN` | DSN from your Sentry project settings |
| `NEXT_PUBLIC_SENTRY_DSN` | Client-side DSN for Next.js |
| `PUBLIC_SENTRY_DSN` | Client-side DSN for Astro |
| `SENTRY_AUTH_TOKEN` | Auth token for sourcemap uploads (CI/build only) |
| `SENTRY_ORG` | Your Sentry organization slug |
| `SENTRY_PROJECT` | Your Sentry project slug |

### PostHog

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key (Next.js) |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog instance URL, e.g. `https://us.i.posthog.com` |
| `PUBLIC_POSTHOG_KEY` | Same, Astro prefix |
| `PUBLIC_POSTHOG_HOST` | Same, Astro prefix |

### Resend

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | API key from resend.com |

### Twenty CRM

| Variable | Description |
|----------|-------------|
| `TWENTY_API_URL` | Base URL of your Twenty instance. Default: `http://localhost:3001` |
| `TWENTY_API_KEY` | API key from Twenty Settings > API Keys |

---

## Development Workflow

### Starting Services

```bash
# Start Supabase local stack (required for Next.js + Payload)
pnpm dev:supabase

# Start Twenty CRM (optional)
cd docker/twenty && docker compose up -d && cd ../..

# Start Astro template
pnpm dev:astro

# Start Next.js + Payload template
pnpm dev:next
```

On first run of `pnpm dev:next`, visit `http://localhost:3100/admin` to create the initial Payload CMS admin user.

### Adding shadcn/ui Components

```bash
cd templates/astro-site
pnpm dlx shadcn@latest add accordion

cd templates/next-app
pnpm dlx shadcn@latest add accordion
```

Components are written to `src/components/ui/`. Pre-installed: `avatar`, `badge`, `button`, `card`, `dialog`, `dropdown-menu`, `form`, `input`, `label`, `navigation-menu`, `separator`, `sheet`, `sonner`, `table`, `tabs`, `field`.

### Creating Payload Collections

Edit `templates/next-app/src/payload.config.ts` and add to the `collections` array:

```typescript
{
  slug: "posts",
  admin: { useAsTitle: "title" },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "content", type: "richText" },
    { name: "publishedAt", type: "date" },
  ],
}
```

Payload auto-generates the database table and REST/GraphQL endpoints on next startup.

### Using the Shared Package

```typescript
import { createClient } from "@template/shared/supabase";
import { initPostHog } from "@template/shared/posthog";
import { resend } from "@template/shared/resend";
```

---

## Scripts Reference

### Root (run from project root)

| Script | Description |
|--------|-------------|
| `pnpm dev:astro` | Start Astro dev server at http://localhost:4400 |
| `pnpm dev:next` | Start Next.js + Payload dev server at http://localhost:3100 |
| `pnpm build:astro` | Production build for Astro |
| `pnpm build:next` | Production build for Next.js |
| `pnpm dev:supabase` | Start Supabase local stack via Docker |
| `pnpm stop:supabase` | Stop Supabase local stack |

### Template-level (run from `templates/astro-site` or `templates/next-app`)

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build locally (Astro only) |

### Docker (run from `docker/twenty/`)

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start Twenty CRM stack in background |
| `docker compose down` | Stop Twenty CRM stack |
| `docker compose logs -f twenty` | Tail Twenty CRM logs |

---

## MCP Servers

`.mcp.json` ships pre-configured with 10 MCP servers for AI assistant access to documentation and APIs.

| Server | Transport | What It Provides |
|--------|-----------|-----------------|
| `astro-docs` | HTTP (SSE) | Astro official documentation search |
| `next-devtools` | stdio | Next.js DevTools — routes, performance, build analysis |
| `shadcn` | HTTP (SSE) | shadcn/ui component documentation and registry |
| `payload` | stdio | Payload CMS schema introspection and documentation |
| `supabase-remote` | HTTP (SSE) | Supabase project management and SQL generation |
| `vercel` | HTTP (SSE) | Vercel deployments, domains, environment variables |
| `posthog` | HTTP (SSE) | PostHog analytics queries and feature flag management |
| `sentry` | stdio | Sentry error search, issue triage, release management |
| `resend` | stdio | Resend email sending and template management |
| `twenty-crm` | stdio | Twenty CRM record and object management |

Servers requiring authentication (Supabase, Vercel, PostHog, Sentry, Resend, Twenty) will prompt for credentials on first use.

---

## Deployment

### Vercel

1. Push the repository to GitHub.
2. In Vercel, create a new project and import the repository.
3. Set the **Root Directory** to `templates/astro-site` or `templates/next-app`.
4. Add all environment variables from `.env.template` with production values.
5. Deploy.

For Next.js + Payload, additionally set:
- `DATABASE_URL` — your Supabase cloud pooled connection string (for serverless)
- `PAYLOAD_SECRET` — a new strong random secret
- `NEXT_PUBLIC_SERVER_URL` — the deployed URL, e.g. `https://my-project.vercel.app`

### Supabase Cloud

```bash
pnpm supabase link --project-ref <your-project-ref>
pnpm supabase db push
```

### Twenty CRM on a VPS

1. Copy `docker/twenty/docker-compose.yml` and `docker/twenty/.env` to your server.
2. Generate a new `APP_SECRET`: `openssl rand -hex 32`
3. Set `SIGN_IN_PREFILLED=false` and update `SERVER_URL`/`FRONT_BASE_URL` to your domain.
4. Run `docker compose up -d`.

---

## Troubleshooting

### Port conflict on startup

```bash
lsof -i :<port>
```

Kill the conflicting process, or change the port in `astro.config.mjs` (Astro) or the `dev` script in `templates/next-app/package.json` (Next.js).

### Supabase won't start — another project already running

Only one Supabase project can run per machine at a time:

```bash
supabase stop --no-backup
pnpm dev:supabase
```

If containers are stuck after an unclean shutdown:

```bash
docker ps | grep supabase
docker stop <container-id>
```

### Payload tables missing RLS policies

Payload creates tables without Row Level Security. If you enable RLS globally and Payload API calls fail, either disable RLS on Payload-managed tables in Supabase Studio, or ensure `DATABASE_URL` uses the direct database port (54322) with the `postgres` superuser rather than the Supabase API port.

### Twenty CRM migration errors on first start

```bash
cd docker/twenty
docker compose down -v   # removes volumes — destroys all CRM data
docker compose up -d
docker compose logs -f twenty
```

The `start_period: 60s` health check means Twenty may show as unhealthy for up to a minute while migrations run — this is expected.

### CSS not loading in Astro (Tailwind v4)

Tailwind v4 in Astro does not use `tailwind.config.js`. Verify:

1. `@tailwindcss/vite` is in the `plugins` array in `astro.config.mjs`.
2. Your global CSS file contains `@import "tailwindcss";`.
3. The CSS file is imported in your layout.

Clear the Vite cache if styles still do not appear:

```bash
rm -rf templates/astro-site/node_modules/.vite
pnpm dev:astro
```

### Payload admin shows a blank page or 404

Ensure `pnpm dev:supabase` is running, `DATABASE_URL` points to port 54322, and visit `http://localhost:3100/admin` to complete the first-run setup if you haven't already.

### `@template/shared` import errors

Run `pnpm install` from the **project root**, not inside a template directory. The `pnpm-workspace.yaml` sets up the symlink automatically.

---

## Contributing

1. Fork the repository and create a feature branch.
2. Follow the existing code style — TypeScript, Tailwind v4, no `tailwind.config.js`.
3. Test your changes against both the Astro and Next.js templates where applicable.
4. Open a pull request with a clear description of the change and why it belongs in the template.

---

## License

MIT — see [LICENSE](LICENSE) for details.
