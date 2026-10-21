/**
 * iGyan App - Supabase Client Configuration
 */

import { createClient } from "@supabase/supabase-js";

// Prefer environment config (EXPO_PUBLIC_SUPABASE_URL /
// EXPO_PUBLIC_SUPABASE_ANON_KEY via app config or EAS secrets). The
// hardcoded values below are a fallback so existing builds keep working,
// but they should be removed once env config is in place — a key shipped
// in the bundle can never be treated as secret.
const FALLBACK_URL = "https://vfaoqkiwsjtnuukmrkel.supabase.co";
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmYW9xa2l3c2p0bnV1a21ya2VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDE2NzUsImV4cCI6MjA3Njg3NzY3NX0.yAcVgYp8cCCIm7dlHYXbETVSbqciXbdSuJiZ6r_MLAs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export { createClient };
