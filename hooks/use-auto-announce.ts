"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { toast } from "@/hooks/use-toast"

export function useAutoAnnounce() {
  const [autoAnnounce, setAutoAnnounce] = useState(true)
  const [showModal, setShowModal] = useState(false)
  
  // Ref to track current state without causing rerenders
  const autoAnnounceRef = useRef(autoAnnounce)
  
  // Keep ref in sync with state
  useEffect(() => {
    autoAnnounceRef.current = autoAnnounce
    console.log(`[AUTO-ANNOUNCE STATE] autoAnnounce: ${autoAnnounce}, showModal: ${showModal}`)
  }, [autoAnnounce, showModal])
  
  // Toggle handler - stable reference that never changes
  const toggle = useCallback((checked: boolean) => {
    console.log(`[AUTO-ANNOUNCE] Toggle called: ${checked}, current state: ${autoAnnounceRef.current}`)
    
    // Guard clause - prevent state update if already in that state
    if (checked === autoAnnounceRef.current) {
      console.log(`[AUTO-ANNOUNCE] Already in state ${checked}, ignoring`)
      return
    }

    if (!checked) {
      // Turning OFF → Change state immediately and show confirmation modal
      console.log(`[AUTO-ANNOUNCE] Disabling and showing confirmation modal`)
      setAutoAnnounce(false)
      setShowModal(true)
    } else {
      // Turning ON → Enable immediately
      console.log(`[AUTO-ANNOUNCE] Enabling auto-announce`)
      setAutoAnnounce(true)
    }
  }, []) // Empty dependency array - function is NEVER recreated
  
  // Confirm disable - just close modal since state already changed
  const confirmDisable = useCallback(() => {
    console.log(`[AUTO-ANNOUNCE] User confirmed disable`)
    setShowModal(false)
    
    // Use setTimeout to prevent state batching issues with toast
    setTimeout(() => {
      toast({
        title: "Auto-Announce Disabled",
        description: "Automatic announcements have been turned off.",
      })
    }, 0)
  }, [])
  
  // Cancel disable - revert state change
  const cancelDisable = useCallback(() => {
    console.log(`[AUTO-ANNOUNCE] User cancelled disable - reverting to enabled`)
    // Revert the state change since user cancelled
    setAutoAnnounce(true)
    setShowModal(false)
  }, [])
  
  return {
    autoAnnounce,
    showModal,
    toggle,
    confirmDisable,
    cancelDisable,
  }
}
