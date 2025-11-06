"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { useQueryClient } from "@tanstack/react-query"

interface UseGuestBookRealtimeOptions {
  enabled?: boolean
  onUpdate?: () => void
}

export type RealtimeStatus = 'connecting' | 'connected' | 'error' | 'disconnected'

export function useGuestBookRealtime(options: UseGuestBookRealtimeOptions = {}) {
  const { enabled = true } = options
  const [status, setStatus] = useState<RealtimeStatus>('connecting')
  const queryClient = useQueryClient()
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<any>(null)
  const retryCountRef = useRef(0)
  const onUpdateRef = useRef(options.onUpdate) // Use ref to avoid dependency issues
  const maxRetries = 1 // Reduced from 3 - fail fast and use polling instead

  // Update ref when callback changes
  useEffect(() => {
    onUpdateRef.current = options.onUpdate
  }, [options.onUpdate])

  useEffect(() => {
    if (!enabled) {
      console.log("🔌 [REALTIME-HOOK] Real-time disabled")
      setStatus('disconnected')
      return
    }

    const supabase = createClient()
    let isCleanedUp = false

    const setupSubscription = async () => {
      if (isCleanedUp) {
        console.log("⚠️ [REALTIME-HOOK] Cleanup flag set, aborting setup")
        return
      }

      // Clear any existing channel
      if (channelRef.current) {
        console.log("🧹 [REALTIME-HOOK] Removing old channel before creating new one")
        await supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

      // Small delay to ensure clean state
      await new Promise(resolve => setTimeout(resolve, 100))

      const channelName = `guest-book-realtime-${Date.now()}`
      console.log(`🔄 [REALTIME-HOOK] Setting up subscription with channel: ${channelName}`)
      setStatus('connecting')

      channelRef.current = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: false },
            presence: { key: '' },
          },
        })
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "voceo_guest_book_messages",
          },
          (payload) => {
            console.log("📨 [REALTIME-HOOK] Database change detected:", {
              event: payload.eventType,
              table: payload.table,
              timestamp: new Date().toISOString(),
            })
            
            // Invalidate queries to trigger refetch
            console.log("♻️ [REALTIME-HOOK] Invalidating guestBookMessages query cache")
            queryClient.invalidateQueries({ queryKey: ["guestBookMessages"] })
            
            // Call optional callback using ref
            if (onUpdateRef.current) {
              console.log("📞 [REALTIME-HOOK] Calling onUpdate callback")
              onUpdateRef.current()
            }
          }
        )
        .subscribe((subscriptionStatus, err) => {
          console.log(`📡 [REALTIME-HOOK] Subscription status changed: ${subscriptionStatus}`)
          
          if (err) {
            console.error("❌ [REALTIME-HOOK] Subscription error:", err)
          }
          
          if (subscriptionStatus === 'SUBSCRIBED') {
            setStatus('connected')
            retryCountRef.current = 0 // Reset retry count on success
            console.log("✅ [REALTIME-HOOK] Successfully subscribed to real-time updates")
            
            // Clear any pending retries
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current)
              retryTimeoutRef.current = null
            }
          } else if (subscriptionStatus === 'CHANNEL_ERROR') {
            setStatus('error')
            console.error("❌ [REALTIME-HOOK] Channel error occurred")
            attemptRetry()
          } else if (subscriptionStatus === 'TIMED_OUT') {
            setStatus('error')
            console.warn("⏱️ [REALTIME-HOOK] Subscription timed out")
            attemptRetry()
          } else if (subscriptionStatus === 'CLOSED') {
            console.log("🔌 [REALTIME-HOOK] Channel closed")
            if (!isCleanedUp) {
              setStatus('disconnected')
            }
          }
        })
    }

    const attemptRetry = () => {
      if (isCleanedUp) return
      
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++
        const delay = 2000 // Quick 2 second retry
        
        console.log(`🔄 [REALTIME-HOOK] Scheduling retry ${retryCountRef.current}/${maxRetries} in ${delay}ms`)
        
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current)
        }
        
        retryTimeoutRef.current = setTimeout(() => {
          console.log(`🔁 [REALTIME-HOOK] Executing retry ${retryCountRef.current}/${maxRetries}`)
          setupSubscription()
        }, delay)
      } else {
        console.error(`❌ [REALTIME-HOOK] Max retries (${maxRetries}) reached, giving up`)
        console.log(`⚡ [REALTIME-HOOK] Falling back to polling mode`)
        setStatus('error')
      }
    }

    // Initial setup
    console.log("🚀 [REALTIME-HOOK] Initializing real-time subscription")
    setupSubscription()

    // Cleanup function
    return () => {
      console.log("🧹 [REALTIME-HOOK] Cleaning up subscription")
      isCleanedUp = true
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
      
      if (channelRef.current) {
        // Async cleanup but don't await (cleanup functions can't be async)
        supabase.removeChannel(channelRef.current).catch(err => {
          console.log("⚠️ [REALTIME-HOOK] Error during channel cleanup:", err)
        })
        channelRef.current = null
      }
      
      setStatus('disconnected')
    }
  }, [enabled, queryClient]) // Removed onUpdate from dependencies

  return { status }
}