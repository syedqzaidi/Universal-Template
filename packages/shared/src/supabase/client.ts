import { createBrowserClient, createServerClient, type CookieMethods } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Browser client — use in client components and browser-side code
export function createSupabaseBrowserClient(
  supabaseUrl: string,
  supabaseAnonKey: string
) {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Server client — use in server components, server actions, route handlers, middleware
// Caller must provide cookie methods from their framework (Next.js cookies(), Astro.cookies, etc.)
export function createSupabaseServerClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
  cookieMethods: CookieMethods
) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: cookieMethods,
  });
}

// Service role client — server-only, bypasses RLS
// Use for admin operations, webhooks, cron jobs
export function createSupabaseServiceClient(
  supabaseUrl: string,
  serviceRoleKey: string
) {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
