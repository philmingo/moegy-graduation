"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  type Html5QrcodeResult,
  Html5QrcodeScannerState,
  type Html5QrcodeCameraScanConfig,
  type Html5QrcodeFullConfig,
} from "html5-qrcode"
import { currentTheme } from "@/lib/theme-config"
import { AlertTriangle } from "lucide-react"
import { decryptQRData, validateStudentInDB } from "@/lib/qr-utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  cleanupCamera,
  createReactCleanup,
  suppressCameraAbortWarnings,
  stopAllVideoElements,
} from "@/lib/utils/camera-cleanup"

interface QrScannerProps {
  onScan: (studentData: any) => void
  onError: (errorMessage: string | any) => void
  className?: string
  onScanError?: (errorMessage: string) => void
  students: any[]
  isActive?: boolean
  isSpeaking?: boolean
  onCameraStopped?: () => void
}

export function QrScanner({ onScan, onError, className, onScanError, students, isActive = true, isSpeaking = false, onCameraStopped }: QrScannerProps) {
  const scannerContainerId = "qr-reader"
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const [cameraError, setCameraError] = useState(false)
  const [scanAttempts, setScanAttempts] = useState(0)
  const hasScannedRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scannerKey, setScannerKey] = useState(0)

  // Error handling states
  const [showInvalidQRDialog, setShowInvalidQRDialog] = useState(false)
  const [invalidQRMessage, setInvalidQRMessage] = useState("")
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  // Extract theme colors for scanner styling
  const scannerTheme = currentTheme.scanner
  const mainTheme = currentTheme

  // Helper function to extract RGB values from Tailwind classes
  const extractRGBFromTailwind = (tailwindClass: string): string => {
    if (tailwindClass.includes("purple-400")) return "168, 85, 247"
    if (tailwindClass.includes("purple-500")) return "147, 51, 234"
    if (tailwindClass.includes("purple-600")) return "124, 58, 237"
    return "168, 85, 247"
  }

  // Get RGB values from theme
  const cornerBorderRGB = extractRGBFromTailwind(scannerTheme.corners.border)
  const regionBorderRGB = extractRGBFromTailwind(scannerTheme.region.border)

  // Reset scan state function
  const resetScanState = useCallback(() => {
    hasScannedRef.current = false
  }, [])

  // Show invalid QR dialog
  const showInvalidQR = useCallback((message: string) => {
    setInvalidQRMessage(message)
    setShowInvalidQRDialog(true)
  }, [])

  // Show error dialog
  const showError = useCallback((message: string) => {
    setErrorMessage(message)
    setShowErrorDialog(true)
  }, [])
  // Process scanned QR code with validation
  const processScannedQR = useCallback(
    (decodedText: string) => {
      try {
        // Step 1: Decrypt and validate QR code format
        const { isValid, studentData, error } = decryptQRData(decodedText)

        if (!isValid) {
          setInvalidQRMessage(`Invalid QR code: ${error}`)
          setShowInvalidQRDialog(true)
          return false
        }

        // Step 2: Validate student exists in database
        if (!studentData || !validateStudentInDB(studentData.id, students)) {
          setInvalidQRMessage("Student not found in database")
          setShowInvalidQRDialog(true)
          return false
        }

        // Step 3: Find full student data
        const fullStudentData = students.find((s) => s.id === studentData.id)
        if (!fullStudentData) {
          setErrorMessage("Could not retrieve student information")
          setShowErrorDialog(true)
          return false
        }

        // Step 4: Process the student
        onScan(fullStudentData)
        return true
      } catch (error) {
        console.error("Error processing QR code:", error)
        setErrorMessage("Error processing QR code")
        setShowErrorDialog(true)
        return false
      }
    },
    [students, onScan],
  )  // Main scanner effect
  useEffect(() => {
    if (!isActive) {
      return
    }

    hasScannedRef.current = false
    setCameraError(false)

    // Make sure the container exists
    if (!containerRef.current) {
      console.error("QR Scanner container ref not found")
      onError("QR Scanner container ref not found.")
      return
    }

    // Helper function to stop camera and cleanup using centralized utility
    const stopCameraAndCleanup = async () => {
      const currentInstance = html5QrCodeRef.current
      await cleanupCamera(currentInstance, false) // Don't clear UI, we'll remount
      
      // Notify parent component that camera has stopped
      if (onCameraStopped) {
        onCameraStopped()
      }
    }    // Local QR processing function
    const localProcessScannedQR = (decodedText: string) => {
      console.log("🔍 [SCANNER] Processing QR code with text:", decodedText.substring(0, 50))
      
      try {
        // Simple test for invalid QR (if it doesn't start with { it's probably invalid)
        if (!decodedText.startsWith('{')) {
          console.log("🔍 [SCANNER] Simple invalid QR test triggered")
          setInvalidQRMessage("Invalid QR code format - not JSON")
          setShowInvalidQRDialog(true)
          
          setTimeout(() => {
            stopCameraAndCleanup()
          }, 500)
          return false
        }        // Step 1: Decrypt and validate QR code format
        const { isValid, studentData, error } = decryptQRData(decodedText)

        if (!isValid) {
          // Stop camera and show error dialog
          console.log("🔍 [SCANNER] Invalid QR detected, showing dialog...")
          setInvalidQRMessage(`Invalid QR code: ${error}`)
          setShowInvalidQRDialog(true)
            // Stop scanner without notifying parent (to keep component mounted)
          // Use centralized cleanup for invalid QR
          const currentInstance = html5QrCodeRef.current
          if (currentInstance) {
            cleanupCamera(currentInstance, false)
              .then(() => {
                console.log("Camera stopped for invalid QR - component stays mounted")
              })
              .catch((err) => {
                console.warn("Error stopping camera:", err)
              })
          }
          
          return false
        }// Step 2: Validate student exists in database
        if (!studentData || !validateStudentInDB(studentData.id, students)) {
          // Stop camera and show error dialog
          console.log("🔍 [SCANNER] Student not found, showing dialog...")
          setInvalidQRMessage("Student not found in database")
          setShowInvalidQRDialog(true)
          stopCameraAndCleanup()
          return false
        }        // Step 3: Find full student data
        const fullStudentData = students.find((s) => s.id === studentData.id)
        if (!fullStudentData) {
          // Stop camera and show error dialog
          console.log("🔍 [SCANNER] Student info not found, showing error dialog...")
          setErrorMessage("Could not retrieve student information")
          setShowErrorDialog(true)
          stopCameraAndCleanup()
          return false
        }

        // Step 4: Process the student
        onScan(fullStudentData)
        return true      } catch (error) {
        console.error("Error processing QR code:", error)
        // Stop camera and show error dialog
        console.log("🔍 [SCANNER] Processing error, showing error dialog...")
        setErrorMessage("Error processing QR code")
        setShowErrorDialog(true)
        stopCameraAndCleanup()
        return false      }
    }

    // Create or clear the qr-reader element
    let qrReaderElement = document.getElementById(scannerContainerId)
    if (!qrReaderElement) {
      qrReaderElement = document.createElement("div")
      qrReaderElement.id = scannerContainerId
      qrReaderElement.className = "w-full h-full"
      containerRef.current.appendChild(qrReaderElement)
    } else {
      qrReaderElement.innerHTML = ""
    }    // Scanner configuration
    const scannerConfig: Html5QrcodeFullConfig = {
      verbose: false,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    }

    const newScannerInstance = new Html5Qrcode(scannerContainerId, scannerConfig)
    html5QrCodeRef.current = newScannerInstance

    // Start configuration - dynamic qrbox with minimum size constraint
    const startConfig: Html5QrcodeCameraScanConfig = {
      fps: 10, 
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
        const qrboxSize = Math.max(250, Math.floor(minEdge * 0.5)) // 50% of viewport, minimum 250px
        return { width: qrboxSize, height: qrboxSize }
      },
      disableFlip: false,
      aspectRatio: 1.0, // Square aspect ratio for the scanning box
    }    // Success callback
    const qrCodeSuccessCallback = async (decodedText: string, result: Html5QrcodeResult) => {
      if (hasScannedRef.current) {
        return // Silently ignore subsequent scans
      }

      // Block scanning if currently announcing
      if (isSpeaking) {
        console.log("🔊 [SCANNER] Scan blocked - announcement in progress")
        return
      }

      hasScannedRef.current = true
      console.log("🎯 [SCANNER] QR code detected and processing...")

      // Stop the scanner immediately
      const currentInstance = html5QrCodeRef.current
      if (currentInstance) {
        try {
          const scannerState = currentInstance.getState()
          if (scannerState === Html5QrcodeScannerState.SCANNING || scannerState === Html5QrcodeScannerState.PAUSED) {
            await currentInstance.stop()
            console.log("✅ [SCANNER] Scanner stopped")
          }
        } catch (err) {
          console.warn("Scanner stop warning:", err)
        }
      }

      // Clean up video streams using centralized utility
      stopAllVideoElements()

      // Process the QR code
      const processResult = localProcessScannedQR(decodedText)
      console.log("✅ [SCANNER] QR processing completed:", processResult ? "success" : "failed")
    }

    // Error callback
    const qrCodeErrorCallback = (errorMessage: string, error: any) => {
      // Add debug logging to see if error callback is being called too much
      if (!errorMessage.toLowerCase().includes("not found") && 
          !errorMessage.toLowerCase().includes("no qr code found") &&
          !errorMessage.toLowerCase().includes("no multiformat readers")) {
        console.log("🔍 [DEBUG] Scanner error:", errorMessage.substring(0, 100))
      }

      // Only handle critical errors
      const isCriticalError =
        errorMessage.includes("NotAllowedError") ||
        errorMessage.includes("Camera access denied") ||
        errorMessage.includes("OverconstrainedError") ||
        errorMessage.includes("NotReadableError") ||
        (error && (error.name === "NotAllowedError" || error.name === "NotReadableError"))

      if (isCriticalError) {
        console.error("Critical camera error:", errorMessage)
        setCameraError(true)
        onError(errorMessage)
      }

      // Don't log normal scan errors to reduce console spam
      const isNormalScanError =
        errorMessage.toLowerCase().includes("not found") ||
        errorMessage.toLowerCase().includes("no qr code found") ||
        errorMessage.toLowerCase().includes("no multiformat readers")

      if (!isNormalScanError) {
        setScanAttempts((prev) => prev + 1)
        if (onScanError) {
          onScanError(errorMessage)
        }
      }
    }    // Initialize scanner
    const initializeScanner = async () => {
      try {
        // Try environment camera first, fallback to user camera
        let cameraConstraint: any = { facingMode: "environment" }

        try {
          await newScannerInstance.start(cameraConstraint, startConfig, qrCodeSuccessCallback, qrCodeErrorCallback)
          console.log("Camera started successfully")
        } catch (envCameraError) {
          console.log("Environment camera failed, trying user camera")
          cameraConstraint = { facingMode: "user" }
          await newScannerInstance.start(cameraConstraint, startConfig, qrCodeSuccessCallback, qrCodeErrorCallback)
          console.log("User camera started successfully")
        }
      } catch (err: any) {
        const errMsg = err instanceof Error ? err.message : String(err)
        console.error("Failed to start scanner:", errMsg)
        setCameraError(true)
        onError(errMsg)

        // Clean up on initialization failure
        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.clear()
          } catch (clearError) {
            console.warn("Failed to clear scanner UI:", clearError)
          }
        }
      }
    }

    initializeScanner()

    // Cleanup function using centralized utility
    return createReactCleanup(html5QrCodeRef, true)
  }, [scannerKey, isActive])
  // External control effect - using centralized cleanup
  useEffect(() => {
    if (!isActive && html5QrCodeRef.current) {
      console.log("External stop requested")
      const instance = html5QrCodeRef.current
      html5QrCodeRef.current = null
      
      // Use centralized cleanup for external stop
      cleanupCamera(instance, true).catch((error) => {
        console.error("Error during external stop cleanup:", error)
      })
    } else if (isActive) {
      hasScannedRef.current = false
    }
  }, [isActive])

  // Suppress Html5Qrcode camera abort warnings
  useEffect(() => {
    return suppressCameraAbortWarnings()
  }, [])

  // Inject CSS to style the scanner elements
  useEffect(() => {
    const styleId = "qr-scanner-custom-styles"

    // Remove existing styles if any
    const existingStyle = document.getElementById(styleId)
    if (existingStyle) {
      existingStyle.remove()
    }

    // Create and inject custom CSS using theme colors
    const style = document.createElement("style")
    style.id = styleId
    style.textContent = `
      /* Override the default border styling with theme colors */
      #qr-shaded-region {
        border-color: rgba(${regionBorderRGB}, 0.4) !important;
      }

      /* Style the corner brackets with theme colors */
      #qr-shaded-region > div {
        background-color: rgb(${cornerBorderRGB}) !important;
        box-shadow: ${scannerTheme.centerDot.shadow.replace("rgba(168,85,247,0.6)", `rgba(${cornerBorderRGB}, 0.6)`)} !important;
      }

      /* Make horizontal brackets shorter */
      #qr-shaded-region > div[style*="width: 40px"] {
        width: 30px !important;
        height: 4px !important;
      }

      /* Make vertical brackets shorter */
      #qr-shaded-region > div[style*="height: 45px"] {
        height: 30px !important;
        width: 4px !important;
      }

      /* Style the video element */
      #${scannerContainerId} video {
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
        border-radius: 1rem !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
      }

      /* Ensure the scanner container fills properly */
      #${scannerContainerId} {
        width: 100% !important;
        height: 100% !important;
        position: relative !important;
        border-radius: 1rem !important;
        overflow: hidden !important;
      }

      /* Style the scanning region overlay */
      #qr-shaded-region {
        border-radius: 1rem !important;
        border-color: rgba(${regionBorderRGB}, 0.4) !important;
      }

      /* Add scanning animation */
      @keyframes scannerPulse {
        0%, 100% { 
          box-shadow: 0 0 8px rgba(${cornerBorderRGB}, 0.3);
        }
        50% { 
          box-shadow: 0 0 15px rgba(${cornerBorderRGB}, 0.8);
        }
      }

      #qr-shaded-region > div {
        animation: scannerPulse 2s ease-in-out infinite;
      }
    `

    document.head.appendChild(style)

    return () => {
      const styleToRemove = document.getElementById(styleId)
      if (styleToRemove) {
        styleToRemove.remove()
      }
    }
  }, [scannerContainerId, cornerBorderRGB, regionBorderRGB, scannerTheme])

  return (
    <div className={`h-full w-full relative overflow-hidden rounded-xl ${className || ""}`} ref={containerRef}>      {/* Camera Error Display */}
      {cameraError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm text-center backdrop-blur-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Camera access error. Please check permissions.
          </div>
        </div>
      )}

      {/* Speaking/Announcement In Progress Indicator */}
      {isSpeaking && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-purple-500/90 text-white px-4 py-2 rounded-lg text-sm text-center backdrop-blur-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Announcement in progress - scanning paused
          </div>
        </div>
      )}      {/* Invalid QR Code Dialog */}
      <AlertDialog open={showInvalidQRDialog} onOpenChange={setShowInvalidQRDialog}>
        <AlertDialogContent className={`${mainTheme.glass.standard} ${mainTheme.modal.background} ${mainTheme.modal.border} max-w-md`}>
          <AlertDialogHeader>
            <AlertDialogTitle className={`${mainTheme.text.primary} text-xl font-semibold`}>
              Invalid QR Code
            </AlertDialogTitle>
            <AlertDialogDescription className={`${mainTheme.text.secondary} mt-2`}>
              {invalidQRMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>          <AlertDialogAction 
            onClick={() => {
              setShowInvalidQRDialog(false)
              // Now notify parent to stop scanning
              if (onCameraStopped) {
                onCameraStopped()
              }
            }}
            className={`${mainTheme.primary.gradient} ${mainTheme.primary.gradientHover} text-white font-medium py-2 px-4 rounded-lg transition-all duration-200`}
          >
            OK
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent className={`${mainTheme.glass.standard} ${mainTheme.modal.background} ${mainTheme.modal.border} max-w-md`}>
          <AlertDialogHeader>
            <AlertDialogTitle className={`${mainTheme.text.primary} text-xl font-semibold`}>
              Scanner Error
            </AlertDialogTitle>
            <AlertDialogDescription className={`${mainTheme.text.secondary} mt-2`}>
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>          <AlertDialogAction 
            onClick={() => {
              setShowErrorDialog(false)
              // Now notify parent to stop scanning  
              if (onCameraStopped) {
                onCameraStopped()
              }
            }}
            className={`${mainTheme.primary.gradient} ${mainTheme.primary.gradientHover} text-white font-medium py-2 px-4 rounded-lg transition-all duration-200`}
          >
            OK
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
