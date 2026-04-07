# Post-Mortem: Integration Issues During Template Setup

**Date:** 2026-04-06
**Project:** Website Template Monorepo
**Scope:** Full-stack agency template with 14 tools/services

---

## Executive Summary

During the setup of the Website Template monorepo, **15 issues** were discovered after initial implementation was declared "complete." These ranged from critical security vulnerabilities to missing CSS, broken hydration, and misconfigured Docker containers. Every issue was resolved, but the pattern of "implement then discover" reveals systemic gaps in our integration process.

**Key finding:** The majority of issues were NOT bugs in the tools themselves — they were **integration seam failures** where Tool A's output didn't match Tool B's expectations. These seams are invisible during individual tool setup and only surface during cross-tool testing.

---

## Complete Issue Registry

### Phase 1: Discovered During First Testing Round

| # | Issue | Category | Severity | Root Cause |
|---|-------|----------|----------|------------|
| 1 | Supabase RLS disabled on all Payload tables | Security | CRITICAL | Payload creates tables at runtime, after Supabase migrations run |
| 2 | Payload admin — duplicate `<html>/<body>` hydration errors | Architecture | CRITICAL | Payload's `RootLayout` renders full HTML document inside Next.js root layout that also renders HTML |
| 3 | Astro error attributed to wrong project | Configuration | MEDIUM | Default port 4321 collided with another Astro project; wrong URL given |

### Phase 2: Discovered During Comprehensive Audit

| # | Issue | Category | Severity | Root Cause |
|---|-------|----------|----------|------------|
| 4 | Astro has no Layout component — CSS never loads | Architecture | CRITICAL | Scaffolded minimal template has no layout; global.css imported nowhere |
| 5 | Supabase shared client ignores @supabase/ssr | Integration | HIGH | Client code written using basic API; SSR package installed but never wired |
| 6 | No auth middleware in Next.js | Integration | HIGH | Supabase SSR requires middleware for token refresh; not in Payload setup |
| 7 | PAYLOAD_SECRET has hardcoded fallback | Security | HIGH | Dev convenience pattern silently degrades to known secret in production |
| 8 | Twenty CRM APP_SECRET is placeholder | Security | HIGH | Docker compose used placeholder; never replaced with real secret |
| 9 | Missing env vars in .env.template | Configuration | MEDIUM | Sentry client-side DSN, org, project vars not documented |
| 10 | shadcn `form` component missing | Installation | MEDIUM | `base-nova` style doesn't include form in registry; manual install needed |
| 11 | No Sentry server config for Astro | Configuration | MEDIUM | Only client config created; server errors uncaptured in SSR |
| 12 | Payload media has no cloud storage adapter | Architecture | MEDIUM | Local disk uploads don't persist on serverless (Vercel) |
| 13 | No serverURL in Payload config | Configuration | MEDIUM | Email links and webhooks can't construct absolute URLs |
| 14 | PostHog provider.tsx misleadingly named | Code Quality | LOW | Named "provider" but is actually an init utility, not React context |
| 15 | Twenty Docker service has no healthcheck | Operations | LOW | App container health never verified; only DB and Redis had checks |

### Phase 3: Discovered During Fix Verification

| # | Issue | Category | Severity | Root Cause |
|---|-------|----------|----------|------------|
| 16 | Payload CSS not loading (unstyled admin) | Integration | CRITICAL | Payload 3.81 doesn't auto-import its CSS; explicit `@payloadcms/next/css` import required |
| 17 | Twenty CRM "error checking user existence" | Operations | HIGH | Docker volume poisoned by failed first migration; needed full volume reset |
| 18 | `handleServerFunctions` missing config | Integration | HIGH | Server function exported as bare reference without binding Payload config + importMap |
| 19 | Server Action not async | Framework | MEDIUM | Next.js requires all `"use server"` exports to be async functions |
| 20 | RLS migration not applied to live DB | Operations | MEDIUM | Migration file existed but event trigger wasn't created in running instance |
| 21 | `auto_enable_rls` function missing search_path | Security | MEDIUM | Supabase linter flagged mutable search_path as injection risk |
| 22 | Next.js 16 renamed middleware.ts to proxy.ts | Framework | LOW | Breaking change in Next.js 16; deprecation warning on every server start |
| 23 | Twenty Docker compose used nonexistent image tag | Operations | HIGH | `twentycrm/twenty-postgres-spilo:16` doesn't exist on Docker Hub |
| 24 | Twenty Docker missing REDIS_URL and Redis service | Operations | HIGH | Twenty v1.20 requires Redis; not in original compose file |

