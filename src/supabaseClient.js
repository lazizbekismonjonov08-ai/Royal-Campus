import { createClient } from "@supabase/supabase-js";

// Paste your Supabase Project URL here (use the base URL without /rest/v1/)
// Or configure VITE_SUPABASE_URL in your environment variables.
const RAW_SUPABASE_URL =
  import.meta.env?.VITE_SUPABASE_URL ||
  "https://sigaquqirlzuwicrrkuh.supabase.co";

// Strip trailing "/rest/v1/" if copied from the REST API endpoint URL
const SUPABASE_URL = RAW_SUPABASE_URL.replace(/\/rest\/v1\/?$/, "");

// Paste your Supabase publishable (public) key here — never place a secret/service_role key in client code.
// Or configure VITE_SUPABASE_PUBLIC_KEY in your environment variables.
const SUPABASE_PUBLIC_KEY =
  import.meta.env?.VITE_SUPABASE_PUBLIC_KEY ||
  "sb_publishable_O48PmVoknOndvVyKet1G7g_dgWyHXGb";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
