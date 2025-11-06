"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { useQueryClient } from "@tanstack/react-query"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface UseGuestBookRealtimeOptions {
  enabled?: boolean
  onUpdate?: () => void
}

export type RealtimeStatus = 'connecting' | 'connected' | 'error' | 'disconnected'

// Global singleton channel to prevent multiple subscriptions
let globalChannel: RealtimeChannel | null = null
let globalSubscriberCount = 0
let globalCallbacks: Set<() => void> = new Set()
let globalQueryClient: any = null
let isSubscribing = false // Prevent concurrent subscription attempts
let subscriptionPromise: Promise<void> | null = null

export function useGuestBookRealtime(options: UseGuestBookRealtimeOptions = {}) {
  const { enabled = true } = options
  const [status, setStatus] = useState<RealtimeStatus>('connecting')
  const queryClient = useQueryClient()
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const onUpdateRef = useRef(options.onUpdate)
  const isSubscribedRef = useRef(false)
  const subscriberIdRef = useRef<number>(0)
  const maxRetries = 1

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
    
    // Register this subscriber
    globalSubscriberCount++
    subscriberIdRef.current = globalSubscriberCount
    const subscriberId = subscriberIdRef.current
    console.log(`👤 [REALTIME-HOOK] Subscriber #${subscriberId} joining (total: ${globalSubscriberCount})`)
    
    // Store query client globally if not set
    if (!globalQueryClient) {
      globalQueryClient = queryClient
    }
    
    // Add callback to global set if provided
    if (onUpdateRef.current) {
      globalCallbacks.add(onUpdateRef.current)
    }
    
    isSubscribedRef.current = true

    const setupSubscription = async () => {
      if (isCleanedUp) {
        console.log("⚠️ [REALTIME-HOOK] Cleanup flag set, aborting setup")
        return
      }

      // If already subscribing, wait for that to complete
      if (isSubscribing && subscriptionPromise) {
        console.log(`⏳ [REALTIME-HOOK] Subscription in progress, waiting for subscriber #${subscriberId}`)
        await subscriptionPromise
        if (globalChannel && globalChannel.state === 'joined') {
          console.log(`✅ [REALTIME-HOOK] Reusing newly established channel for subscriber #${subscriberId}`)
          setStatus('connected')
        }
        return
      }

      // If channel already exists and is joined, reuse it
      if (globalChannel && globalChannel.state === 'joined') {
        console.log(`♻️ [REALTIME-HOOK] Reusing existing global channel for subscriber #${subscriberId}`)
        setStatus('connected')
        return
      }

      // Mark as subscribing
      isSubscribing = true
      subscriptionPromise = (async () => {
        try {
          // Clean up any existing channel
          if (globalChannel) {
            console.log("🧹 [REALTIME-HOOK] Cleaning up existing channel")
            try {
              await supabase.removeChannel(globalChannel)
            } catch (err) {
              console.warn("⚠️ [REALTIME-HOOK] Error removing old channel:", err)
            }
            globalChannel = null
          }

          // Small delay to ensure clean state
          await new Promise(resolve => setTimeout(resolve, 150))

          if (isCleanedUp) {
            console.log("⚠️ [REALTIME-HOOK] Cleanup occurred during setup, aborting")
            return
          }

          const channelName = `guest-book-realtime-${Date.now()}`
          console.log(`🔄 [REALTIME-HOOK] Creating new channel: ${channelName}`)
          setStatus('connecting')

          globalChannel = supabase.channel(channelName, {
            config: {
              broadcast: { self: false },
              presence: { key: '' },
            },
          })

          // Set up the postgres_changes listener
          globalChannel.on(
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
              
              // Invalidate queries using global query client
              if (globalQueryClient) {
                console.log("♻️ [REALTIME-HOOK] Invalidating guestBookMessages query cache")
                globalQueryClient.invalidateQueries({ queryKey: ["guestBookMessages"] })
              }
              
              // Call all registered callbacks
              globalCallbacks.forEach(callback => {
                try {
                  callback()
                } catch (err) {
                  console.error("❌ [REALTIME-HOOK] Error in callback:", err)
                }
              })
            }
          )

          // Subscribe to the channel
          globalChannel.subscribe((subscriptionStatus, err) => {
            console.log(`📡 [REALTIME-HOOK] Subscription status: ${subscriptionStatus}`)
            
            if (err) {
              console.error("❌ [REALTIME-HOOK] Subscription error:", err)
            }
            
            if (subscriptionStatus === 'SUBSCRIBED') {
              setStatus('connected')
              retryCountRef.current = 0
              console.log("✅ [REALTIME-HOOK] Successfully subscribed to real-time updates")
              
              if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current)
                retryTimeoutRef.current = null
              }
            } else if (subscriptionStatus === 'CHANNEL_ERROR') {
              setStatus('error')
              console.error("❌ [REALTIME-HOOK] Channel error occurred")
              globalChannel = null
              attemptRetry()
            } else if (subscriptionStatus === 'TIMED_OUT') {
              setStatus('error')
              console.warn("⏱️ [REALTIME-HOOK] Subscription timed out")
              globalChannel = null
              attemptRetry()
            } else if (subscriptionStatus === 'CLOSED') {
              console.log("🔌 [REALTIME-HOOK] Channel closed")
              globalChannel = null
              if (!isCleanedUp) {
                setStatus('disconnected')
              }
            }
          })

        } finally {
          isSubscribing = false
          subscriptionPromise = null
        }
      })()

      await subscriptionPromise
    }

    const attemptRetry = () => {
      if (isCleanedUp) return
      
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++
        const delay = 2000
        
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
      console.log(`🧹 [REALTIME-HOOK] Subscriber #${subscriberId} leaving`)
      isCleanedUp = true
      isSubscribedRef.current = false
      
      // Unregister subscriber
      globalSubscriberCount--
      console.log(`👥 [REALTIME-HOOK] Remaining subscribers: ${globalSubscriberCount}`)
      
      // Remove callback from global set
      if (onUpdateRef.current) {
        globalCallbacks.delete(onUpdateRef.current)
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
      
      // Only cleanup global channel if no more subscribers
      if (globalSubscriberCount === 0) {
        console.log("🧹 [REALTIME-HOOK] No more subscribers, cleaning up global channel")
        
        if (globalChannel) {
          supabase.removeChannel(globalChannel).catch(err => {
            console.log("⚠️ [REALTIME-HOOK] Error during channel cleanup:", err)
          })
          globalChannel = null
        }
        
        globalCallbacks.clear()
        globalQueryClient = null
      }
      
      setStatus('disconnected')
    }
  }, [enabled, queryClient])

  return { status }
}