---

## Root Cause Analysis

### Category 1: Integration Seam Failures (9 issues)

**Issues:** #1, #2, #5, #6, #16, #18, #19, #22, #24

**Pattern:** Each tool works in isolation, but when Tool A connects to Tool B, their assumptions clash.

| Seam | What Clashed |
|------|-------------|
| Payload + Supabase | Payload creates tables at runtime; Supabase expects tables at migration time |
| Payload + Next.js layouts | Payload renders its own `<html>/<body>`; Next.js root layout also renders them |
| Payload + Next.js CSS | Payload 3.81 doesn't auto-import CSS; must be explicit |
| Payload + Server Actions | `handleServerFunctions` needs config bound in; Next.js requires async |
| Supabase + Next.js SSR | SSR package installed but client code used browser-only API |
| Supabase + Next.js middleware | Token refresh middleware is a Supabase requirement, not a Next.js one |
| Next.js 16 conventions | `middleware.ts` renamed to `proxy.ts` — post-training-cutoff change |
| Twenty + Redis | Twenty v1.20 requires Redis — not documented in basic Docker examples |

**Why missed:** We installed each tool following its OWN documentation. No tool's docs describe how it integrates with the OTHER tools in our stack. The integration seams are undocumented territory.

**Fix going forward:**
- Create an **integration test suite** that tests cross-tool boundaries
- Maintain a **seam registry** documenting every tool-to-tool connection point
- After installing any tool, explicitly test: "does it break everything already installed?"

---

### Category 2: Security Defaults Left in Place (4 issues)

**Issues:** #7, #8, #21, #1 (RLS)

**Pattern:** Dev-friendly defaults (placeholder secrets, disabled security features) were never hardened.

**Why missed:** During setup, the focus was "make it work" not "make it secure." Security hardening was implicitly deferred to "configure per-project later" but no checklist existed to ensure it happened.

**Fix going forward:**
- Add a `SECURITY_CHECKLIST.md` to the template root
- Payload secret: already fixed to throw in production
- Twenty secret: already moved to `.env` file
- RLS: already auto-enabled via event trigger
- Add a pre-deploy hook or CI check that scans for placeholder values

---

### Category 3: Missing Boilerplate/Glue Code (5 issues)

**Issues:** #4, #9, #10, #11, #13

**Pattern:** Scaffolding tools create minimal starting points, but real applications need additional files that aren't generated.

| Tool | What Was Missing | Why |
|------|-----------------|-----|
| Astro | Layout component + CSS import | `--template minimal` creates bare index.astro only |
| Payload | Cloud storage adapter documentation | Payload doesn't know you'll deploy to serverless |
| Payload | serverURL config | Not required for local dev, breaks in production |
| shadcn | form component | `base-nova` style doesn't include it by default |
| Sentry/Astro | Server config file | Auto-instrumentation exists but explicit config is safer |

**Why missed:** We followed CLI scaffolding defaults. The defaults work for demos but not for production templates. The gap between "scaffolded" and "production-ready" was larger than expected.

**Fix going forward:**
- After each scaffold, run a **"production readiness" checklist** specific to that tool
- Document the delta between scaffold output and production requirements

---

### Category 4: Docker/Infrastructure Issues (4 issues)

