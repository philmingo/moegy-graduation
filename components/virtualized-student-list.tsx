"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { Virtuoso } from "react-virtuoso"
import type { Student } from "@/lib/actions/students"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CheckSquare, Edit, QrCode, Square, Trash2 } from "lucide-react"
import { QRCard } from "@/components/qr-card"
import { toast } from "@/hooks/use-toast"
import config from "@/lib/theme-config"
import { copyQRCardAsImage, downloadQRCardAsImage } from "@/lib/utils/image-utils"
import { createPortal } from "react-dom"

interface VirtualizedStudentListProps {
  students: Student[]
  isSelectionMode?: boolean
  selectedStudents?: Set<string>
  onToggleSelection?: (studentId: string) => void
  onCardClick?: (student: Student) => void
  onDelete?: (studentId: string) => void
  onMarkAsShared?: (student: Student) => void
  handleEditStudent?: (student: Student) => void
  height?: number
}

export function VirtualizedStudentList({
  students,
  isSelectionMode = false,
  selectedStudents = new Set(),
  onToggleSelection = () => {},
  onCardClick = () => {},
  onDelete = () => {},
  onMarkAsShared = () => {},
  handleEditStudent = () => {},
  height = 400,
}: VirtualizedStudentListProps) {
  const isMobile = useIsMobile()
  const [listHeight, setListHeight] = useState(height)
  const [windowWidth, setWindowWidth] = useState(0)
  const [windowHeight, setWindowHeight] = useState(0)

  // QR Modal state
  const [selectedQrStudent, setSelectedQrStudent] = useState<Student | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("")
  const [hideQrButtons, setHideQrButtons] = useState(false)
  const [hideQrCloseButton, setHideQrCloseButton] = useState(false)

  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const qrCardRef = useRef<HTMLDivElement>(null)
  const modalContainerRef = useRef<HTMLDivElement>(null)
  const virtuosoRef = useRef(null)

  // Pre-load QRCode library to avoid dynamic import lag
  let QRCodeLib: any = null
  const loadQRCode = async () => {
    if (!QRCodeLib) {
      QRCodeLib = (await import("qrcode")).default
    }
    return QRCodeLib
  }

  const generateQRCode = useCallback(
    async (student: Student) => {
      try {
        setIsGeneratingQR(true)

        const QRCode = await loadQRCode()

        const qrData = {
          id: student.id,
          n: `${student.first_name} ${student.last_name}`,
        }

        const canvas = document.createElement("canvas")

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

  const handleShowQRCode = useCallback(
    async (student: Student) => {
      setSelectedQrStudent(student)
      setQrDialogOpen(true)
      setQrCodeDataUrl("")

      await generateQRCode(student)
    },
    [generateQRCode],
  )

  // Special handling for download/copy to ensure full card capture
  const prepareCardForCapture = useCallback(
    async (student: Student) => {
      // Create a temporary container for capture that's not constrained by the viewport
      const tempContainer = document.createElement("div")
      tempContainer.style.position = "absolute"
      tempContainer.style.left = "-9999px"
      tempContainer.style.top = "-9999px"
      document.body.appendChild(tempContainer)

      // Create a new instance of the QR card at full size for capture
      const tempCard = document.createElement("div")
      tempCard.className = "qr-card-for-capture"
      tempContainer.appendChild(tempCard)

      // Set flags to hide buttons and close button
      setSelectedQrStudent(student)
      setHideQrButtons(true)
      setHideQrCloseButton(true)

      // Wait for state update
      await new Promise((resolve) => setTimeout(resolve, 100))

      return {
        cleanup: () => {
          document.body.removeChild(tempContainer)
          setHideQrButtons(false)
          setHideQrCloseButton(false)
        },
      }
    },
    [selectedQrStudent],
  )

  const handleCopyQR = useCallback(async () => {
    try {
      if (qrCardRef.current && selectedQrStudent) {
        // Temporarily hide buttons and close button by setting flags
        setHideQrButtons(true)
        setHideQrCloseButton(true)

        // Wait for re-render
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Use the actual card ref for copying
        await copyQRCardAsImage(qrCardRef.current)

        setIsCopied(true)
        setTimeout(() => setIsCopied(false), config.animations.durations.feedback.copied)

        toast({
          title: "QR Card Copied",
          description: "The complete QR card has been copied to your clipboard",
        })

        // Restore button visibility
        setHideQrButtons(false)
        setHideQrCloseButton(false)
      }
    } catch (error) {
      console.error("Error copying QR card:", error)
      toast({
        title: "Copy Failed",
        description: "Failed to copy QR card to clipboard",
        variant: "destructive",
      })
    }
  }, [selectedQrStudent, toast])

  const handleDownloadQR = useCallback(async () => {
    try {
      if (qrCardRef.current && selectedQrStudent) {
        // Temporarily hide buttons and close button by setting flags
        setHideQrButtons(true)
        setHideQrCloseButton(true)

        // Wait for re-render
        await new Promise((resolve) => setTimeout(resolve, 100))

        const fileName = `${selectedQrStudent.first_name}_${selectedQrStudent.last_name}_qr_card.png`

        // Use the actual card ref for downloading
        await downloadQRCardAsImage(qrCardRef.current, fileName)

        toast({
          title: "QR Card Downloaded",
          description: "The complete QR card has been downloaded to your device",
        })

        // Restore button visibility
        setHideQrButtons(false)
        setHideQrCloseButton(false)
      }
    } catch (error) {
      console.error("Error downloading QR card:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download QR card",
        variant: "destructive",
      })
    }
  }, [selectedQrStudent, toast])

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

  // Adjust height based on available space
  useEffect(() => {
    if (typeof window !== "undefined") {
      const viewportHeight = window.innerHeight
      const adjustedHeight = Math.min(height, viewportHeight - 300)
      setListHeight(adjustedHeight > 200 ? adjustedHeight : 200)
    }
  }, [height])

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

  // Render student card - now with CSS handling the height automatically
  const renderStudentCard = useCallback(
    (index: number) => {
      const student = students[index]
      const isSelected = selectedStudents.has(student.id)
      const isMobileSize = windowWidth < 640
      const isTabletSize = windowWidth >= 640 && windowWidth < 1024

      // Mobile layout
      if (isMobileSize) {
        return (
          <div className="px-3 py-2">
            <div
              className={cn(
                "w-full rounded-lg overflow-hidden transition-all duration-200 shadow-sm",
                isSelectionMode
                  ? isSelected
                    ? "bg-purple-500/30 border border-purple-400"
                    : "bg-white/10 border border-white/20"
                  : "bg-white/10 border border-white/20 hover:bg-white/15",
              )}
            >
              <div className="p-3 flex flex-col">
                {isSelectionMode && (
                  <div className="absolute top-3 right-3 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleSelection(student.id)
                      }}
                      className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center",
                        isSelected ? "bg-purple-500 text-white" : "bg-white/20 text-white/70",
                      )}
                    >
                      {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </button>
                  </div>
                )}
                <div
                  className={cn("flex flex-col", isSelectionMode ? "pr-8" : "")}
                  onClick={() => !isSelectionMode && onCardClick(student)}
                >
                  <div className="flex flex-col mb-2">
                    <h3 className="font-semibold text-white text-base mb-2">
                      {student.first_name} {student.last_name}
                    </h3>
                    {student.phonetic_spelling && (
                      <p className="text-xs text-gray-300 italic mb-2">({student.phonetic_spelling})</p>
                    )}

                    {/* Mini cards with flexbox for natural content-based sizing */}
                    <div className="flex flex-wrap gap-2 mb-1">
                      {student.programme && (
                        <div className="inline-flex bg-blue-500/30 backdrop-blur-sm border border-blue-400/40 rounded-lg px-2 py-1 text-xs">
                          <span className="text-blue-200 font-medium">📚 </span>
                          <span className="text-white">{student.programme}</span>
                        </div>
                      )}
                      {student.university && (
                        <div className="inline-flex bg-purple-500/30 backdrop-blur-sm border border-purple-400/40 rounded-lg px-2 py-1 text-xs">
                          <span className="text-purple-200 font-medium">🏫 </span>
                          <span className="text-white">{student.university}</span>
                        </div>
                      )}
                      {student.classification && (
                        <div className="inline-flex bg-emerald-500/30 backdrop-blur-sm border border-emerald-400/40 rounded-lg px-2 py-1 text-xs">
                          <span className="text-emerald-200 font-medium">🎓 </span>
                          <span className="text-white">{student.classification}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 text-xs bg-white/10 hover:bg-white/20 text-white flex-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditStudent(student)
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 text-xs bg-white/10 hover:bg-white/20 text-white flex-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleShowQRCode(student)
                      }}
                    >
                      <QrCode className="h-3 w-3 mr-1" />
                      QR
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 text-xs bg-red-500/20 hover:bg-red-500/30 text-white flex-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(student.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      // Tablet and Desktop layout
      return (
        <div className="px-2 py-1">
          <div
            className={cn(
              "w-full rounded-lg overflow-hidden transition-all duration-200 shadow-sm h-full",
              isSelectionMode
                ? isSelected
                  ? "bg-purple-500/30 border border-purple-400"
                  : "bg-white/10 border border-white/20"
                : "bg-white/10 border border-white/20 hover:bg-white/15",
            )}
          >
            <div className="p-3 h-full flex flex-col justify-center">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {isSelectionMode ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleSelection(student.id)
                      }}
                      className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-1",
                        isSelected ? "bg-purple-500 text-white" : "bg-white/20 text-white/70",
                      )}
                    >
                      {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </button>
                  ) : (
                    <div
                      className={`${
                        isTabletSize ? "w-8 h-8 text-sm" : "w-10 h-10"
                      } ${config.theme.primary.gradient} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
                    >
                      {student.first_name.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0" onClick={() => !isSelectionMode && onCardClick(student)}>
                    <h3 className={cn("font-semibold text-white truncate", isTabletSize ? "text-sm" : "text-base")}>
                      {student.first_name} {student.last_name}
                    </h3>
                    {student.phonetic_spelling && (
                      <p className="text-xs text-gray-300 italic mt-0.5">({student.phonetic_spelling})</p>
                    )}

                    {/* Mini cards with flexbox for natural content-based sizing */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {student.programme && (
                        <div className="inline-flex bg-blue-500/30 backdrop-blur-sm border border-blue-400/40 rounded-lg px-2 py-0.5 text-xs">
                          <span className="text-blue-200 font-medium">📚 </span>
                          <span className="text-white">{student.programme}</span>
                        </div>
                      )}
                      {student.university && (
                        <div className="inline-flex bg-purple-500/30 backdrop-blur-sm border border-purple-400/40 rounded-lg px-2 py-0.5 text-xs">
                          <span className="text-purple-200 font-medium">🏫 </span>
                          <span className="text-white">{student.university}</span>
                        </div>
                      )}
                      {student.classification && (
                        <div className="inline-flex bg-emerald-500/30 backdrop-blur-sm border border-emerald-400/40 rounded-lg px-2 py-0.5 text-xs">
                          <span className="text-emerald-200 font-medium">🎓 </span>
                          <span className="text-white">{student.classification}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!isSelectionMode && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "p-0 rounded-full bg-white/10 hover:bg-white/20 text-white",
                        isTabletSize ? "h-7 w-7" : "h-8 w-8",
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditStudent(student)
                      }}
                    >
                      <Edit className={cn(isTabletSize ? "h-3 w-3" : "h-4 w-4")} />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "p-0 rounded-full bg-white/10 hover:bg-white/20 text-white",
                        isTabletSize ? "h-7 w-7" : "h-8 w-8",
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleShowQRCode(student)
                      }}
                    >
                      <QrCode className={cn(isTabletSize ? "h-3 w-3" : "h-4 w-4")} />
                      <span className="sr-only">QR Code</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "p-0 rounded-full bg-red-500/20 hover:bg-red-500/30 text-white",
                        isTabletSize ? "h-7 w-7" : "h-8 w-8",
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(student.id)
                      }}
                    >
                      <Trash2 className={cn(isTabletSize ? "h-3 w-3" : "h-4 w-4")} />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    },
    [
      students,
      isSelectionMode,
      selectedStudents,
      onToggleSelection,
      onCardClick,
      onDelete,
      handleEditStudent,
      handleShowQRCode,
      windowWidth,
    ],
  )

  return (
    <>
      <div className="w-full h-full">
        <Virtuoso
          ref={virtuosoRef}
          style={{ height: isMobile ? Math.min(listHeight, window.innerHeight - 300) : "100%" }}
          totalCount={students.length}
          itemContent={(index) => renderStudentCard(index)}
          className="custom-scrollbar"
          overscan={5}
        />
      </div>

      {/* QR Code Modal - Portal to document body for full screen coverage */}
      {qrDialogOpen &&
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
                setQrDialogOpen(false)
              }
            }}
          >
            {selectedQrStudent && (
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

                {/* QR Card */}
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
                      id={`qr-card-${selectedQrStudent.id}`}
                      student={selectedQrStudent}
                      onCopy={handleCopyQR}
                      onDownload={handleDownloadQR}
                      onClose={hideQrCloseButton ? undefined : () => setQrDialogOpen(false)}
                      isCopied={isCopied}
                      showButtons={true}
                      hideButtonsForCapture={hideQrButtons}
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
    </>
  )
}

// Add default export as well to ensure compatibility
export default VirtualizedStudentList
