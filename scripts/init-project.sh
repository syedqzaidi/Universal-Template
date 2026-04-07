#!/usr/bin/env bash
# =============================================================================
# init-project.sh — One-shot setup for the Website Template monorepo
#
# Usage:
#   ./scripts/init-project.sh <project-name>
#
# What it does:
#   1. Validates prerequisites (Node >=20, pnpm, Docker)
#   2. Installs pnpm dependencies
#   3. Generates random secrets (PAYLOAD_SECRET, APP_SECRET)
#   4. Creates .env.local from .env.template with secrets filled in
#   5. Writes docker/twenty/.env with the generated APP_SECRET
#   6. Starts Supabase local dev and captures anon/service-role keys
#   7. Starts Twenty CRM via docker compose
#   8. Boots Next.js once to trigger Payload table creation, then stops it
#   9. Applies RLS ALTER TABLE commands on Payload tables
#  10. Runs scripts/validate-template.sh
#  11. Prints a summary of all URLs, keys, and next steps
#
# Idempotent: safe to run multiple times.
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Colours
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

ok()   { echo -e "${GREEN}✔${RESET}  $*"; }
info() { echo -e "${CYAN}→${RESET}  $*"; }
warn() { echo -e "${YELLOW}⚠${RESET}  $*"; }
fail() { echo -e "${RED}✘${RESET}  $*" >&2; }
section() { echo -e "\n${BOLD}${CYAN}▶ $*${RESET}"; }

# ---------------------------------------------------------------------------
# Resolve project root (the directory that contains this scripts/ folder)
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

