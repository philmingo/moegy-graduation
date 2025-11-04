"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import DesktopWebSocketClient, { type MobileDeviceInfo } from "@/components/desktop-websocket-client"
import config from "@/lib/theme-config"
import AppHeader from "@/components/app-header"
import { useStudents } from "@/hooks/use-students"
import { type Student } from "@/lib/actions/students"
import { ScannerControls } from "./scanner-controls"
import { CurrentGraduate } from "./current-graduate"
import { MobileScannerPrompt } from "./mobile-scanner-prompt"
import { useIsMobile } from "@/hooks/use-mobile"
import { getAnnouncementText } from "@/lib/utils/speech-utils"

interface ConnectedMobileDevice extends MobileDeviceInfo {
  id?: string
}

export default function ScannerPageWrapper() {
  // Device detection
  const isMobile = useIsMobile()

  // Authentication and routing
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Scanner state
  const [scanning, setScanning] = useState(false)
  const [scannedName, setScannedName] = useState("")
  const [scanResult, setScanResult] = useState({ success: false, message: "" })
  const [phoneticSpelling, setPhoneticSpelling] = useState("")
  const [university, setUniversity] = useState("")
  const [programme, setProgramme] = useState("")
  const [classification, setClassification] = useState("")
  const [scannerKey, setScannerKey] = useState(0)

  // Student data - now using React Query
  const { data: students = [], isLoading: isLoadingStudents } = useStudents()
  const studentsTyped = students as Student[]

  // Log when student cache is ready
  useEffect(() => {
    if (!isLoadingStudents && studentsTyped.length > 0) {
      console.log(`✅ [SCANNER] Student cache ready - ${studentsTyped.length} students loaded from React Query cache`)
    } else if (!isLoadingStudents && studentsTyped.length === 0) {
      console.log("⚠️ [SCANNER] Student cache is empty - no students found")
    }
  }, [isLoadingStudents, studentsTyped.length])

  const [scannedNames, setScannedNames] = useState<Set<string>>(new Set())
  const [totalScanned, setTotalScanned] = useState(0)

  // Search functionality
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Student[]>([])

  // Voice settings - moved before functions that use them
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState("")
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [speechRate, setSpeechRate] = useState(0.9)
  const [speechPitch, setSpeechPitch] = useState(1.0)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Auto-announce toggle
  const [autoAnnounce, setAutoAnnounce] = useState(true)
  const [showAutoAnnounceModal, setShowAutoAnnounceModal] = useState(false)

  // Mobile scanner connection
  const [mobileScannerInfo, setMobileScannerInfo] = useState<ConnectedMobileDevice | null>(null)
  const [isMobileServerAssumedOffline, setIsMobileServerAssumedOffline] = useState(false)
  const [reconnectTrigger, setReconnectTrigger] = useState(0)

  // Recent activity
  const [previousScans, setPreviousScans] = useState<
    Array<{ name: string; phonetic: string; timestamp: string; id: number }>
  >([])

  // Alert dialog
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertTitle, setAlertTitle] = useState("")
  const [alertDescription, setAlertDescription] = useState("")

  // Camera switching for mobile
  const [currentCamera, setCurrentCamera] = useState<"environment" | "user">("environment")

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Voice synthesis function - FIXED: More stable state management
  const speakName = useCallback(
    (
      nameToSpeak: string,
      isFromPreviousList = false,
      studentInfo?: {
        name?: string
        phonetic?: string
        programme?: string
        university?: string
        classification?: string
      },
    ) => {
      if (!nameToSpeak || isSpeaking) return

      if ("speechSynthesis" in window) {
        setIsSpeaking(true)

        try {
          window.speechSynthesis.cancel()
        } catch (error) {
          // Ignore cancellation errors
        }

        // Reduced timeout to minimize state timing issues
        setTimeout(() => {
          try {
            // Use provided student info or fall back to current state
            const currentStudentInfo = studentInfo || {
              name: scannedName,
              phonetic: phoneticSpelling,
              programme: programme,
              university: university,
              classification: classification,
            }

            // For previous list items, only use the provided name
            const textToSpeak = isFromPreviousList ? nameToSpeak : getAnnouncementText(currentStudentInfo)

            const utterance = new SpeechSynthesisUtterance(textToSpeak)

            const voice = availableVoices.find((v) => v.name === selectedVoice)
            if (voice) {
              utterance.voice = voice
            } else if (availableVoices.length > 0) {
              utterance.voice = availableVoices[0]
            }

            utterance.rate = Math.max(0.5, Math.min(2.0, Number(speechRate) || 1.0))
            utterance.pitch = Math.max(0.1, Math.min(2.0, Number(speechPitch) || 1.0))
            utterance.volume = 1.0

            utterance.onend = () => {
              setIsSpeaking(false)
              // REMOVED: Automatic state clearing to prevent cascading updates
              // Let the user manually clear or scan next student
            }

            utterance.onerror = (event) => {
              setIsSpeaking(false)
              if (event.error !== "canceled" && event.error !== "interrupted") {
                toast({
                  title: "Speech Error",
                  description: `Unable to announce "${nameToSpeak}". Please try again.`,
                  variant: "destructive",
                })
              }
            }

            window.speechSynthesis.speak(utterance)

            // Update recent scans - use the correct student info
            if (!isFromPreviousList && currentStudentInfo.name) {
              setPreviousScans((prev) => {
                const studentName = currentStudentInfo.name || "Unknown Student"
                if (prev.length > 0 && prev[0].name === studentName) return prev
                return [
                  {
                    name: studentName,
                    phonetic: currentStudentInfo.phonetic || "",
                    timestamp: new Date().toLocaleTimeString(),
                    id: Date.now(),
                  },
                  ...prev,
                ].slice(0, 3)
              })
            }
          } catch (error) {
            setIsSpeaking(false)
            console.error("Error creating speech utterance:", error)
            toast({
              title: "Speech Error",
              description: "Unable to create speech announcement.",
              variant: "destructive",
            })
          }
        }, 50) // Reduced from 100ms to 50ms
      } else {
        setAlertTitle("Speech Synthesis Not Supported")
        setAlertDescription("Your browser does not support text-to-speech functionality.")
        setAlertOpen(true)
      }
    },
    [
      isSpeaking,
      availableVoices,
      selectedVoice,
      speechRate,
      speechPitch,
      scannedName,
      phoneticSpelling,
      programme,
      university,
      classification,
      toast,
    ],
  )

  // Auto-announce functionality - FIXED to pass student info directly
  const handleAutoAnnounce = useCallback(
    (studentName: string, phonetic?: string, programme?: string, university?: string, classification?: string) => {
      if (autoAnnounce && studentName) {
        const studentInfo = {
          name: studentName,
          phonetic: phonetic,
          programme: programme,
          university: university,
          classification: classification,
        }
        speakName(phonetic || studentName, false, studentInfo)
      }
    },
    [autoAnnounce, speakName],
  )

  // Authentication check
  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated") === "true"
    setIsAuthenticated(authStatus)
    if (!authStatus) {
      router.push("/login")
    }
  }, []) // REMOVED router dependency to prevent loops

  // Load voices - FIXED: More robust voice loading with retry mechanism and manual trigger
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    let isComponentMounted = true
    let retryCount = 0
    const MAX_RETRIES = 10 // Max 10 attempts over ~5 seconds

    const loadVoices = () => {
      if (!isComponentMounted) return

      const allVoices = window.speechSynthesis.getVoices()
      
      if (allVoices.length === 0 && retryCount < MAX_RETRIES) {
        // Exponential backoff: 100ms, 200ms, 300ms, 500ms, 500ms...
        const delay = Math.min(100 * (retryCount + 1), 500)
        retryCount++
        
        console.log(`🔄 [VOICE-LOADING] Attempt ${retryCount}/${MAX_RETRIES} - Retrying voice loading in ${delay}ms`)
        
        timeoutId = setTimeout(() => {
          if (isComponentMounted) {
            loadVoices()
          }
        }, delay)
        return
      }

      if (allVoices.length === 0) {
        console.warn("⚠️ [VOICE-LOADING] No voices available after all retry attempts")
        // Still set empty array to prevent undefined errors
        setAvailableVoices([])
        return
      }

      console.log(`✅ [VOICE-LOADING] Found ${allVoices.length} voices`)

      // Filter for English voices (US/UK/GB)
      const englishVoices = allVoices.filter(
        (voice) =>
          voice.lang.startsWith("en-US") ||
          voice.lang.startsWith("en-GB") ||
          voice.lang.startsWith("en-UK") ||
          voice.lang === "en",
      )

      const filteredVoices = englishVoices.length > 0 ? englishVoices : allVoices
      
      console.log(`✅ [VOICE-LOADING] Filtered to ${filteredVoices.length} English voices`)
      
      if (isComponentMounted) {
        setAvailableVoices(filteredVoices)

        const savedVoice = localStorage.getItem("selectedVoice")
        const savedRate = localStorage.getItem("speechRate")
        const savedPitch = localStorage.getItem("speechPitch")

        if (savedVoice && filteredVoices.find((v) => v.name === savedVoice)) {
          setSelectedVoice(savedVoice)
          console.log(`✅ [VOICE-LOADING] Restored saved voice: ${savedVoice}`)
        } else if (filteredVoices.length > 0) {
          setSelectedVoice(filteredVoices[0].name)
          console.log(`✅ [VOICE-LOADING] Selected default voice: ${filteredVoices[0].name}`)
        }

        if (savedRate) {
          const rate = Number.parseFloat(savedRate)
          if (!isNaN(rate) && rate >= 0.5 && rate <= 2.0) {
            setSpeechRate(rate)
          }
        }
        if (savedPitch) {
          const pitch = Number.parseFloat(savedPitch)
          if (!isNaN(pitch) && pitch >= 0.1 && pitch >= 2.0) {
            setSpeechPitch(pitch)
          }
        }
      }
    }

    // Initial load
    console.log("🔄 [VOICE-LOADING] Starting voice initialization")
    loadVoices()

    // Listen for voiceschanged event (browser-specific behavior)
    const handleVoicesChanged = () => {
      if (isComponentMounted) {
        console.log("🔄 [VOICE-LOADING] voiceschanged event fired")
        retryCount = 0 // Reset retry count on event
        loadVoices()
      }
    }

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged
    }

    return () => {
      isComponentMounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  // Manual voice reload when settings dialog opens - FIXED: Force voice reload on user interaction
  useEffect(() => {
    if (settingsDialogOpen && availableVoices.length === 0) {
      console.log("🔄 [VOICE-LOADING] Settings dialog opened - forcing voice reload")
      
      // Force a fresh voice load when settings dialog opens
      const voices = window.speechSynthesis.getVoices()
      
      if (voices.length > 0) {
        const englishVoices = voices.filter(
          (voice) =>
            voice.lang.startsWith("en-US") ||
            voice.lang.startsWith("en-GB") ||
            voice.lang.startsWith("en-UK") ||
            voice.lang === "en",
        )
        
        const filteredVoices = englishVoices.length > 0 ? englishVoices : voices
        setAvailableVoices(filteredVoices)
        
        if (filteredVoices.length > 0 && !selectedVoice) {
          setSelectedVoice(filteredVoices[0].name)
        }
        
        console.log(`✅ [VOICE-LOADING] Loaded ${filteredVoices.length} voices on settings open`)
      } else {
        // If still no voices, show a toast to inform the user
        console.warn("⚠️ [VOICE-LOADING] No voices available even after settings dialog opened")
        toast({
          title: "Voice Loading Issue",
          description: "Voice options are loading. Please wait a moment and try again.",
        })
      }
    }
  }, [settingsDialogOpen, availableVoices.length, selectedVoice, toast])

  // QR scan handler
  const handleScan = useCallback(
    (data: string | any) => {
      console.log("Raw QR scan data:", data)

      try {
        // Check if data is already an object or needs to be parsed
        const decodedData = typeof data === 'string' ? JSON.parse(data) : data
        console.log("Parsed QR data:", decodedData)

        if (decodedData && decodedData.id && (decodedData.first_name || decodedData.firstName)) {
          // Handle the actual student data structure from the database
          const studentName = decodedData.first_name && decodedData.last_name 
            ? `${decodedData.first_name} ${decodedData.last_name}`
            : decodedData.firstName && decodedData.lastName
            ? `${decodedData.firstName} ${decodedData.lastName}`
            : decodedData.name || ""
            
          const phoneticName = decodedData.phonetic_spelling || decodedData.phoneticSpelling || ""
          const studentProgram = decodedData.programme || decodedData.program || ""
          const studentUniversity = decodedData.university || ""
          const studentClassification = decodedData.classification || ""

          // Set the current student data
          setScannedName(studentName)
          setPhoneticSpelling(phoneticName)
          setProgramme(studentProgram)
          setUniversity(studentUniversity)
          setClassification(studentClassification)
          setScanResult({ success: true, message: `Successfully validated QR code for ${studentName}` })

          // Track scanned students
          if (!scannedNames.has(studentName)) {
            setScannedNames((prev) => new Set(prev).add(studentName))
            setTotalScanned((prev) => prev + 1)
          }

          // Auto-announce if enabled - pass the correct student info
          handleAutoAnnounce(studentName, phoneticName, studentProgram, studentUniversity, studentClassification)
        } else {
          setScanResult({ success: false, message: "Invalid QR code format or missing student data." })
        }
      } catch (error) {
        console.error("QR scan error:", error)
        setScanResult({ success: false, message: "Invalid QR code. This QR code was not generated by the system." })
      }

      // Note: Scanner state will be updated via handleStopScanning callback from QrScanner component
      // This is called automatically when camera stops after successful scan
    },
    [scannedNames, handleAutoAnnounce],
  )

  // Camera switching - FIXED: Only increment scanner key when actually needed
  const handleCameraSwitch = useCallback(() => {
    setCurrentCamera((prev) => (prev === "environment" ? "user" : "environment"))
    // Only increment scanner key for camera switches, not regular scans
    setScannerKey((prev) => prev + 1)
  }, [])

  // Manual scanner refresh - separate from camera switching
  const handleScannerRefresh = useCallback(() => {
    setScannerKey((prev) => prev + 1)
  }, [])

  // Stop scanning function - simplified with reliance on child component cleanup
  const handleStopScanning = useCallback(() => {
    // Simply update the scanning state - the QrScanner component will handle camera cleanup
    setScanning(false)
    // Note: We don't trigger scanner remount here to prevent infinite loops
    // The QrScanner component will handle cleanup via isActive prop change
  }, [])

  // Start scanning function
  const handleStartScanning = useCallback(() => {
    setScanning(true)
  }, [])

  // Mobile WebSocket handlers
  const handleMobileStudentScan = useCallback(
    (student: { name: string; phonetic?: string }, scannerId?: string) => {
      console.log(`[ScannerPage] Mobile student scan received:`, student)
      setScannedName(student.name)
      setPhoneticSpelling(student.phonetic || "")
      setScanResult({ success: true, message: `Student scanned from mobile: ${student.name}` })

      if (!scannedNames.has(student.name)) {
        setScannedNames((prev) => new Set(prev).add(student.name))
        setTotalScanned((prev) => prev + 1)
      }

      // Auto-announce if enabled - pass the correct student info
      handleAutoAnnounce(student.name, student.phonetic, "", "", "")

      toast({
        title: "Mobile Scan Received",
        description: `${student.name} scanned from mobile.`,
        className: "bg-blue-600 text-white",
      })
    },
    [scannedNames, handleAutoAnnounce, toast],
  )

  const handleMobileStatusUpdate = useCallback(
    (isConnected: boolean, deviceInfo?: MobileDeviceInfo, scannerId?: string) => {
      const deviceId = scannerId || deviceInfo?.userAgent || "defaultMobile"
      console.log(`[ScannerPage] Mobile status update for ${deviceId}: ${isConnected ? "CONNECTED" : "DISCONNECTED"}`)

      if (isConnected) {
        setMobileScannerInfo({ id: deviceId, ...deviceInfo })
        setIsMobileServerAssumedOffline(false)
      } else {
        if (scannerId && mobileScannerInfo?.id === scannerId) {
          setMobileScannerInfo(null)
        } else if (!scannerId && deviceInfo?.userAgent === "Mobile features offline") {
          setMobileScannerInfo(null)
        } else if (!scannerId) {
          setMobileScannerInfo(null)
        }
      }
    },
    [mobileScannerInfo?.id],
  )

  const handleScannerDisconnected = useCallback(
    (scannerId: string) => {
      console.log(`[ScannerPage] Received scanner-disconnected event for: ${scannerId}`)
      toast({
        title: "Mobile Scanner Disconnected",
        description: `Scanner ${scannerId} has disconnected.`,
        variant: "destructive",
      })
      if (mobileScannerInfo?.id === scannerId) {
        setMobileScannerInfo(null)
      }
    },
    [mobileScannerInfo?.id, toast],
  )

  const handleServerAssumedOffline = useCallback((isOffline: boolean) => {
    setIsMobileServerAssumedOffline(isOffline)
    if (isOffline) {
      setMobileScannerInfo(null)
    }
  }, [])

  const handleManualReconnect = useCallback(() => {
    console.log("[ScannerPage] Manual reconnect triggered for mobile features.")
    setIsMobileServerAssumedOffline(false)
    setReconnectTrigger((prev) => prev + 1)
    toast({
      title: "Reconnecting Mobile Features...",
      description: "Attempting to connect to the mobile scanning service.",
    })
  }, [toast])

  // Manual clear function - gives users control over when to clear current student
  const handleClearCurrentStudent = useCallback(() => {
    setScannedName("")
    setPhoneticSpelling("")
    setUniversity("")
    setProgramme("")
    setClassification("")
    setScanResult({ success: false, message: "" })
  }, [])

  // Camera switching

  // Auto-announce toggle handler
  const handleAutoAnnounceToggle = () => {
    if (autoAnnounce) {
      setShowAutoAnnounceModal(true)
    } else {
      setAutoAnnounce(true)
    }
  }

  const confirmDisableAutoAnnounce = () => {
    setAutoAnnounce(false)
    setShowAutoAnnounceModal(false)
    toast({
      title: "Auto-Announce Disabled",
      description: "Automatic announcements have been turned off.",
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-white p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-gray-600">Please log in to access the QR scanner</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${config.theme.background} relative overflow-hidden`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
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

        {[
          { pos: "top-16 right-1/3", size: "w-12 h-12", gradient: 0, duration: 0 },
          { pos: "top-1/3 left-16", size: "w-10 h-10", gradient: 1, duration: 1 },
          { pos: "bottom-1/4 right-20", size: "w-14 h-14", gradient: 2, duration: 2 },
          { pos: "top-1/2 right-1/4", size: "w-6 w-6", gradient: 3, duration: 0 },
          { pos: "bottom-1/3 left-1/3", size: "w-8 h-8", gradient: 4, duration: 1 },
        ].map((square, index) => (
          <div
            key={`square-${index}`}
            className={`absolute ${square.pos} ${square.size} ${config.animationGradients.squares[square.gradient]} rotate-45 opacity-60`}
            style={{ animation: `spin ${config.animations.durations.squares.large[square.duration]} linear infinite` }}
          />
        ))}

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

      <div className="relative z-10 flex flex-col lg:h-screen lg:min-h-screen lg:max-h-screen lg:overflow-hidden min-h-screen">
        {/* Header */}
        <AppHeader
          pageType="scanner"
          autoAnnounce={autoAnnounce}
          onAutoAnnounceToggle={handleAutoAnnounceToggle}
          showAutoAnnounceModal={showAutoAnnounceModal}
          onConfirmDisableAutoAnnounce={confirmDisableAutoAnnounce}
          onCancelDisableAutoAnnounce={() => setShowAutoAnnounceModal(false)}
          mobileScannerInfo={mobileScannerInfo}
          isMobileServerAssumedOffline={isMobileServerAssumedOffline}
          onManualReconnect={handleManualReconnect}
        />

        {/* Main Content */}
        <div className="flex-1 container mx-auto px-4 md:px-6 py-2 md:py-4 flex flex-col min-h-0 lg:overflow-hidden">
          {isMobile ? (
            // Mobile Layout - Vertical Stack
            <div className="flex flex-col space-y-4 lg:flex-1 lg:min-h-0 lg:overflow-hidden">
              <ScannerControls
                isMobile={isMobile}
                scanning={scanning}
                onStartScanning={handleStartScanning}
                onStopScanning={handleStopScanning}
                onScan={handleScan}
                scannerKey={scannerKey}
                currentCamera={currentCamera}
                onCameraSwitch={handleCameraSwitch}
                searchDialogOpen={searchDialogOpen}
                onSearchDialogToggle={() => setSearchDialogOpen(!searchDialogOpen)}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                searchResults={searchResults}
                onSearchResultsChange={setSearchResults}
                students={studentsTyped}
                onSelectStudent={(student) => {
                  const studentName = `${student.first_name} ${student.last_name}`
                  setScannedName(studentName)
                  setPhoneticSpelling(student.phonetic_spelling || "")
                  setUniversity(student.university || "")
                  setProgramme(student.programme || "")
                  setClassification(student.classification || "")
                  setScanResult({ success: true, message: `Student selected: ${studentName}` })
                  setSearchDialogOpen(false)
                  setSearchQuery("")
                  setSearchResults([])

                  if (!scannedNames.has(studentName)) {
                    setScannedNames((prev) => new Set(prev).add(studentName))
                    setTotalScanned((prev) => prev + 1)
                  }

                  // Auto-announce if enabled - pass the correct student info
                  handleAutoAnnounce(
                    studentName,
                    student.phonetic_spelling || undefined,
                    student.programme || undefined,
                    student.university || undefined,
                    student.classification || undefined,
                  )
                }}
                settingsDialogOpen={settingsDialogOpen}
                onSettingsDialogToggle={() => setSettingsDialogOpen(!settingsDialogOpen)}
                selectedVoice={selectedVoice}
                onSelectedVoiceChange={setSelectedVoice}
                availableVoices={availableVoices}
                speechRate={speechRate}
                onSpeechRateChange={setSpeechRate}
                speechPitch={speechPitch}
                onSpeechPitchChange={setSpeechPitch}
                isSpeaking={isSpeaking}
                onTestVoice={(text) => speakName(text, true)}
                onSaveVoiceSettings={() => {
                  localStorage.setItem("selectedVoice", selectedVoice)
                  localStorage.setItem("speechRate", speechRate.toString())
                  localStorage.setItem("speechPitch", speechPitch.toString())
                  setSettingsDialogOpen(false)
                  toast({ title: "Settings Saved", description: "Voice settings have been saved successfully." })
                }}
                alertOpen={alertOpen}
                alertTitle={alertTitle}
                alertDescription={alertDescription}
                onAlertClose={() => setAlertOpen(false)}
              />

              <CurrentGraduate
                isMobile={isMobile}
                scannedName={scannedName}
                programme={programme}
                university={university}
                scanResult={scanResult}
                onAnnounce={() => speakName(phoneticSpelling || scannedName, false)}
                isSpeaking={isSpeaking}
                previousScans={previousScans}
                onAnnouncePrevious={(graduate) => {
                  speakName(graduate.phonetic || graduate.name, true)
                }}
                totalScanned={totalScanned}
              />

              <MobileScannerPrompt isMobile={isMobile} />
            </div>
          ) : (
            // Desktop Layout - Side by Side
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:flex-1 lg:min-h-0">
              <div className="lg:w-2/3 flex flex-col lg:min-h-0">
                <ScannerControls
                  isMobile={isMobile}
                  scanning={scanning}
                  onStartScanning={handleStartScanning}
                  onStopScanning={handleStopScanning}
                  onScan={handleScan}
                  scannerKey={scannerKey}
                  currentCamera={currentCamera}
                  onCameraSwitch={handleCameraSwitch}
                  searchDialogOpen={searchDialogOpen}
                  onSearchDialogToggle={() => setSearchDialogOpen(!searchDialogOpen)}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  searchResults={searchResults}
                  onSearchResultsChange={setSearchResults}
                  students={studentsTyped}
                  onSelectStudent={(student) => {
                    const studentName = `${student.first_name} ${student.last_name}`
                    setScannedName(studentName)
                    setPhoneticSpelling(student.phonetic_spelling || "")
                    setUniversity(student.university || "")
                    setProgramme(student.programme || "")
                    setClassification(student.classification || "")
                    setScanResult({ success: true, message: `Student selected: ${studentName}` })
                    setSearchDialogOpen(false)
                    setSearchQuery("")
                    setSearchResults([])

                    if (!scannedNames.has(studentName)) {
                      setScannedNames((prev) => new Set(prev).add(studentName))
                      setTotalScanned((prev) => prev + 1)
                    }

                    // Auto-announce if enabled - pass the correct student info
                    handleAutoAnnounce(
                      studentName,
                      student.phonetic_spelling || undefined,
                      student.programme || undefined,
                      student.university || undefined,
                      student.classification || undefined,
                    )
                  }}
                  settingsDialogOpen={settingsDialogOpen}
                  onSettingsDialogToggle={() => setSettingsDialogOpen(!settingsDialogOpen)}
                  selectedVoice={selectedVoice}
                  onSelectedVoiceChange={setSelectedVoice}
                  availableVoices={availableVoices}
                  speechRate={speechRate}
                  onSpeechRateChange={setSpeechRate}
                  speechPitch={speechPitch}
                  onSpeechPitchChange={setSpeechPitch}
                  isSpeaking={isSpeaking}
                  onTestVoice={(text) => speakName(text, true)}
                  onSaveVoiceSettings={() => {
                    localStorage.setItem("selectedVoice", selectedVoice)
                    localStorage.setItem("speechRate", speechRate.toString())
                    localStorage.setItem("speechPitch", speechPitch.toString())
                    setSettingsDialogOpen(false)
                    toast({ title: "Settings Saved", description: "Voice settings have been saved successfully." })
                  }}
                  alertOpen={alertOpen}
                  alertTitle={alertTitle}
                  alertDescription={alertDescription}
                  onAlertClose={() => setAlertOpen(false)}
                />
              </div>

              <div className="lg:w-1/3 flex flex-col lg:min-h-0">
                <CurrentGraduate
                  isMobile={isMobile}
                  scannedName={scannedName}
                  programme={programme}
                  university={university}
                  scanResult={scanResult}
                  onAnnounce={() => speakName(phoneticSpelling || scannedName, false)}
                  isSpeaking={isSpeaking}
                  previousScans={previousScans}
                  onAnnouncePrevious={(graduate) => {
                    speakName(graduate.phonetic || graduate.name, true)
                  }}
                  totalScanned={totalScanned}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WebSocket Client */}
      <DesktopWebSocketClient
        onStudentScanned={handleMobileStudentScan}
        onTestDataReceived={(data, scannerId) => {
          console.log(`[ScannerPage] Mobile test data received from ${scannerId}:`, data)
          toast({
            title: "Mobile Test Data",
            description: `Received test data from ${scannerId || "mobile"}. Check console.`,
          })
        }}
        onMobileStatusUpdate={handleMobileStatusUpdate}
        onScannerDisconnected={handleScannerDisconnected}
        onServerAssumedOffline={handleServerAssumedOffline}
        manualReconnectTrigger={reconnectTrigger}
      />

      <Toaster />

      <style jsx>{`
        ${config.animations.keyframes}
      `}</style>
    </div>
  )
}
