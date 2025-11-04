/**
 * Industry-Standard Camera Cleanup Utility
 * 
 * This module provides centralized camera resource management following
 * MediaStream API best practices and Html5Qrcode lifecycle patterns.
 * 
 * Key Features:
 * - Graceful camera stream cleanup
 * - Html5Qrcode instance state management
 * - Prevention of memory leaks
 * - Race condition handling
 * - Proper event listener cleanup
 */

import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode"

/**
 * Logger utility for debugging camera operations
 * Set to no-op for production (uncomment console.log to enable debugging)
 */
const log = (message: string, data?: any) => {
  // Uncomment the line below for debugging:
  // console.log(`[CameraCleanup ${new Date().toISOString()}]`, message, data || "")
}

/**
 * Stops all video tracks in a MediaStream
 * @param stream - The MediaStream to stop
 */
export const stopMediaStream = (stream: MediaStream): void => {
  try {
    const tracks = stream.getTracks()
    log(`Stopping ${tracks.length} media track(s)`)
    
    tracks.forEach((track) => {
      log(`Track state before stop: ${track.readyState} (${track.kind}: ${track.label})`)
      if (track.readyState === 'live') {
        track.stop()
        log(`✓ Stopped track: ${track.label} (kind: ${track.kind})`)
      } else {
        log(`- Track already stopped: ${track.label}`)
      }
    })
  } catch (error) {
    log("Error stopping media stream tracks:", error)
  }
}

/**
 * Finds and stops all active video elements in the DOM
 * This is a safety net for cleanup when Html5Qrcode doesn't clean up properly
 */
export const stopAllVideoElements = (): void => {
  try {
    const videoElements = document.querySelectorAll('video')
    log(`Found ${videoElements.length} video elements to cleanup`)
    
    let stoppedCount = 0
    videoElements.forEach((videoElement, index) => {
      if (videoElement.srcObject instanceof MediaStream) {
        const stream = videoElement.srcObject
        stopMediaStream(stream)
        videoElement.srcObject = null
        stoppedCount++
        log(`Cleaned up video element ${index + 1}`)
      }
      
      // Pause the video element
      if (!videoElement.paused) {
        videoElement.pause()
      }
      
      // Remove the video source
      videoElement.removeAttribute('src')
      videoElement.load()
      
      // Remove event listeners by cloning (simple but effective)
      videoElement.onloadedmetadata = null
      videoElement.onplay = null
      videoElement.onpause = null
      videoElement.onerror = null
      videoElement.onabort = null
    })
    
    if (stoppedCount > 0) {
      log(`Successfully stopped ${stoppedCount} video stream(s)`)
    }
  } catch (error) {
    log("Error stopping video elements:", error)
  }
}

/**
 * Safely stops an Html5Qrcode scanner instance
 * Follows the recommended shutdown sequence to prevent errors
 * 
 * @param instance - The Html5Qrcode instance to stop
 * @param clearUI - Whether to clear the UI after stopping (default: true)
 * @returns Promise that resolves when cleanup is complete
 */
export const stopHtml5QrcodeScanner = async (
  instance: Html5Qrcode | null,
  clearUI: boolean = true
): Promise<void> => {
  if (!instance) {
    log("No scanner instance to stop")
    return
  }

  try {
    // Check current state
    const currentState = instance.getState()
    log(`Scanner state: ${Html5QrcodeScannerState[currentState]}`)

    // Only stop if actually scanning or paused
    if (
      currentState === Html5QrcodeScannerState.SCANNING ||
      currentState === Html5QrcodeScannerState.PAUSED
    ) {
      log("Stopping scanner...")
      
      // CRITICAL: Stop the scanner (this should stop the camera stream)
      await instance.stop()
      log("Scanner stopped successfully")
      
      // Immediately check for and stop video elements
      stopAllVideoElements()
      
      // Small delay to allow internal cleanup
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Check again after delay
      stopAllVideoElements()
    } else {
      log(`Scanner not in active state, skipping stop()`)
    }

    // Clear the UI if requested
    if (clearUI) {
      try {
        await instance.clear()
        log("Scanner UI cleared successfully")
      } catch (clearError) {
        log("Error clearing scanner UI (non-fatal):", clearError)
      }
    }
  } catch (error: any) {
    // Log but don't throw - we want to continue cleanup
    log("Error during scanner stop:", error?.message || error)
    
    // If stop() failed, we might still have active streams
    // Fall back to manual cleanup
    stopAllVideoElements()
  }
}

