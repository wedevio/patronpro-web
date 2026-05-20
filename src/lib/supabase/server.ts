import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** SSR client — reads/writes auth cookies. Use in Server Components and Route Handlers. */
export async function getServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll:  ()                   => cookieStore.getAll(),
        setAll: (cookiesToSet)        => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — safe to ignore
          }
        },
      },
    }
  );
}
