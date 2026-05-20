import { createClient } from "@supabase/supabase-js";

/** Server-only admin client — bypasses RLS. NEVER expose to browser. */
export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/** Browser / RSC client — uses anon key, respects RLS */
export function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!anon) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  return createClient(url, anon);
}
