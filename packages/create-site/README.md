# @agency/create-site

Scaffold a new website project from the agency template in one command.

## Usage

```bash
npx @agency/create-site my-project
```

### With a preset

```bash
npx @agency/create-site my-project --preset=marketing
npx @agency/create-site my-project --preset=saas
```

### Selecting services manually

```bash
npx @agency/create-site my-project --astro --supabase --sentry
npx @agency/create-site my-project --next --stripe --posthog
```

### Skip the init script (run it yourself later)

```bash
npx @agency/create-site my-project --no-init
cd my-project
./scripts/init-project.sh my-project
```

## What it does

1. Downloads the template via `degit` (no git history)
2. Runs the interactive setup wizard (`scripts/create-project.mjs`) with your flags passed through
3. Runs `scripts/init-project.sh` to provision services (Supabase, Sentry, etc.)
4. Prints next steps

## Before publishing

Update the `TEMPLATE_REPO` constant at the top of `index.mjs` to your actual GitHub repo URL, then rename the package in `package.json` to your org:

```json
{
  "name": "@your-org/create-site"
}
```

Publish with:

```bash
npm publish --access public
```
