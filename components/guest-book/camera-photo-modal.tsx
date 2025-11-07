"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, X, RotateCcw, Check } from "lucide-react"
import { currentTheme } from "@/lib/theme-config"
import { toast } from "sonner"

interface CameraPhotoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPhotoConfirmed: (photoDataUrl: string) => void
}

export function CameraPhotoModal({
  open,
  onOpenChange,
  onPhotoConfirmed,
}: CameraPhotoModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const theme = currentTheme

  // Helper function to get a friendly camera label
  const getCameraLabel = (camera: MediaDeviceInfo, index: number): string => {
    if (camera.label) {
      // If the device has a label, use it
      const label = camera.label.toLowerCase()
      
      // Try to identify camera position from label
      if (label.includes('back') || label.includes('rear') || label.includes('environment')) {
        return `Back Camera (${camera.label})`
      } else if (label.includes('front') || label.includes('user') || label.includes('face')) {
        return `Front Camera (${camera.label})`
      }
      
      // Use the full label if we can't determine position
      return camera.label
    }
    
    // Fallback: use generic names based on typical camera ordering
    // Usually, the first camera is back/environment and second is front/user
    if (index === 0) {
      return 'Back Camera'
    } else if (index === 1) {
      return 'Front Camera'
    }
    
    return `Camera ${index + 1}`
  }

  // Get available cameras when modal opens
  useEffect(() => {
    if (open) {
      enumerateCameras()
    }
  }, [open])

  // Initialize camera when modal opens or camera changes
  useEffect(() => {
    if (open && !capturedPhoto && selectedCamera) {
      startCamera(selectedCamera)
    }

    return () => {
      stopCamera()
    }
  }, [open, selectedCamera])

  // Enumerate available cameras
  const enumerateCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === "videoinput")
      setAvailableCameras(videoDevices)
      
      // Auto-select first camera if none selected
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId)
      }
    } catch (error) {
      console.error("Error enumerating cameras:", error)
      toast.error("Failed to get camera list")
    }
  }

  // Start camera stream with specific device
  const startCamera = async (deviceId: string) => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      toast.error("Failed to access camera. Please check permissions.")
    }
  }

  // Stop camera stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  // Handle countdown and capture
  const startCountdownAndCapture = useCallback(() => {
    if (isCapturing) return

    setIsCapturing(true)
    setCountdown(3)

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval)
          // Capture photo after countdown reaches 0
          setTimeout(() => {
            capturePhoto()
            setCountdown(null)
            setIsCapturing(false)
          }, 1000)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [isCapturing])

  // Capture photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert canvas to data URL
      const photoDataUrl = canvas.toDataURL("image/png")
      setCapturedPhoto(photoDataUrl)

      // Stop camera after capture
      stopCamera()
    }
  }

  // Handle retake
  const handleRetake = () => {
    setCapturedPhoto(null)
    setCountdown(null)
    if (selectedCamera) {
      startCamera(selectedCamera)
    }
  }

  // Handle confirm
  const handleConfirm = () => {
    if (capturedPhoto) {
      onPhotoConfirmed(capturedPhoto)
      handleClose()
    }
  }

  // Handle close
  const handleClose = () => {
    stopCamera()
    setCapturedPhoto(null)
    setCountdown(null)
    setIsCapturing(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className={`
          ${theme.modal.background} 
          ${theme.modal.border}
          w-[95vw] sm:w-[85vw] md:w-[75vw] lg:w-[600px] max-w-[600px]
          max-h-[85vh] overflow-y-auto
          flex flex-col
          p-4 sm:p-6
        `}
      >
        <DialogHeader className="flex-shrink-0 relative">
          <DialogTitle className={`text-xl sm:text-2xl font-bold ${theme.text.primary} pr-10`}>
            {capturedPhoto ? "Review Your Photo" : "Take Your Photo"}
          </DialogTitle>
          <button
            onClick={handleClose}
            className={`absolute right-0 top-0 p-2 rounded-lg ${theme.glass.standard} ${theme.text.primary} hover:bg-white/20 transition-colors`}
            disabled={isCapturing}
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:gap-4 py-4">
          {/* Camera/Photo Preview - Portrait aspect ratio (3:4) to match message card */}
          <div 
            className="relative w-full bg-black rounded-lg sm:rounded-xl overflow-hidden mx-auto"
            style={{ 
              aspectRatio: '3/4', 
              maxHeight: '55vh',
              maxWidth: 'min(100%, calc(55vh * 0.75))'
            }}
          >
            {!capturedPhoto ? (
              <>
                {/* Live Video Feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Countdown Overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="text-white text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold animate-pulse">
                      {countdown === 0 ? "📸" : countdown}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Captured Photo Preview */
              <img
                src={capturedPhoto}
                alt="Captured photo"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Instructions */}
          <div className="flex-shrink-0">
            {!capturedPhoto && !isCapturing && (
              <p className={`text-center text-xs sm:text-sm ${theme.text.secondary} px-2`}>
                Position yourself in the center and click "Capture Photo" to start the 3-second countdown
              </p>
            )}

            {capturedPhoto && (
              <p className={`text-center text-xs sm:text-sm ${theme.text.secondary} px-2`}>
                Happy with your photo? Confirm to use it, or retake if you'd like to try again.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 flex-shrink-0">
            {!capturedPhoto ? (
              <>
                {/* Camera Selection */}
                {availableCameras.length > 0 && (
                  <div className="w-full">
                    <Select
                      value={selectedCamera}
                      onValueChange={(value) => {
                        stopCamera()
                        setSelectedCamera(value)
                      }}
                      disabled={isCapturing}
                    >
                      <SelectTrigger className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg ${theme.glass.standard} ${theme.text.primary} border-0 text-xs sm:text-sm disabled:opacity-50`}>
                        <SelectValue placeholder="Select camera" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCameras.map((camera, index) => (
                          <SelectItem key={camera.deviceId} value={camera.deviceId}>
                            {getCameraLabel(camera, index)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="flex gap-2 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isCapturing}
                    className={`${theme.glass.standard} ${theme.text.primary} flex-1 text-xs sm:text-sm py-2 sm:py-2.5 px-2 sm:px-4`}
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={startCountdownAndCapture}
                    disabled={isCapturing || !stream}
                    className={`${theme.primary.gradient} flex-1 text-xs sm:text-sm py-2 sm:py-2.5 px-2 sm:px-4`}
                  >
                    <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    {isCapturing ? "Capturing..." : "Capture"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Review Buttons Row */}
                <div className="flex gap-2 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRetake}
                    className={`${theme.glass.standard} ${theme.text.primary} flex-1 text-xs sm:text-sm py-2 sm:py-2.5 px-2 sm:px-4`}
                  >
                    <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Retake
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirm}
                    className={`${theme.primary.gradient} flex-1 text-xs sm:text-sm py-2 sm:py-2.5 px-2 sm:px-4`}
                  >
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Confirm
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
