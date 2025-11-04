"use client"

import { DialogDescription } from "@/components/ui/dialog"

import type React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Download,
  Upload,
  Search,
  Users,
  Trash2,
  CheckSquare,
  Square,
  GraduationCap,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { importStudents, updateStudent, type Student } from "@/lib/actions/students"
import { Toaster } from "@/components/ui/toaster"
import config from "@/lib/theme-config"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { VirtualizedStudentList } from "@/components/virtualized-student-list"
import { useDebounce } from "@/hooks/use-debounce"
import {
  useStudents,
  useAddStudent,
  useDeleteStudent,
  useBulkDeleteStudents,
  useMarkStudentAsShared,
  useRefreshStudents,
} from "@/hooks/use-students"
import { QRCard } from "@/components/qr-card"
import { StudentDetailModal } from "@/components/student-detail-modal"
import { EditStudentModal } from "@/components/edit-student-modal"
import { copyQRCardAsImage, downloadQRCardAsImage } from "@/lib/utils/image-utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import AppHeader from "@/components/app-header"

export type DuplicateInfo = {
  existing: number
  new: number
  newStudents: Array<{
    seatNo?: string
    firstName: string
    lastName: string
    university?: string
    programme?: string
    classification?: string
    phoneticSpelling?: string
    email?: string
  }>
}

