"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { GraduationCap } from "lucide-react"
import type { ReactNode } from "react"
import { createClient } from "@/lib/supabase"

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      console.log("🛡️ [AUTH-GUARD] Checking auth for path:", pathname)
      
      // Public routes - no authentication required
      const publicRoutes = ["/student-qr-portal", "/login"]
      if (publicRoutes.includes(pathname)) {
        console.log("🛡️ [AUTH-GUARD] Public route, allowing access")
        setIsLoading(false)
        setIsAuthenticated(true)
        return
      }

      // Check Supabase session for protected routes
      console.log("🛡️ [AUTH-GUARD] Protected route, checking session...")
      const supabase = createClient()
      const { data: { session }, error } = await supabase.auth.getSession()
      
      console.log("🛡️ [AUTH-GUARD] Session check result:", { 
        userEmail: session?.user?.email, 
        hasSession: !!session,
        error 
      })
      
      setIsAuthenticated(!!session)
      setIsLoading(false)

      if (!session) {
        console.log("🛡️ [AUTH-GUARD] No session found, redirecting to /login")
        router.push("/login")
      } else {
        console.log("🛡️ [AUTH-GUARD] User authenticated, allowing access")
      }
    }

    checkAuth()
  }, [router, pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <GraduationCap className="h-16 w-16 text-purple-400 animate-pulse mb-4" />
        <p className="text-lg text-white">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated && pathname !== "/student-qr-portal") {
    return null // Will redirect in the useEffect
  }

  return <>{children}</>
}
