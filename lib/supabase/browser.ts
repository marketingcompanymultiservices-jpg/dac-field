import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseBrowserConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function createSupabaseBrowserClient() {
  if (!isSupabaseBrowserConfigured) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseBrowserConfigStatus() {
  return {
    isConfigured: isSupabaseBrowserConfigured,
    url: supabaseUrl,
    hasAnonKey: Boolean(supabaseAnonKey)
  };
}
