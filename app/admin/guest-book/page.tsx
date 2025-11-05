"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { getStudents } from "@/lib/actions/students"
import { getGuestBookMessages } from "@/lib/actions/guest-book"
import { GuestBookCarousel } from "@/components/guest-book/guest-book-carousel"
import { GuestBookMessageCreator } from "@/components/guest-book/guest-book-message-creator"
import { Button } from "@/components/ui/button"
import { currentTheme } from "@/lib/theme-config"
import { PlusCircle, Maximize, Minimize } from "lucide-react"
import { createClient } from "@/lib/supabase"
import AppHeader from "@/components/app-header"
import { AnimatedBackground } from "@/components/animated-background"

export default function GuestBookPage() {
  const [isCreatorOpen, setIsCreatorOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const theme = currentTheme

  // Fetch students for QR scanning
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: getStudents,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch guest book messages
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["guestBookMessages"],
    queryFn: getGuestBookMessages,
    staleTime: 30 * 1000, // 30 seconds
  })

  // Set up real-time subscription for new messages
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("guest-book-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "voceo_guest_book_messages",
        },
        () => {
          refetchMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refetchMessages])

  const handleMessageCreated = () => {
    refetchMessages()
    setIsCreatorOpen(false)
  }

  return (
    <div className={`min-h-screen ${theme.background} relative overflow-hidden`}>
      {/* Animated Background */}
      <AnimatedBackground density="medium" />

      {/* Header - Hidden in fullscreen */}
      {!isFullscreen && <AppHeader pageType="guest-book" />}

      {/* Normal Mode Container */}
      {!isFullscreen && (
        <div className="max-w-[1600px] mx-auto p-4 sm:p-6 md:p-8 space-y-6 relative z-10">
          {/* Page Title & Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${theme.text.primary}`}>
                Guest Book
              </h1>
              <p className={theme.text.secondary}>
                Messages from our graduates
              </p>
            </div>

            <Button
              onClick={() => setIsCreatorOpen(true)}
              className={`${theme.primary.gradient} ${theme.primary.gradientHover} text-white px-6 py-3`}
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Create Message
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`${theme.glass.standard} rounded-xl p-6`}>
              <p className={theme.text.muted}>Total Messages</p>
              <p className={`text-3xl font-bold ${theme.text.primary} mt-2`}>
                {messages.length}
              </p>
            </div>
            <div className={`${theme.glass.standard} rounded-xl p-6`}>
              <p className={theme.text.muted}>Latest Message</p>
              <p className={`text-lg font-semibold ${theme.text.primary} mt-2 truncate`}>
                {messages.length > 0
                  ? messages[0].student_name
                  : "No messages yet"}
              </p>
            </div>
          </div>

          {/* Carousel */}
          <GuestBookCarousel 
            messages={messages} 
            autoPlayInterval={10000}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          />
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

      {/* Message Creator Modal */}
      <GuestBookMessageCreator
        open={isCreatorOpen}
        onOpenChange={setIsCreatorOpen}
        students={students}
        onMessageCreated={handleMessageCreated}
      />
    </div>
  )
}
