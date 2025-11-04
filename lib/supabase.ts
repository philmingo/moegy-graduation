import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton instance for browser/client-side usage
let browserClient: SupabaseClient | null = null

/**
 * Creates or returns the singleton Supabase client instance
 * This prevents multiple GoTrueClient instances in the browser
 */
export function createClient() {
  // Server-side: always create a new instance
  if (typeof window === "undefined") {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey)
  }

  // Browser-side: reuse the singleton instance
  if (!browserClient) {
    browserClient = createSupabaseClient(supabaseUrl, supabaseAnonKey)
  }

  return browserClient
}

// Export default client for backwards compatibility
export const supabase = createClient()
