import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton instance for browser/client-side usage
let browserClient: SupabaseClient | null = null

/**
 * Creates or returns the Supabase client instance
 * - Server-side (in server actions/components): Creates a new instance optimized for server
 * - Client-side (in browser): Returns singleton instance to prevent multiple GoTrueClient instances
 */
export function createClient() {
  // Server-side: create instance optimized for server operations
  if (typeof window === "undefined") {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // For server actions, disable session persistence
        // Sessions should be managed on the client side
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
        timeout: 30000, // 30 seconds timeout for Real-Time connections
      },
    })
  }

  // Browser-side: reuse the singleton instance with full auth features
  if (!browserClient) {
    browserClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
        timeout: 30000, // 30 seconds timeout for Real-Time connections
      },
    })
  }

  return browserClient
}

// Export default client for backwards compatibility
export const supabase = createClient()
