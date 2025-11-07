"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser"
import { Result, NotFoundException, ChecksumException, FormatException } from "@zxing/library"
import { currentTheme } from "@/lib/theme-config"
import { AlertTriangle, Camera } from "lucide-react"
import { decryptQRData, validateStudentInDB } from "@/lib/qr-utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ZXingScannerProps {
  onScan: (studentData: any) => void
  onError?: (error: string) => void
  students: any[]
  isActive?: boolean
  isSpeaking?: boolean
  onCameraStopped?: () => void
  cameraDeviceId?: string
  className?: string
}

export function ZXingScanner({
  onScan,
  onError,
  students,
  isActive = true,
  isSpeaking = false,
  onCameraStopped,
  cameraDeviceId,
  className = "",
}: ZXingScannerProps) {
  // Refs for stable callbacks
  const onScanRef = useRef(onScan)
  const onErrorRef = useRef(onError)
  const onCameraStoppedRef = useRef(onCameraStopped)
  const studentsRef = useRef(students)

  // Scanner refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null)
  const scannerControlsRef = useRef<IScannerControls | null>(null)
  const hasScannedRef = useRef(false)
  const streamRef = useRef<MediaStream | null>(null)
  const isCleaningUpRef = useRef(false)
  const isMountedRef = useRef(true)
  const scanAttemptsRef = useRef(0)

  // State
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [showInvalidQRDialog, setShowInvalidQRDialog] = useState(false)
  const [invalidQRMessage, setInvalidQRMessage] = useState("")
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [scanAttempts, setScanAttempts] = useState(0)
  const scanStartTimeRef = useRef<number>(0)

  const theme = currentTheme

  // Keep refs updated
  useEffect(() => {
    onScanRef.current = onScan
    onErrorRef.current = onError
    onCameraStoppedRef.current = onCameraStopped
    studentsRef.current = students
  }, [onScan, onError, onCameraStopped, students])

  // Suppress console noise once
  useEffect(() => {
    const warn = console.warn
    const log = console.log

    console.warn = (...args: any[]) => {
      const msg = args[0]?.toString() || ''
      if (!msg.includes('already playing') && !msg.includes('interrupted')) {
        warn.apply(console, args)
      }
    }

    console.log = (...args: any[]) => {
      const msg = args[0]?.toString() || ''
      if (!msg.includes('already playing') && !msg.includes('Trying to play')) {
        log.apply(console, args)
      }
    }

    return () => {
      console.warn = warn
      console.log = log
    }
  }, [])

  /**
   * Clean up scanner resources - OPTIMIZED
   */
  const cleanup = useCallback(async () => {
    if (isCleaningUpRef.current) return
    
    isCleaningUpRef.current = true
    console.log("🧹 [ZXING] Cleanup started")

    try {
      // Stop scanner controls
      if (scannerControlsRef.current) {
        try {
          await scannerControlsRef.current.stop()
          scannerControlsRef.current = null
          console.log("✅ Scanner controls stopped")
        } catch (err: any) {
          console.warn("⚠️ Scanner stop error:", err)
        }
      }

      // Stop stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
        console.log("✅ Stream tracks stopped")
      }

      // Clear video
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.srcObject = null
        console.log("✅ Video cleared")
      }

      // CRITICAL: Wait for browser to release camera hardware
      await new Promise(resolve => setTimeout(resolve, 100))

      console.log("✅ Cleanup complete")
    } catch (err) {
      console.error("❌ Cleanup error:", err)
    } finally {
      isCleaningUpRef.current = false
    }
  }, [])

  /**
   * Process QR code - OPTIMIZED with ref usage
   */
  const processQRCode = useCallback((decodedText: string): boolean => {
    console.log("🔍 Processing QR code")

    try {
      if (!decodedText.startsWith("{")) {
        setInvalidQRMessage("Invalid QR code format")
        setShowInvalidQRDialog(true)
        return false
      }

      const { isValid, studentData, error: decryptError } = decryptQRData(decodedText)

      if (!isValid || !studentData) {
        setInvalidQRMessage(`Invalid QR: ${decryptError || "Unknown error"}`)
        setShowInvalidQRDialog(true)
        return false
      }

      // Use ref for latest students
      const studentExists = validateStudentInDB(studentData.id, studentsRef.current)

      if (!studentExists) {
        setInvalidQRMessage("Student not found in database")
        setShowInvalidQRDialog(true)
        return false
      }

      const fullStudentData = studentsRef.current.find((s) => s.id === studentData.id)

      if (!fullStudentData) {
        setErrorMessage("Could not retrieve student information")
        setShowErrorDialog(true)
        return false
      }

      console.log("✅ Valid student scanned:", fullStudentData.first_name)
      onScanRef.current(fullStudentData)
      return true
    } catch (err) {
      console.error("❌ QR processing error:", err)
      setErrorMessage("Error processing QR code")
      setShowErrorDialog(true)
      return false
    }
  }, []) // No dependencies!

  /**
   * Start scanner - OPTIMIZED
   */
  const startScanner = useCallback(async () => {
    if (!videoRef.current || !isActive || isCleaningUpRef.current || isInitializing) {
      return
    }

          setIsInitializing(true)
    setError(null)
    hasScannedRef.current = false
    scanStartTimeRef.current = Date.now() // Track scan start time
    scanAttemptsRef.current = 0
    setScanAttempts(0)

    console.log("🚀 Starting scanner")

    try {
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserQRCodeReader()
      }

      let deviceId = cameraDeviceId

      if (!deviceId) {
        const devices = await BrowserQRCodeReader.listVideoInputDevices()
        if (devices.length > 0) {
          const backCamera = devices.find(d =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment")
          )
          deviceId = backCamera?.deviceId || devices[0].deviceId
        }
      }

      // OPTIMIZATION: Configure reader for better performance
      // Note: ZXing browser doesn't expose all configuration options
      // The library handles optimization internally
      
      const controls = await codeReaderRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result: Result | undefined | null, error?: Error) => {
          if (hasScannedRef.current || isSpeaking || !isMountedRef.current) return

          // Track scan attempts using ref for accurate count
          scanAttemptsRef.current++
          if (scanAttemptsRef.current % 10 === 0) {
            // Update state every 10 attempts to show progress without too many re-renders
            setScanAttempts(scanAttemptsRef.current)
          }

          if (result) {
            const scanTime = Date.now() - scanStartTimeRef.current
            console.log(`📸 QR detected in ${scanTime}ms after ${scanAttemptsRef.current} attempts`)
            hasScannedRef.current = true

            const isValid = processQRCode(result.getText())

            if (isValid) {
              // Use requestAnimationFrame for smoother cleanup
              requestAnimationFrame(() => {
                cleanup().then(() => {
                  if (onCameraStoppedRef.current) {
                    onCameraStoppedRef.current()
                  }
                })
              })
            } else {
              // Reset after 500ms instead of 1000ms for faster retry
              setTimeout(() => { hasScannedRef.current = false }, 500)
            }
          }

          if (error &&
              !(error instanceof NotFoundException) &&
              !(error instanceof ChecksumException) &&
              !(error instanceof FormatException)) {
            console.warn("⚠️ Scan error:", error.message)
          }
        }
      )

      scannerControlsRef.current = controls
      if (videoRef.current?.srcObject) {
        streamRef.current = videoRef.current.srcObject as MediaStream
      }

      console.log("✅ Scanner started")
      setIsInitializing(false)
    } catch (err: any) {
      console.error("❌ Start error:", err)
      
      if (err.name === 'AbortError' || err.message?.includes('interrupted')) {
        setIsInitializing(false)
        return
      }
      
      const errorMsg = err.message || "Failed to access camera"
      setError(errorMsg)
      setIsInitializing(false)

      if (onErrorRef.current) {
        onErrorRef.current(errorMsg)
      }
    }
  }, [isActive, isSpeaking, cameraDeviceId, processQRCode, cleanup, isInitializing])

  // Main effect - SIMPLIFIED
  useEffect(() => {
    isMountedRef.current = true

    if (isActive) {
      startScanner()
    } else {
      cleanup()
    }

    return () => {
      isMountedRef.current = false
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, cameraDeviceId]) // Only re-run when these change, not when functions change

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-xl ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover rounded-xl mirror-video"
      />

      <div className="absolute inset-0 pointer-events-none">
        {isActive && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="scan-frame">
              <div className="scan-corner tl" />
              <div className="scan-corner tr" />
              <div className="scan-corner bl" />
              <div className="scan-corner br" />
              <div className="scan-line" />
            </div>
            
            {/* Scan performance indicator */}
            {scanAttempts > 0 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-black/60 text-white px-3 py-1 rounded text-xs backdrop-blur-sm">
                  Scanning... ({scanAttempts} attempts)
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}

        {isSpeaking && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-purple-500/90 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Scanning paused
            </div>
          </div>
        )}

        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="text-center">
              <Camera className="h-12 w-12 text-white mx-auto mb-4 animate-pulse" />
              <p className="text-white text-lg font-medium">Initializing camera...</p>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={showInvalidQRDialog} onOpenChange={setShowInvalidQRDialog}>
        <AlertDialogContent className={`${theme.glass.standard} ${theme.modal.background} ${theme.modal.border} max-w-md`}>
          <AlertDialogHeader>
            <AlertDialogTitle className={`${theme.text.primary} text-xl font-semibold`}>
              Invalid QR Code
            </AlertDialogTitle>
            <AlertDialogDescription className={`${theme.text.secondary} mt-2`}>
              {invalidQRMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction
            onClick={() => {
              setShowInvalidQRDialog(false)
              hasScannedRef.current = false
            }}
            className={`${theme.primary.gradient} ${theme.primary.gradientHover} text-white font-medium py-2 px-4 rounded-lg transition-all duration-200`}
          >
            OK
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent className={`${theme.glass.standard} ${theme.modal.background} ${theme.modal.border} max-w-md`}>
          <AlertDialogHeader>
            <AlertDialogTitle className={`${theme.text.primary} text-xl font-semibold`}>
              Scanner Error
            </AlertDialogTitle>
            <AlertDialogDescription className={`${theme.text.secondary} mt-2`}>
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction
            onClick={() => {
              setShowErrorDialog(false)
              hasScannedRef.current = false
            }}
            className={`${theme.primary.gradient} ${theme.primary.gradientHover} text-white font-medium py-2 px-4 rounded-lg transition-all duration-200`}
          >
            OK
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx>{`
        .mirror-video {
          transform: scaleX(-1);
        }
        
        .scan-frame {
          position: relative;
          width: 16rem;
          height: 16rem;
        }
        
        .scan-corner {
          position: absolute;
          width: 2rem;
          height: 2rem;
          border-color: rgb(192, 132, 252);
        }
        
        .scan-corner.tl {
          top: 0;
          left: 0;
          border-top: 4px solid;
          border-left: 4px solid;
          border-radius: 0.5rem 0 0 0;
        }
        
        .scan-corner.tr {
          top: 0;
          right: 0;
          border-top: 4px solid;
          border-right: 4px solid;
          border-radius: 0 0.5rem 0 0;
        }
        
        .scan-corner.bl {
          bottom: 0;
          left: 0;
          border-bottom: 4px solid;
          border-left: 4px solid;
          border-radius: 0 0 0 0.5rem;
        }
        
        .scan-corner.br {
          bottom: 0;
          right: 0;
          border-bottom: 4px solid;
          border-right: 4px solid;
          border-radius: 0 0 0.5rem 0;
        }
        
        .scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(to right, transparent, rgb(192, 132, 252), transparent);
          animation: scan 2s ease-in-out infinite;
        }
        
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  )
}