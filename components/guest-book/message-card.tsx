"use client"

import { type GuestBookMessage } from "@/lib/actions/guest-book"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import Image from "next/image"

interface MessageCardProps {
  message: GuestBookMessage
  className?: string
}

export function MessageCard({ 
  message, 
  className = ""
}: MessageCardProps) {
  return (
    <Card className={`bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden w-full mx-auto border-0 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-10 min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[650px] max-h-[80vh]">
        {/* Left Side - Photo/Gradient (30%) */}
        <CardHeader className="sm:col-span-3 bg-gradient-to-br from-violet-400 via-purple-400 to-pink-400 p-4 sm:p-6 flex flex-col justify-center items-center">
          <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl sm:rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl mb-3 sm:mb-6">
            <span className="text-3xl sm:text-5xl md:text-6xl font-bold text-white">
              {message.student_name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          
          <div className="text-center">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3">
              {message.student_name}
            </h2>
            <div className="inline-flex items-center gap-1 sm:gap-2 text-white/90 bg-white/20 backdrop-blur-sm px-2 sm:px-4 py-1 sm:py-2 rounded-full">
              <MapPin size={14} className="sm:w-[18px] sm:h-[18px]" />
              <span className="text-xs sm:text-base">{message.student_location}</span>
            </div>
          </div>
        </CardHeader>

        {/* Right Side - Message (70%) */}
        <CardContent className="sm:col-span-7 p-4 sm:p-8 md:p-10 lg:pr-16 flex flex-col">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
            <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-violet-600 to-purple-600 rounded-full"></div>
            <h3 className="text-base sm:text-lg md:text-xl font-medium text-gray-700">Their Message</h3>
          </div>

          {/* Message Image - Fill container with safe padding */}
          <div className="flex-1 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-gray-50 p-1 sm:p-2 overflow-hidden min-h-[200px]">
            <div className="relative w-full h-full">
              <Image
                src={message.message_image_url}
                alt={`Message from ${message.student_name}`}
                fill
                className="object-contain rounded-lg sm:rounded-xl"
                priority
              />
            </div>
          </div>

          <div className="mt-3 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs sm:text-sm text-gray-500">
              {new Date(message.created_at).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
