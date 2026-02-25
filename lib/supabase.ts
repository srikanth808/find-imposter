import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = ReturnType<typeof createClient<any>>;

// Singleton for server-side usage
let _serverClient: AnyClient | null = null;
export function getServerClient(): AnyClient {
    if (!_serverClient) _serverClient = createClient<any>(supabaseUrl, supabaseKey);
    return _serverClient;
}

// Browser client (used in hooks/pages)
export const supabase: AnyClient = createClient<any>(supabaseUrl, supabaseKey);
