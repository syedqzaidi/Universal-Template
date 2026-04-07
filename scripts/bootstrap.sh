#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

REPO_URL="https://github.com/syedqzaidi/agency-web-stack.git"

PROJECT_NAME=""
PASSTHROUGH_ARGS=()
for arg in "$@"; do
  if [[ -z "$PROJECT_NAME" && ! "$arg" =~ ^-- ]]; then
    PROJECT_NAME="$arg"
  else
    PASSTHROUGH_ARGS+=("$arg")
  fi
done

if [[ -z "$PROJECT_NAME" ]]; then
  echo -e "${BOLD}Agency Web Stack — Quick Setup${RESET}"
  echo ""
  echo "Usage:"
  echo "  curl -fsSL <url> | bash -s -- <project-name> [options]"
  echo ""
  echo "Examples:"
  echo "  curl -fsSL <url> | bash -s -- my-project"
  echo "  curl -fsSL <url> | bash -s -- my-project --preset=marketing"
  echo ""
  echo "Options are passed to the project setup wizard."
  echo "Run with --help as an option to see all available flags and presets."
  exit 1
fi

if [[ -d "$PROJECT_NAME" ]]; then
  echo -e "${RED}Error: Directory '$PROJECT_NAME' already exists.${RESET}"
  exit 1
fi

echo -e "${BOLD}${CYAN}"
echo "  ┌─────────────────────────────────────────┐"
echo "  │        Agency Web Stack Setup            │"
echo "  │  Full-stack website template             │"
echo "  └─────────────────────────────────────────┘"
echo -e "${RESET}"
echo ""

# Step 1: Check prerequisites
echo -e "${BOLD}Step 1 of 5: Checking prerequisites${RESET}"

if ! command -v node &>/dev/null; then
  echo -e "${RED}Node.js is not installed.${RESET}"
  echo "Please install Node.js 20 or higher from: https://nodejs.org"
  exit 1
fi
NODE_VER=$(node --version | sed 's/v//' | cut -d. -f1)
if [[ "$NODE_VER" -lt 20 ]]; then
  echo -e "${RED}Node.js 20 or higher is required (you have v${NODE_VER}).${RESET}"
  echo "Please update from: https://nodejs.org"
  exit 1
fi
echo -e "  ${GREEN}✔${RESET} Node.js $(node --version)"

if ! command -v pnpm &>/dev/null; then
  echo -e "  ${YELLOW}pnpm not found — installing...${RESET}"
  npm install -g pnpm
fi
echo -e "  ${GREEN}✔${RESET} pnpm $(pnpm --version)"

if ! command -v docker &>/dev/null; then
  echo -e "${RED}Docker is not installed.${RESET}"
  echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/"
  exit 1
fi
if ! docker info &>/dev/null 2>&1; then
  echo -e "${RED}Docker is installed but not running.${RESET}"
  echo "Please start Docker Desktop and try again."
  exit 1
fi
echo -e "  ${GREEN}✔${RESET} Docker running"

if ! command -v git &>/dev/null; then
  echo -e "${RED}Git is not installed.${RESET}"
  echo "Please install Git from: https://git-scm.com"
  exit 1
fi
echo -e "  ${GREEN}✔${RESET} Git $(git --version | awk '{print $3}')"

echo ""

# Step 2: Clone
echo -e "${BOLD}Step 2 of 5: Downloading template${RESET}"
git clone --depth=1 "$REPO_URL" "$PROJECT_NAME"
rm -rf "$PROJECT_NAME/.git"
echo -e "  ${GREEN}✔${RESET} Template downloaded to ./$PROJECT_NAME"
echo ""

# Step 3: Install dependencies
echo -e "${BOLD}Step 3 of 5: Installing dependencies${RESET}"
echo "  This may take a minute..."
cd "$PROJECT_NAME"
pnpm install 2>&1 | tail -3
echo -e "  ${GREEN}✔${RESET} Dependencies installed"
echo ""

# Step 4: Run wizard (or apply preset)
echo -e "${BOLD}Step 4 of 5: Configuring your project${RESET}"
if [[ ${#PASSTHROUGH_ARGS[@]} -gt 0 ]]; then
  node scripts/create-project.mjs --name="$PROJECT_NAME" "${PASSTHROUGH_ARGS[@]}"
else
  node scripts/create-project.mjs --name="$PROJECT_NAME"
fi
echo ""

# Step 5: Initialize services
echo -e "${BOLD}Step 5 of 5: Starting services${RESET}"
echo "  This starts your database, CRM, and other Docker services."
echo "  First run may take a few minutes to download Docker images."
echo ""
bash scripts/init-project.sh "$PROJECT_NAME"
