"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogIn, Smartphone, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import config, { currentTheme, ui } from "@/lib/theme-config"
import { AnimatedBackground } from "@/components/animated-background"
import { signInMobileScanner } from "@/lib/actions/auth"

interface MobileLoginProps {
  onLoginSuccess: () => void
}

export default function MobileLogin({ onLoginSuccess }: MobileLoginProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signInMobileScanner(email, password)

      if (result.success) {
        toast({
          title: "Access Granted",
          description: "Welcome to Mobile Scanner!",
          className: "bg-green-500 text-white",
        })
        onLoginSuccess()
      } else {
        toast({
          title: "Access Denied",
          description: result.error || "Incorrect password. Please try again.",
          variant: "destructive",
        })
        setPassword("")
      }
    } catch (error) {
      console.error("Mobile login error:", error)
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      setPassword("")
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
              <Smartphone className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <h1 className={`${ui.typography.sizes.xl} ${ui.typography.weights.bold} ${currentTheme.text.primary} mb-2`}>
              {config.institution.name}
            </h1>

            {/* Subtitle */}
            <p className={`${ui.typography.sizes.sm} ${currentTheme.text.secondary} mb-3`}>Mobile Scanner</p>

            {/* Tagline */}
            <div className={`inline-flex items-center ${ui.typography.sizes.sm} ${ui.typography.weights.medium}`}>
              <span className={`${currentTheme.accent.badge} bg-clip-text text-transparent`}>✨ Secure Access ✨</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
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
                placeholder="your.email@example.com"
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
              <Label
                htmlFor="password"
                className={`${ui.typography.sizes.sm} ${ui.typography.weights.medium} ${currentTheme.text.primary}`}
              >
                Password
              </Label>
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
                  Verifying...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Unlock Scanner
                </div>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className={`${ui.typography.sizes.xs} ${currentTheme.text.muted}`}>
              Secure mobile access to graduation announcer system
            </p>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
