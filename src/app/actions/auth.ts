"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const email    = formData.get("email")    as string;
  const password = formData.get("password") as string;
  const next     = (formData.get("next")    as string) || "/panel";

  if (!email || !password) return "Completá todos los campos.";

  // In Server Actions, cookies() is fully writable
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: ()               => cookieStore.getAll(),
        setAll: (cookiesToSet)   => {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return "Credenciales incorrectas.";

  redirect(next);
}
