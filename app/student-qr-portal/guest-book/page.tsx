"use client"

import { useState, useCallback, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getGuestBookMessages } from "@/lib/actions/guest-book"
import { GuestBookCarousel } from "@/components/guest-book/guest-book-carousel"
import { useGuestBookRealtime } from "@/hooks/use-guest-book-realtime"
import { Button } from "@/components/ui/button"
import { currentTheme } from "@/lib/theme-config"
import { ArrowLeft, MessageSquare } from "lucide-react"
import { AnimatedBackground } from "@/components/animated-background"
import Link from "next/link"

export default function StudentGuestBookPage() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showRealtimeWarning, setShowRealtimeWarning] = useState(false)
  const theme = currentTheme
  const queryClient = useQueryClient()

  console.log("🎨 [STUDENT-GUEST-BOOK] Component rendering")

  // Memoize the callback to prevent re-creating on every render
  const handleRealtimeUpdate = useCallback(() => {
    console.log("🔔 [STUDENT-GUEST-BOOK] Real-time update callback triggered")
  }, [])

  // Set up real-time subscription using custom hook with memoized callback
  const { status: realtimeStatus } = useGuestBookRealtime({
    enabled: true,
    onUpdate: handleRealtimeUpdate,
  })

  console.log(`📡 [STUDENT-GUEST-BOOK] Real-time status: ${realtimeStatus}`)

  // Fetch guest book messages
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["guestBookMessages"],
    queryFn: getGuestBookMessages,
    staleTime: 0, // Always consider data stale for immediate updates
    refetchOnWindowFocus: true, // Refetch when window regains focus
  })

  console.log(`📊 [STUDENT-GUEST-BOOK] Current messages count: ${messages.length}`)

  // Dynamic polling fallback when real-time fails
  // This effect is intentionally similar to admin page to ensure consistent real-time behavior
  useEffect(() => {
    console.log(`⏱️ [STUDENT-GUEST-BOOK] Polling effect triggered. Status: ${realtimeStatus}`)
    
    if (realtimeStatus === 'error' || realtimeStatus === 'disconnected') {
      console.log("⚡ [STUDENT-GUEST-BOOK] Real-time unavailable, starting polling (10s interval)")
      
      // Show warning only once when real-time fails
      if (!showRealtimeWarning) {
        setShowRealtimeWarning(true)
      }
      
      const pollInterval = setInterval(() => {
        console.log("🔃 [STUDENT-GUEST-BOOK] Polling for updates...")
        refetchMessages()
      }, 10000)

      return () => {
        console.log("🛑 [STUDENT-GUEST-BOOK] Stopping polling")
        clearInterval(pollInterval)
      }
    } else {
      console.log("✓ [STUDENT-GUEST-BOOK] Real-time active, no polling needed")
      
      // Hide warning if real-time reconnects
      if (showRealtimeWarning && realtimeStatus === 'connected') {
        setShowRealtimeWarning(false)
      }
    }
  }, [realtimeStatus, refetchMessages, showRealtimeWarning])

  return (
    <div className={`min-h-screen ${theme.background} relative overflow-hidden`}>
      {/* Animated Background */}
      <AnimatedBackground density="medium" />

      {/* Header - Hidden in fullscreen */}
      {!isFullscreen && (
        <div className="relative z-10">
          <div className="max-w-[1600px] mx-auto p-4 sm:p-6 md:p-8">
            {/* Back Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Link href="/student-qr-portal">
                <Button
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Portal
                </Button>
              </Link>
            </div>

            {/* Page Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-4">
                <div className={`w-16 h-16 ${theme.primary.gradient} rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50`}>
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className={`text-4xl sm:text-5xl font-bold ${theme.text.primary} mb-2`}>
                Guest Book
              </h1>
              <p className={`text-lg ${theme.text.secondary}`}>
                Messages from our graduates
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Normal Mode Container */}
      {!isFullscreen && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 pb-8 relative z-10">
          {/* Carousel - Centered */}
          <div className="flex justify-center">
            <GuestBookCarousel 
              messages={messages} 
              autoPlayInterval={10000}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            />
          </div>
        </div>
      )}

      {/* Fullscreen Mode */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <GuestBookCarousel 
            messages={messages} 
            autoPlayInterval={10000}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          />
        </div>
      )}
    </div>
  )
}
