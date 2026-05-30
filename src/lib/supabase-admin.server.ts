import { createClient } from "@supabase/supabase-js";
import { getServerConfig } from "./config.server";
import type { Database } from "@/integrations/supabase/types";

/** Supabase client com service role — bypassa RLS. Usar apenas server-side. */
export function getSupabaseAdmin() {
  const { supabaseUrl, supabaseServiceRoleKey } = getServerConfig();
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL env vars");
  }
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
