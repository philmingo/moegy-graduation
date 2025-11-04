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
    <Card className={`bg-white rounded-3xl shadow-2xl overflow-hidden max-w-7xl mx-auto border-0 ${className}`}>
      <div className="grid grid-cols-10 min-h-[600px]">
        {/* Left Side - Photo/Gradient (30%) */}
        <CardHeader className="col-span-3 bg-gradient-to-br from-violet-400 via-purple-400 to-pink-400 p-6 flex flex-col justify-center items-center">
          <div className="w-40 h-40 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl mb-6">
            <span className="text-6xl font-bold text-white">
              {message.student_name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              {message.student_name}
            </h2>
            <div className="inline-flex items-center gap-2 text-white/90 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <MapPin size={18} />
              <span className="text-base">{message.student_location}</span>
            </div>
          </div>
        </CardHeader>

        {/* Right Side - Message (70%) */}
        <CardContent className="col-span-7 p-10 pr-16 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-violet-600 to-purple-600 rounded-full"></div>
            <h3 className="text-xl font-medium text-gray-700">Their Message</h3>
          </div>

          {/* Message Image - Fill container with safe padding */}
          <div className="flex-1 border-2 border-gray-200 rounded-2xl bg-gray-50 p-2 overflow-hidden">
            <div className="relative w-full h-full">
              <Image
                src={message.message_image_url}
                alt={`Message from ${message.student_name}`}
                fill
                className="object-contain rounded-xl"
                priority
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {new Date(message.created_at).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
