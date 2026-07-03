import { createSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/browser";

export const isSupabaseConfigured = isSupabaseBrowserConfigured;

export const supabaseClient = createSupabaseBrowserClient();
