import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  "";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Server-side admin client using service role key (bypasses RLS strictly on the server)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export default supabase;
