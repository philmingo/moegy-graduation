"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QrScanner } from "@/components/qr-scanner"
import { HandwritingCanvas } from "./handwriting-canvas"
import { type Student } from "@/lib/actions/students"
import { createGuestBookMessage } from "@/lib/actions/guest-book"
import { currentTheme } from "@/lib/theme-config"
import { Loader2, Check, X } from "lucide-react"
import { toast } from "sonner"
import { suppressCameraAbortWarnings } from "@/lib/utils/camera-cleanup"

interface GuestBookMessageCreatorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  students: Student[]
  onMessageCreated: () => void
}

type Step = "scan" | "draw" | "review"

export function GuestBookMessageCreator({
  open,
  onOpenChange,
  students,
  onMessageCreated,
}: GuestBookMessageCreatorProps) {
  const [step, setStep] = useState<Step>("scan")
  const [scannedStudent, setScannedStudent] = useState<Student | null>(null)
  const [imageData, setImageData] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [isScannerActive, setIsScannerActive] = useState(true)
  const theme = currentTheme

  // Suppress camera abort warnings using centralized utility
  useEffect(() => {
    return suppressCameraAbortWarnings()
  }, [])

  // Handle QR scan
  const handleScan = useCallback((studentData: Student) => {
    setScannedStudent(studentData)
    setIsScannerActive(false)
    setStep("draw")
  }, [])

  // Handle scan error
  const handleScanError = useCallback((error: string) => {
    toast.error("Failed to scan QR code")
  }, [])

  // Handle camera stopped - properly manage state to prevent remount issues
  const handleCameraStopped = useCallback(() => {
    setIsScannerActive(false)
  }, [])

  // Handle image change from canvas
  const handleImageChange = useCallback((data: string) => {
    setImageData(data)
  }, [])

  // Handle save message
  const handleSave = async () => {
    if (!scannedStudent || !imageData) {
      toast.error("Missing student information or message")
      return
    }

    setIsSaving(true)

    try {
      await createGuestBookMessage({
        studentId: scannedStudent.id,
        studentName: `${scannedStudent.first_name} ${scannedStudent.last_name}`,
        studentLocation: scannedStudent.university || "Unknown Location",
        imageBlob: imageData,
      })

      toast.success("Message saved successfully!")
      onMessageCreated()
      handleClose()
    } catch (error) {
      console.error("Error saving message:", error)
      toast.error("Failed to save message")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle close - reset all state
  const handleClose = () => {
    // Deactivate scanner first to trigger camera cleanup
    setIsScannerActive(false)
    
    // Reset all state
    setStep("scan")
    setScannedStudent(null)
    setImageData("")
    
    // Close dialog - camera cleanup will complete via onCameraStopped callback
    onOpenChange(false)
  }
  
  // Reset scanner state when dialog reopens
  useEffect(() => {
    if (open) {
      setIsScannerActive(true)
      setStep("scan")
    }
  }, [open])

  // Handle cancel
  const handleCancel = () => {
    if (step === "draw" && imageData) {
      // Confirm before canceling if they've drawn something
      if (confirm("Are you sure you want to cancel? Your message will be lost.")) {
        handleClose()
      }
    } else {
      handleClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`
          ${theme.modal.background} 
          ${theme.modal.border}
          max-w-4xl max-h-[90vh] overflow-y-auto
        `}
      >
        <DialogHeader>
          <DialogTitle className={`text-2xl font-bold ${theme.text.primary}`}>
            {step === "scan" && "Scan Student QR Code"}
            {step === "draw" && "Create Your Message"}
            {step === "review" && "Review Message"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: QR Scanner */}
          {step === "scan" && (
            <div className="space-y-4">
              <p className={theme.text.secondary}>
                Scan the student's QR code to identify them
              </p>
              <div className="w-full h-[500px] rounded-xl overflow-hidden">
                <QrScanner
                  onScan={handleScan}
                  onError={handleScanError}
                  students={students}
                  isActive={isScannerActive}
                  onCameraStopped={handleCameraStopped}
                />
              </div>
            </div>
          )}

          {/* Step 2: Drawing Canvas */}
          {step === "draw" && scannedStudent && (
            <div className="space-y-4">
              {/* Student Info */}
              <div className={`${theme.glass.standard} rounded-xl p-4`}>
                <h3 className={`text-lg font-semibold ${theme.text.primary}`}>
                  {scannedStudent.first_name} {scannedStudent.last_name}
                </h3>
                <p className={theme.text.secondary}>
                  {scannedStudent.university || "Unknown Location"}
                </p>
              </div>

              {/* Canvas */}
              <HandwritingCanvas
                onImageChange={handleImageChange}
                width={800}
                height={600}
              />

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={!imageData || isSaving}
                  className={theme.primary.gradient}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Message
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
