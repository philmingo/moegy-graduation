"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, LogIn, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import config, { currentTheme, ui } from "@/lib/theme-config"
import { AnimatedBackground } from "@/components/animated-background"
import Link from "next/link"

// Mock admin credentials - in a real app, this would be in a database
const ADMIN_EMAIL = "admin@example.com"
const ADMIN_PASSWORD = "password123"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Check if already logged in
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true"
    if (isAuthenticated) {
      router.push("/admin")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // In a real app, this would be an API call to authenticate
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Store auth state in localStorage
        localStorage.setItem("isAuthenticated", "true")

        toast({
          title: "Login successful",
          description: "Welcome back, admin!",
        })

        router.push("/admin")
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password. Try admin@example.com / password123",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Login error",
        description: "An error occurred during login.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className={`
                  ${currentTheme.glass.input} 
                  ${currentTheme.text.primary} 
                  ${ui.borderRadius.small}
                  border-white/20 
                  placeholder:text-white/70
                  ${currentTheme.primary.ring}
                  transition-all duration-300
                  hover:${currentTheme.glass.hover}
                  focus:border-purple-400/50
                `}
              />
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`
                    ${currentTheme.glass.input} 
                    ${currentTheme.text.primary} 
                    ${ui.borderRadius.small}
                    border-white/20 
                    placeholder:text-white/70
                    ${currentTheme.primary.ring}
                    transition-all duration-300
                    hover:${currentTheme.glass.hover}
                    focus:border-purple-400/50
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
            </div>

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
