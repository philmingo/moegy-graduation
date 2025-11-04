"use client"
import config from "@/lib/theme-config"
import type { Student } from "@/lib/actions/students"
import { Button } from "@/components/ui/button"
import { Copy, Download, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatedBackground } from "@/components/animated-background"
import { forwardRef } from "react"
import { useQRGeneration } from "@/hooks/use-qr-generation"

// Update the QRCardProps interface
interface QRCardProps {
  student: Student
  className?: string
  onCopy?: () => void
  onDownload?: () => void
  isCopied?: boolean
  showButtons?: boolean
  printMode?: boolean
  id?: string
  hideButtonsForCapture?: boolean
  isMobile?: boolean
  onClose?: () => void
}

// Helper function to get classification badge styling
const getClassificationBadge = (classification: string) => {
  const lowerClass = classification.toLowerCase()
  if (lowerClass.includes("distinction")) {
    return { icon: "🏆", label: "Distinction" }
  } else if (lowerClass.includes("merit")) {
    return { icon: "🥈", label: "Merit" }
  } else if (lowerClass.includes("pass")) {
    return { icon: "✅", label: "Pass" }
  } else {
    return { icon: "📋", label: classification }
  }
}

// Update the QRCard component with forwardRef for better targeting
export const QRCard = forwardRef<HTMLDivElement, QRCardProps>(
  (
    {
      student,
      className = "",
      onCopy,
      onDownload,
      isCopied = false,
      showButtons = false,
      printMode = false,
      id,
      hideButtonsForCapture = false,
      isMobile = false,
      onClose,
    },
    ref,
  ) => {
    const modalConfig = config.theme.qrCard.modal

    // Use our centralized QR generation hook
    const { qrImageUrl, isGenerating, qrCodeData, generateQrCardImage, error } = useQRGeneration(student)

    // Debug logging
    console.log("🔍 [QR-CARD] Component state:", {
      studentId: student?.id,
      hasQrImageUrl: !!qrImageUrl,
      isGenerating,
      error,
      qrCodeDataLength: qrCodeData.length,
    })

    // Handle copy action
    const handleCopy = () => {
      if (qrCodeData && onCopy) {
        navigator.clipboard
          .writeText(qrCodeData)
          .then(() => {
            console.log("✅ [QR-CARD] QR code data copied to clipboard")
            onCopy()
          })
          .catch((err) => {
            console.error("❌ [QR-CARD] Failed to copy QR code data:", err)
          })
      }
    }

    // Handle download action
    const handleDownload = async () => {
      if (onDownload) {
        try {
          const cardImageUrl = await generateQrCardImage()
          if (cardImageUrl) {
            const link = document.createElement("a")
            link.href = cardImageUrl
            link.download = `${student.first_name}-${student.last_name}-QR.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            console.log("✅ [QR-CARD] QR card downloaded successfully")
            onDownload()
          }
        } catch (error) {
          console.error("❌ [QR-CARD] Error downloading QR card:", error)
        }
      }
    }

    // Responsive sizing based on mobile - ensure enough height for buttons
    const containerStyles: React.CSSProperties = {
      width: "100%",
      maxWidth: isMobile ? "90vw" : modalConfig?.container?.maxWidth || "32rem",
      height: "auto",
      minHeight: isMobile ? "auto" : "auto",
      margin: modalConfig?.container?.margin || "0 auto",
      display: modalConfig?.container?.display || "flex",
      flexDirection: (modalConfig?.container?.flexDirection as React.CSSProperties['flexDirection']) || "column",
    }

    return (
      <div
        ref={ref}
        id={id}
        className={`relative ${config.theme.qrCard.background || "bg-gradient-to-br from-purple-800 to-indigo-900"} ${config.theme.qrCard.border || "border border-purple-400/50"} ${config.theme.qrCard.borderRadius || "rounded-3xl"} ${modalConfig?.container?.classes || "text-center overflow-hidden"} ${config.theme.qrCard.shadow || "shadow-2xl shadow-purple-500/25"} ${isMobile ? "p-4 pt-8 pb-6" : "p-8 pb-8"} ${className}`}
        style={containerStyles}
      >
        {/* Close button - positioned absolutely within the card */}
        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              "absolute z-50 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors",
              isMobile ? "top-3 right-3 w-8 h-8" : "top-4 right-4 w-8 h-8",
            )}
            aria-label="Close modal"
          >
            <X className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-white text-shadow-sm`} />
          </button>
        )}
        {/* Background decorative elements - hidden in print mode */}
        {!printMode && (
          <div className={modalConfig?.decorative?.wrapper || "absolute inset-0 pointer-events-none overflow-hidden"}>
            <AnimatedBackground density="low" />
          </div>
        )}

        {/* Content with proper spacing distribution */}
        <div
          className={`${modalConfig?.layout?.contentWrapper || "relative z-10 flex flex-col h-full"} ${isMobile ? "space-y-3" : "space-y-6"}`}
          style={{
            padding: modalConfig?.layout?.contentPadding || "0",
          }}
        >
          {/* Institution Header */}
          <div className={`${modalConfig?.header?.classes || "flex-shrink-0"} ${isMobile ? "mb-2" : "mb-4"}`}>
            <h3
              className={`${config.theme.qrCard.universityNameColor || "text-white"} ${modalConfig?.header?.title?.fontWeight || "font-bold"} text-center ${modalConfig?.header?.title?.lineHeight || "leading-tight"} ${isMobile ? "text-lg" : modalConfig?.header?.title?.textSize || "text-3xl"} ${modalConfig?.header?.title?.marginBottom || "mb-1"} ${modalConfig?.header?.title?.textShadow || "text-shadow-md"}`}
            >
              {config.institution.name}
            </h3>
            <p
              className={`text-white text-center ${isMobile ? "text-xs" : modalConfig?.header?.subtitle?.textSize || "text-lg"} ${modalConfig?.header?.subtitle?.opacity || "opacity-90"} ${modalConfig?.header?.subtitle?.textShadow || "text-shadow-sm"}`}
            >
              {config.institution.subHeader || "Graduation"}
            </p>
          </div>

          {/* QR Code Section - Centered and properly spaced */}
          <div
            className={`${modalConfig?.qrCode?.wrapper?.classes || "flex items-center justify-center"} ${isMobile ? "my-3" : "my-4"}`}
          >
            <div
              className={`${modalConfig?.qrCode?.container?.background || (config.theme.qrCard.qrBgColor ? "bg-white" : modalConfig?.qrCode?.container?.backgroundFallback || "bg-gray-100")} ${modalConfig?.qrCode?.container?.padding || "p-3"} ${modalConfig?.qrCode?.container?.borderRadius || "rounded-xl"} ${modalConfig?.qrCode?.container?.shadow || "shadow-lg"} ${modalConfig?.qrCode?.container?.classes || ""}`}
            >
              {error ? (
                <div
                  className={`${isMobile ? "w-32 h-32" : "w-52 h-52"} flex flex-col items-center justify-center bg-red-50 rounded-lg border-2 border-red-200`}
                >
                  <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                  <p className="text-red-600 text-xs text-center px-2">QR Generation Failed</p>
                  <p className="text-red-500 text-xs text-center px-2 mt-1">{error}</p>
                </div>
              ) : qrImageUrl ? (
                <img
                  src={qrImageUrl || "/placeholder.svg"}
                  alt="Student QR Code"
                  className={`${isMobile ? "w-32 h-32" : modalConfig?.qrCode?.image?.size || "w-52 h-52"} ${modalConfig?.qrCode?.image?.borderRadius || "rounded-lg"} ${modalConfig?.qrCode?.image?.classes || ""}`}
                />
              ) : (
                <div
                  className={`${isMobile ? "w-32 h-32" : modalConfig?.qrCode?.loading?.container?.size || "w-52 h-52"} ${modalConfig?.qrCode?.loading?.container?.background || "bg-gray-200"} ${modalConfig?.qrCode?.loading?.container?.borderRadius || "rounded-lg"} ${modalConfig?.qrCode?.loading?.container?.classes || "flex flex-col items-center justify-center"}`}
                >
                  <div
                    className={`${modalConfig?.qrCode?.loading?.spinner?.size || "w-8 h-8"} ${modalConfig?.qrCode?.loading?.spinner?.border || "border-2 border-purple-600 border-t-transparent"} ${modalConfig?.qrCode?.loading?.spinner?.borderRadius || "rounded-full"} ${modalConfig?.qrCode?.loading?.spinner?.animation || "animate-spin"} ${modalConfig?.qrCode?.loading?.spinner?.classes || ""}`}
                  />
                  <p className="text-gray-600 text-xs mt-2">Generating QR Code...</p>
                </div>
              )}
            </div>
          </div>

          {/* Student Name */}
          <div
            className={`${modalConfig?.studentInfo?.container?.background || "bg-purple-400/20"} ${modalConfig?.studentInfo?.container?.backdropBlur || "backdrop-blur-sm"} ${modalConfig?.studentInfo?.container?.borderRadius || "rounded-2xl"} ${modalConfig?.studentInfo?.container?.shadow || "shadow-md"} ${modalConfig?.studentInfo?.container?.border || "border border-purple-300/30"} ${isMobile ? "px-3 py-2 mx-auto text-center" : modalConfig?.studentInfo?.container?.padding || "px-6 py-4"} ${modalConfig?.studentInfo?.container?.classes || "mx-auto"}`}
            style={{
              maxWidth: isMobile ? "100%" : modalConfig?.studentInfo?.container?.maxWidth || "fit-content",
              minWidth: modalConfig?.studentInfo?.container?.minWidth || "auto",
              ...(modalConfig?.studentInfo?.container?.inlineStyles || {
                width: "fit-content",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }),
            }}
          >
            <p
              className={`${config.theme.qrCard.studentNameColor || "text-white"} ${modalConfig?.studentInfo?.name?.fontWeight || "font-bold"} text-center ${isMobile ? "text-base" : modalConfig?.studentInfo?.name?.textSize || "text-xl"} ${modalConfig?.studentInfo?.name?.classes || "m-0"} ${modalConfig?.studentInfo?.name?.textShadow || "text-shadow-md"}`}
              style={{
                ...(modalConfig?.studentInfo?.name?.inlineStyles || { width: "100%", textAlign: "center" }),
                ...(student.first_name.length + student.last_name.length > 25
                  ? {
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }
                  : {}),
              }}
            >
              {student.first_name} {student.last_name}
            </p>
          </div>

          {/* Pronunciation */}
          {student.phonetic_spelling && (
            <div
              className={`${modalConfig?.studentInfo?.pronunciation?.wrapper?.classes || "mx-auto"} ${isMobile ? "px-2" : ""}`}
              style={{
                maxWidth: isMobile ? "100%" : modalConfig?.studentInfo?.pronunciation?.maxWidth || "320px",
                ...(modalConfig?.studentInfo?.pronunciation?.wrapper?.inlineStyles || {
                  width: "100%",
                  margin: "0 auto",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }),
              }}
            >
              <p
                className={`${config.theme.qrCard.infoTextColor || "text-white"} ${modalConfig?.studentInfo?.pronunciation?.fontStyle || "italic"} text-center ${isMobile ? "text-xs" : modalConfig?.studentInfo?.pronunciation?.textSize || "text-sm"} ${modalConfig?.studentInfo?.pronunciation?.opacity || "opacity-80"} ${modalConfig?.studentInfo?.pronunciation?.classes || "m-0"}`}
              >
                Pronunciation: {student.phonetic_spelling}
              </p>
            </div>
          )}

          {/* Academic Info Cards */}
          <div
            className={`${modalConfig?.studentInfo?.academicCards?.wrapper?.classes || "flex flex-wrap gap-1 justify-center mx-auto"} ${isMobile ? "px-2" : ""}`}
            style={{
              maxWidth: isMobile ? "100%" : modalConfig?.studentInfo?.academicCards?.wrapper?.maxWidth || "400px",
            }}
          >
            {student.university && (
              <div
                className={`${modalConfig?.studentInfo?.academicCards?.card?.base || "px-2 py-1 rounded-lg font-medium backdrop-blur-sm border"} ${modalConfig?.studentInfo?.academicCards?.card?.university || "bg-purple-500/30 border-purple-400/40 text-white"} shadow-md ${isMobile ? "text-xs" : "text-xs"}`}
              >
                🏛️ {student.university}
              </div>
            )}
            {student.programme && (
              <div
                className={`${modalConfig?.studentInfo?.academicCards?.card?.base || "px-2 py-1 rounded-lg font-medium backdrop-blur-sm border"} ${modalConfig?.studentInfo?.academicCards?.card?.programme || "bg-blue-500/30 border-blue-400/40 text-white"} shadow-md ${isMobile ? "text-xs" : "text-xs"}`}
              >
                📚 {student.programme}
              </div>
            )}
            {student.classification && (
              <div
                className={`${modalConfig?.studentInfo?.academicCards?.card?.base || "px-2 py-1 rounded-lg font-medium backdrop-blur-sm border"} ${modalConfig?.studentInfo?.academicCards?.card?.classification || "bg-emerald-500/30 border-emerald-400/40 text-white"} shadow-md ${isMobile ? "text-xs" : "text-xs"}`}
              >
                {getClassificationBadge(student.classification).icon}{" "}
                {getClassificationBadge(student.classification).label}
              </div>
            )}
            {student.seat_no && (
              <div
                className={`${modalConfig?.studentInfo?.academicCards?.card?.base || "px-2 py-1 rounded-lg font-medium backdrop-blur-sm border"} ${modalConfig?.studentInfo?.academicCards?.card?.seat || "bg-orange-500/30 border-orange-400/40 text-white"} shadow-md ${isMobile ? "text-xs" : "text-xs"}`}
              >
                💺 Seat {student.seat_no}
              </div>
            )}
          </div>

          {/* Action Buttons - Hidden in print mode */}
          {showButtons && !printMode && !hideButtonsForCapture && (
            <div
              className={`${modalConfig?.buttons?.wrapper?.classes || "flex-shrink-0"} ${isMobile ? "mt-4 px-2" : "mt-6 px-4"}`}
            >
              <div
                className={`${modalConfig?.buttons?.container?.classes || "flex gap-3 mx-auto w-full"} ${isMobile ? "max-w-full" : "max-w-sm"}`}
              >
                <Button
                  className={cn(
                    modalConfig?.buttons?.individual?.classes ||
                      "flex-1 rounded-xl backdrop-blur-sm transition-all duration-300 border-0",
                    isCopied
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                      : `${config.theme.glass.standard} ${config.theme.text.primary} hover:bg-white/20`,
                    `text-shadow-sm`,
                    isMobile ? "text-xs px-2 py-2 h-10" : "py-3",
                  )}
                  onClick={handleCopy}
                  disabled={!qrCodeData || isGenerating}
                >
                  <Copy className={`mr-1 ${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
                  {isCopied ? "Copied!" : isMobile ? "Copy" : "Copy QR Code"}
                </Button>
                <Button
                  className={`${modalConfig?.buttons?.individual?.classes || "flex-1 rounded-xl"} ${config.theme.primary.gradient} ${config.theme.primary.gradientHover} text-white shadow-lg text-shadow-sm ${isMobile ? "text-xs px-2 py-2 h-10" : "py-3"}`}
                  onClick={handleDownload}
                  disabled={!qrImageUrl || isGenerating}
                >
                  <Download className={`mr-1 ${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
                  {isMobile ? "Download" : "Download QR Code"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  },
)

QRCard.displayName = "QRCard"
