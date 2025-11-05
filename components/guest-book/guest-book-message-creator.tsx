"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QrScanner } from "@/components/qr-scanner"
import { HandwritingCanvas } from "./handwriting-canvas"
import { CameraPhotoModal } from "./camera-photo-modal"
import { type Student } from "@/lib/actions/students"
import { createGuestBookMessage } from "@/lib/actions/guest-book"
import { currentTheme } from "@/lib/theme-config"
import { Loader2, Check, X, Search, QrCode, UserSearch, Camera, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { suppressCameraAbortWarnings } from "@/lib/utils/camera-cleanup"

interface GuestBookMessageCreatorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  students: Student[]
  onMessageCreated: () => void
}

type Step = "select" | "scan" | "search" | "draw"

export function GuestBookMessageCreator({
  open,
  onOpenChange,
  students,
  onMessageCreated,
}: GuestBookMessageCreatorProps) {
  const [step, setStep] = useState<Step>("select")
  const [scannedStudent, setScannedStudent] = useState<Student | null>(null)
  const [imageData, setImageData] = useState<string>("")
  const [studentPhotoData, setStudentPhotoData] = useState<string>("")
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isScannerActive, setIsScannerActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const theme = currentTheme

  // Filter students with proper prioritization (same as scanner page)
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) {
      return []
    }

    const query = searchQuery.toLowerCase().trim()

    // Separate results by priority
    const startsWithFirst: Student[] = []
    const startsWithLast: Student[] = []
    const containsResults: Student[] = []

    students.forEach((student) => {
      const firstName = student.first_name.toLowerCase()
      const lastName = student.last_name.toLowerCase()
      const fullName = `${firstName} ${lastName}`
      const phonetic = student.phonetic_spelling?.toLowerCase() || ""

      // Check if first name starts with query (highest priority)
      if (firstName.startsWith(query)) {
        startsWithFirst.push(student)
      }
      // Check if last name starts with query (second priority)
      else if (lastName.startsWith(query)) {
        startsWithLast.push(student)
      }
      // Check if any field contains the query (lowest priority)
      else if (
        fullName.includes(query) ||
        phonetic.includes(query) ||
        (student.programme && student.programme.toLowerCase().includes(query))
      ) {
        containsResults.push(student)
      }
    })

    // Sort each group alphabetically
    const sortByName = (a: Student, b: Student) => {
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase()
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase()
      return nameA.localeCompare(nameB)
    }

    startsWithFirst.sort(sortByName)
    startsWithLast.sort(sortByName)
    containsResults.sort(sortByName)

    // Return in priority order
    return [...startsWithFirst, ...startsWithLast, ...containsResults]
  }, [students, searchQuery])

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

  // Handle photo confirmed from camera modal
  const handlePhotoConfirmed = useCallback((photoDataUrl: string) => {
    setStudentPhotoData(photoDataUrl)
    toast.success("Photo added successfully!")
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
        studentPhotoBlob: studentPhotoData || undefined,
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

  // Handle student selection from search
  const handleSelectStudent = useCallback((student: Student) => {
    setScannedStudent(student)
    setIsScannerActive(false)
    setStep("draw")
    setSearchQuery("")
  }, [])

  // Handle close - reset all state
  const handleClose = () => {
    // Deactivate scanner first to trigger camera cleanup
    setIsScannerActive(false)
    
    // Reset all state
    setStep("select")
    setScannedStudent(null)
    setImageData("")
    setStudentPhotoData("")
    setSearchQuery("")
    setIsCameraModalOpen(false)
    
    // Close dialog - camera cleanup will complete via onCameraStopped callback
    onOpenChange(false)
  }
  
  // Reset scanner state when dialog reopens
  useEffect(() => {
    if (open) {
      setStep("select")
      setIsScannerActive(false)
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

  // Dynamic modal sizing based on step
  const getModalSize = () => {
    switch (step) {
      case "select":
        return "max-w-md"
      case "scan":
        return "max-w-2xl"
      case "search":
        return "max-w-xl"
      case "draw":
        return "max-w-6xl"
      default:
        return "max-w-lg"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`
          ${theme.modal.background} 
          ${theme.modal.border}
          ${getModalSize()} max-h-[90vh] overflow-y-auto
        `}
      >
        <DialogHeader className="relative">
          <DialogTitle className={`text-2xl font-bold ${theme.text.primary} pr-10`}>
            {step === "select" && "Create Message"}
            {step === "scan" && "Scan QR Code"}
            {step === "search" && "Search Student"}
            {step === "draw" && "Create Your Message"}
          </DialogTitle>
          {step === "select" ? (
            <button
              onClick={handleClose}
              className={`absolute right-0 top-0 p-2 rounded-lg ${theme.glass.standard} ${theme.text.primary} hover:bg-white/20 transition-colors`}
            >
              <X className="h-5 w-5" />
            </button>
          ) : (step === "scan" || step === "search") && (
            <button
              onClick={() => setStep("select")}
              className={`absolute right-0 top-0 p-2 rounded-lg ${theme.glass.standard} ${theme.text.primary} hover:bg-white/20 transition-colors`}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Selection Mode */}
          {step === "select" && (
            <div className="space-y-4">
              <p className={`${theme.text.secondary} text-center`}>
                Choose how you'd like to select the student
              </p>
              
              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setStep("scan")
                    setIsScannerActive(true)
                  }}
                  className={`${theme.primary.gradient} text-white h-20 text-lg`}
                >
                  <QrCode className="h-6 w-6 mr-3" />
                  Scan QR Code
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("search")}
                  className={`${theme.glass.standard} ${theme.text.primary} h-20 text-lg border-0`}
                >
                  <UserSearch className="h-6 w-6 mr-3" />
                  Search for Student
                </Button>
              </div>
            </div>
          )}

          {/* Step 2a: QR Scanner */}
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
              <div className="flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsScannerActive(false)
                    setStep("select")
                  }}
                  className={`${theme.glass.standard} ${theme.text.primary}`}
                >
                  <X className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Step 2b: Search */}
          {step === "search" && (
            <div className="space-y-4">
              <p className={theme.text.secondary}>
                Search for a student by name
              </p>
              
              {/* Search Input */}
              <div className="relative">
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme.text.primary} z-10`}
                />
                <Input
                  type="text"
                  placeholder="Search by student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-12 pr-12 py-3 w-full text-base rounded-xl border-0 bg-white/10 backdrop-blur-sm ${theme.text.primary} placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-0 transition-all`}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded ${theme.text.muted} hover:${theme.text.primary} transition-colors z-10`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Search Results */}
              <div className="max-h-[400px] overflow-y-auto">
                {searchQuery && filteredStudents.length > 0 ? (
                  <div className="space-y-2">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => handleSelectStudent(student)}
                        className={`p-4 ${theme.glass.light} rounded-lg hover:bg-white/20 cursor-pointer transition-all group`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 ${theme.primary.gradient} rounded-lg flex items-center justify-center text-white font-bold`}
                          >
                            {student.first_name.charAt(0)}
                            {student.last_name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3
                              className={`font-semibold ${theme.text.primary} group-hover:text-purple-200 transition-colors`}
                            >
                              {student.first_name} {student.last_name}
                            </h3>
                            {student.phonetic_spelling && (
                              <p className={`text-sm ${theme.text.secondary}`}>
                                Pronunciation: {student.phonetic_spelling}
                              </p>
                            )}
                            {student.university && (
                              <p className={`text-sm ${theme.text.secondary}`}>
                                {student.university}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="text-center py-8">
                    <p className={`${theme.text.secondary}`}>
                      No students found matching "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className={`${theme.text.secondary}`}>
                      Start typing to search for students
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("select")}
                  className={`${theme.glass.standard} ${theme.text.primary}`}
                >
                  <X className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Drawing Canvas */}
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

              {/* Canvas - Rectangle format to match message card */}
              <HandwritingCanvas
                onImageChange={handleImageChange}
                width={1200}
                height={600}
                onAttachPhoto={() => setIsCameraModalOpen(true)}
                studentPhotoData={studentPhotoData}
                onRemovePhoto={() => setStudentPhotoData("")}
                isSaving={isSaving}
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

      {/* Camera Photo Modal */}
      <CameraPhotoModal
        open={isCameraModalOpen}
        onOpenChange={setIsCameraModalOpen}
        onPhotoConfirmed={handlePhotoConfirmed}
      />
    </Dialog>
  )
}
