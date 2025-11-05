"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { getStudents } from "@/lib/actions/students"
import { getGuestBookMessages, deleteGuestBookMessage, deleteAllGuestBookMessages } from "@/lib/actions/guest-book"
import { GuestBookCarousel } from "@/components/guest-book/guest-book-carousel"
import { GuestBookMessageCreator } from "@/components/guest-book/guest-book-message-creator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { currentTheme } from "@/lib/theme-config"
import { PlusCircle, Trash2, AlertTriangle, Eye, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase"
import AppHeader from "@/components/app-header"
import { AnimatedBackground } from "@/components/animated-background"
import { useToast } from "@/hooks/use-toast"

export default function GuestBookPage() {
  const [isCreatorOpen, setIsCreatorOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [manageDialogOpen, setManageDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const messagesPerPage = 9
  const { toast } = useToast()
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

  const handleDeleteMessage = async () => {
    if (!selectedMessageId) return

    try {
      await deleteGuestBookMessage(selectedMessageId)
      toast({
        title: "Success",
        description: "Message deleted successfully",
      })
      refetchMessages()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedMessageId(null)
    }
  }

  const handleDeleteAll = async () => {
    try {
      await deleteAllGuestBookMessages()
      toast({
        title: "Success",
        description: "All messages deleted successfully",
      })
      refetchMessages()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete all messages",
        variant: "destructive",
      })
    } finally {
      setDeleteAllDialogOpen(false)
    }
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className={`text-3xl font-bold ${theme.text.primary}`}>
                Guest Book
              </h1>
              <p className={theme.text.secondary}>
                Messages from our graduates
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setManageDialogOpen(true)}
                className={`${theme.glass.standard} hover:bg-white/10 px-6 py-3`}
              >
                <Settings className="h-5 w-5 mr-2" />
                Manage Messages
              </Button>
              
              <Button
                onClick={() => setIsCreatorOpen(true)}
                className={`${theme.primary.gradient} ${theme.primary.gradientHover} text-white px-6 py-3`}
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Create Message
              </Button>
            </div>
          </div>

          {/* Carousel - Default and Centered */}
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

      {/* Manage Messages Dialog */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className={`${theme.glass.standard} max-w-6xl max-h-[90vh] overflow-y-auto`}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className={`text-2xl font-bold ${theme.text.primary}`}>
                  Manage Messages
                </DialogTitle>
                <DialogDescription className={theme.text.secondary}>
                  View and manage all guest book messages ({messages.length} total)
                </DialogDescription>
              </div>
              {messages.length > 0 && (
                <Dialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={`${theme.glass.standard}`}>
                    <DialogHeader>
                      <DialogTitle className={`flex items-center gap-2 ${theme.text.primary}`}>
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        Delete All Messages?
                      </DialogTitle>
                      <DialogDescription className={theme.text.secondary}>
                        This will permanently delete all {messages.length} messages and their images. This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setDeleteAllDialogOpen(false)}
                        className={theme.glass.standard}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAll}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Delete All
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </DialogHeader>

          {messages.length === 0 ? (
            <div className="p-12 text-center">
              <p className={`text-lg ${theme.text.muted}`}>No messages yet</p>
              <p className={`text-sm ${theme.text.muted} mt-2`}>Messages will appear here once students create them</p>
            </div>
          ) : (
            <>
              {/* Message Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {messages
                  .slice((currentPage - 1) * messagesPerPage, currentPage * messagesPerPage)
                  .map((message) => (
                    <Card key={message.id} className={`${theme.glass.standard} overflow-hidden border-white/10`}>
                      <CardHeader className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                        <CardTitle className={`text-lg ${theme.text.primary}`}>
                          {message.student_name}
                        </CardTitle>
                        <CardDescription className={theme.text.secondary}>
                          {message.student_location}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        {/* Message Image */}
                        <div className="relative aspect-[4/3] overflow-hidden bg-black/20">
                          <img
                            src={message.message_image_url}
                            alt={`Message from ${message.student_name}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Card Footer with Actions */}
                        <div className="p-4 space-y-3">
                          <p className={`text-sm ${theme.text.muted}`}>
                            {new Date(message.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          
                          <div className="flex gap-2">
                            {/* View Button */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`${theme.glass.standard} hover:bg-white/10 flex-1`}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className={`${theme.glass.standard} max-w-3xl`}>
                                <DialogHeader>
                                  <DialogTitle className={theme.text.primary}>
                                    Message from {message.student_name}
                                  </DialogTitle>
                                  <DialogDescription className={theme.text.secondary}>
                                    {message.student_location} • {new Date(message.created_at).toLocaleDateString()}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="mt-4">
                                  <img
                                    src={message.message_image_url}
                                    alt={`Message from ${message.student_name}`}
                                    className="w-full h-auto rounded-lg"
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>

                            {/* Delete Button */}
                            <Dialog 
                              open={deleteDialogOpen && selectedMessageId === message.id} 
                              onOpenChange={(open) => {
                                setDeleteDialogOpen(open)
                                if (!open) setSelectedMessageId(null)
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  onClick={() => setSelectedMessageId(message.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className={theme.glass.standard}>
                                <DialogHeader>
                                  <DialogTitle className={`flex items-center gap-2 ${theme.text.primary}`}>
                                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                    Delete Message?
                                  </DialogTitle>
                                  <DialogDescription className={theme.text.secondary}>
                                    Are you sure you want to delete the message from {message.student_name}? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setDeleteDialogOpen(false)
                                      setSelectedMessageId(null)
                                    }}
                                    className={theme.glass.standard}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={handleDeleteMessage}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>

              {/* Pagination */}
              {messages.length > messagesPerPage && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent className={theme.glass.standard}>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-white/10'} ${theme.text.primary}`}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.ceil(messages.length / messagesPerPage) }, (_, i) => i + 1).map((page) => {
                        const totalPages = Math.ceil(messages.length / messagesPerPage)
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className={`cursor-pointer ${theme.text.primary} ${
                                  currentPage === page 
                                    ? 'bg-white/20' 
                                    : 'hover:bg-white/10'
                                }`}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis className={theme.text.muted} />
                            </PaginationItem>
                          )
                        }
                        return null
                      })}

                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(Math.ceil(messages.length / messagesPerPage), p + 1))}
                          className={`${currentPage === Math.ceil(messages.length / messagesPerPage) ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-white/10'} ${theme.text.primary}`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

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
