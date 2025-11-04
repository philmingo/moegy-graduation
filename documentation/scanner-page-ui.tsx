"use client"

import { useState } from "react"
import { Search, Settings, Camera, Play, Volume2, Clock, QrCode, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import config from "@/lib/theme-config"

export default function QRScannerPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [currentGraduate, setCurrentGraduate] = useState({
    name: "Jonathan Sookram",
    id: "GRD-2024-001",
    pronunciation: "John-a-ton Suuk-cramo",
    validated: true,
  })

  const recentActivity = [
    { name: "Sarah Johnson", time: "5 min ago", initials: "SJ" },
    { name: "Michael Chen", time: "8 min ago", initials: "MC" },
  ]

  const stats = {
    totalScanned: 47,
    recent: 2,
  }

  return (
    <div className={`min-h-screen ${config.theme.background} relative overflow-hidden`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        {config.animationGradients.orbs.map((gradient, index) => (
          <div
            key={`orb-${index}`}
            className={`absolute ${
              index === 0
                ? "top-20 left-10 w-72 h-72"
                : index === 1
                  ? "top-40 right-20 w-96 h-96"
                  : "bottom-20 left-1/4 w-80 h-80"
            } ${gradient} ${config.ui.borderRadius.large} ${config.ui.blur.large} animate-pulse ${
              index > 0 ? `delay-${index}000` : ""
            }`}
          />
        ))}

        {/* Rotating Squares */}
        {[
          { pos: "top-16 right-1/3", size: "w-12 h-12", gradient: 0, duration: 0 },
          { pos: "top-1/3 left-16", size: "w-10 h-10", gradient: 1, duration: 1 },
          { pos: "bottom-1/4 right-20", size: "w-14 h-14", gradient: 2, duration: 2 },
          { pos: "top-1/2 right-1/4", size: "w-6 h-6", gradient: 3, duration: 0 },
          { pos: "bottom-1/3 left-1/3", size: "w-8 h-8", gradient: 4, duration: 1 },
        ].map((square, index) => (
          <div
            key={`square-${index}`}
            className={`absolute ${square.pos} ${square.size} ${config.animationGradients.squares[square.gradient]} rotate-45 opacity-60`}
            style={{ animation: `spin ${config.animations.durations.squares.large[square.duration]} linear infinite` }}
          />
        ))}

        {/* Bouncing Circles */}
        {[
          { pos: "top-24 right-24", size: "w-8 h-8" },
          { pos: "bottom-32 left-40", size: "w-6 h-6" },
          { pos: "top-40 right-96", size: "w-10 h-10" },
          { pos: "bottom-36 right-60", size: "w-5 h-5" },
        ].map((circle, index) => (
          <div
            key={`circle-${index}`}
            className={`absolute ${circle.pos} ${circle.size} ${config.animationGradients.circles[index]} ${config.ui.borderRadius.large} opacity-60`}
            style={{ animation: `circlebounce ${config.animations.durations.circles[index]} ease-in-out infinite` }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div
          className={`${config.theme.glass.standard} ${config.theme.text.primary} border-b ${config.theme.primary.border}`}
        >
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 ${config.theme.primary.gradient} ${config.ui.borderRadius.small} flex items-center justify-center`}
                >
                  <QrCode className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1
                    className={`${config.ui.typography.sizes.lg} ${config.ui.typography.weights.bold} ${config.theme.text.primary}`}
                  >
                    QR Scanner
                  </h1>
                  <p className={`${config.ui.typography.sizes.sm} ${config.theme.text.secondary}`}>
                    Cyril Potter College
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Badge
                  className={`${config.theme.status.success.bg} ${config.theme.status.success.text} ${config.theme.status.success.border}`}
                >
                  Live
                </Badge>
                <div
                  className={`w-10 h-10 ${config.theme.primary.gradient} ${config.ui.borderRadius.large} flex items-center justify-center text-white ${config.ui.typography.weights.bold}`}
                >
                  A
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Scanner Area */}
            <div className="lg:w-2/3 flex flex-col space-y-6">
              {/* Scanner Header */}
              <div className="text-center">
                <h2
                  className={`${config.ui.typography.sizes["2xl"]} ${config.ui.typography.weights.bold} ${config.theme.text.gradient.primary} mb-2`}
                >
                  QR Code Scanner
                </h2>
                <p className={`${config.theme.text.secondary} ${config.ui.typography.sizes.md}`}>
                  Position QR codes in the scanning area
                </p>
              </div>

              {/* Connection Status */}
              <div className="flex items-center justify-between">
                <Badge className={`${config.theme.glass.standard} ${config.theme.text.primary} px-4 py-2`}>
                  📱 Mobile Scanner: Connected
                </Badge>
                <div className="flex gap-3">
                  <Button
                    className={`${config.theme.glass.standard} ${config.theme.text.primary} ${config.theme.glass.hover}`}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search Student
                  </Button>
                  <Button
                    className={`${config.theme.primary.gradient} ${config.theme.primary.gradientHover} text-white`}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Voice Settings
                  </Button>
                </div>
              </div>

              {/* Scanner Area */}
              <div
                className={`${config.theme.glass.standard} ${config.ui.borderRadius.medium} p-8 flex-grow flex flex-col items-center justify-center`}
              >
                <div className="relative group">
                  <div
                    className={`absolute -inset-4 ${config.theme.primary.gradient}/20 ${config.ui.borderRadius.large} ${config.ui.blur.medium} group-hover:opacity-40 transition-opacity`}
                  />
                  <div
                    className={`relative w-32 h-32 ${config.theme.glass.light} ${config.ui.borderRadius.large} flex items-center justify-center mb-6`}
                  >
                    <Camera className={`h-16 w-16 ${config.theme.text.muted}`} />
                  </div>
                </div>

                <h3
                  className={`${config.ui.typography.sizes.xl} ${config.ui.typography.weights.bold} ${config.theme.text.primary} mb-2`}
                >
                  Scanner Ready
                </h3>
                <p className={`${config.theme.text.secondary} text-center mb-8`}>
                  Click start to begin scanning QR codes
                </p>
              </div>

              {/* Scanner Controls */}
              <div className={`${config.theme.glass.standard} ${config.ui.borderRadius.medium} p-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 ${config.theme.primary.gradient} ${config.ui.borderRadius.small} flex items-center justify-center`}
                    >
                      <QrCode className="h-5 w-5 text-white" />
                    </div>
                    <span className={`${config.theme.text.primary} ${config.ui.typography.weights.medium}`}>
                      QR Scanner
                    </span>
                    <Badge className={`${config.theme.status.success.bg} ${config.theme.status.success.text}`}>
                      ✓ Last scan successful
                    </Badge>
                  </div>

                  <Button
                    onClick={() => setIsScanning(!isScanning)}
                    className={`${config.theme.primary.gradient} ${config.theme.primary.gradientHover} text-white px-8 py-3 ${config.ui.borderRadius.small}`}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isScanning ? "Stop" : "Start"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:w-1/3 flex flex-col space-y-6">
              {/* Current Graduate */}
              <div className={`${config.theme.glass.standard} ${config.ui.borderRadius.medium} p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-6 h-6 ${config.theme.primary.gradient} ${config.ui.borderRadius.small} flex items-center justify-center`}
                  >
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <h3 className={`${config.ui.typography.weights.bold} ${config.theme.text.primary}`}>
                    Current Graduate
                  </h3>
                </div>

                {currentGraduate.validated && (
                  <Badge className={`${config.theme.status.success.bg} ${config.theme.status.success.text} mb-4`}>
                    ✓ QR Code Validated
                  </Badge>
                )}

                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-12 h-12 ${config.theme.primary.gradient} ${config.ui.borderRadius.small} flex items-center justify-center text-white ${config.ui.typography.weights.bold}`}
                  >
                    JS
                  </div>
                  <div>
                    <h4 className={`${config.ui.typography.weights.bold} ${config.theme.text.primary}`}>
                      {currentGraduate.name}
                    </h4>
                    <p className={`${config.theme.text.secondary} ${config.ui.typography.sizes.sm}`}>
                      ID: {currentGraduate.id}
                    </p>
                  </div>
                </div>

                <div className={`${config.theme.glass.light} ${config.ui.borderRadius.small} p-3 mb-4`}>
                  <p className={`${config.ui.typography.sizes.xs} ${config.theme.text.secondary} mb-1`}>
                    PHONETIC PRONUNCIATION
                  </p>
                  <p className={`${config.theme.text.primary} font-mono`}>{currentGraduate.pronunciation}</p>
                </div>

                <Button
                  className={`w-full ${config.theme.primary.gradient} ${config.theme.primary.gradientHover} text-white py-3`}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Announce Name
                </Button>
              </div>

              {/* Recent Activity */}
              <div
                className={`${config.theme.glass.standard} ${config.ui.borderRadius.medium} p-6 flex-grow flex flex-col`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Clock className={`h-5 w-5 ${config.theme.primary.text}`} />
                  <h3 className={`${config.ui.typography.weights.bold} ${config.theme.text.primary}`}>
                    Recent Activity
                  </h3>
                </div>

                <div className="space-y-3 flex-grow">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div
                        className={cn(
                          `w-8 h-8 ${config.ui.borderRadius.small} flex items-center justify-center text-white ${config.ui.typography.sizes.xs} ${config.ui.typography.weights.bold}`,
                          config.avatarGradients[index % config.avatarGradients.length],
                        )}
                      >
                        {activity.initials}
                      </div>
                      <div className="flex-1">
                        <p className={`${config.theme.text.primary} ${config.ui.typography.sizes.sm}`}>
                          {activity.name}
                        </p>
                        <p className={`${config.theme.text.muted} ${config.ui.typography.sizes.xs}`}>{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statistics */}
              <div className={`${config.theme.glass.standard} ${config.ui.borderRadius.medium} p-4 text-center`}>
                <div
                  className={`${config.ui.typography.sizes["2xl"]} ${config.ui.typography.weights.bold} ${config.theme.text.primary} mb-1`}
                >
                  {stats.totalScanned}
                </div>
                <div className={`${config.theme.text.secondary} ${config.ui.typography.sizes.sm}`}>Total Scanned</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        ${config.animations.keyframes}
      `}</style>
    </div>
  )
}