# ---------------------------------------------------------------------------
# Argument handling
# ---------------------------------------------------------------------------
if [[ $# -lt 1 ]]; then
  fail "Usage: $0 <project-name>"
  echo "  Example: $0 acme-corp" >&2
  exit 1
fi

PROJECT_NAME="$1"
info "Project name: ${BOLD}${PROJECT_NAME}${RESET}"

# ---------------------------------------------------------------------------
# Port map (documented; referenced in summary)
# ---------------------------------------------------------------------------
PORT_ASTRO=4400
PORT_NEXTJS=3100
PORT_SUPABASE_API=54321
PORT_SUPABASE_DB=54322
PORT_SUPABASE_STUDIO=54323
PORT_SUPABASE_MAILPIT=54324
PORT_TWENTY=3001

# ---------------------------------------------------------------------------
# STEP 1 — Prerequisites
# ---------------------------------------------------------------------------
section "Step 1 — Checking prerequisites"

# Node.js >= 20
if ! command -v node &>/dev/null; then
  fail "Node.js is not installed. Install Node.js 20+ from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
if [[ "${NODE_VERSION}" -lt 20 ]]; then
  fail "Node.js >= 20 is required (found v${NODE_VERSION}). Upgrade at https://nodejs.org"
  exit 1
fi
ok "Node.js $(node --version)"

# pnpm
if ! command -v pnpm &>/dev/null; then
  fail "pnpm is not installed. Install with: npm install -g pnpm"
  exit 1
fi
ok "pnpm $(pnpm --version)"

# Docker — daemon must be running
if ! command -v docker &>/dev/null; then
  fail "Docker is not installed. Install from https://docs.docker.com/get-docker/"
  exit 1
fi
if ! docker info &>/dev/null; then
  fail "Docker daemon is not running. Start Docker Desktop (or the daemon) and retry."
  exit 1
fi
ok "Docker $(docker --version | awk '{print $3}' | tr -d ',')"

# openssl (for secret generation)
if ! command -v openssl &>/dev/null; then
  fail "openssl is required for secret generation but was not found on PATH."
  exit 1
fi
ok "openssl available"

# ---------------------------------------------------------------------------
# STEP 2 — Install dependencies
# ---------------------------------------------------------------------------
section "Step 2 — Installing dependencies"
info "Running pnpm install…"
pnpm install
ok "Dependencies installed"

# ---------------------------------------------------------------------------
# STEP 3 — Generate secrets
# ---------------------------------------------------------------------------
section "Step 3 — Generating secrets"

PAYLOAD_SECRET=$(openssl rand -hex 32)
APP_SECRET=$(openssl rand -hex 32)

ok "PAYLOAD_SECRET generated (${#PAYLOAD_SECRET} hex chars)"
ok "APP_SECRET generated (${#APP_SECRET} hex chars)"

# ---------------------------------------------------------------------------
# STEP 4 — Create .env.local from .env.template
# ---------------------------------------------------------------------------
section "Step 4 — Creating .env.local"

ENV_LOCAL="${PROJECT_ROOT}/.env.local"
ENV_TEMPLATE="${PROJECT_ROOT}/.env.template"

if [[ ! -f "${ENV_TEMPLATE}" ]]; then
  fail ".env.template not found at ${ENV_TEMPLATE}"
  exit 1
fi

if [[ -f "${ENV_LOCAL}" ]]; then
  warn ".env.local already exists — backing up to .env.local.bak"
  cp "${ENV_LOCAL}" "${ENV_LOCAL}.bak"
fi

# Copy template, then substitute the two secrets we own right now.
# Supabase keys will be patched in after `supabase start`.
cp "${ENV_TEMPLATE}" "${ENV_LOCAL}"

# Use | as sed delimiter to avoid issues with / in values
sed -i.tmp "s|^PAYLOAD_SECRET=.*|PAYLOAD_SECRET=${PAYLOAD_SECRET}|" "${ENV_LOCAL}"

# Ensure DATABASE_URL points to the local Supabase DB (template default is correct;
# this line is here explicitly for documentation / override safety)
sed -i.tmp "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:${PORT_SUPABASE_DB}/postgres|" "${ENV_LOCAL}"

rm -f "${ENV_LOCAL}.tmp"

ok ".env.local created at ${ENV_LOCAL}"

# ---------------------------------------------------------------------------
# STEP 5 — Write docker/twenty/.env
# ---------------------------------------------------------------------------
section "Step 5 — Writing docker/twenty/.env"

TWENTY_ENV_DIR="${PROJECT_ROOT}/docker/twenty"
TWENTY_ENV_FILE="${TWENTY_ENV_DIR}/.env"

if [[ ! -d "${TWENTY_ENV_DIR}" ]]; then
  fail "docker/twenty/ directory not found at ${TWENTY_ENV_DIR}"
  exit 1
fi

# Overwrite only APP_SECRET; preserve any other existing vars
if [[ -f "${TWENTY_ENV_FILE}" ]]; then
  # Update the existing APP_SECRET line
  sed -i.tmp "s|^APP_SECRET=.*|APP_SECRET=${APP_SECRET}|" "${TWENTY_ENV_FILE}"
  rm -f "${TWENTY_ENV_FILE}.tmp"
  ok "Updated APP_SECRET in ${TWENTY_ENV_FILE}"
else
  echo "APP_SECRET=${APP_SECRET}" > "${TWENTY_ENV_FILE}"
  ok "Created ${TWENTY_ENV_FILE}"
fi

# ---------------------------------------------------------------------------
# STEP 6 — Start Supabase local dev
# ---------------------------------------------------------------------------
section "Step 6 — Starting Supabase local dev"

# Check if Supabase is already running by attempting `supabase status`
SUPABASE_ALREADY_RUNNING=false
if pnpm supabase status &>/dev/null 2>&1; then
  warn "Supabase appears to already be running — skipping start"
  SUPABASE_ALREADY_RUNNING=true
else
  info "Running pnpm supabase start (this may take a minute on first run)…"
  if ! pnpm supabase start; then
    fail "pnpm supabase start failed. Check Docker is running and ports are free."
    exit 1
  fi
  ok "Supabase started"
fi

# Capture keys from supabase status output
info "Capturing Supabase connection details…"
SUPABASE_STATUS=$(pnpm supabase status 2>&1)

extract_supabase_value() {
  local key="$1"
  echo "${SUPABASE_STATUS}" | grep -E "^\s*${key}:" | sed 's/.*: *//' | tr -d '[:space:]'
}

SUPABASE_ANON_KEY=$(extract_supabase_value "anon key")
SUPABASE_SERVICE_ROLE_KEY=$(extract_supabase_value "service_role key")
SUPABASE_API_URL=$(extract_supabase_value "API URL")

# Fallback if the URL line differs by pnpm wrapper output
if [[ -z "${SUPABASE_API_URL}" ]]; then
  SUPABASE_API_URL="http://127.0.0.1:${PORT_SUPABASE_API}"
fi

if [[ -z "${SUPABASE_ANON_KEY}" ]]; then
  fail "Could not extract anon key from supabase status. Output was:\n${SUPABASE_STATUS}"
  exit 1
fi
if [[ -z "${SUPABASE_SERVICE_ROLE_KEY}" ]]; then
  fail "Could not extract service_role key from supabase status."
  exit 1
fi

ok "anon key captured"
ok "service_role key captured"
ok "API URL: ${SUPABASE_API_URL}"

# Patch keys into .env.local
sed -i.tmp "s|^NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_API_URL}|"       "${ENV_LOCAL}"
sed -i.tmp "s|^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}|" "${ENV_LOCAL}"
sed -i.tmp "s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}|" "${ENV_LOCAL}"

# Astro PUBLIC_ variants
sed -i.tmp "s|^PUBLIC_SUPABASE_URL=.*|PUBLIC_SUPABASE_URL=${SUPABASE_API_URL}|"                 "${ENV_LOCAL}"
sed -i.tmp "s|^PUBLIC_SUPABASE_ANON_KEY=.*|PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}|"     "${ENV_LOCAL}"

rm -f "${ENV_LOCAL}.tmp"

ok ".env.local patched with Supabase keys"

# ---------------------------------------------------------------------------
# STEP 7 — Start Twenty CRM
# ---------------------------------------------------------------------------
section "Step 7 — Starting Twenty CRM"

TWENTY_COMPOSE_FILE="${TWENTY_ENV_DIR}/docker-compose.yml"

# Accept docker-compose.yml or compose.yml
if [[ ! -f "${TWENTY_COMPOSE_FILE}" ]]; then
  TWENTY_COMPOSE_FILE="${TWENTY_ENV_DIR}/compose.yml"
fi

if [[ ! -f "${TWENTY_COMPOSE_FILE}" ]]; then
  warn "No docker-compose.yml / compose.yml found in docker/twenty/ — skipping Twenty CRM start"
else
  # Check if Twenty containers are already up
  if docker compose -f "${TWENTY_COMPOSE_FILE}" ps --services --filter status=running 2>/dev/null | grep -q .; then
    warn "Twenty CRM containers appear to already be running — skipping start"
  else
    info "Starting Twenty CRM via docker compose…"
    if ! docker compose -f "${TWENTY_COMPOSE_FILE}" up -d; then
      fail "docker compose up for Twenty CRM failed. Check ${TWENTY_COMPOSE_FILE} and Docker logs."
      exit 1
    fi
    ok "Twenty CRM started (port ${PORT_TWENTY})"
  fi
fi

# ---------------------------------------------------------------------------
# STEP 8 — Boot Next.js once to trigger Payload table creation
# ---------------------------------------------------------------------------
section "Step 8 — Booting Next.js to trigger Payload CMS table creation"

NEXTJS_LOG="/tmp/${PROJECT_NAME}-nextjs-boot.log"
NEXTJS_PID_FILE="/tmp/${PROJECT_NAME}-nextjs.pid"

# Locate the Next.js package directory
# Try common monorepo layouts: apps/web, apps/nextjs, packages/web, or root
NEXTJS_APP_DIR=""
for candidate in \
  "${PROJECT_ROOT}/apps/web" \
  "${PROJECT_ROOT}/apps/nextjs" \
  "${PROJECT_ROOT}/apps/cms" \
  "${PROJECT_ROOT}/packages/web" \
  "${PROJECT_ROOT}"; do
  if [[ -f "${candidate}/next.config.js" ]] || [[ -f "${candidate}/next.config.ts" ]] || [[ -f "${candidate}/next.config.mjs" ]]; then
    NEXTJS_APP_DIR="${candidate}"
    break
  fi
done

if [[ -z "${NEXTJS_APP_DIR}" ]]; then
  warn "Could not locate a Next.js app directory — skipping Payload boot step"
  warn "You may need to manually run your Next.js app once to create Payload tables."
else
  info "Found Next.js app at: ${NEXTJS_APP_DIR}"
  info "Starting Next.js in dev mode (logging to ${NEXTJS_LOG})…"
  info "Waiting for Payload to finish creating tables (up to 120 seconds)…"

  # Start Next.js dev server in background
  (cd "${NEXTJS_APP_DIR}" && pnpm dev --port "${PORT_NEXTJS}" >> "${NEXTJS_LOG}" 2>&1) &
  NEXTJS_PID=$!
  echo "${NEXTJS_PID}" > "${NEXTJS_PID_FILE}"

  # Poll for either the "ready" or "started" log line from Next.js / Payload
  BOOT_TIMEOUT=120
  ELAPSED=0
  BOOT_SUCCESS=false

  while [[ ${ELAPSED} -lt ${BOOT_TIMEOUT} ]]; do
    if grep -qiE "(ready|started server|payload cms|migrations complete)" "${NEXTJS_LOG}" 2>/dev/null; then
      BOOT_SUCCESS=true
      break
    fi
    if ! kill -0 "${NEXTJS_PID}" 2>/dev/null; then
      fail "Next.js process exited unexpectedly. Check ${NEXTJS_LOG}"
      break
    fi
    sleep 3
    ELAPSED=$((ELAPSED + 3))
    echo -n "."
  done
  echo ""

  # Give Payload an extra moment to finish any remaining migrations after the
  # "ready" signal, then shut down
  sleep 5

  info "Stopping Next.js dev server (PID ${NEXTJS_PID})…"
  kill "${NEXTJS_PID}" 2>/dev/null || true
  wait "${NEXTJS_PID}" 2>/dev/null || true
  rm -f "${NEXTJS_PID_FILE}"

  if [[ "${BOOT_SUCCESS}" == true ]]; then
    ok "Next.js booted and Payload tables should be created"
  else
    warn "Next.js boot timed out after ${BOOT_TIMEOUT}s — Payload tables may not be fully created"
    warn "Check ${NEXTJS_LOG} and re-run if needed"
  fi
fi

# ---------------------------------------------------------------------------
# STEP 9 — Apply RLS on Payload CMS tables
# ---------------------------------------------------------------------------
section "Step 9 — Applying Row-Level Security on Payload CMS tables"

# Payload tables are created outside Supabase migrations, so RLS must be
# applied separately. We discover all tables created in the public schema
# that do not already have RLS enabled.
info "Connecting to Supabase DB at 127.0.0.1:${PORT_SUPABASE_DB}…"

DB_URL="postgresql://postgres:postgres@127.0.0.1:${PORT_SUPABASE_DB}/postgres"

# List all public schema tables
PAYLOAD_TABLES=$(psql "${DB_URL}" -t -c \
  "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null \
  | tr -s ' ' | sed 's/^ //' | grep -v '^$' || true)

if [[ -z "${PAYLOAD_TABLES}" ]]; then
  warn "No tables found in public schema — skipping RLS step (tables may not exist yet)"
else
  RLS_APPLIED=0
  RLS_SKIPPED=0
  while IFS= read -r TABLE; do
    [[ -z "${TABLE}" ]] && continue

    # Check if RLS is already enabled
    RLS_STATUS=$(psql "${DB_URL}" -t -c \
      "SELECT rowsecurity FROM pg_class WHERE relname = '${TABLE}' AND relnamespace = 'public'::regnamespace;" \
      2>/dev/null | tr -s ' ' | sed 's/^ //' | tr -d '[:space:]' || true)

    if [[ "${RLS_STATUS}" == "t" ]]; then
      RLS_SKIPPED=$((RLS_SKIPPED + 1))
    else
      psql "${DB_URL}" -c "ALTER TABLE public.\"${TABLE}\" ENABLE ROW LEVEL SECURITY;" &>/dev/null || \
        warn "Could not enable RLS on table: ${TABLE}"
      RLS_APPLIED=$((RLS_APPLIED + 1))
    fi
  done <<< "${PAYLOAD_TABLES}"

  ok "RLS: enabled on ${RLS_APPLIED} table(s), already enabled on ${RLS_SKIPPED} table(s)"
fi

# ---------------------------------------------------------------------------
# STEP 10 — Run validation script
# ---------------------------------------------------------------------------
section "Step 10 — Running template validation"

VALIDATE_SCRIPT="${SCRIPT_DIR}/validate-template.sh"

if [[ -f "${VALIDATE_SCRIPT}" ]]; then
  if bash "${VALIDATE_SCRIPT}"; then
    ok "Template validation passed"
  else
    warn "Template validation reported issues — review output above"
  fi
else
  warn "validate-template.sh not found at ${VALIDATE_SCRIPT} — skipping validation"
fi

# ---------------------------------------------------------------------------
# STEP 11 — Summary
# ---------------------------------------------------------------------------
section "Setup Complete — Summary for: ${BOLD}${PROJECT_NAME}${RESET}"

echo ""
echo -e "${BOLD}URLs${RESET}"
echo -e "  Astro (static/marketing)    http://localhost:${PORT_ASTRO}"
echo -e "  Next.js / Payload CMS       http://localhost:${PORT_NEXTJS}"
echo -e "  Payload Admin               http://localhost:${PORT_NEXTJS}/admin"
echo -e "  Supabase Studio             http://localhost:${PORT_SUPABASE_STUDIO}"
echo -e "  Supabase API                ${SUPABASE_API_URL:-http://127.0.0.1:${PORT_SUPABASE_API}}"
echo -e "  Supabase Mailpit            http://localhost:${PORT_SUPABASE_MAILPIT}"
echo -e "  Twenty CRM                  http://localhost:${PORT_TWENTY}"

echo ""
echo -e "${BOLD}Generated Secrets (stored in .env.local & docker/twenty/.env)${RESET}"
echo -e "  PAYLOAD_SECRET              ${PAYLOAD_SECRET:0:16}…  (truncated)"
echo -e "  APP_SECRET (Twenty CRM)     ${APP_SECRET:0:16}…  (truncated)"
echo -e "  SUPABASE_ANON_KEY           ${SUPABASE_ANON_KEY:0:20}…  (truncated)"
echo -e "  SUPABASE_SERVICE_ROLE_KEY   ${SUPABASE_SERVICE_ROLE_KEY:0:20}…  (truncated)"

echo ""
echo -e "${BOLD}Files Created / Modified${RESET}"
echo -e "  ${PROJECT_ROOT}/.env.local"
echo -e "  ${TWENTY_ENV_DIR}/.env"

echo ""
echo -e "${BOLD}Next Steps${RESET}"
echo -e "  1. Fill in optional keys in .env.local (PostHog, Sentry, Resend, etc.)"
echo -e "  2. Start Astro dev server:    ${CYAN}pnpm --filter astro dev${RESET}"
echo -e "  3. Start Next.js dev server:  ${CYAN}pnpm --filter web dev${RESET}  (or your app name)"
echo -e "  4. Open Payload Admin and create your first user: http://localhost:${PORT_NEXTJS}/admin"
echo -e "  5. Configure Twenty CRM at: http://localhost:${PORT_TWENTY}"
echo ""
echo -e "${GREEN}${BOLD}Project '${PROJECT_NAME}' is ready to go!${RESET}"
