"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Smartphone, QrCode } from "lucide-react"
import config from "@/lib/theme-config"

interface MobileScannerPromptProps {
  isMobile: boolean
}

export function MobileScannerPrompt({ isMobile }: MobileScannerPromptProps) {
  if (!isMobile) return null

  return (
    <div className={`${config.theme.glass.standard} ${config.ui.borderRadius.medium} p-6`}>
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div
            className={`w-12 h-12 ${config.theme.primary.gradient} ${config.ui.borderRadius.small} flex items-center justify-center`}
          >
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <QrCode className={`h-8 w-8 ${config.theme.text.primary}`} />
        </div>

        <h3
          className={`${config.ui.typography.sizes.lg} ${config.ui.typography.weights.bold} ${config.theme.text.primary}`}
        >
          Mobile Scanner Mode
        </h3>

        <p className={`${config.theme.text.secondary} text-sm`}>
          Use this device as a dedicated mobile scanner to send student data to the main desktop scanner.
        </p>

        <Link href="/mobile-scan">
          <Button
            className={`w-full ${config.theme.primary.gradient} ${config.theme.primary.gradientHover} text-white py-4 text-lg font-semibold`}
          >
            <Smartphone className="h-5 w-5 mr-3" />
            Use This Device as Scanner
          </Button>
        </Link>

        <p className={`${config.theme.text.muted} text-xs`}>
          This will connect to the main scanner and allow you to scan QR codes remotely.
        </p>
      </div>
    </div>
  )
}
