"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Camera, CameraOff, Play, Square, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { currentTheme } from "@/lib/theme-config"
import {
  cleanupCamera,
  createReactCleanup,
  suppressCameraAbortWarnings,
} from "@/lib/utils/camera-cleanup"

interface MobileQrScannerProps {
  onScanSuccess: (decodedText: string, decodedResult: any) => void
  onScanError?: (errorMessage: string) => void
  isConnected: boolean
}

type ScannerState = "idle" | "requesting-permission" | "starting" | "scanning" | "stopping" | "error"
type PermissionState = "unknown" | "granted" | "denied" | "prompt"

const MobileQrScanner: React.FC<MobileQrScannerProps> = ({ onScanSuccess, onScanError, isConnected }) => {
  const [scannerState, setScannerState] = useState<ScannerState>("idle")
  const [permissionState, setPermissionState] = useState<PermissionState>("unknown")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedCameraId, setSelectedCameraId] = useState<string>("")

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const scannerElementId = "mobile-qr-scanner-element" // Ensure this ID is unique if multiple instances
  const { toast } = useToast()

  const log = useCallback((message: string, data?: any) => {
    console.log(`[MobileQrScanner ${new Date().toISOString()}] ${message}`, data || "")
  }, [])

  const stopScanning = useCallback(
    async (showToast = false) => {
      log("Stopping scanner...")
      // Check if already stopping or idle to prevent multiple stop calls
      if (scannerState === "stopping" || scannerState === "idle") {
        setScannerState("idle") // Ensure state is idle
        return
      }
      
      setScannerState("stopping")
      
      try {
        if (html5QrCodeRef.current) {
          const instance = html5QrCodeRef.current
          
          // Use centralized cleanup
          await cleanupCamera(instance, true)
          log("Scanner stopped successfully")
          
          if (showToast) {
            toast({ title: "Scanner Stopped", description: "Camera has been turned off." })
          }
        }
      } catch (error: any) {
        log("Error stopping scanner:", error)
        setErrorMessage(`Error stopping scanner: ${error.message}`)
      } finally {
        setScannerState("idle") // Ensure state is idle even if stop fails
      }
    },
    [log, toast, scannerState],
  )

  const getCamerasAndSetDefault = useCallback(async () => {
    try {
      log("Getting available cameras...")
      const devices = await Html5Qrcode.getCameras()
      log("Available cameras:", devices)
      if (devices && devices.length > 0) {
        const backCamera = devices.find(
          (camera) => camera.label.toLowerCase().includes("back") || camera.label.toLowerCase().includes("environment"),
        )
        const selectedCamera = backCamera || devices[0]
        setSelectedCameraId(selectedCamera.id)
        log("Selected camera:", selectedCamera)
        return true
      } else {
        throw new Error("No cameras found on this device")
      }
    } catch (error: any) {
      log("Error getting cameras:", error.message)
      setErrorMessage(`Failed to get cameras: ${error.message}`)
      return false
    }
  }, [log])

  const checkCameraPermissions = useCallback(async () => {
    log("Checking camera permissions...")
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser")
      }
      if ("permissions" in navigator) {
        const permission = await navigator.permissions.query({ name: "camera" as PermissionName })
        log("Permission state:", permission.state)
        setPermissionState(permission.state as PermissionState)
        if (permission.state === "granted") {
          await getCamerasAndSetDefault()
        }
        permission.onchange = async () => {
          log("Permission state changed:", permission.state)
          setPermissionState(permission.state as PermissionState)
          if (permission.state === "granted") {
            await getCamerasAndSetDefault()
          } else {
            setSelectedCameraId("")
            if (scannerState === "scanning") await stopScanning()
          }
        }
      } else {
        // Fallback for browsers without navigator.permissions
        await getCamerasAndSetDefault() // This will prompt if needed
        setPermissionState("granted") // Assume granted if getCameras succeeds
      }
      return true
    } catch (error: any) {
      log("Error checking permissions:", error.message)
      setPermissionState("denied")
      setErrorMessage(`Camera permission check failed: ${error.message}`)
      return false
    }
  }, [log, getCamerasAndSetDefault, scannerState, stopScanning])

  const requestCameraAccess = useCallback(async () => {
    log("Requesting camera access...")
    setScannerState("requesting-permission")
    setErrorMessage(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }, // Prefer back camera
      })
      log("Camera access granted")
      setPermissionState("granted")
      stream.getTracks().forEach((track) => track.stop()) // Stop the tracks from this temporary stream
      const success = await getCamerasAndSetDefault() // Now get the list and set default
      if (success) {
        setScannerState("idle") // Go to idle, ready for user to click "Start Scanning"
        return true
      } else {
        throw new Error("Failed to get cameras after permission granted")
      }
    } catch (error: any) {
      log("Camera access error:", error)
      setPermissionState("denied")
      setScannerState("error")
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setErrorMessage("Camera access denied. Please allow camera permissions in your browser settings and try again.")
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setErrorMessage("No camera found on this device.")
      } else {
        setErrorMessage(`Camera error: ${error.message || "Unknown camera error"}`)
      }
      toast({ title: "Camera Access Error", description: error.message, variant: "destructive" })
      return false
    }
  }, [log, toast, getCamerasAndSetDefault])

  const startScanning = useCallback(async () => {
    if (!isConnected) {
      toast({ title: "Not Connected", description: "Please wait for connection to desktop.", variant: "destructive" })
      return
    }
    if (!selectedCameraId) {
      log("No camera selected, attempting to get one.")
      const gotCamera = await getCamerasAndSetDefault()
      if (!gotCamera || !selectedCameraId) {
        // Re-check selectedCameraId
        setErrorMessage("No camera available. Please check permissions or ensure a camera is connected.")
        toast({ title: "Camera Issue", description: "No camera selected or available.", variant: "destructive" })
        return
      }
    }

    log("Starting scanner with camera:", selectedCameraId)
    setScannerState("starting")
    setErrorMessage(null)
    const scannerElement = document.getElementById(scannerElementId)
    if (scannerElement) {
      scannerElement.innerHTML = "" // Clear previous content
    } else {
      log("Scanner element not found in DOM")
      setErrorMessage("Scanner UI element not found. Cannot start scanning.")
      setScannerState("error")
      return
    }

    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear() // Clear any previous instance
      }
      html5QrCodeRef.current = new Html5Qrcode(scannerElementId, { verbose: false })
      const qrCodeSuccessCallback = (decodedText: string, decodedResult: any) => {
        log("QR Code scanned successfully:", decodedText)

        // Add vibration feedback
        if ("vibrate" in navigator) navigator.vibrate(100)

        // Visual feedback
        if (scannerElement) {
          scannerElement.style.border = "4px solid #10B981" // Green border for success
          setTimeout(() => {
            if (scannerElement) scannerElement.style.border = ""
          }, 1000)
        }

        // Process the QR code data
        try {
          let studentData: any = null

          // Try to parse as JSON first
          try {
            const qrData = JSON.parse(decodedText)
            log("Parsed QR data as JSON:", qrData)

            // Handle different QR code formats
            if (qrData.id && qrData.n) {
              // Format 1: {id, n, p?, t, v}
              studentData = {
                id: qrData.id,
                name: qrData.n,
                phonetic: qrData.p,
                type: qrData.t || 1,
                verify: qrData.v || btoa(qrData.id).substring(0, 8),
              }
            } else if (qrData.studentId && qrData.name) {
              // Format 2: {studentId, name, phoneticSpelling?, ...}
              studentData = {
                id: qrData.studentId,
                name: qrData.name,
                phonetic: qrData.phoneticSpelling,
                type: 1,
                verify: qrData.verify || btoa(qrData.studentId).substring(0, 8),
              }
            } else if (qrData.first_name && qrData.last_name) {
              // Format 3: Database format {id, first_name, last_name, phonetic_spelling?, ...}
              studentData = {
                id: qrData.id,
                name: `${qrData.first_name} ${qrData.last_name}`,
                phonetic: qrData.phonetic_spelling,
                type: 1,
                verify: qrData.verify || btoa(qrData.id).substring(0, 8),
              }
            } else {
              throw new Error("QR code format not recognized")
            }
          } catch (jsonError) {
            log("QR code is not JSON, trying as plain text:", decodedText)

            // Handle plain text QR codes (fallback)
            // Assume it's a student ID or name
            studentData = {
              id: decodedText,
              name: decodedText,
              type: 1,
              verify: btoa(decodedText).substring(0, 8),
            }
          }

          if (!studentData || !studentData.id || !studentData.name) {
            throw new Error("Invalid QR code: missing required student information")
          }

          log("Processed student data:", studentData)
          onScanSuccess(JSON.stringify(studentData), decodedResult)
        } catch (error: any) {
          log("Error processing QR code:", error)
          // Still call onScanSuccess with the raw data so the parent can handle it
          onScanSuccess(decodedText, decodedResult)
        }
      }
      const qrCodeErrorCallback = (error: any) => {
        // More selective logging for common "not found" errors
        if (!error.message || !error.message.toLowerCase().includes("not found")) {
          log("Scanner error (non-critical):", error.message || error)
        }
        if (onScanError && typeof error.message === "string" && !error.message.toLowerCase().includes("not found")) {
          onScanError(error.message)
        }
      }
      await html5QrCodeRef.current.start(
        selectedCameraId,
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
            const qrboxSize = Math.floor(minEdge * 0.75) // Slightly larger qrbox
            return { width: qrboxSize, height: qrboxSize }
          },
          aspectRatio: 1.0, // Square aspect ratio for the scanning box
        },
        qrCodeSuccessCallback,
        qrCodeErrorCallback,
      )
      log("Scanner started successfully")
      setScannerState("scanning")
    } catch (error: any) {
      log("Error starting scanner:", error)
      setScannerState("error")
      setErrorMessage(`Failed to start scanner: ${error.message}`)
      toast({
        title: "Scanner Error",
        description: `Could not start scanner: ${error.message}`,
        variant: "destructive",
      })
    }
  }, [selectedCameraId, isConnected, onScanSuccess, onScanError, log, toast, getCamerasAndSetDefault])

  // Effect to stop scanning when the component unmounts or is hidden
  // Using centralized cleanup utility
  useEffect(() => {
    log("Mobile scanner mounted")
    return createReactCleanup(html5QrCodeRef, true)
  }, [log])
  
  // Suppress camera abort warnings
  useEffect(() => {
    return suppressCameraAbortWarnings()
  }, [])

  // Effect to initialize camera permissions check
  useEffect(() => {
    checkCameraPermissions()
  }, [checkCameraPermissions])

  const getPermissionDisplay = () => {
    switch (permissionState) {
      case "granted":
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-400" />,
          text: "Camera access granted",
          color: "text-green-300",
        }
      case "denied":
        return {
          icon: <CameraOff className="w-5 h-5 text-red-400" />,
          text: "Camera access denied",
          color: "text-red-300",
        }
      case "prompt":
        return {
          icon: <Camera className="w-5 h-5 text-yellow-400" />,
          text: "Camera permission required",
          color: "text-yellow-300",
        }
      default:
        return {
          icon: <Camera className="w-5 h-5 text-gray-400" />,
          text: "Checking camera access...",
          color: "text-gray-300",
        }
    }
  }
  const permissionDisplay = getPermissionDisplay()

  // Remove the old theming variables and replace with theme-based styling

  return (
    <div
      className={`w-full max-w-md mx-auto ${currentTheme.glass.standard} p-4 rounded-lg shadow-md border border-white/20`}
    >
      <div
        className={`mb-3 p-2.5 ${currentTheme.glass.light} rounded-md flex items-center gap-2 border border-white/10`}
      >
        {permissionDisplay.icon}
        <span className={`text-sm font-medium ${permissionDisplay.color}`}>{permissionDisplay.text}</span>
      </div>

      <div className="relative bg-black/20 backdrop-blur-sm rounded overflow-hidden aspect-square border-2 border-white/30">
        <div
          id={scannerElementId}
          className="w-full h-full bg-black/40"
          style={{ visibility: scannerState === "scanning" ? "visible" : "hidden", minHeight: "250px" }}
        />
        {scannerState !== "scanning" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="text-center p-4">
              {scannerState === "requesting-permission" && (
                <>
                  <Loader2 className="w-10 h-10 text-white animate-spin mx-auto mb-2" />
                  <p className="text-white text-sm">Requesting camera...</p>
                </>
              )}
              {scannerState === "starting" && (
                <>
                  <Loader2 className="w-10 h-10 text-white animate-spin mx-auto mb-2" />
                  <p className="text-white text-sm">Starting camera...</p>
                </>
              )}
              {scannerState === "stopping" && (
                <>
                  <Loader2 className="w-10 h-10 text-white animate-spin mx-auto mb-2" />
                  <p className="text-white text-sm">Stopping camera...</p>
                </>
              )}
              {scannerState === "idle" && permissionState === "granted" && (
                <>
                  <Camera className="w-10 h-10 text-white/70 mx-auto mb-2" />
                  <p className="text-white/70 text-sm">Ready to scan</p>
                </>
              )}
              {scannerState === "idle" && permissionState !== "granted" && (
                <>
                  <CameraOff className="w-10 h-10 text-white/70 mx-auto mb-2" />
                  <p className="text-white/70 text-sm">Camera access needed</p>
                </>
              )}
              {scannerState === "error" && (
                <>
                  <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                  <p className="text-red-400 text-sm">Scanner error</p>
                </>
              )}
            </div>
          </div>
        )}
        {scannerState === "scanning" && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[70%] h-[70%] border-2 border-gold/70 rounded-lg relative">
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-gold rounded-tl-md"></div>
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-gold rounded-tr-md"></div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-gold rounded-bl-md"></div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-gold rounded-br-md"></div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {permissionState !== "granted" && (
          <Button
            onClick={requestCameraAccess}
            disabled={scannerState === "requesting-permission"}
            className={`w-full ${currentTheme.primary.gradient} text-white`}
          >
            {scannerState === "requesting-permission" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Requesting...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Allow Camera
              </>
            )}
          </Button>
        )}
        {permissionState === "granted" && (scannerState === "idle" || scannerState === "starting") && (
          <Button
            onClick={startScanning}
            disabled={!isConnected || !selectedCameraId || scannerState === "starting"}
            className={`w-full ${currentTheme.primary.gradient} text-white`}
          >
            {scannerState === "starting" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Scanning
              </>
            )}
          </Button>
        )}
        {scannerState === "scanning" && (
          <Button onClick={() => stopScanning(true)} className="w-full bg-red-600 hover:bg-red-700 text-white">
            <Square className="w-4 h-4 mr-2" />
            Stop Scanning
          </Button>
        )}
      </div>

      {errorMessage && (
        <div className="mt-3 p-2.5 bg-red-500/20 border border-red-500/30 rounded-md backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 text-sm">{errorMessage}</span>
          </div>
        </div>
      )}
      <div className="mt-3 text-center">
        <p className="text-white/70 text-xs">
          {scannerState === "scanning"
            ? "Position QR code within the viewfinder"
            : permissionState === "granted"
              ? "Press 'Start Scanning'"
              : "Allow camera access to begin"}
        </p>
      </div>
    </div>
  )
}
export default MobileQrScanner
