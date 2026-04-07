-- Auto-enable RLS on any table created in the public schema.
-- This catches Payload CMS tables (created at app startup, not via SQL migrations)
-- and any future tables added by other tools sharing this Postgres instance.
--
-- Payload connects as postgres (superuser) which bypasses RLS,
-- so zero policies = deny all for anon/authenticated (PostgREST) roles
-- while Payload continues to work normally.

-- 1. Function that enables RLS on newly created tables in public schema
CREATE OR REPLACE FUNCTION public.auto_enable_rls()
RETURNS event_trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag = 'CREATE TABLE'
  LOOP
    -- Only target tables in the public schema
    IF obj.schema_name = 'public' THEN
      EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', obj.object_identity);
      RAISE NOTICE 'Auto-enabled RLS on %', obj.object_identity;
    END IF;
  END LOOP;
END;
$$;

-- 2. Event trigger that fires after any CREATE TABLE
DROP EVENT TRIGGER IF EXISTS auto_enable_rls_trigger;
CREATE EVENT TRIGGER auto_enable_rls_trigger
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE')
  EXECUTE FUNCTION public.auto_enable_rls();

-- 3. Also enable RLS on any tables that already exist right now
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    RAISE NOTICE 'RLS enabled on public.%', t;
  END LOOP;
END;
$$;
