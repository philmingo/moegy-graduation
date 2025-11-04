"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, User, Clock, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"
import config from "@/lib/theme-config"

interface CurrentGraduateProps {
  isMobile: boolean
  scannedName: string
  programme: string
  university: string
  scanResult: { success: boolean; message: string }
  onAnnounce: () => void
  isSpeaking: boolean
  previousScans: Array<{ name: string; phonetic: string; timestamp: string; id: number }>
  onAnnouncePrevious: (graduate: { name: string; phonetic: string; timestamp: string; id: number }) => void
  totalScanned: number
}

export function CurrentGraduate({
  isMobile,
  scannedName,
  programme,
  university,
  scanResult,
  onAnnounce,
  isSpeaking,
  previousScans,
  onAnnouncePrevious,
  totalScanned,
}: CurrentGraduateProps) {
  return (
    <div className="flex flex-col lg:h-full space-y-3 md:space-y-4 lg:min-h-0">
      {/* Current Graduate */}
      <div className={`${config.theme.glass.standard} ${config.ui.borderRadius.medium} p-3 md:p-4 flex-shrink-0`}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-6 h-6 ${config.theme.primary.gradient} ${config.ui.borderRadius.small} flex items-center justify-center`}
          >
            <Users className="h-4 w-4 text-white" />
          </div>
          <h3
            className={`${config.ui.typography.weights.bold} ${config.theme.text.primary} ${isMobile ? "text-lg" : ""}`}
          >
            Current Graduate
          </h3>
        </div>

        {scannedName ? (
          <div className="space-y-4">
            {scanResult.success && (
              <Badge className={`${config.theme.status.success.bg} ${config.theme.status.success.text}`}>
                ✓ QR Code Validated
              </Badge>
            )}

            {!scanResult.success && scanResult.message && (
              <Badge className={`${config.theme.status.warning.bg} text-red-300`}>⚠ {scanResult.message}</Badge>
            )}

            <div className="flex items-center gap-4 mb-4">
              <div
                className={`${isMobile ? "w-16 h-16" : "w-12 h-12"} ${config.theme.primary.gradient} ${config.ui.borderRadius.small} flex items-center justify-center text-white ${config.ui.typography.weights.bold} ${isMobile ? "text-lg" : ""}`}
              >
                {scannedName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <h4
                  className={`${config.ui.typography.weights.bold} ${config.theme.text.primary} ${isMobile ? "text-lg" : ""}`}
                >
                  {scannedName}
                </h4>
                <p className={`${config.theme.text.secondary} ${config.ui.typography.sizes.sm}`}>Graduate Student</p>
              </div>
            </div>

            {programme && (
              <div className="space-y-2 mb-4">
                <div className={`${config.theme.glass.light} ${config.ui.borderRadius.small} p-3`}>
                  <p className={`${config.ui.typography.sizes.xs} ${config.theme.text.secondary} mb-1`}>PROGRAM</p>
                  <p className={`${config.theme.text.primary} ${config.ui.typography.sizes.sm}`}>{programme}</p>
                </div>
              </div>
            )}

            {university && (
              <div className={`${config.theme.glass.light} ${config.ui.borderRadius.small} p-3 mb-4`}>
                <p className={`${config.ui.typography.sizes.xs} ${config.theme.text.secondary} mb-1`}>UNIVERSITY</p>
                <p className={`${config.theme.text.primary} ${config.ui.typography.sizes.sm}`}>{university}</p>
              </div>
            )}

            <Button
              onClick={onAnnounce}
              disabled={isSpeaking}
              className={`w-full ${config.theme.primary.gradient} ${config.theme.primary.gradientHover} text-white ${isMobile ? "py-4 text-lg" : "py-3"}`}
            >
              <Volume2 className={`${isMobile ? "h-5 w-5" : "h-4 w-4"} mr-2`} />
              {isSpeaking ? "Speaking..." : "Announce Name"}
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <div
              className={`${isMobile ? "w-20 h-20" : "w-16 h-16"} ${config.theme.glass.light} ${config.ui.borderRadius.large} flex items-center justify-center mx-auto mb-4`}
            >
              <User className={`${isMobile ? "w-10 h-10" : "w-8 h-8"} ${config.theme.text.muted}`} />
            </div>
            <p className={`${config.theme.text.secondary} ${isMobile ? "text-lg" : ""}`}>No graduate scanned</p>
            <p className={`${config.theme.text.muted} ${config.ui.typography.sizes.sm}`}>Waiting for QR code...</p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div
        className={`${config.theme.glass.standard} ${config.ui.borderRadius.medium} p-3 md:p-4 flex flex-col lg:flex-grow lg:min-h-0`}
        style={isMobile ? { maxHeight: "300px" } : {}}
      >
        <div className="flex items-center gap-3 mb-3 flex-shrink-0">
          <Clock className={`h-5 w-5 ${config.theme.primary.text}`} />
          <h3
            className={`${config.ui.typography.weights.bold} ${config.theme.text.primary} ${isMobile ? "text-lg" : ""}`}
          >
            Recent Activity
          </h3>
        </div>

        <div className={`lg:flex-grow overflow-y-auto space-y-2 lg:min-h-0`} style={isMobile ? { maxHeight: "220px" } : {}}>
          {previousScans.map((graduate, index) => (
            <div key={graduate.id} className="group">
              <div
                className={`flex items-center gap-2 p-3 ${config.theme.glass.light} ${config.ui.borderRadius.small} transition-all ${config.animations.durations.transitions.medium}`}
              >
                <div
                  className={cn(
                    `${isMobile ? "w-10 h-10" : "w-7 h-7"} ${config.ui.borderRadius.small} flex items-center justify-center text-white ${config.ui.typography.sizes.xs} ${config.ui.typography.weights.bold}`,
                    config.avatarGradients[index % config.avatarGradients.length],
                  )}
                >
                  {graduate.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`${config.theme.text.primary} ${isMobile ? "text-sm" : config.ui.typography.sizes.xs} truncate font-medium`}
                  >
                    {graduate.name}
                  </p>
                  <p className={`${config.theme.text.muted} ${config.ui.typography.sizes.xs}`}>{graduate.timestamp}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAnnouncePrevious(graduate)}
                  disabled={isSpeaking}
                  className={`${isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity ${isMobile ? "h-8 w-8" : "h-6 w-6"} p-0`}
                >
                  <Volume2 className={`${isMobile ? "w-4 h-4" : "w-3 h-3"}`} />
                </Button>
              </div>
            </div>
          ))}

          {previousScans.length === 0 && (
            <div className="text-center py-8">
              <p className={`${config.theme.text.secondary} ${isMobile ? "text-base" : ""}`}>No previous graduates</p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className={`${config.theme.glass.standard} ${config.ui.borderRadius.medium} p-3 text-center flex-shrink-0`}>
        <div
          className={`${isMobile ? config.ui.typography.sizes.xl : config.ui.typography.sizes["2xl"]} ${config.ui.typography.weights.bold} ${config.theme.text.primary} mb-1`}
        >
          {totalScanned}
        </div>
        <div className={`${config.theme.text.secondary} ${config.ui.typography.sizes.sm}`}>Total Scanned</div>
      </div>
    </div>
  )
}
