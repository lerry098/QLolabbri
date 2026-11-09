import { createAdminClient } from "@supabase/server/core";
import type { Database } from "./supabase-types";

export function createSupabaseAdminClient(url: string, secretKey: string) {
  if (!url || !secretKey)
    throw new Error("Set SUPABASE_URL and SUPABASE_SECRET_KEY.");
  return createAdminClient<Database>({
    auth: { keyName: "default" },
    env: {
      url,
      publishableKeys: {},
      secretKeys: { default: secretKey },
      jwks: null,
    },
    supabaseOptions: {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  });
}
