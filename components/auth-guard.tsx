"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { GraduationCap } from "lucide-react"
import type { ReactNode } from "react"

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Allow public access to student QR portal
    if (pathname === "/student-qr-portal") {
      setIsLoading(false)
      setIsAuthenticated(true) // Allow access without auth
      return
    }

    // Check if user is authenticated for protected routes
    const authStatus = localStorage.getItem("isAuthenticated")
    setIsAuthenticated(authStatus === "true")
    setIsLoading(false)

    if (authStatus !== "true") {
      router.push("/login")
    }
  }, [router, pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <GraduationCap className="h-16 w-16 text-purple-600 animate-pulse mb-4" />
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated && pathname !== "/student-qr-portal") {
    return null // Will redirect in the useEffect
  }

  return <>{children}</>
}
