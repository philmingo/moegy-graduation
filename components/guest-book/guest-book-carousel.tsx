"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { type GuestBookMessage } from "@/lib/actions/guest-book"
import { MessageCard } from "./message-card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { currentTheme } from "@/lib/theme-config"
import { Button } from "@/components/ui/button"
import { Maximize, Minimize } from "lucide-react"

interface GuestBookCarouselProps {
  messages: GuestBookMessage[]
  autoPlayInterval?: number
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

export function GuestBookCarousel({ 
  messages, 
  autoPlayInterval = 10000,
  isFullscreen = false,
  onToggleFullscreen 
}: GuestBookCarouselProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isManuallyInteracting, setIsManuallyInteracting] = useState(false)
  const autoplayRef = useRef<NodeJS.Timeout | null>(null)
  const manualInteractionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const theme = currentTheme

  console.log(`🎠 [CAROUSEL] Component render - messages.length: ${messages.length}, displayed count: ${count}`)

  // Clear all timers on unmount
  useEffect(() => {
    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current)
      }
      if (manualInteractionTimeoutRef.current) {
        clearTimeout(manualInteractionTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap() + 1)
    }

    api.on("select", handleSelect)

    return () => {
      api.off("select", handleSelect)
    }
  }, [api])

  // Update count when messages change - use messages.length directly
  useEffect(() => {
    if (!api) return
    
    console.log(`🔢 [CAROUSEL] Messages array changed. Length: ${messages.length}`)
    
    // Force carousel to reinitialize after DOM updates
    requestAnimationFrame(() => {
      if (!api) return
      
      const newCount = api.scrollSnapList().length
      console.log(`🔢 [CAROUSEL] Carousel API reports ${newCount} slides (messages.length = ${messages.length})`)
      
      if (newCount !== count) {
        console.log(`✅ [CAROUSEL] Updating count display from ${count} to ${newCount}`)
        setCount(newCount)
      } else if (newCount !== messages.length) {
        // API hasn't caught up with React yet, try again after a short delay
        console.warn(`⚠️ [CAROUSEL] API count (${newCount}) doesn't match messages (${messages.length}), retrying...`)
        setTimeout(() => {
          const retryCount = api.scrollSnapList().length
          console.log(`🔁 [CAROUSEL] Retry: API now reports ${retryCount} slides`)
          if (retryCount !== count) {
            console.log(`✅ [CAROUSEL] Updating count after retry: ${count} → ${retryCount}`)
            setCount(retryCount)
          }
        }, 200)
      } else {
        console.log(`✓ [CAROUSEL] Count already correct: ${count}`)
      }
    })
  }, [api, messages.length]) // Remove 'count' from dependencies to avoid cycles

  // Track message count and jump to first slide when NEW messages arrive
  const previousMessageCountRef = useRef(messages.length)
  useEffect(() => {
    if (api && messages.length > 0 && messages.length > previousMessageCountRef.current) {
      console.log("🔄 [CAROUSEL] New message detected, count:", messages.length)
      // Wait for React to finish rendering the new messages before scrolling
      // Use requestAnimationFrame for better timing with render cycle
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (api) {
            api.scrollTo(0, false)
          }
        }, 150) // Slightly longer delay to ensure data is rendered
      })
    }
    previousMessageCountRef.current = messages.length
  }, [messages.length, api])

  // Handle manual interaction - pause autoplay for 10 seconds
  const handleManualInteraction = useCallback(() => {
    console.log("👆 [CAROUSEL] Manual interaction detected, pausing autoplay for 10 seconds")
    setIsManuallyInteracting(true)

    // Clear existing timeout
    if (manualInteractionTimeoutRef.current) {
      clearTimeout(manualInteractionTimeoutRef.current)
    }

    // Resume autoplay after 10 seconds
    manualInteractionTimeoutRef.current = setTimeout(() => {
      console.log("▶️ [CAROUSEL] Resuming autoplay after manual interaction")
      setIsManuallyInteracting(false)
    }, 10000)
  }, [])

  // Listen to carousel API events for manual navigation
  useEffect(() => {
    if (!api) return

    let isUserInitiated = false

    // Detect when user clicks prev/next buttons or uses pointer
    const handlePointerDown = () => {
      isUserInitiated = true
    }

    const handleSelect = () => {
      // Only trigger if this was a user-initiated interaction
      if (isUserInitiated) {
        console.log("👆 [CAROUSEL] Manual interaction detected, pausing autoplay for 10 seconds")
        handleManualInteraction()
        isUserInitiated = false
      }
    }

    // Listen for pointer down (clicks/touches on carousel)
    api.on("pointerDown", handlePointerDown)
    api.on("select", handleSelect)

    return () => {
      api.off("pointerDown", handlePointerDown)
      api.off("select", handleSelect)
    }
  }, [api, handleManualInteraction])

  // Escape key handler for fullscreen
  useEffect(() => {
    if (!isFullscreen || !onToggleFullscreen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onToggleFullscreen()
      }
    }

    window.addEventListener("keydown", handleEscape)

    return () => {
      window.removeEventListener("keydown", handleEscape)
    }
  }, [isFullscreen, onToggleFullscreen])

  // Auto-play functionality with proper loop restart
  useEffect(() => {
    // Don't autoplay if:
    // 1. No API
    // 2. User is manually interacting (within 10 seconds of manual action)
    // 3. User is hovering (in normal mode only)
    if (!api || isManuallyInteracting || (!isFullscreen && isHovered)) {
      // Clear autoplay if it's running
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current)
        autoplayRef.current = null
      }
      return
    }

    console.log("▶️ [CAROUSEL] Starting autoplay")

    const startAutoplay = () => {
      autoplayRef.current = setInterval(() => {
        if (!api.canScrollNext()) {
          // At the end, restart from beginning
          console.log("🔄 [CAROUSEL] Reached end, restarting from beginning")
          api.scrollTo(0)
        } else {
          api.scrollNext()
        }
      }, autoPlayInterval)
    }

    startAutoplay()

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current)
        autoplayRef.current = null
      }
    }
  }, [api, autoPlayInterval, isHovered, isFullscreen, isManuallyInteracting])

  if (messages.length === 0) {
    return (
      <div className={`${theme.glass.standard} rounded-2xl p-12 text-center`}>
        <p className={`text-lg ${theme.text.secondary}`}>
          No messages yet. Be the first to leave a message!
        </p>
      </div>
    )
  }

  return (
    <div 
      className={`w-full h-full flex flex-col items-center ${
        isFullscreen 
          ? 'justify-between px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-6 sm:py-8' 
          : 'justify-center px-4 sm:px-8 md:px-12 lg:px-20 py-8'
      } transition-all duration-300`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative w-full max-w-7xl ${isFullscreen ? 'flex-1 flex items-center justify-center' : 'flex-shrink'}`}>
        <div className={`w-full transition-all duration-300 ${
          isFullscreen 
            ? 'scale-[1.15] sm:scale-[1.2] md:scale-[1.25] lg:scale-[1.3] xl:scale-[1.35] origin-center' 
            : 'scale-100'
        }`}>
        <Carousel
          opts={{
            align: "center",
            loop: true,
          }}
          setApi={setApi}
          className="w-full"
        >
          <CarouselContent className="items-center">
            {messages.map((message) => (
              <CarouselItem key={message.id} className="flex justify-center">
                <MessageCard message={message} isFullscreen={isFullscreen} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious 
            className={`${theme.glass.standard} ${isFullscreen ? 'left-2' : 'left-2 sm:-left-12'}`}
          />
          <CarouselNext 
            className={`${theme.glass.standard} ${isFullscreen ? 'right-2' : 'right-2 sm:-right-12'}`}
          />
        </Carousel>
        </div>
      </div>

      {/* Controls below the card */}
      <div className={`w-full max-w-7xl flex items-center justify-between ${isFullscreen ? 'mt-6 sm:mt-8' : 'mt-4 sm:mt-6'} transition-all duration-300`}>
        <div className="flex items-center gap-3">
          <span className={`${isFullscreen ? 'text-base sm:text-lg' : 'text-sm'} ${theme.text.muted}`}>
            {current} / {count}
          </span>
          {isManuallyInteracting && (
            <span className={`${isFullscreen ? 'text-xs sm:text-sm' : 'text-xs'} ${theme.text.muted} opacity-70`}>
              (Auto-play paused)
            </span>
          )}
        </div>

        {onToggleFullscreen && (
          <Button
            onClick={onToggleFullscreen}
            size={isFullscreen ? "default" : "sm"}
            variant="outline"
            className={`${theme.glass.standard} ${theme.text.primary} border-0`}
          >
            {isFullscreen ? (
              <>
                <Minimize className="h-4 w-4 mr-2" />
                Exit<span className="ml-1 hidden sm:inline">(ESC)</span>
              </>
            ) : (
              <>
                <Maximize className="h-4 w-4 mr-2" />
                Fullscreen
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
