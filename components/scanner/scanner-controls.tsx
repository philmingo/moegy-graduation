"use client"

import { useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Play, Square, Search, Settings, QrCode, X, Volume2, RotateCcw } from "lucide-react"
import { QrScanner } from "@/components/qr-scanner"
import { type Student } from "@/lib/actions/students"
import config from "@/lib/theme-config"

interface ScannerControlsProps {
  isMobile: boolean
  scanning: boolean
  onStartScanning: () => void
  onStopScanning: () => void
  onScan: (data: string) => void
  scannerKey: number
  currentCamera: "environment" | "user"
  onCameraSwitch: () => void
  searchDialogOpen: boolean
  onSearchDialogToggle: () => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  students: Student[]
  onSelectStudent: (student: Student) => void
  settingsDialogOpen: boolean
  onSettingsDialogToggle: () => void
  selectedVoice: string
  onSelectedVoiceChange: (voice: string) => void
  availableVoices: SpeechSynthesisVoice[]
  speechRate: number
  onSpeechRateChange: (rate: number) => void
  speechPitch: number
  onSpeechPitchChange: (pitch: number) => void
  isSpeaking: boolean
  onTestVoice: (text: string) => void
  onSaveVoiceSettings: () => void
  alertOpen: boolean
  alertTitle: string
  alertDescription: string
  onAlertClose: () => void
}

