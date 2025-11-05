"use client"

import { useEffect, useState, useRef } from "react"
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
  const autoplayRef = useRef<NodeJS.Timeout | null>(null)
  const theme = currentTheme

  useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  // Jump to first slide when messages change (new message added)
  useEffect(() => {
    if (api && messages.length > 0) {
      api.scrollTo(0)
    }
  }, [messages.length, api])

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

  // Auto-play functionality
  useEffect(() => {
    // In fullscreen mode, always autoplay regardless of hover
    // In normal mode, pause on hover
    if (!api || (!isFullscreen && isHovered)) {
      return
    }

    const startAutoplay = () => {
      autoplayRef.current = setInterval(() => {
        api.scrollNext()
      }, autoPlayInterval)
    }

    startAutoplay()

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current)
      }
    }
  }, [api, autoPlayInterval, isHovered, isFullscreen])

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
          <CarouselPrevious className={`${theme.glass.standard} ${isFullscreen ? 'left-2' : 'left-2 sm:-left-12'}`} />
          <CarouselNext className={`${theme.glass.standard} ${isFullscreen ? 'right-2' : 'right-2 sm:-right-12'}`} />
        </Carousel>
        </div>
      </div>

      {/* Controls below the card */}
      <div className={`w-full max-w-7xl flex items-center justify-between ${isFullscreen ? 'mt-6 sm:mt-8' : 'mt-4 sm:mt-6'} transition-all duration-300`}>
        <span className={`${isFullscreen ? 'text-base sm:text-lg' : 'text-sm'} ${theme.text.muted}`}>
          {current} / {count}
        </span>

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
