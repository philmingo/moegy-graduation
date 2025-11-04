"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Send,
  SearchIcon,
  User,
  ScanLine,
  RefreshCw,
  GraduationCap,
  QrCode,
  ListChecks,
  LogOut,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import MobileQrScanner from "@/components/mobile-qr-scanner"
import MobileLogin from "@/components/mobile-login"
import { Toaster } from "@/components/ui/toaster"
import { AnimatedBackground } from "@/components/animated-background"
import themeConfig from "@/lib/theme-config"
import Link from "next/link"

const { institution, theme } = themeConfig

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error" | "reconnecting"
type ViewMode = "scanner" | "search" | "result"

interface StudentDataForSocket {
  id: string
  name: string
  phonetic?: string
  type: number // 1 for QR, 2 for manual search
  verify: string
}

interface StoredStudent {
  id: string
  firstName: string
  lastName: string
  phoneticSpelling?: string | null
}

export default function MobileScanPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [isMobileAuthenticated, setIsMobileAuthenticated] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting")
  const [processedStudent, setProcessedStudent] = useState<StudentDataForSocket | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("scanner")

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 10

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<StoredStudent[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    // Check mobile authentication status on mount
    const mobileAuthStatus = localStorage.getItem("isMobileAuthenticated")
    setIsMobileAuthenticated(mobileAuthStatus === "true")
    setIsLoadingAuth(false)
  }, [])

  const handleMobileLoginSuccess = () => {
    setIsMobileAuthenticated(true)
  }

  const handleMobileLogout = () => {
    localStorage.removeItem("isMobileAuthenticated")
    setIsMobileAuthenticated(false)
    toast({ title: "Logged Out", description: "You have been logged out from mobile scanner." })
    // Optionally, close WebSocket connection if open
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close()
    }
    setConnectionStatus("disconnected") // Reflect logout in connection status
  }

  const log = useCallback((type: string, message: string, data?: any) => {
    console.log(`[MobileScan ${new Date().toISOString()}] [${type.toUpperCase()}] ${message}`, data || "")
  }, [])

  const connectWebSocket = useCallback(() => {
    // Only connect if authenticated
    if (!isMobileAuthenticated) {
      log("info", "WebSocket connection deferred: Mobile not authenticated.")
      setConnectionStatus("disconnected") // Show as disconnected if not auth'd
      return
    }

    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8080"
    log("info", `Attempting to connect to WebSocket: ${wsUrl}`)
    setConnectionStatus("connecting")
    if (wsRef.current) wsRef.current.close()
    try {
      wsRef.current = new WebSocket(wsUrl)
      wsRef.current.onopen = () => {
        log("success", "WebSocket connection established")
        setConnectionStatus("connected")
        reconnectAttempts.current = 0
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
        const registrationMessage = { type: "register-scanner" }
        wsRef.current?.send(JSON.stringify(registrationMessage))
        log("info", "Sent scanner registration", registrationMessage)
      }
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string)
          log("info", "Received message from server", data)
          switch (data.type) {
            case "registered":
              if (data.role === "scanner") log("success", "Scanner registration confirmed")
              break
            case "test-connection-confirmed":
              log("success", "Test connection confirmed by desktop", data)
              toast({
                title: "Verified",
                description: "Desktop connection verified.",
                className: `${theme.status.success.bg} ${theme.text.primary}`,
              })
              break
            case "scan-confirmed":
              log("success", "Scan confirmed by desktop", data)
              toast({
                title: "Data Received by Desktop",
                description: `${data.studentName || data.studentId} acknowledged.`,
                className: `${theme.status.success.bg} ${theme.text.primary}`,
              })
              break
            case "error":
              log("error", `Server error: ${data.message}`, data)
              toast({ title: "Server Error", description: data.message, variant: "destructive" })
              break
            default:
              log("warning", `Unhandled message type: ${data.type}`, data)
          }
        } catch (error: any) {
          log("error", "Failed to parse server message", { error: error.message, rawData: event.data })
        }
      }
      wsRef.current.onclose = (event) => {
        log("warning", `WebSocket connection closed`, {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        })
        if (event.wasClean) setConnectionStatus("disconnected")
        else {
          // Only attempt reconnect if still authenticated
          if (isMobileAuthenticated) {
            setConnectionStatus("reconnecting")
            if (reconnectAttempts.current < maxReconnectAttempts) {
              reconnectAttempts.current++
              const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
              log("info", `Attempting reconnection ${reconnectAttempts.current}/${maxReconnectAttempts} in ${delay}ms`)
              reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay)
            } else {
              log("error", "Max reconnection attempts reached")
              setConnectionStatus("error")
            }
          } else {
            setConnectionStatus("disconnected") // Stay disconnected if logged out
          }
        }
      }
      wsRef.current.onerror = (error) => {
        log("error", "WebSocket error occurred", error)
        setConnectionStatus("error")
      }
    } catch (error: any) {
      log("error", "Failed to create WebSocket connection", error)
      setConnectionStatus("error")
    }
  }, [log, toast, isMobileAuthenticated])

  const sendStudentDataToDesktop = useCallback(
    (studentData: StudentDataForSocket) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const message = { type: "student-scan", student: studentData, timestamp: new Date().toISOString() }
        wsRef.current.send(JSON.stringify(message))
        log("info", "Sent student data to desktop", message)
        setProcessedStudent(studentData)
        setViewMode("result")
        toast({
          title: "Data Sent",
          description: `Sending ${studentData.name.replace(/\s*$$from mobile$$$/i, "")} to desktop...`,
          className: `${theme.accent.badge} ${theme.text.primary}`,
        })
      } else {
        log("error", "Cannot send scan data - WebSocket not connected")
        toast({
          title: "Connection Error",
          description: "Not connected to desktop.",
          className: `${theme.status.warning.bg} ${theme.text.primary}`,
        })
      }
    },
    [log, toast],
  )

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      log("info", "QR code scanned", { decodedText })

      try {
        let studentData: StudentDataForSocket | null = null

        // Try to parse as JSON first
        try {
          const qrData = JSON.parse(decodedText)
          log("info", "Parsed QR data as JSON:", qrData)

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
          } else if (qrData.id && qrData.name) {
            // Generic format with id and name
            studentData = {
              id: qrData.id,
              name: qrData.name,
              phonetic: qrData.phonetic || qrData.phoneticSpelling,
              type: 1,
              verify: qrData.verify || btoa(qrData.id).substring(0, 8),
            }
          }
        } catch (jsonError) {
          log("info", "QR code is not JSON, treating as plain text:", decodedText)

          // Handle plain text QR codes
          // Could be a student ID, name, or other identifier
          studentData = {
            id: decodedText,
            name: `Student ${decodedText}`,
            type: 1,
            verify: btoa(decodedText).substring(0, 8),
          }
        }

        if (!studentData) {
          throw new Error("Could not process QR code data")
        }

        log("info", "Processed student data for desktop:", studentData)
        sendStudentDataToDesktop(studentData)
      } catch (error: any) {
        log("error", "Failed to process QR code", { error: error.message, decodedText })
        toast({
          title: "QR Code Error",
          description: `Could not process QR code: ${error.message}`,
          variant: "destructive",
        })
        // Don't change view mode on error, stay in scanner
      }
    },
    [log, toast, sendStudentDataToDesktop],
  )

  const handleSearchStudents = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setSearchError(null)
      return
    }

    setIsSearching(true)
    setSearchError(null)
    log("info", "Searching students via API", { query: searchQuery })

    try {
      const searchUrl = `/api/search-students?q=${encodeURIComponent(searchQuery.trim())}`

      const response = await fetch(searchUrl)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Search failed")
      }

      log("debug", "Search API response", data)

      setSearchResults(data.students || [])

      if (data.students?.length === 0) {
        setSearchError(`No students found matching "${searchQuery}"`)
      } else {
        toast({
          title: "Search Complete",
          description: `Found ${data.count} student${data.count === 1 ? "" : "s"}`,
          className: `${theme.status.success.bg} ${theme.text.primary}`,
        })
      }
    } catch (error: any) {
      log("error", "Search API error", error)
      setSearchError(error.message || "Could not perform search. Please try again.")
      setSearchResults([])

      toast({
        title: "Search Error",
        description: error.message || "Could not perform search. Please try again.",
        variant: "destructive",
      })
    }

    setIsSearching(false)
  }, [searchQuery, log, toast])

  const handleSelectStudentFromSearch = useCallback(
    (student: StoredStudent) => {
      const studentData: StudentDataForSocket = {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        phonetic: student.phoneticSpelling || undefined,
        type: 2,
        verify: btoa(student.id).substring(0, 8),
      }
      sendStudentDataToDesktop(studentData)
      setSearchQuery("")
      setSearchResults([])
      setSearchError(null)
    },
    [sendStudentDataToDesktop],
  )

  const handleNext = () => {
    setProcessedStudent(null)
    setViewMode("scanner")
  }

  useEffect(() => {
    if (isMobileAuthenticated) {
      log("info", "Mobile scan page initialized and authenticated")
      connectWebSocket()
    } else if (!isLoadingAuth) {
      log("info", "Mobile scan page initialized, user not authenticated.")
      // Ensure WebSocket is closed if user becomes unauthenticated while on page
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close()
      }
      setConnectionStatus("disconnected")
    }
    return () => {
      if (isMobileAuthenticated) {
        log("info", "Mobile scan page effect cleanup (possibly unmounting or re-authenticating)")
      }
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (wsRef.current) {
        // Check readyState before closing to avoid errors if already closed
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close()
        }
      }
    }
  }, [log, connectWebSocket, isMobileAuthenticated, isLoadingAuth])

  // Search with single character and faster response
  useEffect(() => {
    if (searchQuery.trim().length >= 1) {
      const timeoutId = setTimeout(() => {
        handleSearchStudents()
      }, 200) // Even faster response - 200ms

      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
      setSearchError(null)
    }
  }, [searchQuery, handleSearchStudents])

  const getStatusDisplay = () => {
    if (!isMobileAuthenticated && !isLoadingAuth) {
      return {
        icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
        text: "Login Required",
        color: "text-orange-500",
      }
    }
    switch (connectionStatus) {
      case "connecting":
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin text-orange-400" />,
          text: "Connecting...",
          color: "text-orange-400",
        }
      case "connected":
        return {
          icon: <CheckCircle className={`w-4 h-4 ${theme.status.success.text}`} />,
          text: "Connected to Desktop",
          color: theme.status.success.text,
        }
      case "reconnecting":
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />,
          text: `Reconnecting...`,
          color: "text-yellow-400",
        }
      case "disconnected":
        return { icon: <WifiOff className="w-4 h-4 text-red-400" />, text: "Disconnected", color: "text-red-400" }
      case "error":
        return {
          icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
          text: "Connection Error",
          color: "text-red-500",
        }
      default:
        return { icon: <Wifi className="w-4 h-4 text-gray-400" />, text: "Status Unknown", color: "text-gray-400" }
    }
  }
  const statusDisplay = getStatusDisplay()

  if (isLoadingAuth) {
    return (
      <div className={`min-h-screen ${theme.background} flex flex-col items-center justify-center`}>
        <Loader2 className={`w-12 h-12 animate-spin ${theme.primary.text} mb-4`} />
        <p className={`${theme.primary.text} text-lg`}>Loading Scanner...</p>
      </div>
    )
  }

  if (!isMobileAuthenticated) {
    return <MobileLogin onLoginSuccess={handleMobileLoginSuccess} />
  }

  // If authenticated, render the scanner UI
  return (
    <div className={`min-h-screen ${theme.background} relative overflow-hidden flex flex-col`}>
      {/* Add the animated background */}
      <div className="absolute inset-0 z-0">
        <AnimatedBackground />
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-50 ${theme.glass.standard} ${theme.primary.border}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <div
                  className={`absolute inset-0 ${theme.accent.badge} rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity`}
                ></div>
                <div className={`relative ${theme.primary.gradient} p-2 rounded-full`}>
                  <GraduationCap className={`h-6 w-6 ${theme.text.primary}`} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className={`text-lg font-bold ${theme.text.primary}`}>{institution.name}</span>
                <span className={`text-xs ${theme.primary.text}`}>Mobile Announcer</span>
              </div>
            </div>

            {/* Status Display and Navigation */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 text-sm font-semibold ${statusDisplay.color}`}>
                {statusDisplay.icon}
                <span className="hidden sm:inline">{statusDisplay.text}</span>
              </div>

              <Link href="/admin">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-blue-400 hover:bg-blue-500/20 rounded-full"
                  title="Back to Admin Dashboard"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleMobileLogout}
                className="text-red-400 hover:bg-red-500/20 rounded-full"
                title="Logout Mobile Scanner"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 md:p-6 space-y-6 items-center justify-center relative z-10">
        <div className="w-full max-w-md">
          {viewMode === "result" && processedStudent && (
            <Card
              className={`${theme.glass.standard} shadow-2xl ${theme.primary.border} border-2 rounded-xl overflow-hidden`}
            >
              <CardHeader
                className={`text-center bg-gradient-to-br from-purple-800 to-indigo-900 backdrop-blur-md p-6 ${theme.primary.border} border-b`}
              >
                <GraduationCap className={`w-24 h-24 mx-auto ${theme.text.primary} mb-3`} />
                <CardTitle className={`text-3xl font-bold ${theme.text.primary}`}>Student Processed!</CardTitle>
                <CardDescription className={`${theme.text.secondary} text-sm`}>
                  Details successfully sent to desktop.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-center">
                <p className={`text-4xl font-extrabold ${theme.text.primary} tracking-tight`}>
                  {processedStudent.name.replace(/\s*$$from mobile$$$/i, "")}
                </p>
                {processedStudent.phonetic && (
                  <p className={`text-xl ${theme.text.secondary} font-medium`}>Phonetic: {processedStudent.phonetic}</p>
                )}
                <p className={`text-md ${theme.text.muted}`}>ID: {processedStudent.id}</p>
                <p className={`text-sm ${theme.text.muted} mt-1`}>
                  Method: {processedStudent.type === 1 ? "QR Scan" : "Manual Search"}
                </p>
                <Button
                  onClick={handleNext}
                  className={`w-full mt-8 ${theme.primary.gradient} ${theme.text.primary} shadow-lg hover:shadow-xl transition-all duration-300 text-lg py-3 rounded-md font-semibold`}
                  size="lg"
                >
                  <RefreshCw className="w-5 h-5 mr-2" /> Scan/Search Next
                </Button>
              </CardContent>
            </Card>
          )}

          {viewMode === "scanner" && (
            <Card className={`${theme.glass.standard} shadow-xl ${theme.primary.border} rounded-lg`}>
              <CardHeader
                className={`text-center bg-gradient-to-br from-purple-800 to-indigo-900 backdrop-blur-md py-4 rounded-t-lg ${theme.primary.border} border-b`}
              >
                <QrCode className={`w-12 h-12 mx-auto ${theme.text.primary} mb-2`} />
                <CardTitle className={`text-2xl font-semibold ${theme.text.primary}`}>Scan Graduate QR Code</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <MobileQrScanner
                  onScanSuccess={handleScanSuccess}
                  onScanError={(err) => log("error", "QR Scan Error", err)}
                  isConnected={connectionStatus === "connected"}
                />
                <Button
                  onClick={() => setViewMode("search")}
                  variant="outline"
                  className={`w-full border-2 ${theme.primary.border} ${theme.text.primary} ${theme.glass.input} hover:${theme.glass.hover} hover:${theme.text.primary} transition-all duration-200 text-lg py-4 rounded-md font-semibold backdrop-blur-sm`}
                  size="lg"
                >
                  <ListChecks className="w-6 h-6 mr-3" /> Search Manually
                </Button>
              </CardContent>
            </Card>
          )}

          {viewMode === "search" && (
            <Card className={`${theme.glass.standard} shadow-xl ${theme.primary.border} rounded-lg`}>
              <CardHeader
                className={`text-center bg-gradient-to-br from-purple-800 to-indigo-900 backdrop-blur-md py-4 rounded-t-lg ${theme.primary.border} border-b`}
              >
                <SearchIcon className={`w-12 h-12 mx-auto ${theme.text.primary} mb-2`} />
                <CardTitle className={`text-2xl font-semibold ${theme.text.primary}`}>Manual Student Search</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex space-x-3">
                  <div className="relative flex-grow">
                    <Input
                      type="text"
                      placeholder="Enter student name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full border-2 ${theme.primary.border} ${theme.primary.ring} ${theme.glass.input} ${theme.text.primary} ${theme.text.placeholder} text-lg p-4 pr-12 rounded-md backdrop-blur-sm font-medium`}
                    />
                    <SearchIcon
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.primary.text} pointer-events-none`}
                    />
                  </div>
                  <Button
                    onClick={handleSearchStudents}
                    disabled={isSearching || !searchQuery.trim()}
                    className={`${theme.primary.gradient} ${theme.text.primary} shadow-md hover:shadow-lg transition-shadow duration-300 px-5 py-3 rounded-md disabled:opacity-50`}
                    size="lg"
                  >
                    {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <SearchIcon className="w-5 h-5" />}
                  </Button>
                </div>

                {searchError && (
                  <div className="text-center py-4">
                    <p className={`${theme.text.secondary} text-md`}>{searchError}</p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div
                    className={`max-h-72 overflow-y-auto space-y-3 ${theme.primary.border} rounded-md p-3 ${theme.glass.light} ${theme.scrollbar.style}`}
                  >
                    {searchResults.map((student) => (
                      <Button
                        key={student.id}
                        variant="ghost"
                        onClick={() => handleSelectStudentFromSearch(student)}
                        className={`w-full flex items-center space-x-4 text-left p-4 hover:${theme.glass.hover} rounded-lg transition-colors duration-150 ${theme.text.primary} group`}
                      >
                        <User
                          className={`w-8 h-8 ${theme.primary.text} group-hover:${theme.primary.text} transition-colors duration-150 flex-shrink-0`}
                        />
                        <div className="flex-grow">
                          <p
                            className={`font-semibold text-lg group-hover:${theme.primary.text} transition-colors duration-150`}
                          >
                            {student.firstName} {student.lastName}
                          </p>
                          {student.phoneticSpelling && (
                            <p className={`text-sm ${theme.text.secondary}`}>Phonetic: {student.phoneticSpelling}</p>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                )}

                <Button
                  onClick={() => setViewMode("scanner")}
                  variant="outline"
                  className={`w-full mt-4 border-2 ${theme.primary.border} ${theme.text.primary} ${theme.glass.input} hover:${theme.glass.hover} hover:${theme.text.primary} transition-all duration-200 text-md py-3 rounded-md font-semibold backdrop-blur-sm`}
                  size="lg"
                >
                  <ScanLine className="w-5 h-5 mr-2" /> Back to QR Scanner
                </Button>
              </CardContent>
            </Card>
          )}

          {(connectionStatus === "disconnected" || connectionStatus === "error") && viewMode !== "result" && (
            <Button
              onClick={() => {
                log("info", "Manual reconnect initiated")
                reconnectAttempts.current = 0
                connectWebSocket()
              }}
              className={`w-full mt-8 ${theme.primary.gradient} ${theme.text.primary} shadow-lg hover:shadow-xl transition-all duration-300 text-lg py-3 rounded-md font-semibold`}
              size="lg"
            >
              <Send className="w-5 h-5 mr-2" /> Reconnect to Desktop
            </Button>
          )}
        </div>
      </main>
      <Toaster />
    </div>
  )
}
