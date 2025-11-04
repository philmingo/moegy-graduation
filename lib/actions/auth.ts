"use server"

import { createClient } from "@/lib/supabase"

export interface AuthUser {
  id: string
  email: string
  role?: string
}

/**
 * Sign in with email and password
 * Supports multiple concurrent sessions (same user on multiple devices)
 */
export async function signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("❌ [AUTH] Sign in error:", error.message)
      return { user: null, error: error.message }
    }

    if (!data.user) {
      return { user: null, error: "No user data returned" }
    }

    console.log("✅ [AUTH] User signed in successfully:", data.user.email)

    return {
      user: {
        id: data.user.id,
        email: data.user.email || "",
        role: data.user.user_metadata?.role || "admin",
      },
      error: null,
    }
  } catch (error) {
    console.error("❌ [AUTH] Unexpected sign in error:", error)
    return {
      user: null,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

/**
 * Sign out current user
 * Only signs out from current device/session
 */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const supabase = createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("❌ [AUTH] Sign out error:", error.message)
      return { error: error.message }
    }

    console.log("✅ [AUTH] User signed out successfully")
    return { error: null }
  } catch (error) {
    console.error("❌ [AUTH] Unexpected sign out error:", error)
    return {
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

/**
 * Get current session
 * Returns null if no active session
 */
export async function getSession(): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const supabase = createClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("❌ [AUTH] Get session error:", error.message)
      return { user: null, error: error.message }
    }

    if (!session || !session.user) {
      return { user: null, error: null }
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email || "",
        role: session.user.user_metadata?.role || "admin",
      },
      error: null,
    }
  } catch (error) {
    console.error("❌ [AUTH] Unexpected get session error:", error)
    return {
      user: null,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

/**
 * Check if user is authenticated
 * Useful for middleware and route guards
 */
export async function isAuthenticated(): Promise<boolean> {
  const { user } = await getSession()
  return user !== null
}

/**
 * Mobile scanner authentication
 * Accepts email and password directly from the user
 * Supabase handles multiple concurrent sessions automatically
 */
export async function signInMobileScanner(
  email: string,
  password: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const result = await signIn(email, password)

    if (result.error || !result.user) {
      return { success: false, error: result.error || "Invalid credentials" }
    }

    console.log("✅ [AUTH] Mobile scanner authenticated")
    return { success: true, error: null }
  } catch (error) {
    console.error("❌ [AUTH] Mobile scanner authentication error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
