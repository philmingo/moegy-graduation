"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Search, QrCode, Users, Star, GraduationCap, X, ChevronDown, User, LayoutDashboard } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import config from "@/lib/theme-config"
import { getStudents, type Student } from "@/lib/actions/students"
import { useToast } from "@/components/ui/use-toast"
import { QRCard } from "@/components/qr-card"
import { downloadQRCardAsImage, copyQRCardAsImage } from "@/lib/utils/image-utils"
import { useIsMobile } from "@/hooks/use-mobile"
import React from "react"
import Link from "next/link"
import { createPortal } from "react-dom"

// Pre-load QRCode library to avoid dynamic import lag
let QRCodeLib: any = null
const loadQRCode = async () => {
  if (!QRCodeLib) {
    QRCodeLib = (await import("qrcode")).default
  }
  return QRCodeLib
}

// PERFORMANCE SETTINGS
const INITIAL_DISPLAY_LIMIT = 20 // Show first 20 results immediately
const LOAD_MORE_INCREMENT = 20 // Load 20 more when "Load More" is clicked
const MAX_TOTAL_DISPLAY = 100 // Maximum total results to show

// Memoized Student Card Component
const StudentCard = React.memo(
  ({
    student,
    index,
    onViewQR,
    isMobile,
  }: {
    student: Student
    index: number
    onViewQR: (student: Student) => void
    isMobile: boolean
  }) => {
    const handleViewQR = useCallback(() => {
      onViewQR(student)
    }, [student, onViewQR])

    const getInitials = useCallback((student: Student) => {
      return `${student.first_name.charAt(0)}${student.last_name.charAt(0)}`.toUpperCase()
    }, [])

    return (
      <div className="group relative">
        <div
          className={`absolute -inset-0.5 ${config.theme.primary.gradient} ${config.ui.borderRadius.medium} blur opacity-20 group-hover:opacity-40 transition ${config.animations.durations.transitions.slow}`}
        />
        <div
          className={cn(
            `relative ${config.theme.glass.standard} ${config.ui.borderRadius.medium} overflow-hidden transition-all ${config.animations.durations.transitions.medium}`,
            // Use theme's responsive min-height instead of hardcoded values
            config.theme.layout.graduationList.card.minHeight,
            "hover:scale-105 hover:-translate-y-2",
            config.theme.hover.card.shadow,
            config.theme.hover.card.glow,
            config.theme.hover.card.background,
            config.theme.hover.card.border,
          )}
        >
          <div className={`relative ${isMobile ? "p-3" : "p-4"} h-full flex flex-col`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full" />

            <div className={`flex items-center ${isMobile ? "gap-3 mb-3" : "gap-4 mb-4"}`}>
              <div
                className={cn(
                  `${isMobile ? "w-10 h-10" : "w-12 h-12"} ${config.ui.borderRadius.small} flex items-center justify-center ${config.theme.text.primary} ${config.ui.typography.weights.bold} ${isMobile ? "text-sm" : config.ui.typography.sizes.md} ${config.ui.shadows.large}`,
                  config.avatarGradients[index % config.avatarGradients.length],
                )}
              >
                {getInitials(student)}
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className={`${isMobile ? "text-base" : config.ui.typography.sizes.lg} ${config.ui.typography.weights.bold} ${config.theme.text.primary} group-hover:text-purple-200 transition-colors truncate`}
                >
                  {student.first_name} {student.last_name}
                </h3>
                {student.seat_no && (
                  <p className={`text-white ${isMobile ? "text-xs" : "text-sm"} opacity-80`}>Seat: {student.seat_no}</p>
                )}
              </div>
            </div>

            {/* Academic Info Cards - More compact */}
            <div className={`flex flex-wrap gap-1.5 ${isMobile ? "mb-3" : "mb-4"}`}>
              {student.university && (
                <div className="bg-purple-500/30 backdrop-blur-sm border border-purple-400/40 rounded-md px-2 py-1 text-xs">
                  <span className="text-purple-200 font-medium">University: </span>
                  <span className="text-white break-words">{student.university}</span>
                </div>
              )}

              {student.programme && (
                <div className="bg-blue-500/30 backdrop-blur-sm border border-blue-400/40 rounded-md px-2 py-1 text-xs">
                  <span className="text-blue-200 font-medium">Programme: </span>
                  <span className="text-white break-words">{student.programme}</span>
                </div>
              )}

              {student.classification && (
                <div className="bg-emerald-500/30 backdrop-blur-sm border border-emerald-400/40 rounded-md px-2 py-1 text-xs">
                  <span className="text-emerald-200 font-medium">Grade: </span>
                  <span className="text-white break-words">{student.classification}</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleViewQR}
              className={`w-full mt-auto ${config.theme.primary.gradient} ${config.theme.primary.gradientHover} ${config.theme.text.primary} ${config.ui.borderRadius.small} ${isMobile ? "py-2.5 text-sm" : "py-3 text-base"} ${config.ui.typography.weights.semibold} transition-all ${config.animations.durations.transitions.fast} ${config.ui.shadows.small} hover:${config.ui.shadows.large} hover:${config.ui.shadows.colored} transform hover:scale-105 active:scale-95`}
            >
              <QrCode className={`${isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} mr-2`} />
              {config.content.buttons.viewQR}
            </Button>
          </div>
        </div>
      </div>
    )
  },
)

StudentCard.displayName = "StudentCard"

export default function StudentQRSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT)
  const [selectedStudent, setSelectedStudent] = useState<null | Student>(null)
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const { toast } = useToast()
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const qrCardRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const modalContainerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  // Window dimensions for proper scaling
  const [windowWidth, setWindowWidth] = useState(0)
  const [windowHeight, setWindowHeight] = useState(0)

  // Update window dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      setWindowHeight(window.innerHeight)
    }

    // Set initial dimensions
    setWindowWidth(window.innerWidth)
    setWindowHeight(window.innerHeight)

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Calculate scale factor for QR card based on viewport size
  const getQRCardScale = useCallback(() => {
    const isSmallScreen = windowWidth < 640
    const cardWidth = isSmallScreen ? windowWidth * 0.9 : 400 // Approximate card width
    const cardHeight = isSmallScreen ? 550 : 650 // Approximate card height

    // Calculate scale factors
    const scaleX = (windowWidth - 40) / cardWidth // 20px padding on each side
    const scaleY = (windowHeight - 40) / cardHeight // 20px padding on each side

    // Use the smaller scale factor to ensure card fits in viewport
    const scale = Math.min(scaleX, scaleY, 1) // Don't scale up, only down if needed

    return scale
  }, [windowWidth, windowHeight])

  // Check admin login status
  useEffect(() => {
    const checkAuthStatus = () => {
      const isAuthenticated = localStorage.getItem("isAuthenticated") === "true"
      setIsAdminLoggedIn(isAuthenticated)
    }

    checkAuthStatus()

    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener("storage", checkAuthStatus)

    return () => {
      window.removeEventListener("storage", checkAuthStatus)
    }
  }, [])

  // Pre-load QRCode library on component mount
  useEffect(() => {
    loadQRCode().catch(console.error)
  }, [])

  // Load students from database
  useEffect(() => {
    loadStudents()
  }, [])

  // Reset display limit when search query changes
  useEffect(() => {
    setDisplayLimit(INITIAL_DISPLAY_LIMIT)
  }, [searchQuery])

  const loadStudents = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getStudents()

      // Sort students alphabetically by full name
      const sortedStudents = data.sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase()
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase()
        return nameA.localeCompare(nameB)
      })

      setStudents(sortedStudents)
    } catch (error) {
      toast({
        title: "Error Loading Students",
        description: error instanceof Error ? error.message : "Failed to load students from database",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // OPTIMIZED: Simple immediate search
  const allFilteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      return []
    }

    const filtered = students.filter((student) => {
      const firstNameLower = student.first_name.toLowerCase()
      const lastNameLower = student.last_name.toLowerCase()
      const fullNameLower = `${firstNameLower} ${lastNameLower}`

      return (
        firstNameLower.includes(query) ||
        lastNameLower.includes(query) ||
        fullNameLower.includes(query) ||
        (student.programme && student.programme.toLowerCase().includes(query)) ||
        (student.university && student.university.toLowerCase().includes(query))
      )
    })

    return filtered.sort((a, b) => {
      const aFirstNameLower = a.first_name.toLowerCase()
      const bFirstNameLower = b.first_name.toLowerCase()
      const aLastNameLower = a.last_name.toLowerCase()
      const bLastNameLower = b.last_name.toLowerCase()

      const aFirstNameStartsWith = aFirstNameLower.startsWith(query)
      const bFirstNameStartsWith = bFirstNameLower.startsWith(query)

      if (aFirstNameStartsWith && !bFirstNameStartsWith) return -1
      if (!aFirstNameStartsWith && bFirstNameStartsWith) return 1

      const aLastNameStartsWith = aLastNameLower.startsWith(query)
      const bLastNameStartsWith = bLastNameLower.startsWith(query)

      if (aLastNameStartsWith && !bLastNameStartsWith) return -1
      if (!aLastNameStartsWith && bLastNameStartsWith) return 1

      return aFirstNameLower.localeCompare(bFirstNameLower)
    })
  }, [students, searchQuery])

  const displayedStudents = useMemo(() => {
    return allFilteredStudents.slice(0, displayLimit)
  }, [allFilteredStudents, displayLimit])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setSearchQuery(newValue)
    },
    [searchQuery],
  )

  const handleLoadMore = useCallback(() => {
    const newLimit = Math.min(displayLimit + LOAD_MORE_INCREMENT, MAX_TOTAL_DISPLAY, allFilteredStudents.length)
    setDisplayLimit(newLimit)
  }, [displayLimit, allFilteredStudents.length])

  const generateQRCode = useCallback(
    async (student: Student) => {
      try {
        setIsGeneratingQR(true)

        const QRCode = await loadQRCode()

        const qrData = {
          id: student.id,
          n: `${student.first_name} ${student.last_name}`,
        }

        const canvas = canvasRef.current || document.createElement("canvas")

        await new Promise<void>((resolve) => {
          requestAnimationFrame(async () => {
            try {
              await QRCode.toCanvas(canvas, JSON.stringify(qrData), {
                width: 260,
                margin: 0,
                color: {
                  dark: config.theme.qrCard.qrFgColor,
                  light: config.theme.qrCard.qrBgColor,
                },
                errorCorrectionLevel: "M",
              })

              const qrDataUrl = canvas.toDataURL("image/png", 1.0)
              setQrCodeDataUrl(qrDataUrl)

              resolve()
            } catch (error) {
              console.error("Error generating QR code:", error)
              resolve()
            }
          })
        })
      } catch (error) {
        console.error("Error generating QR code:", error)
        toast({
          title: "Error",
          description: "Failed to generate QR code",
          variant: "destructive",
        })
      } finally {
        setIsGeneratingQR(false)
      }
    },
    [toast],
  )

  const handleViewQR = useCallback(
    async (student: Student) => {
      setSelectedStudent(student)
      setIsQRModalOpen(true)
      setQrCodeDataUrl("")

      await generateQRCode(student)
    },
    [generateQRCode],
  )

  // Updated copy handler using html-to-image with proper capture preparation
  const handleCopyQR = useCallback(async () => {
    try {
      if (qrCardRef.current && selectedStudent) {
        // Temporarily hide buttons and close button by setting flags
        const originalStudent = selectedStudent
        setSelectedStudent({ ...selectedStudent, _hideButtons: true, _hideCloseButton: true })

        // Wait for re-render
        await new Promise((resolve) => setTimeout(resolve, 100))

        await copyQRCardAsImage(qrCardRef.current)

        setIsCopied(true)
        setTimeout(() => setIsCopied(false), config.animations.durations.feedback.copied)

        toast({
          title: "QR Card Copied",
          description: "The complete QR card has been copied to your clipboard",
        })

        // Restore original student
        setSelectedStudent(originalStudent)
      }
    } catch (error) {
      console.error("Error copying QR card:", error)
      toast({
        title: "Copy Failed",
        description: "Failed to copy QR card to clipboard",
        variant: "destructive",
      })
    }
  }, [selectedStudent, toast])

  // Updated download handler using html-to-image with proper capture preparation
  const handleDownloadQR = useCallback(async () => {
    try {
      if (qrCardRef.current && selectedStudent) {
        // Temporarily hide buttons and close button by setting flags
        const originalStudent = selectedStudent
        setSelectedStudent({ ...selectedStudent, _hideButtons: true, _hideCloseButton: true })

        // Wait for re-render
        await new Promise((resolve) => setTimeout(resolve, 100))

        const fileName = `${selectedStudent.first_name}_${selectedStudent.last_name}_qr_card.png`
        await downloadQRCardAsImage(qrCardRef.current, fileName)

        toast({
          title: "QR Card Downloaded",
          description: "The complete QR card has been downloaded to your device",
        })

        // Restore original student
        setSelectedStudent(originalStudent)
      }
    } catch (error) {
      console.error("Error downloading QR card:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download QR card",
        variant: "destructive",
      })
    }
  }, [selectedStudent, toast])

  const clearSearch = useCallback(() => {
    setSearchQuery("")
  }, [searchQuery])

  if (isLoading) {
    return (
      <div className={`min-h-screen ${config.theme.background} flex items-center justify-center`}>
        <div className="text-center">
          <div
            className={`w-16 h-16 ${config.theme.primary.gradient} ${config.ui.borderRadius.large} flex items-center justify-center mx-auto mb-4`}
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <p className={`${config.theme.text.secondary} ${config.ui.typography.sizes.lg}`}>Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${config.theme.background} relative overflow-hidden`}>
      {/* Hidden canvas for QR generation */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        {config.animationGradients.orbs.map((gradient, index) => (
          <div
            key={`orb-${index}`}
            className={`absolute ${
              index === 0
                ? "top-20 left-10 w-72 h-72"
                : index === 1
                  ? "top-40 right-20 w-96 h-96"
                  : "bottom-20 left-1/4 w-80 h-80"
            } ${gradient} ${config.ui.borderRadius.large} ${config.ui.blur.large} animate-pulse ${
              index > 0 ? `delay-${index}000` : ""
            }`}
          />
        ))}

        {/* Large Rotating Squares */}
        {[
          { pos: "top-16 right-1/3", size: "w-12 h-12", gradient: 0, duration: 0 },
          { pos: "top-1/3 left-16", size: "w-10 h-10", gradient: 1, duration: 1 },
          { pos: "bottom-1/4 right-20", size: "w-14 h-14", gradient: 2, duration: 2 },
        ].map((square, index) => (
          <div
            key={`large-square-${index}`}
            className={`absolute ${square.pos} ${square.size} ${config.animationGradients.squares[square.gradient]} rotate-45 opacity-60`}
            style={{ animation: `spin ${config.animations.durations.squares.large[index]} linear infinite` }}
          />
        ))}

        {/* Medium Squares */}
        {[
          { pos: "top-1/2 right-1/4", size: "w-6 h-6", gradient: 3 },
          { pos: "bottom-1/3 left-1/3", size: "w-5 h-5", gradient: 4 },
          { pos: "top-1/4 left-1/2", size: "w-8 h-8", gradient: 5 },
        ].map((square, index) => (
          <div
            key={`medium-square-${index}`}
            className={`absolute ${square.pos} ${square.size} ${config.animationGradients.squares[square.gradient]} rotate-45 opacity-70`}
            style={{ animation: `spin ${config.animations.durations.squares.medium[index]} linear infinite` }}
          />
        ))}

        {/* Small Squares */}
        {[
          { pos: "top-20 left-1/4", size: "w-4 h-4", gradient: 6 },
          { pos: "bottom-1/2 right-1/3", size: "w-3 h-3", gradient: 7 },
          { pos: "top-2/3 left-20", size: "w-4 h-4", gradient: 8 },
          { pos: "bottom-20 right-1/2", size: "w-3 h-3", gradient: 9 },
          { pos: "top-40 right-10", size: "w-5 h-5", gradient: 10 },
        ].map((square, index) => (
          <div
            key={`small-square-${index}`}
            className={`absolute ${square.pos} ${square.size} ${config.animationGradients.squares[square.gradient]} rotate-45 opacity-80`}
            style={{ animation: `spin ${config.animations.durations.squares.small[index]} linear infinite` }}
          />
        ))}

        {/* Extra Small Squares */}
        {[
          { pos: "top-32 left-1/3", size: "w-2 h-2", gradient: 0 },
          { pos: "bottom-40 left-10", size: "w-2 h-2", gradient: 6 },
          { pos: "top-1/2 left-1/4", size: "w-1.5 h-1.5", gradient: 1 },
          { pos: "bottom-1/4 left-1/2", size: "w-1.5 h-1.5", gradient: 10 },
          { pos: "top-3/4 right-1/4", size: "w-3 h-3", gradient: 8 },
        ].map((square, index) => (
          <div
            key={`xs-square-${index}`}
            className={`absolute ${square.pos} ${square.size} ${config.animationGradients.squares[square.gradient]} rotate-45 opacity-95`}
            style={{ animation: `spin ${config.animations.durations.squares.extraSmall[index]} linear infinite` }}
          />
        ))}

        {/* Bouncing Squares */}
        {[
          { pos: "top-1/3 right-1/4", size: "w-5 h-5", gradient: 9 },
          { pos: "bottom-2/3 left-2/3", size: "w-4 h-4", gradient: 0 },
        ].map((square, index) => (
          <div
            key={`bounce-square-${index}`}
            className={`absolute ${square.pos} ${square.size} ${config.animationGradients.squares[square.gradient]} rotate-45 opacity-70`}
            style={{
              animation: `bounce 2s infinite, spin ${config.animations.durations.squares.bouncing[index]} linear infinite`,
            }}
          />
        ))}

        {/* Animated Circles */}
        {[
          { pos: "top-24 right-24", size: "w-8 h-8" },
          { pos: "bottom-32 left-40", size: "w-6 h-6" },
          { pos: "top-40 right-96", size: "w-10 h-10" },
          { pos: "bottom-36 right-60", size: "w-5 h-5" },
          { pos: "top-96 left-20", size: "w-7 h-7" },
          { pos: "top-1/2 right-36", size: "w-4 h-4" },
          { pos: "bottom-40 left-60", size: "w-6 h-6" },
        ].map((circle, index) => (
          <div
            key={`circle-${index}`}
            className={`absolute ${circle.pos} ${circle.size} ${config.animationGradients.circles[index]} ${config.ui.borderRadius.large} opacity-60`}
            style={{ animation: `circlebounce ${config.animations.durations.circles[index]} ease-in-out infinite` }}
          />
        ))}

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot%3E%3Cg fill=&quot;none&quot; fillRule=&quot;evenodd&quot%3E%3Cg fill=&quot;%239C92AC&quot fillOpacity=&quot;0.05&quot%3E%3Ccircle cx=&quot;30&quot cy=&quot;30&quot r=&quot;1&quot/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
      </div>

      <div className="relative z-10">
        {/* Responsive Header - Hidden when searching */}
        <div
          className={cn(
            `container mx-auto ${isMobile ? "px-4 py-8" : config.ui.spacing.padding.page} ${config.ui.spacing.container.max}`,
            searchQuery
              ? "transform -translate-y-32 scale-90 opacity-0 h-0 overflow-hidden"
              : "transform translate-y-0 scale-100 opacity-100",
            "transition-all duration-500 ease-in-out",
          )}
        >
          <div
            className={cn(
              // Match the search bar width exactly
              `${
                searchQuery ? (isMobile ? "max-w-full" : "max-w-6xl") : isMobile ? "max-w-full" : "max-w-3xl"
              } mx-auto text-center ${isMobile ? "mb-8" : "mb-16"}`,
            )}
          >
            <div className="inline-flex items-center justify-center mb-6">
              <div className="relative">
                <div
                  className={`${isMobile ? "w-16 h-16" : "w-20 h-20"} ${config.theme.primary.gradient} ${config.ui.borderRadius.medium} flex items-center justify-center ${config.ui.shadows.large} ${config.ui.shadows.colored}`}
                >
                  <QrCode className={`${isMobile ? "h-8 w-8" : "h-12 w-12"} ${config.theme.text.primary}`} />
                </div>
                <div
                  className={`absolute -top-2 -right-2 ${isMobile ? "w-6 h-6" : "w-8 h-8"} ${config.theme.accent.badge} ${config.ui.borderRadius.large} flex items-center justify-center`}
                >
                  <GraduationCap className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-white`} />
                </div>
              </div>
            </div>

            <h1
              className={`${isMobile ? "text-4xl sm:text-5xl" : "text-6xl md:text-7xl lg:text-8xl"} ${config.ui.typography.weights.black} ${config.theme.text.gradient.primary} mb-2 leading-tight`}
            >
              {config.content.title}
            </h1>

            <h2
              className={`${isMobile ? "text-3xl sm:text-4xl" : "text-5xl md:text-6xl lg:text-7xl"} ${config.ui.typography.weights.black} ${config.theme.text.gradient.secondary} mb-6 leading-tight`}
            >
              {config.content.subtitle}
            </h2>

            <div
              className={`${isMobile ? "text-lg sm:text-xl" : "text-2xl md:text-3xl lg:text-4xl"} ${config.theme.text.secondary} leading-relaxed space-y-1`}
            >
              <p>Search for your name below to find</p>
              <p>your personalized QR code. You can copy</p>
              <p>or download it for scanning at graduation.</p>
            </div>
          </div>
        </div>

        {/* Responsive Admin/Dashboard Button */}
        <div className={`${isMobile ? "fixed top-4 right-4" : "absolute top-6 right-6"} z-20`}>
          {isAdminLoggedIn ? (
            <Link href="/admin">
              <Button
                className={`${config.theme.primary.gradient} ${config.theme.primary.gradientHover} text-white ${isMobile ? "px-4 py-2 text-sm" : "px-6 py-2"} ${config.ui.borderRadius.small} ${config.ui.shadows.medium} hover:${config.ui.shadows.large} transition-all duration-300`}
              >
                <LayoutDashboard className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} mr-2`} />
                {isMobile ? "Dashboard" : "Admin Dashboard"}
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button
                className={`${config.theme.primary.gradient} ${config.theme.primary.gradientHover} text-white ${isMobile ? "px-4 py-2 text-sm" : "px-6 py-2"} ${config.ui.borderRadius.small} ${config.ui.shadows.medium} hover:${config.ui.shadows.large} transition-all duration-300`}
              >
                <User className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} mr-2`} />
                {isMobile ? "Login" : "Admin Login"}
              </Button>
            </Link>
          )}
        </div>

        {/* Enhanced Search Section */}
        <div
          ref={searchContainerRef}
          className={`container mx-auto ${isMobile ? "px-4" : "px-4"} ${config.ui.spacing.container.max}`}
        >
          <div
            className={cn(
              // Narrower when empty, wider when searching
              `${
                searchQuery ? (isMobile ? "max-w-full" : "max-w-6xl") : isMobile ? "max-w-full" : "max-w-3xl"
              } mx-auto ${isMobile ? "mb-8" : "mb-16"}`,
              searchQuery ? `${isMobile ? "pt-4" : "pt-8"} transform translate-y-0` : "transform translate-y-0",
              "transition-all duration-500 ease-in-out",
            )}
          >
            <div className="relative group">
              <div
                className={`absolute -inset-1 ${config.theme.primary.gradient} ${config.ui.borderRadius.medium} blur opacity-25 group-hover:opacity-40 transition ${config.animations.durations.transitions.slow}`}
              />
              <div
                className={`relative ${config.theme.glass.standard} ${config.ui.borderRadius.medium} ${isMobile ? "p-4" : "p-8"}`}
              >
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 left-0 ${isMobile ? "pl-3" : "pl-4"} flex items-center pointer-events-none`}
                  >
                    <Search className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} ${config.theme.text.muted}`} />
                  </div>
                  <Input
                    type="text"
                    placeholder={config.content.searchPlaceholder}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className={`${isMobile ? "pl-10 pr-10 py-5 text-lg" : "pl-12 pr-12 py-6 text-xl"} ${config.ui.borderRadius.small} border-0 ${config.theme.glass.input} ${config.theme.text.primary} placeholder:${config.theme.text.secondary} ${config.theme.primary.ring} focus-visible:ring-2 focus-visible:ring-offset-0 transition-all`}
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className={`absolute inset-y-0 right-0 ${isMobile ? "pr-3" : "pr-4"} flex items-center ${config.theme.text.muted} hover:${config.theme.text.primary} transition-colors`}
                    >
                      <X className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
                    </button>
                  )}
                </div>

                {/* Show results count */}
                {searchQuery && (
                  <div
                    className={`flex items-center justify-between ${isMobile ? "mt-3 pt-3" : "mt-4 pt-4"} border-t border-white/20`}
                  >
                    <div className={`flex items-center ${config.ui.spacing.gap.small} text-white`}>
                      <Users className={`${isMobile ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
                      <span className={isMobile ? "text-sm" : "text-base"}>
                        {allFilteredStudents.length === 0
                          ? "No matches found"
                          : `Showing ${displayedStudents.length} of ${allFilteredStudents.length} student${
                              allFilteredStudents.length !== 1 ? "s" : ""
                            }`}
                      </span>
                    </div>
                    {allFilteredStudents.length > 0 && (
                      <Badge
                        className={`${config.theme.primary.gradient} ${config.theme.text.primary} border-0 ${isMobile ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"}`}
                      >
                        <Star className={`${isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} mr-1`} />
                        {allFilteredStudents.length} total
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* No Results */}
          {searchQuery && allFilteredStudents.length === 0 && (
            <div className={`text-center ${isMobile ? "py-12" : "py-20"}`}>
              <div className={`relative ${isMobile ? "max-w-sm" : "max-w-2xl"} mx-auto`}>
                <div
                  className={`absolute inset-0 ${config.theme.status.warning.gradient}/20 ${config.ui.borderRadius.medium} ${config.ui.blur.medium}`}
                />
                <div
                  className={`relative ${config.theme.glass.light} ${config.ui.borderRadius.medium} ${isMobile ? "p-6" : "p-12"}`}
                >
                  <div
                    className={`${isMobile ? "w-16 h-16" : "w-24 h-24"} ${config.theme.status.warning.gradient} ${config.ui.borderRadius.large} flex items-center justify-center mx-auto mb-6`}
                  >
                    <Search className={`${isMobile ? "h-8 w-8" : "h-12 w-12"} ${config.theme.text.primary}`} />
                  </div>
                  <h3
                    className={`${isMobile ? config.ui.typography.sizes.lg : config.ui.typography.sizes["2xl"]} ${config.ui.typography.weights.bold} ${config.theme.text.primary} mb-4`}
                  >
                    {config.content.noResults.title}
                  </h3>
                  <p
                    className={`${config.theme.text.secondary} mb-4 ${isMobile ? config.ui.typography.sizes.sm : config.ui.typography.sizes.lg}`}
                  >
                    {config.content.noResults.message}{" "}
                    <span className={`${config.theme.primary.text} ${config.ui.typography.weights.semibold}`}>
                      "{searchQuery}"
                    </span>
                  </p>
                  <p className={`text-white ${isMobile ? config.ui.typography.sizes.sm : ""}`}>
                    {config.content.noResults.suggestion}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Results Grid */}
          {searchQuery && displayedStudents.length > 0 && (
            <div className="animate-fadeIn">
              <div
                className={`${isMobile ? "grid grid-cols-1 gap-4" : config.ui.grid.responsive} ${isMobile ? "gap-4" : config.ui.spacing.gap.large}`}
              >
                {displayedStudents.map((student, index) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    index={index}
                    onViewQR={handleViewQR}
                    isMobile={isMobile}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {displayedStudents.length < allFilteredStudents.length &&
                displayedStudents.length < MAX_TOTAL_DISPLAY && (
                  <div className={`text-center ${isMobile ? "mt-8" : "mt-12"}`}>
                    <Button
                      onClick={handleLoadMore}
                      className={`${config.theme.primary.gradient} ${config.theme.primary.gradientHover} text-white ${isMobile ? "px-6 py-3" : "px-8 py-4"} rounded-xl shadow-lg hover:shadow-xl transition-all duration-300`}
                    >
                      <ChevronDown className={`mr-2 ${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
                      Load More ({Math.min(LOAD_MORE_INCREMENT, allFilteredStudents.length - displayedStudents.length)}{" "}
                      more)
                    </Button>
                    <p className={`text-white/70 mt-4 ${isMobile ? "text-xs" : "text-sm"}`}>
                      Showing {displayedStudents.length} of {allFilteredStudents.length} results
                    </p>
                  </div>
                )}

              {/* Max Results Warning */}
              {displayedStudents.length >= MAX_TOTAL_DISPLAY && allFilteredStudents.length > MAX_TOTAL_DISPLAY && (
                <div className={`text-center ${isMobile ? "mt-8" : "mt-12"}`}>
                  <div
                    className={`bg-yellow-500/20 border border-yellow-400/40 rounded-lg ${isMobile ? "p-3" : "p-4"} ${isMobile ? "max-w-sm" : "max-w-md"} mx-auto`}
                  >
                    <p className={`text-yellow-200 ${isMobile ? "text-xs" : "text-sm"}`}>
                      Showing first {MAX_TOTAL_DISPLAY} results of {allFilteredStudents.length} total. Try a more
                      specific search to narrow down results.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal - Using createPortal for better control */}
      {isQRModalOpen &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            ref={modalContainerRef}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
            }}
            onClick={(e) => {
              // Close modal when clicking backdrop
              if (e.target === e.currentTarget) {
                setIsQRModalOpen(false)
              }
            }}
          >
            {selectedStudent && (
              <>
                {/* Loading state while generating QR */}
                {isGeneratingQR && (
                  <div className="animate-scaleIn">
                    <div
                      className={cn(
                        "flex items-center justify-center bg-gradient-to-br from-slate-800 via-purple-800/80 to-slate-800 rounded-2xl",
                        windowWidth < 640 ? "w-[90vw] h-auto p-8" : "w-96 h-96",
                      )}
                    >
                      <div className="text-center">
                        <div
                          className={`animate-spin rounded-full ${windowWidth < 640 ? "h-16 w-16" : "h-12 w-12"} border-b-2 border-purple-400 mx-auto mb-4`}
                        ></div>
                        <p className={`text-white text-shadow-sm ${windowWidth < 640 ? "text-lg" : ""}`}>
                          Generating QR Code...
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* QR Card with proper scaling */}
                {!isGeneratingQR && (
                  <div
                    className="animate-scaleIn flex items-center justify-center"
                    style={{
                      transform: `scale(${getQRCardScale()})`,
                      transformOrigin: "center center",
                    }}
                  >
                    <QRCard
                      ref={qrCardRef}
                      id={`qr-card-${selectedStudent.id}`}
                      student={selectedStudent}
                      qrCodeDataUrl={qrCodeDataUrl}
                      onCopy={handleCopyQR}
                      onDownload={handleDownloadQR}
                      onClose={selectedStudent._hideCloseButton ? undefined : () => setIsQRModalOpen(false)}
                      isCopied={isCopied}
                      showButtons={true}
                      hideButtonsForCapture={selectedStudent._hideButtons}
                      isMobile={windowWidth < 640}
                      className={windowWidth < 640 ? "w-full max-w-[90vw]" : ""}
                    />
                  </div>
                )}
              </>
            )}
          </div>,
          document.body,
        )}

      <style jsx>{`
        ${config.animations.keyframes}
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
