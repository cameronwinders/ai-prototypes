import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/supabase/env";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey, schema } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    db: {
      schema
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies. Middleware refreshes the session.
        }
      }
    }
  });
}
