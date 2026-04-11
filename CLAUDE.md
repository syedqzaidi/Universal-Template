# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Agency Web Stack — a pnpm monorepo template for building client websites. Two framework templates (Astro for marketing, Next.js for dashboards/CMS), shared packages, and integrated services (Supabase, Payload CMS, Twenty CRM, Stripe, Sentry, PostHog, Resend).

## Commands

```bash
# Development
pnpm dev:astro              # Astro dev server (port 4400)
pnpm dev:next               # Next.js dev server (port 3100)
pnpm dev:supabase           # Start local Supabase (API: 54321, DB: 54322)
pnpm stop:supabase          # Stop local Supabase

# Building
pnpm build:astro            # Production build for Astro
pnpm build:next             # Production build for Next.js

# Per-template (from template directory)
cd templates/astro-site && pnpm dev
cd templates/next-app && pnpm dev

# Project setup
node scripts/create-project.mjs        # Interactive project wizard
bash scripts/bootstrap.sh my-project   # One-command bootstrap
bash scripts/launch-ui.sh              # GUI dashboard (port 3333)
bash scripts/validate-template.sh      # Validation tests
bash scripts/e2e-test.sh               # End-to-end tests

# Docker (Twenty CRM)
docker compose -f docker/twenty/docker-compose.yml up -d
```

## Architecture

```
├── templates/
│   ├── astro-site/          # Astro 6 — marketing/SEO sites, file-based routing
│   │   └── src/{pages,components/ui,layouts,lib,styles}/
│   └── next-app/            # Next.js 16 — dashboard + Payload CMS admin
│       └── src/{app/(app),app/(payload),app/api,collections,lib,mcp,emails}/
├── packages/
│   ├── shared/              # @template/shared — Supabase, PostHog, Resend clients
│   └── create-site/         # @agency/create-site — setup wizard CLI
├── tools/ai-website-cloner/ # Standalone Next.js tool for reverse-engineering sites
├── docker/twenty/           # Twenty CRM v1.20 Docker Compose
├── supabase/                # Local Supabase config + migrations
├── scripts/                 # Bootstrap, setup, validation, e2e test scripts
├── docs/                    # Documentation site + integration seams
└── website-seo-playbook/    # 17 SEO strategy guides
```

### Key Relationships

- **@template/shared** exports `./supabase`, `./posthog`, `./resend`, `./types` — consumed by both templates
- **Payload CMS** lives inside `templates/next-app/` — collections in `src/collections/`, config at `src/payload.config.ts`
- **Twenty CRM** integration: API client at `src/lib/twenty/`, webhooks at `src/webhooks/`
- **MCP tools** (61 tools, 8 prompts) at `templates/next-app/src/mcp/` — AI-powered CMS operations

### Tailwind CSS v4

Both templates use Tailwind v4 — no `tailwind.config.js` file. Configuration is CSS-native:
- Astro: `@tailwindcss/vite` plugin in `astro.config.mjs`
- Next.js: `@tailwindcss/postcss` in `postcss.config.mjs`
- Import via `@import "tailwindcss"` in CSS files
- Colors use OKLCh color space

### UI Components

Both templates use shadcn/ui with Radix UI primitives. Components live in `src/components/ui/`. Animation via Motion library (not Framer Motion).

### Payload CMS Plugins (Next.js only)

form-builder, seo, search, redirects, nested-docs, stripe, sentry, mcp, import-export, richtext-lexical. Storage: S3 or Vercel Blob.

## Environment Variables

All defined in `.env.template`. Key groups: Supabase (URLs + keys), Payload CMS (secret + DB URL), Sentry (DSN + auth), PostHog (key + host), Resend (API key), Stripe (secret + webhook + publishable), Twenty CRM (URL + API key), S3/Blob storage, AI keys (OpenAI, Anthropic, Google, ElevenLabs).

## Project Presets

`full` | `marketing` (Astro only) | `dashboard` (Next.js only) | `both-frameworks` | `minimal` | `nextjs-minimal`

## Node Requirements

Root: >=20, Astro: >=22.12.0, AI Website Cloner: >=24