**Issues:** #17, #20, #23, #15

**Pattern:** Docker containers are stateful — failed first runs poison volumes, and image tags may not exist.

**Why missed:**
- Image tag `twentycrm/twenty-postgres-spilo:16` was taken from docs that were outdated
- Volume data from failed migration persisted across container restarts
- Migration files existed on disk but weren't applied to the running database
- Healthcheck on the app service was simply omitted from the compose template

**Fix going forward:**
- Always verify Docker image tags exist on Docker Hub before adding to compose
- Include `docker compose down -v` in the "fresh start" instructions
- After creating migrations, always verify they're applied: `supabase migration list`
- All services in compose files must have healthchecks

---

### Category 5: Port Conflicts and Environment Isolation (2 issues)

**Issues:** #3, #22

**Pattern:** Multiple projects on the same machine share port space.

**Why missed:** Default ports (4321 for Astro, 3000 for Next.js) are the same across all projects. When another project is running, ports silently shift.

**Fix going forward:**
- Already fixed: Astro pinned to 4400, Next.js to 3100
- Document port assignments in README
- Consider a port range convention: template projects use 3100-3199 and 4400-4499

---

## Why Issues Weren't Caught During Implementation

| Gap | Explanation |
|-----|-------------|
| **No cross-tool integration tests** | Each tool was tested in isolation. "Astro starts" ✓ and "Payload starts" ✓ doesn't mean "Payload inside Next.js alongside Supabase with SSR" ✓ |
| **CLI scaffolds trusted blindly** | `create-astro`, `create-next-app`, `shadcn init` outputs were accepted without verifying production readiness |
| **Verification was HTTP-status-only** | We tested `curl → 200` but didn't check CSS rendering, hydration errors, or console output |
| **Docker docs were outdated** | Twenty CRM's Docker setup guide didn't match the v1.20 requirements (Redis, correct image tags) |
| **Security was deferred** | "Configure keys per-project later" left placeholders that became silent vulnerabilities |
| **Framework breaking changes** | Next.js 16.2.2 renamed middleware.ts → proxy.ts (post-training-cutoff change) |
| **No browser-level testing** | All verification was CLI/curl. Hydration errors, missing CSS, and layout issues only show in a browser |

---

## Recommendations for the Reusable Template

### 1. Create an Automated Validation Script

Add `scripts/validate-template.sh` that runs after cloning:

```
- pnpm install (clean)
- Start Supabase local
- Start Next.js dev server
- Start Astro dev server
- HTTP health checks on all endpoints
- HTML structure validation (1 html, 1 body per page)
- CSS presence validation (Tailwind tokens in response)
- RLS verification (all public tables secured)
- Env var completeness check
- Docker healthcheck verification
- Port conflict detection
```

### 2. Create a Project Initialization Script

Instead of just `git clone`, create a `scripts/init-project.sh` that:

```
1. Copies the template (or clones from GitHub)
2. Generates real secrets (PAYLOAD_SECRET, APP_SECRET)
3. Writes .env.local with generated values
4. Runs pnpm install
5. Starts Supabase local + applies migrations
6. Starts Twenty CRM
7. Boots Next.js once to trigger Payload table creation
8. Re-applies RLS (since Payload tables are created after migration)
9. Runs the validation script
10. Makes initial git commit
```

### 3. Use GitHub Template Repository

Instead of a raw clone, use GitHub's **template repository** feature:
- Mark the repo as a template in GitHub settings
- Users click "Use this template" → creates a new repo with clean history
- Add a GitHub Action that runs the validation script on push

Alternatively, use `degit` for faster cloning without git history:
```bash
npx degit your-org/website-template my-new-project
cd my-new-project
./scripts/init-project.sh
```

### 4. Integration Seam Registry

Maintain a document listing every tool-to-tool connection:

