"use client"

import { type GuestBookMessage } from "@/lib/actions/guest-book"
import { currentTheme } from "@/lib/theme-config"
import { Calendar, MapPin } from "lucide-react"
import Image from "next/image"

interface MessageCardProps {
  message: GuestBookMessage
  className?: string
}

export function MessageCard({ message, className = "" }: MessageCardProps) {
  const theme = currentTheme

  return (
    <div 
      className={`
        ${theme.glass.standard} 
        rounded-2xl p-6 
        ${theme.hover.card.transition}
        flex flex-col gap-4
        ${className}
      `}
    >
      {/* Student Info Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className={`text-xl font-semibold ${theme.text.primary} mb-1`}>
            {message.student_name}
          </h3>
          <div className="flex items-center gap-2">
            <MapPin className={`h-4 w-4 ${theme.text.muted}`} />
            <span className={`text-sm ${theme.text.secondary}`}>
              {message.student_location}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className={`h-4 w-4 ${theme.text.muted}`} />
          <span className={`text-sm ${theme.text.muted}`}>
            {new Date(message.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Handwritten Message Image */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-white">
        <Image
          src={message.message_image_url}
          alt={`Message from ${message.student_name}`}
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  )
}