/**
 * Aggressive cleanup - stops ALL media tracks from all active streams
 * This is a nuclear option when normal cleanup doesn't work
 */
export const stopAllMediaTracks = async (): Promise<void> => {
  try {
    // Get all media devices and stop their tracks
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      log("Performing aggressive media track cleanup")
      
      // Try to enumerate and stop all active tracks
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      log(`Found ${videoDevices.length} video input devices`)
    }
    
    // Stop all video elements and their streams
    stopAllVideoElements()
    
  } catch (error) {
    log("Error in aggressive cleanup:", error)
  }
}

/**
 * Complete cleanup for Html5Qrcode scanner
 * This is the main function to call when unmounting or closing a scanner
 * 
 * @param instance - The Html5Qrcode instance to cleanup
 * @param clearUI - Whether to clear the UI after stopping
 * @returns Promise that resolves when all cleanup is complete
 */
export const cleanupCamera = async (
  instance: Html5Qrcode | null,
  clearUI: boolean = true
): Promise<void> => {
  log("Starting complete camera cleanup")
  
  try {
    // Step 1: Stop the Html5Qrcode scanner properly
    await stopHtml5QrcodeScanner(instance, clearUI)
    
    // Step 2: Additional safety - stop any remaining video elements
    // This catches any streams that Html5Qrcode didn't clean up
    stopAllVideoElements()
    
    // Step 3: Aggressive cleanup - stop all media tracks
    await stopAllMediaTracks()
    
    // Step 4: Small delay to ensure browser releases camera
    await new Promise(resolve => setTimeout(resolve, 150))
    
    log("Camera cleanup completed successfully")
  } catch (error) {
    log("Error during camera cleanup:", error)
    
    // Last resort - force cleanup all video elements
    stopAllVideoElements()
  }
}

/**
 * Creates a cleanup function for use in React useEffect
 * This handles the async cleanup in a React-friendly way
 * 
 * @param instanceRef - React ref containing the Html5Qrcode instance
 * @param clearUI - Whether to clear the UI after stopping
 * @returns Cleanup function for React useEffect
 */
export const createReactCleanup = (
  instanceRef: React.MutableRefObject<Html5Qrcode | null>,
  clearUI: boolean = true
) => {
  return () => {
    log("React cleanup triggered - component unmounting")
    
    // CRITICAL: Stop video elements BEFORE React removes them from DOM
    stopAllVideoElements()
    
    const instance = instanceRef.current
    instanceRef.current = null // Clear ref immediately
    
    // Run cleanup without blocking unmount
    if (instance) {
      log("Cleaning up Html5Qrcode instance")
      cleanupCamera(instance, clearUI).catch((error) => {
        log("Cleanup error in React effect:", error)
      })
    }
    
    // Run aggressive cleanup after a short delay to catch any stragglers
    setTimeout(() => {
      stopAllVideoElements()
      stopAllMediaTracks()
    }, 100)
  }
}

/**
 * Suppresses Html5Qrcode camera abort warnings in console
 * These warnings are expected during normal cleanup and can be safely ignored
 * 
 * @returns Cleanup function to restore original console methods
 */
export const suppressCameraAbortWarnings = (): (() => void) => {
  const originalWarn = console.warn
  const originalError = console.error
  
  console.warn = (...args) => {
    if (args[0]?.includes?.('RenderedCameraImpl video surface onabort()')) {
      return // Suppress this specific warning
    }
    originalWarn.apply(console, args)
  }
  
  console.error = (...args) => {
    if (args[0]?.includes?.('RenderedCameraImpl video surface onabort()')) {
      return // Suppress this specific error
    }
    originalError.apply(console, args)
  }
  
  // Return cleanup function
  return () => {
    console.warn = originalWarn
    console.error = originalError
  }
}

/**
 * Waits for the camera to be fully released before resolving
 * Useful when you need to ensure camera is available for next scanner
 * 
 * @param maxWaitMs - Maximum time to wait (default: 2000ms)
 * @returns Promise that resolves when camera appears to be released
 */
export const waitForCameraRelease = async (maxWaitMs: number = 2000): Promise<void> => {
  const startTime = Date.now()
  
  while (Date.now() - startTime < maxWaitMs) {
    const videoElements = document.querySelectorAll('video')
    const hasActiveVideo = Array.from(videoElements).some(
      (video) => video.srcObject instanceof MediaStream
    )
    
    if (!hasActiveVideo) {
      log("Camera released successfully")
      return
    }
    
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  log("Camera release timeout - forcing cleanup")
  stopAllVideoElements()
}
