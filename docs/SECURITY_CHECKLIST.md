# Security Checklist

Review before deploying to staging or production.

## Secrets & Keys

- [ ] PAYLOAD_SECRET is set to a unique random value (not the dev default)
- [ ] SUPABASE_SERVICE_ROLE_KEY is set (never expose in client-side code)
- [ ] SENTRY_AUTH_TOKEN is set (for source map uploads)
- [ ] RESEND_API_KEY is set
- [ ] TWENTY_API_KEY is set
- [ ] Twenty CRM APP_SECRET in docker/twenty/.env is a real random value
- [ ] No placeholder secrets remain in any .env file

## Database

- [ ] RLS is enabled on ALL public schema tables
- [ ] RLS policies are defined for tables accessed via Supabase client
- [ ] auto_enable_rls event trigger is active (catches new tables)
- [ ] Supabase service role key is only used server-side
- [ ] DATABASE_URL uses a strong password (not postgres:postgres)

## Authentication

- [ ] Supabase auth middleware (proxy.ts) is active
- [ ] Password minimum length is >= 8 (supabase/config.toml)
- [ ] Email confirmation is enabled for production
- [ ] Anonymous sign-ins are disabled (unless intentionally needed)
- [ ] MFA is configured if handling sensitive data

## Deployment

- [ ] NEXT_PUBLIC_SERVER_URL points to the production domain
- [ ] Supabase project URL points to cloud instance (not localhost)
- [ ] Twenty CRM SIGN_IN_PREFILLED is set to false
- [ ] Twenty CRM is behind authentication/VPN if internet-facing
- [ ] Sentry DSN is set for both client and server
- [ ] Source maps are uploaded to Sentry (SENTRY_AUTH_TOKEN set)

## Headers & CORS

- [ ] Payload CMS cors/csrf is configured for production domain
- [ ] Supabase additional_redirect_urls includes production domain
- [ ] No wildcard CORS origins in production

## Environment Files

- [ ] .env.local is in .gitignore (never committed)
- [ ] docker/twenty/.env is in .gitignore
- [ ] No secrets in docker-compose.yml (use ${VAR} references)
- [ ] .env.template contains only empty placeholders (no real values)

## Monitoring

- [ ] Sentry is capturing errors in both templates
- [ ] PostHog is tracking pageviews
- [ ] Supabase Studio is not publicly accessible in production