| From | To | Seam Point | What to Verify |
|------|----|------------|----------------|
| Payload | Supabase Postgres | DATABASE_URL on port 54322 | Tables created, RLS applied |
| Payload | Next.js | withPayload() wrapper + route groups | No duplicate html/body |
| Payload | Next.js CSS | `@payloadcms/next/css` import | Admin panel styled |
| Sentry | Next.js | withSentryConfig() + init files | No build errors without DSN |
| Sentry | Astro | Integration + client/server configs | Disabled gracefully without DSN |
| Supabase | Next.js | SSR client + proxy.ts middleware | Token refresh works |
| Twenty | Docker | Postgres + Redis + migrations | All containers healthy |

### 5. Version Pinning Strategy

Pin exact versions for tools with known integration seams:
- Next.js: `16.2.2` (not ^16)
- Payload: `3.81.0` (not ^3)
- Supabase CLI: `2.85.0` (not ^2)

Use ranges for stable libraries:
- Tailwind, shadcn, Motion, PostHog, Resend — `^` ranges are fine

### 6. Pre-Commit Validation Hook

Add a git hook that prevents committing if:
- `.env` files contain real secrets
- Placeholder secrets are in committed files
- RLS is disabled on any public table

---

## Template Distribution Strategy

### Option A: GitHub Template Repository (Recommended)

```
Pros:
- One-click "Use this template" on GitHub
- Clean git history for each new project
- GitHub Actions can run validation on template changes
- Dependabot keeps deps updated in the template

Cons:
- Must manually pull template updates into existing projects
- GitHub-specific (no GitLab/Bitbucket)

Setup:
1. Push to GitHub
2. Settings → check "Template repository"
3. Add GitHub Action for CI validation
4. Document: "Click Use this template → run init script"
```

### Option B: degit + Init Script

```bash
# One command to start a new project:
npx degit your-org/website-template my-client-site
cd my-client-site && ./scripts/init-project.sh "Client Name"
```

```
Pros:
- Platform-agnostic (works with any git host)
- Faster than git clone (no history)
- Init script handles all setup

Cons:
- No automatic template updates
- Requires npx/degit installed
```

### Option C: Custom CLI Tool (Future)

```bash
npx @your-agency/create-site my-client-site
```

```
Pros:
- Best UX — interactive prompts for project name, which services to enable
- Can selectively include/exclude services (e.g., skip Twenty CRM)
- Handles secret generation, env setup, Docker startup

Cons:
- Significant development effort
- Must be maintained alongside the template
```

### Recommendation

**Start with Option A (GitHub Template) + init script.** It's the fastest to set up and gives you immediate value. Add Option B as a convenience alias. Consider Option C only if you're creating 10+ projects/month and need customization.

---

## Action Items

| Priority | Action | Owner | Status |
|----------|--------|-------|--------|
| HIGH | Create `scripts/init-project.sh` automation script | — | TODO |
| HIGH | Create `scripts/validate-template.sh` test suite | — | TODO |
| HIGH | Make initial git commit with all current work | — | TODO |
| HIGH | Push to GitHub as template repository | — | TODO |
| MEDIUM | Create `SECURITY_CHECKLIST.md` | — | TODO |
| MEDIUM | Create integration seam registry document | — | TODO |
| MEDIUM | Add GitHub Action for CI validation | — | TODO |
| LOW | Create `degit` distribution alias | — | TODO |
| LOW | Consider custom CLI tool for project creation | — | TODO |

---

## Conclusion

The 24 issues discovered during this build fall into 5 predictable categories: integration seams, security defaults, missing boilerplate, Docker state, and port conflicts. None were exotic bugs — they were all foreseeable failures at the boundaries between well-documented tools.

The fix is not "be more careful" — it's **automate the verification of every integration seam** so these checks run every time the template is used, not just when a human remembers to look.

The template is now in a solid state with all 24 issues resolved. The next step is to commit, push to GitHub, create the init/validation scripts, and test the full clone-to-running workflow end-to-end.
