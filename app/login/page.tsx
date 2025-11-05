"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, LogIn, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import config, { currentTheme, ui } from "@/lib/theme-config"
import { AnimatedBackground } from "@/components/animated-background"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [generalError, setGeneralError] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        console.log("✅ [LOGIN] Already logged in, redirecting to /admin")
        router.replace("/admin")
      } else {
        setIsCheckingAuth(false)
      }
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Clear previous errors
    setEmailError("")
    setPasswordError("")
    setGeneralError("")

    try {
      console.log("🔐 [LOGIN] Attempting login for:", email)
      
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("🔐 [LOGIN] Sign in result:", { user: data.user?.email, error })

      if (error || !data.user) {
        // Parse error and set appropriate field error
        const errorMessage = error?.message || "Invalid email or password"
        const lowerError = errorMessage.toLowerCase()
        
        // Determine if this is a user error (invalid credentials) or system error
        const isUserError = lowerError.includes("invalid") || 
                           lowerError.includes("credentials") || 
                           lowerError.includes("password") ||
                           lowerError.includes("user not found") ||
                           lowerError.includes("no user")
        
        // Log as warning for expected user errors, error for system issues
        if (isUserError) {
          console.warn("⚠️ [LOGIN] Invalid credentials provided")
        } else {
          console.error("❌ [LOGIN] Login failed:", error?.message)
        }
        
        // Check for email-specific errors
        if (lowerError.includes("email") || lowerError.includes("user not found") || lowerError.includes("no user")) {
          setEmailError("No account found with this email address.")
        } 
        // Check for invalid credentials (could be email or password)
        else if (lowerError.includes("invalid login credentials") || lowerError.includes("invalid credentials")) {
          // This error is ambiguous - could be either wrong email or password
          // Set it as password error since that's more common
          setEmailError("Email or password is incorrect.")
          setPasswordError("Email or password is incorrect.")
        }
        // Check for password-specific errors
        else if (lowerError.includes("password")) {
          setPasswordError("Incorrect password. Please try again.")
        } 
        // Generic invalid errors
        else if (lowerError.includes("invalid")) {
          setPasswordError("Incorrect password. Please try again.")
        } 
        // Network or other errors
        else {
          setGeneralError(errorMessage)
        }
        
        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        })
      } else {
        console.log("✅ [LOGIN] Login successful, session created")
        console.log("✅ [LOGIN] User:", data.user.email)
        console.log("✅ [LOGIN] Session:", data.session?.access_token ? "Valid token" : "No token")
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.email}!`,
        })

        // Small delay to ensure session is fully set before navigation
        await new Promise(resolve => setTimeout(resolve, 100))
        
        console.log("✅ [LOGIN] Redirecting to /admin")
        // Use replace to avoid back button issues
        router.replace("/admin")
      }
    } catch (error) {
      console.error("❌ [LOGIN] Unexpected error:", error)
      toast({
        title: "Login error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center`}>
        <div className="text-center">
          <GraduationCap className="h-16 w-16 text-purple-400 animate-pulse mb-4 mx-auto" />
          <p className="text-white">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen ${currentTheme.background} relative overflow-hidden flex items-center justify-center p-4`}
    >
      {/* Animated Background Elements */}
      <AnimatedBackground />

      {/* Login Form */}
      <div className={`w-full max-w-md relative z-10`}>
        <div
          className={`${currentTheme.glass.standard} ${ui.borderRadius.medium} ${ui.shadows.large} ${ui.shadows.colored} p-8`}
        >
          {/* Header */}
          <div className="text-center mb-8">
            {/* Logo */}
            <div
              className={`inline-flex items-center justify-center w-20 h-20 ${currentTheme.primary.gradient} ${ui.borderRadius.large} mb-6 ${ui.shadows.medium}`}
            >
              <GraduationCap className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <h1 className={`${ui.typography.sizes.xl} ${ui.typography.weights.bold} ${currentTheme.text.primary} mb-2`}>
              {config.institution.name}
            </h1>

            {/* Subtitle */}
            <p className={`${ui.typography.sizes.sm} ${currentTheme.text.secondary} mb-3`}>
              {config.institution.systemName}
            </p>

            {/* Tagline */}
            <div className={`inline-flex items-center ${ui.typography.sizes.sm} ${ui.typography.weights.medium}`}>
              <span className={`${currentTheme.accent.badge} bg-clip-text text-transparent`}>
                ✨ {config.institution.slogan} ✨
              </span>
            </div>
          </div>

          {/* Back to Graduate Portal Button - add this before the login form */}
          <div className="mb-6">
            <Link href="/student-qr-portal">
              <Button
                variant="outline"
                className={`
                  w-full 
                  ${currentTheme.glass.standard} 
                  ${currentTheme.text.primary} 
                  ${ui.borderRadius.small}
                  border-white/20 
                  ${currentTheme.glass.hover}
                  transition-all duration-300
                  hover:scale-[1.02]
                  h-12
                `}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Graduate Portal
              </Button>
            </Link>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className={`${ui.typography.sizes.sm} ${ui.typography.weights.medium} ${currentTheme.text.primary}`}
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setEmailError("") // Clear error on change
                }}
                placeholder="admin@example.com"
                required
                className={`
                  ${currentTheme.glass.input} 
                  ${currentTheme.text.primary} 
                  ${ui.borderRadius.small}
                  ${emailError ? "border-red-500/50 focus:border-red-500" : "border-white/20 focus:border-purple-400/50"}
                  placeholder:text-white/70
                  ${currentTheme.primary.ring}
                  transition-all duration-300
                  hover:${currentTheme.glass.hover}
                `}
              />
              {emailError && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <span className="text-red-400">⚠</span> {emailError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className={`${ui.typography.sizes.sm} ${ui.typography.weights.medium} ${currentTheme.text.primary}`}
                >
                  Password
                </Label>
                <button
                  type="button"
                  className={`${ui.typography.sizes.sm} ${currentTheme.primary.text} hover:text-purple-300 transition-colors`}
                  onClick={() => alert("Contact administrator")}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordError("") // Clear error on change
                  }}
                  placeholder="••••••••"
                  required
                  className={`
                    ${currentTheme.glass.input} 
                    ${currentTheme.text.primary} 
                    ${ui.borderRadius.small}
                    ${passwordError ? "border-red-500/50 focus:border-red-500" : "border-white/20 focus:border-purple-400/50"}
                    placeholder:text-white/70
                    ${currentTheme.primary.ring}
                    transition-all duration-300
                    hover:${currentTheme.glass.hover}
                    pr-12
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${currentTheme.text.muted} hover:${currentTheme.text.secondary} transition-colors`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <span className="text-red-400">⚠</span> {passwordError}
                </p>
              )}
            </div>

            {/* General Error Message */}
            {generalError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <span className="text-red-400 text-lg">⚠</span>
                  {generalError}
                </p>
              </div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className={`
                w-full 
                ${currentTheme.primary.gradient} 
                ${currentTheme.primary.gradientHover}
                text-white 
                ${ui.typography.weights.semibold}
                ${ui.borderRadius.small}
                ${ui.shadows.medium}
                transition-all duration-300
                hover:${ui.shadows.large}
                hover:scale-[1.02]
                disabled:opacity-50 
                disabled:cursor-not-allowed
                disabled:hover:scale-100
                h-12
              `}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Login
                </div>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className={`${ui.typography.sizes.xs} ${currentTheme.text.muted}`}>
              Secure admin access to graduation management system
            </p>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
