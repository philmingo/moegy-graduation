"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { GraduationCap, Home, ScanLine, Smartphone, LogOut, QrCode, RefreshCw, BookHeart } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"
import config from "@/lib/theme-config"
import { useIsMobile } from "@/hooks/use-mobile"

interface ConnectedMobileDevice {
  id?: string
  userAgent?: string
  platform?: string
  language?: string
}

interface AppHeaderProps {
  pageType?: "admin" | "scanner"
  // Scanner-specific props
  autoAnnounce?: boolean
  onAutoAnnounceToggle?: () => void
  showAutoAnnounceModal?: boolean
  onConfirmDisableAutoAnnounce?: () => void
  onCancelDisableAutoAnnounce?: () => void
  mobileScannerInfo?: ConnectedMobileDevice | null
  isMobileServerAssumedOffline?: boolean
  onManualReconnect?: () => void
}

export default function AppHeader({
  pageType = "admin",
  autoAnnounce = false,
  onAutoAnnounceToggle,
  showAutoAnnounceModal = false,
  onConfirmDisableAutoAnnounce,
  onCancelDisableAutoAnnounce,
  mobileScannerInfo,
  isMobileServerAssumedOffline = false,
  onManualReconnect,
}: AppHeaderProps) {
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    })
    if (pageType === "scanner") {
      router.push("/login")
    } else {
      window.location.href = "/login"
    }
  }

  const isScanner = pageType === "scanner"

  return (
    <>
      <div
        className={`${config.theme.glass.standard} ${config.theme.text.primary} border-b ${config.theme.primary.border} flex-shrink-0 sticky top-0 z-50`}
      >
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between min-h-0">
            <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
              <Link href="/admin" className="flex items-center gap-2 md:gap-3 group min-w-0 flex-shrink-0">
                <div className="relative">
                  {isScanner && (
                    <div className="absolute inset-0 bg-gold rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  )}
                  <div
                    className={`relative w-8 h-8 md:w-10 md:h-10 ${config.theme.primary.gradient} ${config.ui.borderRadius.small} flex items-center justify-center`}
                  >
                    {isScanner ? (
                      <QrCode className="h-4 w-4 md:h-6 md:w-6 text-white" />
                    ) : (
                      <GraduationCap className="h-4 w-4 md:h-6 md:w-6 text-white" />
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h1
                    className={`${config.ui.typography.sizes.md} md:${config.ui.typography.sizes.lg} ${config.ui.typography.weights.bold} ${config.theme.text.primary} truncate`}
                  >
                    {isScanner ? "QR Scanner" : "Admin Dashboard"}
                  </h1>
                  <p className={`${config.ui.typography.sizes.xs} md:${config.ui.typography.sizes.sm} ${config.theme.text.secondary} truncate`}>
                    {config.institution.name}
                  </p>
                  <p className={`${config.ui.typography.sizes.xs} ${config.theme.text.muted} truncate`}>
                    {config.institution.subHeader}
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 lg:gap-4 flex-shrink-0">
              {/* Scanner-specific controls */}
              {isScanner && (
                <>
                  {/* Auto-Announce Toggle */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-announce"
                      checked={autoAnnounce}
                      onCheckedChange={onAutoAnnounceToggle}
                      className="shadow-lg border-0 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500 data-[state=unchecked]:bg-gray-500/30 [&>span]:bg-white [&>span]:shadow-md"
                    />
                    <Label htmlFor="auto-announce" className={`text-sm ${config.theme.text.primary} font-medium`}>
                      Auto-Announce
                    </Label>
                  </div>

                  {/* Mobile Scanner Status */}
                  <Badge
                    className={`px-2 py-1 text-xs font-medium ${
                      mobileScannerInfo
                        ? "bg-green-500/90 text-white border-green-400/50"
                        : "bg-red-500/90 text-white border-red-400/50"
                    } backdrop-blur-sm border-0 shadow-lg flex-shrink-0 flex items-center gap-1.5 hover:bg-inherit pointer-events-none`}
                  >
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        mobileScannerInfo ? "bg-green-300 shadow-sm shadow-black/30" : "bg-red-300 shadow-sm shadow-black/30"
                      }`}
                    ></div>
                    Status
                  </Badge>

                  {isMobileServerAssumedOffline && (
                    <Button
                      onClick={onManualReconnect}
                      size="sm"
                      className={`${config.theme.glass.standard} ${config.theme.text.primary} ${config.theme.glass.hover}`}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  )}
                </>
              )}

              {/* Navigation buttons */}
              {isScanner ? (
                <Link href="/admin">
                  <Button
                    variant="dashboard"
                    style={{
                      backgroundColor: "#D4AF37",
                      color: "#3A2E5D",
                    }}
                    className="!bg-[#D4AF37] !text-[#3A2E5D] hover:!bg-[#D4AF37] hover:!text-[#3A2E5D] hover:scale-105 hover:shadow-lg transition-all duration-200 ease-in-out"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/student-qr-portal">
                    <Button
                      variant="outline"
                      className={`${config.theme.glass.standard} ${config.theme.text.primary} ${config.theme.glass.hover} border-0`}
                    >
                      <Home className="h-4 w-4 lg:mr-2" />
                      <span className="hidden lg:inline">Graduate Portal</span>
                      <span className="lg:hidden">Portal</span>
                    </Button>
                  </Link>

                  <Link href="/admin/guest-book">
                    <Button
                      variant="outline"
                      className={`${config.theme.glass.standard} ${config.theme.text.primary} ${config.theme.glass.hover} border-0`}
                    >
                      <BookHeart className="h-4 w-4 lg:mr-2" />
                      <span className="hidden lg:inline">Guest Book</span>
                      <span className="lg:hidden">Guest</span>
                    </Button>
                  </Link>

                  <Link href="/scanner">
                    <Button
                      variant="dashboard"
                      style={{
                        backgroundColor: "#D4AF37",
                        color: "#3A2E5D",
                      }}
                      className="!bg-[#D4AF37] !text-[#3A2E5D] hover:!bg-[#D4AF37] hover:!text-[#3A2E5D] hover:scale-105 hover:shadow-lg transition-all duration-200 ease-in-out"
                    >
                      <ScanLine className="h-4 w-4 mr-2" />
                      Scanner
                    </Button>
                  </Link>
                </>
              )}

              <div className="flex items-center gap-2 lg:gap-3 pl-3 lg:pl-4 border-l border-white/20 flex-shrink-0">
                <div className="text-right hidden lg:block">
                  <p className={`text-sm font-medium ${config.theme.text.primary}`}>Admin User</p>
                  <p className={`text-xs ${config.theme.text.secondary}`}>Administrator</p>
                </div>
                <div
                  className={`w-8 h-8 lg:w-10 lg:h-10 ${config.theme.primary.gradient} ${config.ui.borderRadius.large} flex items-center justify-center text-white ${config.ui.typography.weights.bold}`}
                >
                  A
                </div>
              </div>

              <Button
                variant="signout"
                onClick={handleLogout}
                className="!text-white hover:!bg-red-500 hover:!text-white flex-shrink-0"
              >
                <LogOut className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Sign Out</span>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors relative z-50 flex-shrink-0 ${
                isMobileMenuOpen ? "text-white" : config.theme.text.primary
              }`}
            >
              <div className="relative w-6 h-6">
                <span
                  className={`absolute top-1 left-0 w-6 h-0.5 bg-current transition-all duration-300 ${
                    isMobileMenuOpen ? "rotate-45 top-3" : ""
                  }`}
                />
                <span
                  className={`absolute top-3 left-0 w-6 h-0.5 bg-current transition-all duration-300 ${
                    isMobileMenuOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`absolute top-5 left-0 w-6 h-0.5 bg-current transition-all duration-300 ${
                    isMobileMenuOpen ? "-rotate-45 top-3" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Unified Mobile Navigation Slide-in Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] ${config.theme.background} ${config.theme.glass.standard} border-l ${config.theme.primary.border} z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 ${config.theme.primary.gradient} ${config.ui.borderRadius.small} flex items-center justify-center`}
              >
                {isScanner ? (
                  <QrCode className="h-5 w-5 text-white" />
                ) : (
                  <GraduationCap className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <h2
                  className={`${config.ui.typography.sizes.md} ${config.ui.typography.weights.bold} ${config.theme.text.primary}`}
                >
                  {isScanner ? "Scanner Menu" : "Menu"}
                </h2>
                <p className={`${config.ui.typography.sizes.xs} ${config.theme.text.secondary}`}>
                  {config.institution.name}
                </p>
                <p className={`text-[10px] ${config.theme.text.muted}`}>{config.institution.subHeader}</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg
                className={`h-5 w-5 ${config.theme.text.primary}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scanner-specific Mobile Controls */}
          {isScanner && (
            <div className="p-6 border-b border-white/10 space-y-4">
              <h3
                className={`${config.ui.typography.sizes.sm} ${config.ui.typography.weights.semibold} ${config.theme.text.secondary} uppercase tracking-wider`}
              >
                Scanner Controls
              </h3>

              {/* Auto-Announce Toggle */}
              <div className={`${config.theme.glass.light} border ${config.theme.primary.border} rounded-xl p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`${config.ui.typography.sizes.md} ${config.ui.typography.weights.semibold} ${config.theme.text.primary}`}
                    >
                      Auto-Announce
                    </p>
                    <p className={`${config.ui.typography.sizes.xs} ${config.theme.text.secondary}`}>
                      Automatically announce scanned students
                    </p>
                  </div>
                  <Switch
                    id="auto-announce-mobile"
                    checked={autoAnnounce}
                    onCheckedChange={onAutoAnnounceToggle}
                    className="shadow-lg border-0 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500 data-[state=unchecked]:bg-gray-500/30 [&>span]:bg-white [&>span]:shadow-md"
                  />
                </div>
              </div>

              {/* Retry Button - Only show when needed */}
              {isMobileServerAssumedOffline && (
                <Button
                  onClick={onManualReconnect}
                  className={`w-full ${config.theme.primary.gradient} text-white hover:scale-105 transition-transform duration-200 rounded-xl p-4`}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Mobile Connection
                </Button>
              )}
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex-1 p-6">
            <div className="space-y-1">
              <h3
                className={`${config.ui.typography.sizes.sm} ${config.ui.typography.weights.semibold} ${config.theme.text.secondary} uppercase tracking-wider mb-3`}
              >
                Navigation
              </h3>

              {isScanner ? (
                // Scanner Navigation
                <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                  <div
                    className={`${config.theme.glass.light} ${config.theme.glass.hover} border ${config.theme.primary.border} rounded-xl p-4 transition-all duration-200 group mb-2`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <Home className="h-5 w-5 text-purple-900" />
                      </div>
                      <div>
                        <p
                          className={`${config.ui.typography.sizes.md} ${config.ui.typography.weights.semibold} ${config.theme.text.primary}`}
                        >
                          Admin Dashboard
                        </p>
                        <p className={`${config.ui.typography.sizes.xs} ${config.theme.text.secondary}`}>
                          Manage students & data
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                // Admin Navigation
                <>
                  <Link href="/student-qr-portal" onClick={() => setIsMobileMenuOpen(false)}>
                    <div
                      className={`${config.theme.glass.light} ${config.theme.glass.hover} border ${config.theme.primary.border} rounded-xl p-4 transition-all duration-200 group mb-2`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 ${config.theme.primary.gradient} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                        >
                          <Home className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p
                            className={`${config.ui.typography.sizes.md} ${config.ui.typography.weights.semibold} ${config.theme.text.primary}`}
                          >
                            Graduate Portal
                          </p>
                          <p className={`${config.ui.typography.sizes.xs} ${config.theme.text.secondary}`}>
                            Student QR codes
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link href="/admin/guest-book" onClick={() => setIsMobileMenuOpen(false)}>
                    <div
                      className={`${config.theme.glass.light} ${config.theme.glass.hover} border ${config.theme.primary.border} rounded-xl p-4 transition-all duration-200 group mb-2`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 ${config.theme.primary.gradient} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                        >
                          <BookHeart className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p
                            className={`${config.ui.typography.sizes.md} ${config.ui.typography.weights.semibold} ${config.theme.text.primary}`}
                          >
                            Guest Book
                          </p>
                          <p className={`${config.ui.typography.sizes.xs} ${config.theme.text.secondary}`}>
                            Graduate messages
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link href="/scanner" onClick={() => setIsMobileMenuOpen(false)}>
                    <div
                      className={`${config.theme.glass.light} ${config.theme.glass.hover} border ${config.theme.primary.border} rounded-xl p-4 transition-all duration-200 group mb-2`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <ScanLine className="h-5 w-5 text-purple-900" />
                        </div>
                        <div>
                          <p
                            className={`${config.ui.typography.sizes.md} ${config.ui.typography.weights.semibold} ${config.theme.text.primary}`}
                          >
                            Scanner
                          </p>
                          <p className={`${config.ui.typography.sizes.xs} ${config.theme.text.secondary}`}>
                            QR code scanner
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </>
              )}

              {isMobile && !isScanner && (
                <Link href="/mobile-scan" onClick={() => setIsMobileMenuOpen(false)}>
                  <div
                    className={`${config.theme.glass.light} ${config.theme.glass.hover} border ${config.theme.primary.border} rounded-xl p-4 transition-all duration-200 group mb-2`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 ${config.theme.primary.gradient} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                      >
                        <Smartphone className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p
                          className={`${config.ui.typography.sizes.md} ${config.ui.typography.weights.semibold} ${config.theme.text.primary}`}
                        >
                          Mobile Scanner
                        </p>
                        <p className={`${config.ui.typography.sizes.xs} ${config.theme.text.secondary}`}>
                          Use phone as scanner
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Information Section - Non-clickable */}
          <div className="p-6 border-t border-white/10">
            <h3
              className={`${config.ui.typography.sizes.sm} ${config.ui.typography.weights.semibold} ${config.theme.text.secondary} uppercase tracking-wider mb-4`}
            >
              Information
            </h3>
            
            <div className="space-y-3">
              {/* User Profile Info - Non-clickable */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <div
                  className={`w-10 h-10 ${config.theme.primary.gradient} ${config.ui.borderRadius.large} flex items-center justify-center text-white ${config.ui.typography.weights.bold}`}
                >
                  A
                </div>
                <div>
                  <p className={`${config.ui.typography.sizes.sm} ${config.ui.typography.weights.medium} ${config.theme.text.primary}`}>
                    Admin User
                  </p>
                  <p className={`${config.ui.typography.sizes.xs} ${config.theme.text.secondary}`}>
                    Administrator
                  </p>
                </div>
              </div>

              {/* Mobile Scanner Status - Scanner page only */}
              {isScanner && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div>
                    <p className={`${config.ui.typography.sizes.sm} ${config.ui.typography.weights.medium} ${config.theme.text.primary}`}>
                      Mobile Scanner
                    </p>
                    <p className={`${config.ui.typography.sizes.xs} ${config.theme.text.secondary}`}>
                      Connection status
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        mobileScannerInfo ? "bg-green-400" : "bg-red-400"
                      }`}
                    ></div>
                    <span className={`text-xs ${config.theme.text.secondary}`}>
                      {mobileScannerInfo ? "Connected" : "Offline"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Section - Sign Out */}
          <div className="p-6 border-t border-white/10">
            <button
              onClick={handleLogout}
              className={`w-full ${config.theme.glass.light} hover:bg-red-500/20 border border-red-500/30 rounded-xl p-4 transition-all duration-200 group`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <LogOut className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className={`${config.ui.typography.sizes.md} ${config.ui.typography.weights.semibold} text-red-300`}>
                    Sign Out
                  </p>
                  <p className={`${config.ui.typography.sizes.xs} text-red-400`}>
                    End your session
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Announce Confirmation Modal - Scanner only */}
      {isScanner && (
        <Dialog open={showAutoAnnounceModal} onOpenChange={onCancelDisableAutoAnnounce}>
          <DialogContent
            className={`${config.theme.modal.background} ${config.theme.modal.border} ${config.ui.borderRadius.medium}`}
          >
            <DialogHeader>
              <DialogTitle
                className={`${config.ui.typography.sizes.xl} ${config.ui.typography.weights.bold} ${config.theme.text.gradient.primary}`}
              >
                Disable Auto-Announce?
              </DialogTitle>
              <DialogDescription className={`${config.theme.text.secondary}`}>
                Auto-announce is currently active. Turning this off will prevent automatic announcements for scanned or
                searched students. Are you sure you want to disable it?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={onCancelDisableAutoAnnounce}
                className={`${config.theme.glass.standard} ${config.theme.text.primary} ${config.theme.glass.hover}`}
              >
                Cancel
              </Button>
              <Button
                onClick={onConfirmDisableAutoAnnounce}
                className={`${config.theme.primary.gradient} ${config.theme.primary.gradientHover} text-white`}
              >
                Disable Auto-Announce
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
