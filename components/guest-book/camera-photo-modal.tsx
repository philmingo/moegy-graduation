"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
          w-[95vw] h-[95vh] max-w-2xl
          sm:w-[90vw] sm:h-[90vh] md:w-[85vw] lg:w-[75vw] xl:max-w-3xl
          flex flex-col
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

        <div className="flex-1 flex flex-col gap-3 sm:gap-4 min-h-0">
          {/* Camera/Photo Preview - Portrait aspect ratio to match message card */}
          <div className="relative w-full flex-1 bg-black rounded-lg sm:rounded-xl overflow-hidden">
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
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between items-stretch sm:items-center px-2 sm:px-0 flex-shrink-0">
            {!capturedPhoto ? (
              <>
                {/* Camera Selection - Bottom Left */}
                <div className="flex items-center gap-2 order-2 sm:order-1">
                  {availableCameras.length > 0 && (
                    <select
                      value={selectedCamera}
                      onChange={(e) => {
                        stopCamera()
                        setSelectedCamera(e.target.value)
                      }}
                      disabled={isCapturing}
                      className={`px-2 sm:px-3 py-2 rounded-lg ${theme.glass.standard} ${theme.text.primary} border-0 text-xs sm:text-sm cursor-pointer disabled:opacity-50 w-full sm:w-auto`}
                    >
                      {availableCameras.map((camera, index) => (
                        <option key={camera.deviceId} value={camera.deviceId}>
                          {camera.label || `Camera ${index + 1}`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Right Side Buttons */}
                <div className="flex gap-2 sm:gap-3 order-1 sm:order-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isCapturing}
                    className={`${theme.glass.standard} ${theme.text.primary} flex-1 sm:flex-none text-sm sm:text-base`}
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={startCountdownAndCapture}
                    disabled={isCapturing || !stream}
                    className={`${theme.primary.gradient} flex-1 sm:flex-none text-sm sm:text-base`}
                  >
                    <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    {isCapturing ? "Capturing..." : "Capture Photo"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="hidden sm:block" /> {/* Spacer for alignment on larger screens */}
                <div className="flex gap-2 sm:gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRetake}
                    className={`${theme.glass.standard} ${theme.text.primary} flex-1 sm:flex-none text-sm sm:text-base`}
                  >
                    <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Retake
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirm}
                    className={`${theme.primary.gradient} flex-1 sm:flex-none text-sm sm:text-base`}
                  >
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Confirm Photo
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