export default function AdminPage() {
  // Removed excessive component rendering log

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phoneticSpelling, setPhoneticSpelling] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300) // 300ms delay

  const [alertOpen, setAlertOpen] = useState(false)
  const [alertTitle, setAlertTitle] = useState("")
  const [alertDescription, setAlertDescription] = useState("")
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  // Mobile responsive states
  const isMobile = useIsMobile()
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(!isMobile) // Collapsed on mobile by default
  const [isStudentListOpen, setIsStudentListOpen] = useState(true) // Always start open

  // Bulk delete states
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const cancelRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo>({ existing: 0, new: 0, newStudents: [] })

  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null)
  const [showStudentDetailModal, setShowStudentDetailModal] = useState(false)

  const [showQrDisplayModal, setShowQrDisplayModal] = useState(false)
  const [selectedStudentForQr, setSelectedStudentForQr] = useState<Student | null>(null)

  // Add these state variables after the existing state declarations:
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [downloadProgress, setDownloadProgress] = useState(0)

  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedStudentForQR, setSelectedStudentForQR] = useState<Student | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("")
  const [isCopied, setIsCopied] = useState(false)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [hideQrButtons, setHideQrButtons] = useState(false)
  const qrCardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Add a new state for upload loading:
  const [isUploading, setIsUploading] = useState(false)

  // Use React Query hooks for data management
  const { data: students = [], isLoading: studentsLoading, error, refetch } = useStudents()
  const addStudentMutation = useAddStudent()
  const deleteStudentMutation = useDeleteStudent()
  const bulkDeleteMutation = useBulkDeleteStudents()
  const markAsSharedMutation = useMarkStudentAsShared()
  const refreshStudents = useRefreshStudents()

  // Memoized filtered students for performance with debounced search and improved sorting
  const filteredStudents = useMemo(() => {
    // Reduced logging - only log when there's a search query
    if (debouncedSearchQuery.trim()) {
      console.log(`🔄 [OPTIMIZATION] Memoization - Filtering students with query: "${debouncedSearchQuery}"`)
    }

    if (!debouncedSearchQuery.trim()) {
      return students
    }

    const query = debouncedSearchQuery.toLowerCase().trim()

    // Initial broad filter
    const preliminaryFilter = students.filter((student) => {
      const firstNameLower = student.first_name.toLowerCase()
      const lastNameLower = student.last_name.toLowerCase()
      const programmeLower = student.programme?.toLowerCase() || ""
      const emailLower = student.email?.toLowerCase() || ""

      return (
        firstNameLower.includes(query) ||
        lastNameLower.includes(query) ||
        programmeLower.includes(query) ||
        emailLower.includes(query)
      )
    })

    // Enhanced sorting
    const sortedResults = [...preliminaryFilter].sort((a, b) => {
      const aFirstNameLower = a.first_name.toLowerCase()
      const bFirstNameLower = b.first_name.toLowerCase()
      const aLastNameLower = a.last_name.toLowerCase()
      const bLastNameLower = b.last_name.toLowerCase()

      const aFirstNameStartsWith = aFirstNameLower.startsWith(query)
      const bFirstNameStartsWith = bFirstNameLower.startsWith(query)

      // Prioritize first name startsWith
      if (aFirstNameStartsWith && !bFirstNameStartsWith) return -1
      if (!aFirstNameStartsWith && bFirstNameStartsWith) return 1

      // If both or neither first names start with query, check last names startsWith
      const aLastNameStartsWith = aLastNameLower.startsWith(query)
      const bLastNameStartsWith = bLastNameLower.startsWith(query)

      if (aLastNameStartsWith && !bLastNameStartsWith) return -1
      if (!aLastNameStartsWith && bLastNameStartsWith) return 1

      // If still tied, check full name starts with (for queries like "John D")
      const aFullName = `${aFirstNameLower} ${aLastNameLower}`
      const bFullName = `${bFirstNameLower} ${bLastNameLower}`
      const aFullNameStartsWith = aFullName.startsWith(query)
      const bFullNameStartsWith = bFullName.startsWith(query)

      if (aFullNameStartsWith && !bFullNameStartsWith) return -1
      if (!aFullNameStartsWith && bFullNameStartsWith) return 1

      // Further tie-breaking: if one first name starts with and the other's last name starts with, first name wins
      if (aFirstNameStartsWith && bLastNameStartsWith && !bFirstNameStartsWith) return -1
      if (bFirstNameStartsWith && aLastNameStartsWith && !aFirstNameStartsWith) return 1

      // Final tie-breaker: alphabetical by full name
      if (aFullName !== bFullName) {
        return aFullName.localeCompare(bFullName)
      }

      return 0
    })

    return sortedResults
  }, [students, debouncedSearchQuery])

  // Clear selection when exiting selection mode
  useEffect(() => {
    if (!isSelectionMode && selectedStudents.size > 0) {
      console.log(`🔄 [COMPONENT] AdminPage - Exiting selection mode, clearing ${selectedStudents.size} selections`)
      setSelectedStudents(new Set())
    }
  }, [isSelectionMode]) // Remove selectedStudents.size dependency

  // Auto-expand sections on desktop
  useEffect(() => {
    if (!isMobile) {
      // Expand both sections on desktop if they're not already open
      setIsAddStudentOpen(prev => prev === false ? true : prev)
      setIsStudentListOpen(prev => prev === false ? true : prev)
    } else {
      // On mobile, ensure student list is open but don't force add student section
      setIsStudentListOpen(prev => prev === false ? true : prev)
    }
  }, [isMobile])

  const handleAddStudent = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      console.log(`🔄 [COMPONENT] AdminPage - Adding student: ${firstName} ${lastName}`)

      if (!firstName.trim() || !lastName.trim()) {
        console.log(`❌ [COMPONENT] AdminPage - Validation error: Missing name fields`)
        toast({
          title: "Validation Error",
          description: "Both first and last name are required.",
          variant: "destructive",
        })
        return
      }

      const formData = new FormData()
      formData.append("firstName", firstName)
      formData.append("lastName", lastName)
      formData.append("phoneticSpelling", phoneticSpelling)

      addStudentMutation.mutate(formData, {
        onSuccess: () => {
          console.log(`✅ [COMPONENT] AdminPage - Student added successfully, clearing form`)
          setFirstName("")
          setLastName("")
          setPhoneticSpelling("")

          // Close the add student section on mobile after successful add
          if (isMobile) {
            setIsAddStudentOpen(false)
            setIsStudentListOpen(true)
          }

          toast({
            title: "Student Added",
            description: `${firstName} ${lastName} has been added successfully.`,
          })
        },
      })
    },
    [firstName, lastName, phoneticSpelling, addStudentMutation, toast, isMobile],
  )

  const handleDeleteStudent = useCallback(
    async (id: string) => {
      console.log(`🔄 [COMPONENT] AdminPage - Deleting student: ${id}`)
      deleteStudentMutation.mutate(id)
    },
    [deleteStudentMutation],
  )

  const handleMarkAsShared = useCallback(
    async (student: Student) => {
      console.log(`🔄 [COMPONENT] AdminPage - Marking student as shared: ${student.id}`)
      markAsSharedMutation.mutate(student.id)
    },
    [markAsSharedMutation],
  )

  const handleBulkDelete = useCallback(() => {
    if (selectedStudents.size === 0) return
    console.log(`🔄 [COMPONENT] AdminPage - Opening bulk delete dialog for ${selectedStudents.size} students`)
    setShowBulkDeleteDialog(true)
  }, [selectedStudents.size])

  const confirmBulkDelete = useCallback(async () => {
    console.log(`🔄 [COMPONENT] AdminPage - Confirming bulk delete of ${selectedStudents.size} students`)
    setIsBulkDeleting(true)
    setShowBulkDeleteDialog(false)

    try {
      // Convert Set to Array for the API call
      const selectedIds = Array.from(selectedStudents)
      console.log(`🔄 [COMPONENT] AdminPage - Bulk deleting student IDs:`, selectedIds)

      await bulkDeleteMutation.mutateAsync(selectedIds)

      // Clear selections and exit selection mode
      setSelectedStudents(new Set())
      setIsSelectionMode(false)
    } catch (error) {
      console.error(`❌ [COMPONENT] AdminPage - Error in bulk delete:`, error)
      // Error handling is done in the mutation hook
    } finally {
      setIsBulkDeleting(false)
    }
  }, [selectedStudents, bulkDeleteMutation])

  // Handle file upload for importing students with duplicate detection
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      console.log(`🔄 [COMPONENT] AdminPage - Processing uploaded file: ${file.name}`)
      setIsUploading(true)

      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const fileContent = e.target?.result as string
          console.log(`🔄 [COMPONENT] AdminPage - File loaded, parsing content`)

          let studentsToImport: Array<{
            seatNo?: string
            name?: string
            firstName?: string
            lastName?: string
            university?: string
            programme?: string
            classification?: string
            phoneticSpelling?: string
            email?: string
          }> = []

          // Try to parse as JSON first
          try {
            console.log(`🔄 [COMPONENT] AdminPage - Attempting to parse as JSON`)
            const jsonData = JSON.parse(fileContent)
            if (Array.isArray(jsonData)) {
              console.log(`✅ [COMPONENT] AdminPage - Successfully parsed JSON with ${jsonData.length} records`)
              studentsToImport = jsonData.map((student) => ({
                seatNo: student.seatNo || student.seat_no || student["Seat No."] || "",
                name: student.name || student.Name || "",
                firstName: student.firstName || student.first_name || "",
                lastName: student.lastName || student.last_name || "",
                university: student.university || student.University || "",
                programme: student.programme || student.Programme || student.program || "",
                classification: student.classification || student.Classification || "",
                phoneticSpelling: student.phoneticSpelling || student.phonetic_spelling || undefined,
                email: student.email || undefined,
              }))
            }
          } catch (jsonError) {
            // If JSON parsing fails, try CSV
            console.log(`🔄 [COMPONENT] AdminPage - JSON parsing failed, attempting CSV parsing`)
            const lines = fileContent.split("\n").filter((line) => line.trim())

            if (lines.length < 2) {
              throw new Error("CSV file must contain at least a header row and one data row")
            }

            const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
            console.log("CSV Headers found:", headers)

            const seatNoIndex = headers.findIndex(
              (h) =>
                h.toLowerCase().includes("seat") || h.toLowerCase() === "seat no." || h.toLowerCase() === "seat no",
            )
            const nameIndex = headers.findIndex((h) => h.toLowerCase() === "name")
            const universityIndex = headers.findIndex((h) => h.toLowerCase().includes("university"))
            const programmeIndex = headers.findIndex(
              (h) => h.toLowerCase().includes("programme") || h.toLowerCase().includes("program"),
            )
            const classificationIndex = headers.findIndex((h) => h.toLowerCase().includes("classification"))

            if (nameIndex === -1) {
              throw new Error("CSV file must contain a 'Name' column")
            }

            console.log(`🔄 [COMPONENT] AdminPage - Processing ${lines.length - 1} CSV rows`)

            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim()
              if (!line) continue

              const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""))

              if (values.length < headers.length) {
                console.warn(`Row ${i + 1} has fewer columns than expected. Skipping.`)
                continue
              }

              const seatNo = seatNoIndex !== -1 ? values[seatNoIndex] : ""
              const fullName = nameIndex !== -1 ? values[nameIndex] : ""
              const university = universityIndex !== -1 ? values[universityIndex] : ""
              const programme = programmeIndex !== -1 ? values[programmeIndex] : ""
              const classification = classificationIndex !== -1 ? values[classificationIndex] : ""

              const seatNoTrimmed = seatNo.trim()
              const fullNameTrimmed = fullName.trim()
              const universityTrimmed = university.trim()
              const programmeTrimmed = programme.trim()
              const classificationTrimmed = classification.trim()

              if (fullNameTrimmed) {
                const nameParts = fullNameTrimmed.split(/\s+/)
                const firstName = nameParts[0] || ""
                const lastName = nameParts.slice(1).join(" ") || ""

                studentsToImport.push({
                  seatNo: seatNoTrimmed,
                  name: fullNameTrimmed,
                  firstName: firstName.trim(),
                  lastName: lastName.trim(),
                  university: universityTrimmed,
                  programme: programmeTrimmed,
                  classification: classificationTrimmed,
                })
              }
            }

            console.log(`✅ [COMPONENT] AdminPage - Successfully parsed CSV with ${studentsToImport.length} records`)
          }

          const validStudents = studentsToImport.filter((student) => {
            const hasName = student.name?.trim()
            const hasFirstLast = student.firstName?.trim() && student.lastName?.trim()
            return hasName || hasFirstLast
          })

          console.log(`🔄 [COMPONENT] AdminPage - ${validStudents.length} valid students after filtering`)

          if (validStudents.length === 0) {
            console.error(`❌ [COMPONENT] AdminPage - No valid student data found in file`)
            toast({
              title: "Import Failed",
              description: "No valid student data found in the file.",
              variant: "destructive",
            })
            return
          }

          // Process and normalize student data
          const processedStudents = validStudents.map((student) => {
            let firstName = student.firstName || ""
            let lastName = student.lastName || ""

            if (!firstName && !lastName && student.name) {
              const nameParts = student.name.trim().split(/\s+/)
              firstName = nameParts[0] || ""
              lastName = nameParts.slice(1).join(" ") || ""
            }

            return {
              seatNo: student.seatNo?.trim() || undefined,
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              university: student.university?.trim() || undefined,
              programme: student.programme?.trim() || undefined,
              classification: student.classification?.trim() || undefined,
              phoneticSpelling: student.phoneticSpelling?.trim() || undefined,
              email: student.email?.trim() || undefined,
            }
          })

          // Check for duplicates against existing students
          console.log(`🔄 [COMPONENT] AdminPage - Checking for duplicates among ${processedStudents.length} students`)

          const duplicates: typeof processedStudents = []
          const newStudents: typeof processedStudents = []

          processedStudents.forEach((newStudent) => {
            const isDuplicate = students.some((existingStudent) => {
              return (
                existingStudent.first_name.toLowerCase() === newStudent.firstName.toLowerCase() &&
                existingStudent.last_name.toLowerCase() === newStudent.lastName.toLowerCase() &&
                (existingStudent.university?.toLowerCase() || "") === (newStudent.university?.toLowerCase() || "") &&
                (existingStudent.programme?.toLowerCase() || "") === (newStudent.programme?.toLowerCase() || "") &&
                (existingStudent.classification?.toLowerCase() || "") ===
                  (newStudent.classification?.toLowerCase() || "")
              )
            })

            if (isDuplicate) {
              duplicates.push(newStudent)
            } else {
              newStudents.push(newStudent)
            }
          })

          console.log(
            `🔍 [COMPONENT] AdminPage - Found ${duplicates.length} duplicates and ${newStudents.length} new students`,
          )

          if (duplicates.length > 0) {
            // Show duplicate confirmation dialog
            setDuplicateInfo({
              existing: duplicates.length,
              new: newStudents.length,
              newStudents: newStudents,
            })
            setShowDuplicateDialog(true)
          } else if (newStudents.length > 0) {
            // No duplicates, proceed with import
            await performImport(newStudents)
          } else {
            // All students are duplicates
            toast({
              title: "No New Students",
              description: "All students in the file already exist in the database.",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error(`❌ [COMPONENT] AdminPage - Import error:`, error)
          toast({
            title: "Import Failed",
            description: error instanceof Error ? error.message : "Could not parse the file. Please check the format.",
            variant: "destructive",
          })
        } finally {
          setIsUploading(false)
        }
      }

      reader.readAsText(file)
      event.target.value = ""
    },
    [toast, isMobile, students],
  )

  const performImport = useCallback(
    async (
      studentsToImport: Array<{
        seatNo?: string
        firstName: string
        lastName: string
        university?: string
        programme?: string
        classification?: string
        phoneticSpelling?: string
        email?: string
      }>,
    ) => {
      try {
        console.log(`🔄 [COMPONENT] AdminPage - Importing ${studentsToImport.length} students`)
        const result = await importStudents(studentsToImport)

        if (result.success) {
          console.log(`✅ [COMPONENT] AdminPage - Import successful: ${result.count} students imported`)

          // Force refresh the students list
          await refetch()

          toast({
            title: "Import Successful",
            description: `${result.count} student${result.count !== 1 ? "s" : ""} have been imported successfully.`,
          })

          // Close the add student section and open the student list on mobile after successful import
          if (isMobile) {
            setIsAddStudentOpen(false)
            setIsStudentListOpen(true)
          }
        } else {
          console.error(`❌ [COMPONENT] AdminPage - Import failed:`, result.error)
          toast({
            title: "Import Failed",
            description: result.error,
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error(`❌ [COMPONENT] AdminPage - Error in import:`, error)
        toast({
          title: "Import Failed",
          description: "Failed to import students to database",
          variant: "destructive",
        })
      }
    },
    [refetch, toast, isMobile],
  )

  const handleConfirmDuplicateImport = useCallback(async () => {
    setShowDuplicateDialog(false)
    if (duplicateInfo.newStudents.length > 0) {
      await performImport(duplicateInfo.newStudents)
    }
    setDuplicateInfo({ existing: 0, new: 0, newStudents: [] })
  }, [duplicateInfo, performImport])

  // Optimized function to process a single student
  const processStudent = useCallback(
    async (student: Student, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, QRCode: any) => {
      console.log(`🔄 [COMPONENT] AdminPage - Processing QR code for student: ${student.id}`)

      // Create QR code data matching the actual database schema
      const qrData = {
        id: student.id,
        n: `${student.first_name} ${student.last_name}`,
      }

      // Generate QR code on a temporary canvas
      const tempCanvas = document.createElement("canvas")
      await QRCode.toCanvas(tempCanvas, JSON.stringify(qrData), {
        width: 500,
        margin: 0,
        color: {
          dark: "#3A2E5D",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "H",
      })

      // Inside processStudent function, after canvas and ctx are defined:
      const themeQrConfig = config.theme.qrCard // Access the theme

      // Clear the main canvas
      // Apply themed background (similar to StudentQRDisplay's handleDownloadQR)
      const bgColor = themeQrConfig.background.includes("gradient")
        ? "#1E1B2E"
        : themeQrConfig.background.split("bg-")[1]?.split("-")[0]
          ? themeQrConfig.background
          : "#1E1B2E"
      ctx.fillStyle = bgColor
      if (themeQrConfig.background.includes("gradient")) {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        gradient.addColorStop(
          0,
          themeQrConfig.background.match(/from-([a-z]+)-([0-9]+)/)?.[0].replace("from-", "") || "#3A2E5D",
        )
        gradient.addColorStop(
          1,
          themeQrConfig.background.match(/to-([a-z]+)-([0-9]+)/)?.[0].replace("to-", "") || "#7A2F3D",
        )
        ctx.fillStyle = gradient
      } else {
        const colorMatch = themeQrConfig.background.match(/bg-([a-zA-Z]+)-([0-9]+)/)
        if (colorMatch) {
          const colorName = colorMatch[1]
          const colorShade = colorMatch[2]
          if (colorName === "slate" && colorShade === "800") ctx.fillStyle = "#1e293b"
          else if (colorName === "purple" && colorShade === "800") ctx.fillStyle = "#581c87"
          else ctx.fillStyle = "#1A1139"
        } else {
          ctx.fillStyle = "#1A1139"
        }
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // University Name
      ctx.fillStyle = themeQrConfig.universityNameColor.startsWith("text-")
        ? themeQrConfig.universityNameColor.replace("text-", "")
        : themeQrConfig.universityNameColor
      if (ctx.fillStyle === "white") ctx.fillStyle = "#FFFFFF"
      else if (ctx.fillStyle === "purple-300") ctx.fillStyle = "#c084fc"
      ctx.font = "bold 60px Arial, sans-serif" // Keep large for ZIP download
      ctx.textAlign = "center"
      ctx.fillText(config.institution.name, canvas.width / 2, 100)

      // Draw QR code with white background and border
      const qrSize = 480
      const qrX = (canvas.width - qrSize) / 2
      const qrY = 180

      ctx.fillStyle = themeQrConfig.qrBgColor
      ctx.fillRect(qrX, qrY, qrSize, qrSize)

      ctx.drawImage(tempCanvas, qrX, qrY, qrSize, qrSize)

      // Student Name
      const nameY = qrY + qrSize + 70
      ctx.fillStyle = themeQrConfig.studentNameColor.startsWith("text-")
        ? themeQrConfig.studentNameColor.replace("text-", "")
        : themeQrConfig.studentNameColor
      if (ctx.fillStyle === "purple-300") ctx.fillStyle = "#c084fc"
      else if (ctx.fillStyle === "white") ctx.fillStyle = "#FFFFFF"
      ctx.font = "bold 48px Arial, sans-serif"
      ctx.fillText(`${student.first_name} ${student.last_name}`, canvas.width / 2, nameY)

      // Phonetic Spelling and Programme
      let currentY = nameY + 50
      if (student.phonetic_spelling) {
        ctx.fillStyle = themeQrConfig.infoTextColor.startsWith("text-")
          ? themeQrConfig.infoTextColor.replace("text-", "")
          : themeQrConfig.infoTextColor
        if (ctx.fillStyle === "gray-400") ctx.fillStyle = "#9ca3af"
        ctx.font = "italic 36px Arial, sans-serif"
        ctx.fillText(`(${student.phonetic_spelling})`, canvas.width / 2, currentY)
        currentY += 40
      }
      if (student.programme) {
        ctx.fillStyle = themeQrConfig.infoTextColor.startsWith("text-")
          ? themeQrConfig.infoTextColor.replace("text-", "")
          : themeQrConfig.infoTextColor
        if (ctx.fillStyle === "gray-400") ctx.fillStyle = "#9ca3af"
        ctx.font = "32px Arial, sans-serif"
        ctx.fillText(`${student.programme}`, canvas.width / 2, currentY)
      }

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL("image/png", 1.0)

      // Convert data URL to blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()

      console.log(`✅ [COMPONENT] AdminPage - QR code processed for ${student.first_name} ${student.last_name}`)

      return {
        fileName: `${student.first_name}_${student.last_name}_qr.png`,
        blob,
      }
    },
    [],
  )

  // Show confirmation dialog first
  const handleDownloadClick = useCallback(async () => {
    if (students.length === 0) {
      console.log(`❌ [COMPONENT] AdminPage - No students to download QR codes for`)
      toast({
        title: "No Students",
        description: "There are no students to generate QR codes for.",
        variant: "destructive",
      })
      return
    }

    console.log(`🔄 [COMPONENT] AdminPage - Starting QR code download process for ${students.length} students`)
    setIsDownloading(true)
    setDownloadProgress(0)
    cancelRef.current = false

    abortControllerRef.current = new AbortController()

    try {
      console.log(`🔄 [COMPONENT] AdminPage - Loading JSZip and QRCode libraries`)
      const JSZip = (await import("jszip")).default
      const QRCode = (await import("qrcode")).default

      const zip = new JSZip()
      const folder = zip.folder("graduation_qr_codes")

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!

      canvas.width = 840
      canvas.height = 1000

      // Process in batches for better performance
      const BATCH_SIZE = 3
      const batches = []

      for (let i = 0; i < students.length; i += BATCH_SIZE) {
        batches.push(students.slice(i, i + BATCH_SIZE))
      }

      console.log(
        `🔄 [COMPONENT] AdminPage - Processing ${batches.length} batches of QR codes (${BATCH_SIZE} per batch)`,
      )

      let processedCount = 0

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        if (cancelRef.current || abortControllerRef.current?.signal.aborted) {
          console.log(`🔄 [COMPONENT] AdminPage - Download cancelled, stopping process`)
          toast({
            title: "Download Cancelled",
            description: "QR code generation was cancelled.",
            variant: "destructive",
          })
          return
        }

        const batch = batches[batchIndex]
        console.log(
          `🔄 [COMPONENT] AdminPage - Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} students)`,
        )

        const batchPromises = batch.map((student) => processStudent(student, canvas, ctx, QRCode))

        try {
          const batchResults = await Promise.all(batchPromises)

          batchResults.forEach((result) => {
            folder!.file(result.fileName, result.blob)
          })

          processedCount += batch.length

          const progress = Math.round((processedCount / students.length) * 100)
          console.log(`✅ [COMPONENT] AdminPage - Batch ${batchIndex + 1} complete, progress: ${progress}%`)
          setDownloadProgress(progress)

          // Yield to the main thread to prevent UI freezing
          await new Promise((resolve) => setTimeout(resolve, 0))
        } catch (batchError) {
          console.error(`❌ [COMPONENT] AdminPage - Error processing batch ${batchIndex + 1}:`, batchError)
        }
      }

      if (cancelRef.current || abortControllerRef.current?.signal.aborted) {
        console.log(`🔄 [COMPONENT] AdminPage - Download cancelled, stopping process`)
        toast({
          title: "Download Cancelled",
          description: "QR code generation was cancelled.",
          variant: "destructive",
        })
        return
      }

      console.log(`🔄 [COMPONENT] AdminPage - Creating ZIP archive`)
      const content = await zip.generateAsync({ type: "blob" })

      console.log(`✅ [COMPONENT] AdminPage - ZIP archive created, starting download`)
      const url = window.URL.createObjectURL(content)
      const a = document.createElement("a")
      a.href = url
      a.download = "graduation_qr_codes.zip"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      console.log(`✅ [COMPONENT] AdminPage - Download complete`)
      toast({
        title: "Download Complete",
        description: "QR codes have been generated and downloaded.",
      })
    } catch (error: any) {
      console.error(`❌ [COMPONENT] AdminPage - Download error:`, error)
      toast({
        title: "Download Failed",
        description: error.message || "An error occurred while generating QR codes.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
      setDownloadProgress(0)
      abortControllerRef.current = null
    }
  }, [students, toast, setDownloadProgress])

  const generateQRCode = useCallback(
    async (student: Student) => {
      try {
        setIsGeneratingQR(true)

        const QRCode = (await import("qrcode")).default

        const qrData = {
          id: student.id,
          n: `${student.first_name} ${student.last_name}`,
        }

        const canvas = canvasRef.current || document.createElement("canvas")

        await new Promise<void>((resolve) => {
          requestAnimationFrame(async () => {
            try {
              await QRCode.toCanvas(canvas, JSON.stringify(qrData), {
                width: 260,
                margin: 0,
                color: {
                  dark: config.theme.qrCard.qrFgColor,
                  light: config.theme.qrCard.qrBgColor,
                },
                errorCorrectionLevel: "M",
              })

              const qrDataUrl = canvas.toDataURL("image/png", 1.0)
              setQrCodeDataUrl(qrDataUrl)

              resolve()
            } catch (error) {
              console.error("Error generating QR code:", error)
              resolve()
            }
          })
        })
      } catch (error) {
        console.error("Error generating QR code:", error)
        toast({
          title: "Error",
          description: "Failed to generate QR code",
          variant: "destructive",
        })
      } finally {
        setIsGeneratingQR(false)
      }
    },
    [toast],
  )

  const handleViewQRModal = useCallback(
    async (student: Student) => {
      setSelectedStudentForQr(student)
      setShowQRModal(true)
      setQrCodeDataUrl("")

      await generateQRCode(student)
    },
    [generateQRCode],
  )

  const handleCopyQR = useCallback(async () => {
    try {
      if (qrCardRef.current && selectedStudentForQR) {
        // Temporarily hide buttons by setting a flag
        setHideQrButtons(true)

        // Wait for re-render
        await new Promise((resolve) => setTimeout(resolve, 100))

        await copyQRCardAsImage(qrCardRef.current)

        setIsCopied(true)
        setTimeout(() => setIsCopied(false), config.animations.durations.feedback.copied)

        toast({
          title: "QR Card Copied",
          description: "The complete QR card has been copied to your clipboard",
        })

        // Restore button visibility
        setHideQrButtons(false)
      }
    } catch (error) {
      console.error("Error copying QR card:", error)
      toast({
        title: "Copy Failed",
        description: "Failed to copy QR card to clipboard",
        variant: "destructive",
      })
    }
  }, [selectedStudentForQR, toast])

  const handleDownloadQR = useCallback(async () => {
    try {
      if (qrCardRef.current && selectedStudentForQR) {
        // Temporarily hide buttons by setting a flag
        setHideQrButtons(true)

        // Wait for re-render
        await new Promise((resolve) => setTimeout(resolve, 100))

        const fileName = `${selectedStudentForQR.first_name}_${selectedStudentForQR.last_name}_qr_card.png`
        await downloadQRCardAsImage(qrCardRef.current, fileName)

        toast({
          title: "QR Card Downloaded",
          description: "The complete QR card has been downloaded to your device",
        })

        // Restore button visibility
        setHideQrButtons(false)
      }
    } catch (error) {
      console.error("Error downloading QR card:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download QR card",
        variant: "destructive",
      })
    }
  }, [selectedStudentForQR, toast])

  const toggleStudentSelection = useCallback(
    (studentId: string) => {
      setSelectedStudents((prevSelected) => {
        const newSelected = new Set(prevSelected)
        if (newSelected.has(studentId)) {
          newSelected.delete(studentId)
        } else {
          newSelected.add(studentId)
        }
        return newSelected
      })
    },
    [setSelectedStudents],
  )

  const toggleSelectAll = useCallback(() => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set())
    } else {
      const allIds = new Set(filteredStudents.map((student) => student.id))
      setSelectedStudents(allIds)
    }
  }, [filteredStudents, selectedStudents])

  const handleStudentCardClick = useCallback(
    (student: Student) => {
      setSelectedStudentForDetail(student)
      setShowStudentDetailModal(true)
    },
    [setSelectedStudentForDetail, setShowStudentDetailModal],
  )

  const handleOpenQrModal = useCallback((student: Student) => {
    setSelectedStudentForQr(student)
    setShowQrDisplayModal(true)
  }, [])

  // Add this edit handler function:
  const handleEditStudent = useCallback((student: Student) => {
    console.log("Edit student clicked:", student)
    setEditingStudent(student)
    setShowEditModal(true)
  }, [])

  // Add this save handler function:
  const handleSaveStudent = useCallback(
    async (studentData: Partial<Student>) => {
      try {
        await updateStudent(studentData)
        // Refresh the student list after successful update
        refreshStudents()
        toast({
          title: "Student Updated",
          description: "Student information has been updated successfully.",
        })
      } catch (error) {
        console.error("Error updating student:", error)
        toast({
          title: "Update Failed",
          description: "Failed to update student information.",
          variant: "destructive",
        })
      }
    },
    [refreshStudents, toast],
  )

  if (studentsLoading) {
    return (
      <div
        className={`${config.theme.layout.pageConstraints.height} ${config.theme.background} relative ${config.theme.layout.pageConstraints.overflow} flex flex-col`}
      >
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden opacity-50">
          {[0, 1, 2].map((index) => (
            <div
              key={`orb-${index}`}
              className={`absolute ${
                index === 0
                  ? "top-20 left-10 w-72 h-72"
                  : index === 1
                    ? "top-40 right-20 w-96 h-96"
                    : "bottom-20 left-1/4 w-80 h-80"
              } bg-purple-800/20 rounded-full blur-3xl`}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Header Skeleton */}
          <AppHeader />

          {/* Main Content Skeleton */}
          <div className="flex-1 py-6 px-4 md:px-20 lg:px-32">
            <div className="h-full">
              {/* Dashboard Header Skeleton */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="h-8 w-64 bg-white/20 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-96 bg-white/10 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-48 bg-white/10 rounded animate-pulse"></div>
                  <div className="h-10 w-40 bg-white/10 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Main Grid Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-8 gap-8 lg:gap-20">
                {/* Left Column */}
                <div className="lg:col-span-3 bg-white/5 backdrop-blur-md rounded-xl p-6 h-[calc(100vh-240px)]">
                  <div className="h-6 w-32 bg-white/20 rounded animate-pulse mb-6"></div>
                  <div className="space-y-4">
                    <div className="h-4 w-24 bg-white/10 rounded animate-pulse"></div>
                    <div className="h-10 w-full bg-white/10 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-white/10 rounded animate-pulse"></div>
                    <div className="h-10 w-full bg-white/10 rounded animate-pulse"></div>
                    <div className="h-4 w-36 bg-white/10 rounded animate-pulse"></div>
                    <div className="h-10 w-full bg-white/10 rounded animate-pulse"></div>
                    <div className="h-10 w-full bg-purple-700/30 rounded animate-pulse mt-4"></div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-5 bg-white/5 backdrop-blur-md rounded-xl p-6 h-[calc(100vh-240px)]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="h-6 w-40 bg-white/20 rounded animate-pulse"></div>
                    <div className="h-8 w-32 bg-white/10 rounded animate-pulse"></div>
                  </div>
                  <div className="h-10 w-full bg-white/10 rounded animate-pulse mb-6"></div>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-20 w-full bg-white/10 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${config.theme.layout.pageConstraints.height} ${config.theme.background} relative overflow-y-auto flex flex-col`}
    >
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
          { pos: "top-20 left-1/4", size: "w-4 h-4", gradient: 6, duration: 0 },
          { pos: "bottom-1/2 right-1/3", size: "w-3 h-3", gradient: 7, duration: 1 },
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
          { pos: "bottom-32 left-40", size: "w-6 w-6" },
          { pos: "top-40 right-96", size: "w-10 h-10" },
          { pos: "bottom-36 right-60", size: "w-5 h-5" },
          { pos: "top-96 left-20", size: "w-7 h-7" },
        ].map((circle, index) => (
          <div
            key={`circle-${index}`}
            className={`absolute ${circle.pos} ${circle.size} ${config.animationGradients.circles[index]} ${config.ui.borderRadius.large} opacity-60`}
            style={{ animation: `circlebounce ${config.animations.durations.circles[index]} ease-in-out infinite` }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header - Use AppHeader component */}
        <AppHeader />

        {/* Main Content */}
        <div className={`flex-1 py-6 ${isMobile ? "px-4" : "px-4 md:px-20 lg:px-32"}`}>
          <div className="h-full">
            {/* Dashboard Header */}
            <div
              className={`flex ${
                isMobile ? "flex-col gap-4" : "items-center justify-between"
              } ${config.theme.layout.pageConstraints.headerSpacing}`}
            >
              <div>
                <h2
                  className={`${config.ui.typography.sizes["2xl"]} ${config.ui.typography.weights.bold} ${config.theme.text.gradient.primary} mb-2`}
                >
                  Graduation Management
                </h2>
                <p className={`${config.theme.text.secondary} ${config.ui.typography.sizes.md}`}>
                  Manage students and generate QR codes for the graduation ceremony
                </p>
              </div>

              <div className={`flex ${isMobile ? "flex-col" : "items-center"} gap-4`}>
                <Button
                  className={`${isMobile ? "w-full" : ""} ${config.theme.primary.gradient} ${
                    config.theme.primary.gradientHover
                  } text-white ${config.ui.borderRadius.small} ${config.ui.shadows.small}`}
                  onClick={handleDownloadClick}
                  disabled={isDownloading || students.length === 0}
                >
                  {isDownloading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Generating... ({downloadProgress}%)
                    </div>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      {isMobile ? "Download QR Codes" : "Download All QR Codes (ZIP)"}
                    </>
                  )}
                </Button>
                {process.env.NODE_ENV === "development" && (
                  <Button
                    variant="outline"
                    onClick={refreshStudents}
                    className={`${isMobile ? "w-full" : ""} bg-white/10 hover:bg-white/20 text-white border-white/20`}
                  >
                    Refresh List
                  </Button>
                )}
              </div>
            </div>

            {/* Main Content - Responsive Layout */}
            {isMobile ? (
              // Mobile: Vertical Stack with Collapsible Sections
              <div className="space-y-6">
                {/* Add Student Section - Collapsible on Mobile */}
                <Collapsible open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden">
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-purple-300" />
                        <h3
                          className={`${config.ui.typography.sizes.lg} ${config.ui.typography.weights.bold} ${config.theme.text.primary}`}
                        >
                          Add Student
                        </h3>
                      </div>
                      {isAddStudentOpen ? (
                        <ChevronUp className="h-5 w-5 text-purple-300" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-purple-300" />
                      )}
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="p-6 pt-0">
                        <p className={`${config.theme.text.secondary} mb-6`}>
                          Add a new student to the graduation list
                        </p>

                        <form onSubmit={handleAddStudent} className="space-y-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="first-name"
                              className={`${config.theme.text.primary} ${config.ui.typography.weights.medium}`}
                            >
                              First Name
                            </Label>
                            <Input
                              id="first-name"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className={`${config.theme.glass.input} ${config.theme.text.primary} ${config.theme.text.placeholder} ${config.ui.borderRadius.small} ${config.theme.primary.ring} focus-visible:ring-2 focus-visible:ring-offset-0 border-0 h-12`}
                              placeholder="Enter first name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="last-name"
                              className={`${config.theme.text.primary} ${config.ui.typography.weights.medium}`}
                            >
                              Last Name
                            </Label>
                            <Input
                              id="last-name"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className={`${config.theme.glass.input} ${config.theme.text.primary} ${config.theme.text.placeholder} ${config.ui.borderRadius.small} ${config.theme.primary.ring} focus-visible:ring-2 focus-visible:ring-offset-0 border-0 h-12`}
                              placeholder="Enter last name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="phonetic"
                              className={`${config.theme.text.primary} ${config.ui.typography.weights.medium}`}
                            >
                              Phonetic Spelling{" "}
                              <span className={`${config.theme.text.muted} ${config.ui.typography.sizes.xs}`}>
                                (optional)
                              </span>
                            </Label>
                            <Input
                              id="phonetic"
                              value={phoneticSpelling}
                              onChange={(e) => setPhoneticSpelling(e.target.value)}
                              className={`${config.theme.glass.input} ${config.theme.text.primary} ${config.theme.text.placeholder} ${config.ui.borderRadius.small} ${config.theme.primary.ring} focus-visible:ring-2 focus-visible:ring-offset-0 border-0 h-12`}
                              placeholder="How to pronounce the name"
                            />
                            <p className={`${config.ui.typography.sizes.xs} ${config.theme.text.muted}`}>
                              Add a phonetic spelling to help with pronunciation during the ceremony.
                            </p>
                          </div>

                          <div className="pt-4">
                            <Button
                              type="submit"
                              className={`w-full h-12 ${config.theme.primary.gradient} ${config.theme.primary.gradientHover} text-white ${config.ui.borderRadius.small} ${config.ui.shadows.small} hover:${config.ui.shadows.large} transition-all ${config.animations.durations.transitions.fast}`}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Student
                            </Button>
                          </div>
                        </form>

                        <div className={`mt-6 pt-6 border-t ${config.theme.primary.border}`}>
                          <h4
                            className={`${config.ui.typography.sizes.sm} ${config.ui.typography.weights.medium} ${config.theme.text.primary} mb-3`}
                          >
                            Import Students
                          </h4>
                          <p className={`${config.ui.typography.sizes.xs} ${config.theme.text.secondary} mb-4`}>
                            Import students from a CSV file with columns: Seat No., Name, University, Programme,
                            Classification. The Name column should contain the full name (first and last name separated
                            by space).
                          </p>
                          <div className="flex items-center gap-2">
                            <Input
                              id="file-upload"
                              type="file"
                              accept=".csv,.json"
                              onChange={handleFileUpload}
                              disabled={isUploading}
                              className="hidden"
                            />
                            <Label
                              htmlFor="file-upload"
                              className={`cursor-pointer flex items-center justify-center w-full py-4 px-4 h-12 ${config.ui.borderRadius.small} ${
                                isUploading
                                  ? "bg-white/5 cursor-not-allowed"
                                  : `${config.theme.glass.standard} ${config.theme.glass.hover}`
                              } ${config.theme.text.primary} transition-all ${config.animations.durations.transitions.fast}`}
                            >
                              {isUploading ? (
                                <>
                                  <svg
                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Processing File...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Choose File
                                </>
                              )}
                            </Label>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>

                {/* Student List Section - Always Expanded on Mobile */}
                <Collapsible open={true} onOpenChange={() => {}}>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden">
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-5 w-5 text-purple-300" />
                        <h3
                          className={`${config.ui.typography.sizes.lg} ${config.ui.typography.weights.bold} ${config.theme.text.primary}`}
                        >
                          Graduation List ({filteredStudents.length})
                        </h3>
                      </div>
                      {isStudentListOpen ? (
                        <ChevronUp className="h-5 w-5 text-purple-300" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-purple-300" />
                      )}
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="p-6 pt-0">
                        {/* Mobile Controls */}
                        <div className="space-y-4 mb-6">
                          {!isSelectionMode ? (
                            <Button
                              variant="outline"
                              onClick={() => setIsSelectionMode(true)}
                              className={`w-full h-12 ${config.theme.glass.standard} ${config.theme.text.primary} ${config.theme.glass.hover} border-0`}
                              disabled={filteredStudents.length === 0}
                            >
                              <CheckSquare className="h-4 w-4 mr-2" />
                              Select Multiple Students
                            </Button>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={toggleSelectAll}
                                  className={`flex-1 h-12 ${config.theme.glass.standard} ${config.theme.text.primary} ${config.theme.glass.hover} border-0`}
                                >
                                  {selectedStudents.size === filteredStudents.length ? (
                                    <CheckSquare className="h-4 w-4 mr-2" />
                                  ) : (
                                    <Square className="h-4 w-4 mr-2" />
                                  )}
                                  Select All
                                </Button>

                                <Button
                                  variant="ghost"
                                  onClick={() => setIsSelectionMode(false)}
                                  className={`px-4 h-12 ${config.theme.text.muted} hover:${config.theme.text.primary}`}
                                >
                                  Cancel
                                </Button>
                              </div>

                              {selectedStudents.size > 0 && (
                                <Button
                                  variant="destructive"
                                  onClick={handleBulkDelete}
                                  disabled={isBulkDeleting}
                                  className={`w-full h-12 ${config.theme.status.warning.gradient} hover:bg-red-700 text-white`}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Selected ({selectedStudents.size})
                                </Button>
                              )}
                            </div>
                          )}

                          {/* Search */}
                          <div className="relative">
                            <Search
                              className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${config.theme.text.muted}`}
                            />
                            <Input
                              type="search"
                              placeholder="Search students..."
                              className={`pl-10 h-12 ${config.theme.glass.input} ${config.theme.text.primary} ${config.theme.text.placeholder} ${config.ui.borderRadius.small} ${config.theme.primary.ring} focus-visible:ring-2 focus-visible:ring-offset-0 border-0`}
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Student List */}
                        <div className="h-96 w-full">
                          {" "}
                          {/* Fixed height container */}
                          {filteredStudents.length === 0 ? (
                            <div className="text-center py-12">
                              <div
                                className={`w-16 h-16 ${config.theme.glass.light} ${config.ui.borderRadius.large} flex items-center justify-center mx-auto mb-4`}
                              >
                                <Users className={`h-8 w-8 ${config.theme.text.muted}`} />
                              </div>
                              <h3
                                className={`${config.ui.typography.sizes.lg} ${config.ui.typography.weights.bold} ${config.theme.text.primary} mb-2`}
                              >
                                No Students Found
                              </h3>
                              <p className={`${config.theme.text.secondary}`}>
                                {searchQuery
                                  ? `No students match "${searchQuery}"`
                                  : "Add your first student to get started"}
                              </p>
                            </div>
                          ) : (
                            <VirtualizedStudentList
                              students={filteredStudents}
                              isSelectionMode={isSelectionMode}
                              selectedStudents={selectedStudents}
                              onToggleSelection={toggleStudentSelection}
                              onCardClick={handleStudentCardClick}
                              onDelete={handleDeleteStudent}
                              onMarkAsShared={handleViewQRModal}
                              handleEditStudent={handleEditStudent}
                              height={384} // Fixed height of 384px (h-96)
                            />
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </div>
            ) : (
              // Desktop: Original Grid Layout
              <div className="grid grid-cols-1 lg:grid-cols-8 gap-20 h-[calc(100vh-240px)]">
                {/* Add Student Section */}
                <div className="lg:col-span-3 bg-white/10 backdrop-blur-md rounded-xl p-6 flex flex-col h-[calc(100vh-240px)] overflow-hidden">
                  <div className="flex flex-col h-full">
                    <div className="mb-4">
                      <h3
                        className={`${config.ui.typography.sizes.lg} ${config.ui.typography.weights.bold} ${config.theme.text.primary} flex items-center mb-2`}
                      >
                        <Users className="h-5 w-5 mr-2" />
                        Add Student
                      </h3>
                      <p className={`${config.theme.text.secondary}`}>Add a new student to the graduation list</p>
                    </div>

                    <div className="flex-1 flex flex-col justify-between min-h-0">
                      <form onSubmit={handleAddStudent} className="space-y-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor="first-name"
                            className={`${config.theme.text.primary} ${config.ui.typography.weights.medium}`}
                          >
                            First Name
                          </Label>
                          <Input
                            id="first-name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className={`${config.theme.glass.input} ${config.theme.text.primary} ${config.theme.text.placeholder} ${config.ui.borderRadius.small} ${config.theme.primary.ring} focus-visible:ring-2 focus-visible:ring-offset-0 border-0`}
                            placeholder="Enter first name"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label
                            htmlFor="last-name"
                            className={`${config.theme.text.primary} ${config.ui.typography.weights.medium}`}
                          >
                            Last Name
                          </Label>
                          <Input
                            id="last-name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className={`${config.theme.glass.input} ${config.theme.text.primary} ${config.theme.text.placeholder} ${config.ui.borderRadius.small} ${config.theme.primary.ring} focus-visible:ring-2 focus-visible:ring-offset-0 border-0`}
                            placeholder="Enter last name"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label
                            htmlFor="phonetic"
                            className={`${config.theme.text.primary} ${config.ui.typography.weights.medium}`}
                          >
                            Phonetic Spelling{" "}
                            <span className={`${config.theme.text.muted} ${config.ui.typography.sizes.xs}`}>
                              (optional)
                            </span>
                          </Label>
                          <Input
                            id="phonetic"
                            value={phoneticSpelling}
                            onChange={(e) => setPhoneticSpelling(e.target.value)}
                            className={`${config.theme.glass.input} ${config.theme.text.primary} ${config.theme.text.placeholder} ${config.ui.borderRadius.small} ${config.theme.primary.ring} focus-visible:ring-2 focus-visible:ring-offset-0 border-0`}
                            placeholder="How to pronounce the name"
                          />
                          <p className={`${config.ui.typography.sizes.xs} ${config.theme.text.muted}`}>
                            Add a phonetic spelling to help with pronunciation during the ceremony.
                          </p>
                        </div>

                        <div className="pt-3">
                          <Button
                            type="submit"
                            className={`w-full ${config.theme.primary.gradient} ${config.theme.primary.gradientHover} text-white ${config.ui.borderRadius.small} ${config.ui.shadows.small} hover:${config.ui.shadows.large} transition-all ${config.animations.durations.transitions.fast}`}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Student
                          </Button>
                        </div>
                      </form>

                      <div className={`mt-3 pt-3 border-t ${config.theme.primary.border}`}>
                        <h4
                          className={`${config.ui.typography.sizes.sm} ${config.ui.typography.weights.medium} ${config.theme.text.primary} mb-2`}
                        >
                          Import Students
                        </h4>
                        <p className={`${config.ui.typography.sizes.xs} ${config.theme.text.secondary} mb-3`}>
                          Import students from a CSV file with columns: Seat No., Name, University, Programme,
                          Classification. The Name column should contain the full name (first and last name separated by
                          space).
                        </p>
                        <div className="flex items-center gap-2 mb-0">
                          <Input
                            id="file-upload"
                            type="file"
                            accept=".csv,.json"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            className="hidden"
                          />
                          <Label
                            htmlFor="file-upload"
                            className={`cursor-pointer flex items-center justify-center w-full py-3 px-4 ${config.ui.borderRadius.small} ${
                              isUploading
                                ? "bg-white/5 cursor-not-allowed"
                                : `${config.theme.glass.standard} ${config.theme.glass.hover}`
                            } ${config.theme.text.primary} transition-all ${config.animations.durations.transitions.fast}`}
                          >
                            {isUploading ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Processing...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Choose File
                              </>
                            )}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student List Section */}
                <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-xl flex flex-col h-[calc(100vh-240px)] overflow-hidden">
                  {/* Header */}
                  <div className="p-6 pb-4 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                      <h3
                        className={`${config.ui.typography.sizes.lg} ${config.ui.typography.weights.bold} ${config.theme.text.primary}`}
                      >
                        Graduation List
                      </h3>
                      <div className="flex items-center gap-2">
                        {!isSelectionMode ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsSelectionMode(true)}
                            className={`${config.theme.glass.standard} ${config.theme.text.primary} ${config.theme.glass.hover} border-0`}
                            disabled={filteredStudents.length === 0}
                          >
                            <CheckSquare className="h-4 w-4 mr-2" />
                            Select Multiple
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={toggleSelectAll}
                              className={`${config.theme.glass.standard} ${config.theme.text.primary} ${config.theme.glass.hover} border-0`}
                            >
                              {selectedStudents.size === filteredStudents.length ? (
                                <CheckSquare className="h-4 w-4 mr-2" />
                              ) : (
                                <Square className="h-4 w-4 mr-2" />
                              )}
                              All
                            </Button>

                            {selectedStudents.size > 0 && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDelete}
                                disabled={isBulkDeleting}
                                className={`${config.theme.status.warning.gradient} hover:bg-red-700 text-white`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete ({selectedStudents.size})
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsSelectionMode(false)}
                              className={`${config.theme.text.muted} hover:${config.theme.text.primary}`}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className={`${config.theme.text.secondary} mb-4`}>
                      {filteredStudents.length} {filteredStudents.length === 1 ? "student" : "students"} in the
                      graduation list (sorted A-Z)
                      {selectedStudents.size > 0 && (
                        <span className={`ml-2 ${config.theme.primary.text} ${config.ui.typography.weights.medium}`}>
                          • {selectedStudents.size} selected
                        </span>
                      )}
                    </p>

                    {/* Search */}
                    <div className="relative">
                      <Search className={`absolute left-2.5 top-2.5 h-4 w-4 ${config.theme.text.muted}`} />
                      <Input
                        type="search"
                        placeholder="Search students..."
                        className={`pl-8 ${config.theme.glass.input} ${config.theme.text.primary} ${config.theme.text.placeholder} ${config.ui.borderRadius.small} ${config.theme.primary.ring} focus-visible:ring-2 focus-visible:ring-offset-0 border-0`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Student List */}
                  <div className="flex-1 overflow-hidden">
                    {filteredStudents.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center py-8">
                          <div
                            className={`w-16 h-16 ${config.theme.glass.light} ${config.ui.borderRadius.large} flex items-center justify-center mx-auto mb-4`}
                          >
                            <Users className={`h-8 w-8 ${config.theme.text.muted}`} />
                          </div>
                          <h3
                            className={`${config.ui.typography.sizes.lg} ${config.ui.typography.weights.bold} ${config.theme.text.primary} mb-2`}
                          >
                            No Students Found
                          </h3>
                          <p className={`${config.theme.text.secondary}`}>
                            {searchQuery
                              ? `No students match "${searchQuery}"`
                              : "Add your first student to get started"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <VirtualizedStudentList
                        students={filteredStudents}
                        isSelectionMode={isSelectionMode}
                        selectedStudents={selectedStudents}
                        onToggleSelection={toggleStudentSelection}
                        onCardClick={handleStudentCardClick}
                        onDelete={handleDeleteStudent}
                        onMarkAsShared={handleViewQRModal}
                        handleEditStudent={handleEditStudent}
                        height={typeof window !== "undefined" ? Math.max(400, window.innerHeight - 300) : 400}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent
          className="sm:max-w-lg bg-transparent border-0 p-0 shadow-none"
          aria-describedby="qr-modal-description"
        >
          <DialogDescription id="qr-modal-description" className="sr-only">
            {selectedStudentForQr
              ? `QR code modal for ${selectedStudentForQr.first_name} ${selectedStudentForQr.last_name}`
              : "QR code modal"}
          </DialogDescription>

          {selectedStudentForQr && (
            <>
              {/* Loading state while generating QR */}
              {isGeneratingQR && (
                <div className="animate-scaleIn relative">
                  <div className="flex items-center justify-center h-96 w-96 bg-gradient-to-br from-slate-800 via-purple-800/80 to-slate-800 rounded-2xl">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                      <p className="text-white text-shadow-sm">Generating QR Code...</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="absolute top-2 right-2 z-50 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5 text-white text-shadow-sm" />
                  </button>
                </div>
              )}

              {/* Visible card in modal */}
              {!isGeneratingQR && (
                <div className="animate-scaleIn relative">
                  <QRCard
                    ref={qrCardRef}
                    id={`qr-card-${selectedStudentForQr.id}`}
                    student={selectedStudentForQr}
                    onCopy={handleCopyQR}
                    onDownload={handleDownloadQR}
                    isCopied={isCopied}
                    showButtons={true}
                    hideButtonsForCapture={hideQrButtons}
                  />
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="absolute top-2 right-2 z-50 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5 text-white text-shadow-sm" />
                  </button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden canvas for QR generation */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Student Detail Modal */}
      <StudentDetailModal
        student={selectedStudentForDetail}
        isOpen={showStudentDetailModal}
        onClose={() => setShowStudentDetailModal(false)}
        onEdit={(student) => {
          handleEditStudent(student)
          setShowStudentDetailModal(false)
        }}
        onDelete={(student) => {
          handleDeleteStudent(student.id)
          setShowStudentDetailModal(false)
        }}
      />

      {/* Edit Student Modal */}
      <EditStudentModal
        student={editingStudent}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingStudent(null)
        }}
        onSave={handleSaveStudent}
      />

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent
          className={`max-w-md ${config.theme.modal.background} ${config.theme.modal.border} ${config.ui.shadows.large}`}
        >
          <AlertDialogHeader className="space-y-4 pb-4">
            <div
              className={`flex items-center justify-center w-16 h-16 mx-auto ${config.theme.status.warning.bg} ${config.ui.borderRadius.large}`}
            >
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <AlertDialogTitle
              className={`${config.ui.typography.sizes.xl} ${config.ui.typography.weights.bold} ${config.theme.text.gradient.primary} text-center`}
            >
              Delete Selected Students
            </AlertDialogTitle>
            <AlertDialogDescription
              className={`${config.ui.typography.sizes.md} ${config.theme.text.secondary} text-center leading-relaxed px-2`}
            >
              Are you sure you want to delete{" "}
              <span className={`${config.ui.typography.weights.semibold} ${config.theme.primary.text}`}>
                {selectedStudents.size} student{selectedStudents.size !== 1 ? "s" : ""}
              </span>
              ?
              <br />
              <span className={`${config.ui.typography.sizes.sm} ${config.theme.text.muted} mt-2 block`}>
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 pt-6">
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteDialog(false)}
              className={`flex-1 ${config.theme.glass.standard} ${config.theme.text.primary} ${config.theme.glass.hover} border-0 transition-all ${config.animations.durations.transitions.fast}`}
              disabled={isBulkDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmBulkDelete}
              className={`flex-1 ${config.theme.status.warning.gradient} text-white ${config.ui.shadows.small} hover:${config.ui.shadows.large} transition-all ${config.animations.durations.transitions.fast}`}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? "Deleting..." : "Delete Students"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Confirmation Dialog */}
      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent
          className={`max-w-md ${config.theme.modal.background} ${config.theme.modal.border} ${config.ui.shadows.large}`}
        >
          <AlertDialogHeader className="space-y-4 pb-4">
            <div
              className={`flex items-center justify-center w-16 h-16 mx-auto ${config.theme.primary.gradient} ${config.ui.borderRadius.large}`}
            >
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <AlertDialogTitle
              className={`${config.ui.typography.sizes.xl} ${config.ui.typography.weights.bold} ${config.theme.text.gradient.primary} text-center`}
            >
              Duplicate Students Found
            </AlertDialogTitle>
            <AlertDialogDescription
              className={`${config.ui.typography.sizes.md} ${config.theme.text.secondary} text-center leading-relaxed px-2`}
            >
              We found{" "}
              <span className={`${config.ui.typography.weights.semibold} text-red-400`}>
                {duplicateInfo.existing} duplicate student{duplicateInfo.existing !== 1 ? "s" : ""}
              </span>{" "}
              that already exist in the database.
              <br />
              <br />
              {duplicateInfo.new > 0 ? (
                <>
                  There {duplicateInfo.new === 1 ? "is" : "are"}{" "}
                  <span className={`${config.ui.typography.weights.semibold} ${config.theme.primary.text}`}>
                    {duplicateInfo.new} new student{duplicateInfo.new !== 1 ? "s" : ""}
                  </span>{" "}
                  that can be added.
                  <br />
                  <span className={`${config.ui.typography.sizes.sm} ${config.theme.text.muted} mt-2 block`}>
                    Would you like to add only the new students?
                  </span>
                </>
              ) : (
                <span className={`${config.ui.typography.sizes.sm} ${config.theme.text.muted} mt-2 block`}>
                  All students in the file already exist in the database.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 pt-6">
            <Button
              variant="outline"
              onClick={() => setShowDuplicateDialog(false)}
              className={`flex-1 ${config.theme.glass.standard} ${config.theme.text.primary} ${config.theme.glass.hover} border-0 transition-all ${config.animations.durations.transitions.fast}`}
            >
              Cancel
            </Button>
            {duplicateInfo.new > 0 && (
              <Button
                onClick={handleConfirmDuplicateImport}
                className={`flex-1 ${config.theme.primary.gradient} ${config.theme.primary.gradientHover} text-white ${config.ui.shadows.small} hover:${config.ui.shadows.large} transition-all ${config.animations.durations.transitions.fast}`}
              >
                Add {duplicateInfo.new} New Student{duplicateInfo.new !== 1 ? "s" : ""}
              </Button>
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />

      <style jsx>{`
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.animate-scaleIn {
  animation: scaleIn 0.4s ease-out forwards;
}

${config.animations.keyframes}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(139, 92, 246, 0.1);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.5);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.7);
}
`}</style>
    </div>
  )
}
