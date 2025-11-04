"use client"

import type React from "react"
import { useEffect, useRef, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"

export interface MobileDeviceInfo {
  userAgent?: string
  platform?: string
  language?: string
}

interface DesktopWebSocketClientProps {
  onStudentScanned: (student: any, scannerId?: string) => void
  onTestDataReceived: (data: any, scannerId?: string) => void
  onMobileStatusUpdate: (isConnected: boolean, deviceInfo?: MobileDeviceInfo, scannerId?: string) => void
  onScannerDisconnected?: (scannerId: string) => void
  onServerAssumedOffline: (isOffline: boolean) => void
  manualReconnectTrigger?: number
}

const DesktopWebSocketClient: React.FC<DesktopWebSocketClientProps> = ({
  onStudentScanned,
  onTestDataReceived,
  onMobileStatusUpdate,
  onScannerDisconnected,
  onServerAssumedOffline,
  manualReconnectTrigger,
}) => {
  const wsRef = useRef<WebSocket | null>(null)
  const { toast } = useToast()
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const componentIsMounted = useRef(true)
  const currentWsUrl = useRef<string>("")
  const serverLikelyOffline = useRef(false)

  const connectWebSocket = useCallback(() => {
    if (!componentIsMounted.current || serverLikelyOffline.current) {
      if (serverLikelyOffline.current) {
        console.log("[DesktopWS] Server marked as offline, not attempting further reconnections.")
        if (typeof onMobileStatusUpdate === "function") {
          onMobileStatusUpdate(false, { userAgent: "Mobile features offline" })
        }
      }
      return
    }

    if (typeof onMobileStatusUpdate !== "function") {
      console.error("[DesktopWS] connectWebSocket: onMobileStatusUpdate is not a function. Aborting.")
      return
    }

    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8080"
    currentWsUrl.current = wsUrl
    console.log(`[DesktopWS] Attempting to connect to WebSocket: ${wsUrl}`)

    if (wsRef.current) {
      wsRef.current.onopen = null
      wsRef.current.onmessage = null
      wsRef.current.onclose = null
      wsRef.current.onerror = null
      wsRef.current.close(1000, "Reconnecting")
      wsRef.current = null
    }

    try {
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log(`[DesktopWS] WebSocket connection established to ${currentWsUrl.current}`)
        toast({ title: "System Online", description: `Mobile features connected.` })
        reconnectAttempts.current = 0
        serverLikelyOffline.current = false
        if (typeof onServerAssumedOffline === "function") {
          onServerAssumedOffline(false)
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "register-desktop" }))
          console.log("[DesktopWS] Sent 'register-desktop' message to server.")
        }
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string)
          console.log("[DesktopWS] Received message:", data)

          switch (data.type) {
            case "registered":
              console.log(`[DesktopWS] Successfully registered with server as role: ${data.role}, id: ${data.id}`)
              toast({
                title: "Desktop Registered",
                description: `Registered for mobile features. ID: ${data.id}`,
                className: "bg-blue-600 text-white",
              })
              break
            case "student-scanned":
              if (typeof onStudentScanned === "function") onStudentScanned(data.student, data.scannerId)
              if (typeof onMobileStatusUpdate === "function")
                onMobileStatusUpdate(
                  true,
                  data.deviceInfo || { userAgent: `Scanner: ${data.scannerId || "Unknown"}` },
                  data.scannerId,
                )
              break
            case "mobile-connected":
              console.log(`Mobile scanner "${data.id}" connected at ${data.timestamp}`)
              if (typeof onMobileStatusUpdate === "function" && data.id) {
                onMobileStatusUpdate(true, { userAgent: data.id }, data.id)
              }
              break
            case "scanner-disconnected":
              console.log(`[DesktopWS] Server indicated scanner disconnected: ${data.scannerId}`)
              if (typeof onScannerDisconnected === "function") {
                onScannerDisconnected(data.scannerId)
              } else if (typeof onMobileStatusUpdate === "function") {
                onMobileStatusUpdate(false, { userAgent: `Scanner ${data.scannerId} disconnected` }, data.scannerId)
              }
              toast({
                title: "Scanner Disconnected",
                description: `Scanner ID: ${data.scannerId} has disconnected.`,
                variant: "destructive",
              })
              break
            case "error":
              console.error(`[DesktopWS] Server-side error received: ${data.message}`, data)
              toast({
                title: "Mobile Feature Error",
                description: data.message || "An unspecified error occurred with mobile features.",
                variant: "destructive",
              })
              break
            default:
              console.warn(`[DesktopWS] Unhandled message type received from server: ${data.type}`, data)
          }
        } catch (error) {
          console.error("[DesktopWS] Error processing message:", error)
        }
      }

      wsRef.current.onclose = (event: CloseEvent) => {
        console.warn(
          `[DesktopWS] WebSocket to ${currentWsUrl.current} closed. Code: ${event.code}, Reason: '${event.reason}'`,
        )
        if (typeof onMobileStatusUpdate === "function")
          onMobileStatusUpdate(false, { userAgent: "Mobile features offline" })

        if (!componentIsMounted.current || serverLikelyOffline.current) return

        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          const delay =
            reconnectAttempts.current <= 2 ? Math.min(1000 * Math.pow(1.5, reconnectAttempts.current - 1), 5000) : 15000
          console.log(
            `[DesktopWS] Attempting to reconnect mobile features (${reconnectAttempts.current}/${maxReconnectAttempts}) in ${Math.round(delay / 1000)}s`,
          )
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay)
        } else if (reconnectAttempts.current >= maxReconnectAttempts && event.code !== 1000) {
          if (typeof onServerAssumedOffline === "function") {
            onServerAssumedOffline(true)
          }
          serverLikelyOffline.current = true
          console.warn(
            `[DesktopWS] Max reconnection attempts for mobile features reached. Server appears to be offline. URL: ${currentWsUrl.current}, Code: ${event.code}`,
          )
          toast({
            title: "Mobile Features Offline",
            description: `Could not connect to the mobile scanning service. Local scanning is still available. (Code: ${event.code})`,
            variant: "default",
            className: "bg-yellow-100 border-yellow-500 text-yellow-700",
            duration: 10000,
          })
        }
      }

      wsRef.current.onerror = (event: Event) => {
        console.error(`[DesktopWS] WebSocket low-level error for ${currentWsUrl.current}:`, event)
        // Don't show toast here, onclose will handle it
      }
    } catch (error) {
      console.error(`[DesktopWS] Failed to create WebSocket for ${currentWsUrl.current}:`, error)
      if (componentIsMounted.current && !serverLikelyOffline.current) {
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts.current - 1), 15000)
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay)
        } else {
          if (typeof onServerAssumedOffline === "function") {
            onServerAssumedOffline(true)
          }
          serverLikelyOffline.current = true
          toast({
            title: "Mobile Features Unavailable",
            description: `Failed to establish initial connection for mobile features. Local scanning is active.`,
            variant: "default",
            className: "bg-yellow-100 border-yellow-500 text-yellow-700",
            duration: 10000,
          })
        }
      }
    }
  }, [onStudentScanned, onTestDataReceived, onMobileStatusUpdate, onScannerDisconnected, toast, onServerAssumedOffline])

  useEffect(() => {
    componentIsMounted.current = true
    serverLikelyOffline.current = false
    reconnectAttempts.current = 0
    console.log("[DesktopWS] Initializing or manual reconnect triggered.")
    connectWebSocket()
    return () => {
      componentIsMounted.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (wsRef.current) {
        wsRef.current.onopen = null
        wsRef.current.onmessage = null
        wsRef.current.onclose = null
        wsRef.current.onerror = null
        wsRef.current.close(1000, "Component unmounted")
        wsRef.current = null
      }
    }
  }, [manualReconnectTrigger])

  return null
}

export default DesktopWebSocketClient