export function ScannerControls({
  isMobile,
  scanning,
  onStartScanning,
  onStopScanning,
  onScan,
  scannerKey,
  currentCamera,
  onCameraSwitch,
  searchDialogOpen,
  onSearchDialogToggle,
  searchQuery,
  onSearchQueryChange,
  students,
  onSelectStudent,
  settingsDialogOpen,
  onSettingsDialogToggle,
  selectedVoice,
  onSelectedVoiceChange,
  availableVoices,
  speechRate,
  onSpeechRateChange,
  speechPitch,
  onSpeechPitchChange,
  isSpeaking,
  onTestVoice,
  onSaveVoiceSettings,
  alertOpen,
  alertTitle,
  alertDescription,
  onAlertClose,
}: ScannerControlsProps) {
  const scannerContainerRef = useRef<HTMLDivElement>(null)

  // Filter students with proper prioritization - FIXED
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

  // No need to sync - parent can use filteredStudents directly via ref or pass it back differently

  // Check if the selected voice is a "natural" voice that might not support pitch
  const isNaturalVoice =
    selectedVoice.toLowerCase().includes("natural") ||
    selectedVoice.toLowerCase().includes("neural") ||
    selectedVoice.toLowerCase().includes("premium")

  return (
    <div className="flex flex-col lg:h-full lg:min-h-0">
      {/* Scanner Header */}
      <div className="flex items-start justify-between mb-3 md:mb-4 flex-shrink-0">
        <div>
          <h2
            className={`${isMobile ? config.ui.typography.sizes.xl : config.ui.typography.sizes["2xl"]} ${config.ui.typography.weights.bold} ${config.theme.text.gradient.primary} mb-2`}
          >
            QR Code Scanner
          </h2>
          <p
            className={`${config.theme.text.secondary} ${isMobile ? config.ui.typography.sizes.sm : config.ui.typography.sizes.md}`}
          >
            Position QR codes in the scanning area
          </p>
        </div>

        {!isMobile && (
          <div className="flex gap-3 items-center">
            <Button
              onClick={onSearchDialogToggle}
              className={`${config.theme.glass.standard} ${config.theme.text.primary} ${config.theme.glass.hover}`}
            >
              <Search className="h-4 w-4 mr-2" />
              Search Graduate
            </Button>
            <Button
              onClick={onSettingsDialogToggle}
              className={`${config.theme.primary.gradient} ${config.theme.primary.gradientHover} text-white`}
            >
              <Settings className="h-4 w-4 mr-2" />
              Voice Settings
            </Button>
          </div>
        )}
      </div>

      {/* Scanner Area */}
      <div
        className={`${config.theme.glass.standard} ${config.ui.borderRadius.medium} p-3 md:p-4 lg:flex-grow flex flex-col lg:min-h-0`}
      >
        {/* Camera Box */}
        <div
          className={`${config.theme.glass.light} ${config.ui.borderRadius.medium} p-0 lg:flex-grow flex flex-col items-center justify-center mb-3 overflow-hidden relative`}
          style={{
            height: isMobile ? "280px" : "auto",
            minHeight: isMobile ? "280px" : "300px",
            maxHeight: isMobile ? "280px" : "none",
          }}
        >
          {scanning ? (
            <div className="w-full h-full relative" ref={scannerContainerRef} key={scannerKey}>
              <div className="w-full h-full overflow-hidden rounded-xl">
                <QrScanner
                  onScan={onScan}
                  onError={(error) => {
                    console.error("QR Scanner Error:", error)
                  }}
                  className="w-full h-full"
                  students={students}
                  isActive={scanning}
                  isSpeaking={isSpeaking}
                  onCameraStopped={onStopScanning}
                />
              </div>
              {/* Status Messages */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
                <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm text-center backdrop-blur-sm">
                  <p>Position QR code in the scanning frame</p>
                </div>
              </div>
              {/* Mobile Camera Switch Button */}
              {isMobile && (
                <div className="absolute bottom-4 right-4 z-10">
                  <Button
                    onClick={onCameraSwitch}
                    size="sm"
                    className="bg-white/20 text-white rounded-full w-12 h-12 p-0 backdrop-blur-sm hover:bg-white/30"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <div className="relative group mb-6">
                <div
                  className={`absolute -inset-4 ${config.theme.primary.gradient}/20 ${config.ui.borderRadius.large} ${config.ui.blur.medium} group-hover:opacity-40 transition-opacity`}
                />
                <div
                  className={`relative w-24 h-24 md:w-32 md:h-32 ${config.theme.glass.light} ${config.ui.borderRadius.large} flex items-center justify-center`}
                >
                  <Camera className={`h-12 w-12 md:h-16 md:w-16 ${config.theme.text.muted}`} />
                </div>
              </div>
              <h3
                className={`${isMobile ? config.ui.typography.sizes.lg : config.ui.typography.sizes.xl} ${config.ui.typography.weights.bold} text-white mb-2 text-center`}
              >
                Scanner Ready
              </h3>
              <p className="text-white/90 text-center">Click start to begin scanning QR codes</p>
            </div>
          )}
        </div>

        {/* Scanner Controls Bar */}
        <div className={`${config.theme.glass.light} ${config.ui.borderRadius.small} p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 ${config.theme.primary.gradient} ${config.ui.borderRadius.small} flex items-center justify-center`}
              >
                <QrCode className="h-4 w-4 text-white" />
              </div>
              <span className={`${config.theme.text.primary} ${config.ui.typography.weights.medium} text-sm`}>
                QR Scanner
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile Controls */}
              {isMobile && (
                <>
                  <Button
                    onClick={onSearchDialogToggle}
                    size="sm"
                    className={`${config.theme.glass.standard} ${config.theme.text.primary} ${config.theme.glass.hover}`}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={onSettingsDialogToggle}
                    size="sm"
                    className={`${config.theme.glass.standard} ${config.theme.text.primary} ${config.theme.glass.hover}`}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </>
              )}

              <Button
                onClick={scanning ? onStopScanning : onStartScanning}
                disabled={!scanning && isSpeaking}
                className={`${config.theme.primary.gradient} ${config.theme.primary.gradientHover} text-white px-4 md:px-6 py-2 ${config.ui.borderRadius.small} text-sm ${(!scanning && isSpeaking) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {scanning ? (
                  <>
                    <Square className="h-3 w-3 mr-2" />
                    Stop
                  </>
                ) : isSpeaking ? (
                  <>
                    <div className="w-3 h-3 mr-2 bg-white rounded-full animate-pulse"></div>
                    Speaking...
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-2" />
                    Start
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Dialog */}
      <Dialog open={searchDialogOpen} onOpenChange={onSearchDialogToggle}>
        <DialogContent className={`sm:max-w-lg ${config.theme.modal.background} ${config.theme.modal.border} p-0`}>
          <div className="relative">
            <button
              onClick={onSearchDialogToggle}
              className={`absolute top-4 right-4 z-10 p-2 rounded-lg ${config.theme.glass.light} hover:bg-white/20 transition-colors`}
            >
              <X className={`h-5 w-5 ${config.theme.text.primary}`} />
            </button>

            <div className="p-6">
              <DialogHeader className="mb-6 text-center">
                <DialogTitle
                  className={`${config.ui.typography.sizes.xl} ${config.ui.typography.weights.bold} ${config.theme.text.primary}`}
                >
                  Search Graduates
                </DialogTitle>
              </DialogHeader>

              <div className="mb-6">
                <div className="relative">
                  <Search
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${config.theme.text.primary} z-10`}
                  />
                  <Input
                    type="text"
                    placeholder="Search by graduate name..."
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    className={`pl-12 pr-12 py-3 w-full text-base ${config.ui.borderRadius.small} border-0 bg-white/10 backdrop-blur-sm ${config.theme.text.primary} placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-0 transition-all`}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => onSearchQueryChange("")}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded ${config.theme.text.muted} hover:${config.theme.text.primary} transition-colors z-10`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {searchQuery && filteredStudents.length > 0 ? (
                  <div className="space-y-2">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => onSelectStudent(student)}
                        className={`p-4 ${config.theme.glass.light} ${config.ui.borderRadius.small} hover:bg-white/20 cursor-pointer transition-all group`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 ${config.theme.primary.gradient} ${config.ui.borderRadius.small} flex items-center justify-center text-white font-bold`}
                          >
                            {student.first_name.charAt(0)}
                            {student.last_name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3
                              className={`font-semibold ${config.theme.text.primary} group-hover:text-purple-200 transition-colors`}
                            >
                              {student.first_name} {student.last_name}
                            </h3>
                            {student.phonetic_spelling && (
                              <p className={`text-sm ${config.theme.text.secondary}`}>
                                Pronunciation: {student.phonetic_spelling}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="text-center py-8">
                    <p className={`${config.theme.text.secondary}`}>No graduates found matching "{searchQuery}"</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Voice Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={onSettingsDialogToggle}>
        <DialogContent
          className={`${config.theme.modal.background} ${config.theme.modal.border} ${config.ui.borderRadius.medium}`}
        >
          <DialogHeader>
            <DialogTitle
              className={`${config.ui.typography.sizes.xl} ${config.ui.typography.weights.bold} ${config.theme.text.gradient.primary}`}
            >
              Voice Settings
            </DialogTitle>
            <DialogDescription className={`${config.theme.text.secondary}`}>
              Customize voice for announcements
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="voice-select" className={`${config.theme.text.primary}`}>
                  Voice
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log("🔄 [VOICE-LOADING] Manual refresh triggered")
                    // Force reload voices
                    const voices = window.speechSynthesis.getVoices()
                    if (voices.length > 0) {
                      console.log(`✅ [VOICE-LOADING] Manual refresh found ${voices.length} voices`)
                    } else {
                      console.warn("⚠️ [VOICE-LOADING] Manual refresh found no voices")
                    }
                    // Trigger the voiceschanged event handler if it exists
                    if (window.speechSynthesis.onvoiceschanged) {
                      window.speechSynthesis.onvoiceschanged(new Event('voiceschanged'))
                    }
                  }}
                  className={`h-7 px-2 ${config.theme.text.primary} hover:${config.theme.text.secondary}`}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>
              <Select value={selectedVoice} onValueChange={onSelectedVoiceChange}>
                <SelectTrigger
                  id="voice-select"
                  className={`w-full ${config.theme.glass.standard} ${config.theme.text.primary}`}
                >
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.length > 0 ? (
                    availableVoices.map((voice) => (
                      <SelectItem key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="loading" disabled>
                      Loading voices...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className={`${config.ui.typography.sizes.xs} ${config.theme.text.secondary}`}>
                {availableVoices.length > 0 
                  ? `${availableVoices.length} voice${availableVoices.length !== 1 ? 's' : ''} available. Google/Microsoft voices are often more natural.`
                  : "Loading voices... If voices don't appear, click Refresh."}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="speech-rate" className={`${config.theme.text.primary}`}>
                Speech Rate: {speechRate.toFixed(1)}
              </Label>
              <Slider
                id="speech-rate"
                min={0.5}
                max={2}
                step={0.1}
                value={[speechRate]}
                onValueChange={(v) => onSpeechRateChange(v[0])}
                className="w-full"
              />
              <p className={`${config.ui.typography.sizes.xs} ${config.theme.text.secondary}`}>
                Adjust announcement speed (1.0 is normal).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="speech-pitch" className={`${config.theme.text.primary}`}>
                Voice Pitch: {speechPitch.toFixed(1)}
              </Label>
              <Slider
                id="speech-pitch"
                min={0.1}
                max={2.0}
                step={0.1}
                value={[speechPitch]}
                onValueChange={(v) => onSpeechPitchChange(v[0])}
                className="w-full"
              />
              <p className={`${config.ui.typography.sizes.xs} ${config.theme.text.secondary}`}>
                Adjust voice pitch (1.0 is normal).
                {isNaturalVoice && (
                  <span className="text-amber-400 block mt-1">
                    ⚠️ Natural/Premium voices may not support pitch changes.
                  </span>
                )}
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                className={`w-full ${config.theme.glass.standard} ${config.theme.text.primary} ${config.theme.glass.hover}`}
                onClick={() => {
                  const testText = `This is a test announcement with rate ${speechRate.toFixed(1)} and pitch ${speechPitch.toFixed(1)}. John Smith.`
                  onTestVoice(testText)
                }}
                disabled={isSpeaking}
              >
                <Volume2 className="h-4 w-4 mr-2" /> {isSpeaking ? "Speaking..." : "Test Voice Settings"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={onSettingsDialogToggle}
              className={`${config.theme.glass.standard} ${config.theme.text.primary} ${config.theme.glass.hover}`}
            >
              Cancel
            </Button>
            <Button
              onClick={onSaveVoiceSettings}
              className={`${config.theme.primary.gradient} ${config.theme.primary.gradientHover} text-white`}
            >
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={onAlertClose}>
        <AlertDialogContent
          className={`${config.theme.modal.background} ${config.theme.modal.border} ${config.ui.borderRadius.medium}`}
        >
          <AlertDialogHeader>
            <AlertDialogTitle
              className={`${config.ui.typography.sizes.xl} ${config.ui.typography.weights.bold} ${config.theme.text.gradient.primary}`}
            >
              {alertTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className={`${config.theme.text.secondary}`}>
              {alertDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className={`${config.theme.primary.gradient} ${config.theme.primary.gradientHover} text-white`}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
