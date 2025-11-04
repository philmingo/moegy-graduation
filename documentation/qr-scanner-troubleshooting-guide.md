# QR Scanner Troubleshooting Guide

## Overview
This document details the problems encountered while implementing the QR scanner using the html5-qrcode library and the solutions we developed to create a properly functioning scanner with custom styling.

## Problems Encountered

### 1. Initial Problem: Camera Rendering Issues
**Issue**: The original QR scanner component had camera rendering problems and needed to be rebuilt from scratch.

**Solution**: Completely removed the camera rendering logic and started fresh with a clean implementation using the html5-qrcode library.

### 2. QR Box Size Mismatch
**Issue**: The actual scanning area (qrbox) was not aligned with the visual target overlay, causing confusion about where to position QR codes.

**Solution**: Ensured the qrbox parameter in the html5-qrcode configuration matches the visual overlay dimensions.

### 3. Flash of White Boxes
**Issue**: Before the custom purple scanning box appeared, there was a brief flash of white boxes from the library's default UI.

**Cause**: The html5-qrcode library renders its default UI first, then our custom styling was applied after a delay.

**Initial Solution**: Added custom styling with setTimeout to override the default appearance.

### 4. Corner Brackets Touching Each Other
**Issue**: The most critical problem - the corner brackets were positioned so close together that they were "kissing" or touching, leaving no space for QR codes to fit inside the scanning area.

**Root Cause Analysis**: 
- Container dimensions: 894px × 843px
- Library calculated border-width: 456px 307px (vertical, horizontal)
- Calculated inner area: 280px × **-69px** (negative height!)
- The vertical borders (456px × 2 = 912px) were larger than the container height (843px)
- This caused the top and bottom borders to overlap, creating no scanning space

**Debugging Process**:
\`\`\`javascript
// Debug output showed the problem:
📐 Calculated inner area dimensions: {
  "innerWidth": 280,
  "innerHeight": -69,  // ← NEGATIVE HEIGHT!
  "containerWidth": 894,
  "containerHeight": 843,
  "verticalBorder": 456,
  "horizontalBorder": 307
}
\`\`\`

### 5. Visual Flash During Initialization
**Issue**: Users could see the broken white brackets (touching each other) for 500ms before the fixed purple styling was applied.

**Solution**: Pre-applied CSS styling using injected stylesheets to eliminate the visual flash.

## Final Solution Architecture

### 1. Pre-Applied CSS Styling
Instead of applying styles after the scanner initializes, we inject CSS rules into the document head before initialization:

\`\`\`css
/* Override the default border styling */
#qr-shaded-region {
  border-color: rgba(168, 85, 247, 0.4) !important;
}

/* Style the corner brackets */
#qr-shaded-region > div {
  background-color: rgb(147, 51, 234) !important;
  box-shadow: 0 0 8px rgba(168, 85, 247, 0.6) !important;
}

/* Make horizontal brackets shorter */
#qr-shaded-region > div[style*="width: 40px"] {
  width: 30px !important;
  height: 4px !important;
}

/* Make vertical brackets shorter */
#qr-shaded-region > div[style*="height: 45px"] {
  height: 30px !important;
  width: 4px !important;
}
\`\`\`

### 2. Dynamic Border Width Calculation
The critical fix for the touching brackets issue:

\`\`\`javascript
const containerWidth = scannerContainer.clientWidth
const containerHeight = scannerContainer.clientHeight

// Calculate proper border dimensions to ensure positive inner area
const qrboxWidth = 280
const qrboxHeight = 280
const horizontalBorder = (containerWidth - qrboxWidth) / 2
const verticalBorder = (containerHeight - qrboxHeight) / 2

// Override the library's calculated border-width
const newBorderWidth = `${verticalBorder}px ${horizontalBorder}px`
shadedRegion.style.setProperty("border-width", newBorderWidth, "important")
\`\`\`

This ensures:
- Inner width: `containerWidth - (horizontalBorder × 2) = 894 - (307 × 2) = 280px` ✅
- Inner height: `containerHeight - (verticalBorder × 2) = 843 - (281.5 × 2) = 280px` ✅

## Current Code Implementation

\`\`\`typescript
"use client"

import { useEffect, useRef, useState } from "react"
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  type Html5QrcodeError,
  type Html5QrcodeResult,
  Html5QrcodeScannerState,
  type Html5QrcodeCameraScanConfig,
  type Html5QrcodeFullConfig,
} from "html5-qrcode"

interface QrScannerProps {
  onScan: (decodedText: string) => void
  onError: (errorMessage: string | Html5QrcodeError) => void
  className?: string
}

export function QrScanner({ onScan, onError, className }: QrScannerProps) {
  const scannerContainerId = "qr-reader"
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const [cameraError, setCameraError] = useState(false)
  const [scanAttempts, setScanAttempts] = useState(0)
  const hasScannedRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Inject CSS to style the scanner elements before they're created
  useEffect(() => {
    const styleId = "qr-scanner-custom-styles"

    // Remove existing styles if any
    const existingStyle = document.getElementById(styleId)
    if (existingStyle) {
      existingStyle.remove()
    }

    // Create and inject custom CSS
    const style = document.createElement("style")
    style.id = styleId
    style.textContent = `
      /* Override the default border styling */
      #qr-shaded-region {
        border-color: rgba(168, 85, 247, 0.4) !important;
      }

      /* Style the corner brackets */
      #qr-shaded-region > div {
        background-color: rgb(147, 51, 234) !important;
        box-shadow: 0 0 8px rgba(168, 85, 247, 0.6) !important;
      }

      /* Make horizontal brackets shorter */
      #qr-shaded-region > div[style*="width: 40px"] {
        width: 30px !important;
        height: 4px !important;
      }

      /* Make vertical brackets shorter */
      #qr-shaded-region > div[style*="height: 45px"] {
        height: 30px !important;
        width: 4px !important;
      }

      /* Style the video element */
      #${scannerContainerId} video {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        border-radius: 1rem !important;
      }
    `

    document.head.appendChild(style)
    console.log("✅ Pre-applied CSS styling for QR scanner")

    // Cleanup function to remove styles when component unmounts
    return () => {
      const styleToRemove = document.getElementById(styleId)
      if (styleToRemove) {
        styleToRemove.remove()
        console.log("🧹 Removed QR scanner CSS styling")
      }
    }
  }, [scannerContainerId])

  useEffect(() => {
    hasScannedRef.current = false

    // Make sure the container exists
    if (!containerRef.current) {
      console.error("QR Scanner container ref not found.")
      onError("QR Scanner container ref not found.")
      return
    }

    // Create or clear the qr-reader element
    let qrReaderElement = document.getElementById(scannerContainerId)
    if (!qrReaderElement) {
      qrReaderElement = document.createElement("div")
      qrReaderElement.id = scannerContainerId
      qrReaderElement.className = "w-full h-full"
      containerRef.current.appendChild(qrReaderElement)
    } else {
      qrReaderElement.innerHTML = ""
    }

    const verboseLogging = false
    const scannerConfig: Html5QrcodeFullConfig = {
      verbose: verboseLogging,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    }
    const newScannerInstance = new Html5Qrcode(scannerContainerId, scannerConfig)
    html5QrCodeRef.current = newScannerInstance

    // Set qrbox to match our desired size
    const startConfig: Html5QrcodeCameraScanConfig = {
      fps: 10,
      qrbox: { width: 280, height: 280 },
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true,
      },
      disableFlip: false,
    }

    const qrCodeSuccessCallback = async (decodedText: string, result: Html5QrcodeResult) => {
      if (hasScannedRef.current) return
      hasScannedRef.current = true
      console.log("QR Scanner: Successful scan", { decodedText })

      const currentInstance = html5QrCodeRef.current
      if (currentInstance) {
        try {
          const scannerState = currentInstance.getState()
          if (scannerState === Html5QrcodeScannerState.SCANNING || scannerState === Html5QrcodeScannerState.PAUSED) {
            await currentInstance.stop()
            console.log("Scanner stopped after successful scan.")
          } else {
            console.log("Scanner was not in a stoppable state (state: " + scannerState + "), proceeding.")
          }
        } catch (err) {
          console.error(
            "Error stopping scanner after successful scan:",
            err instanceof Error ? err.message : String(err),
          )
        } finally {
          onScan(decodedText)
        }
      } else {
        onScan(decodedText)
      }
    }

    const qrCodeErrorCallback = (errorMessage: string, error: Html5QrcodeError) => {
      setScanAttempts((prev) => prev + 1)
      if (
        errorMessage.includes("NotAllowedError") ||
        errorMessage.includes("Camera access denied") ||
        (error && error.name === "NotAllowedError")
      ) {
        setCameraError(true)
        onError(errorMessage)
      }
    }

    const initializeScanner = async () => {
      try {
        await newScannerInstance.start(
          { facingMode: "environment" },
          startConfig,
          qrCodeSuccessCallback,
          qrCodeErrorCallback,
        )
        console.log("🎯 QR Scanner started successfully with pre-applied styling")

        // We still need to fix the border dimensions since CSS can't calculate dynamic values
        setTimeout(() => {
          const scannerContainer = document.getElementById(scannerContainerId)
          if (!scannerContainer) return

          const shadedRegion = scannerContainer.querySelector("#qr-shaded-region") as HTMLElement
          if (shadedRegion) {
            const containerWidth = scannerContainer.clientWidth
            const containerHeight = scannerContainer.clientHeight

            // Calculate proper border dimensions
            const qrboxWidth = 280
            const qrboxHeight = 280
            const horizontalBorder = (containerWidth - qrboxWidth) / 2
            const verticalBorder = (containerHeight - qrboxHeight) / 2

            // Only override the border-width (colors and bracket styling already applied via CSS)
            const newBorderWidth = `${verticalBorder}px ${horizontalBorder}px`
            shadedRegion.style.setProperty("border-width", newBorderWidth, "important")

            console.log("✅ Border dimensions adjusted:", newBorderWidth)
          }
        }, 100) // Much shorter delay since styling is already applied
      } catch (err: any) {
        const errMsg = err instanceof Error ? err.message : String(err)
        console.error("Error starting scanner:", errMsg)
        setCameraError(true)
        onError(errMsg)

        const currentInstanceForClear = html5QrCodeRef.current
        if (currentInstanceForClear) {
          try {
            await currentInstanceForClear.clear()
            console.log("Scanner UI cleared after start() error.")
          } catch (clearError) {
            console.warn(
              "Failed to clear scanner UI after start() error:",
              clearError instanceof Error ? clearError.message : String(clearError),
            )
          }
        }
      }
    }

    initializeScanner()

    return () => {
      console.log("QrScanner: Unmounting and cleaning up...")
      const instanceToClean = html5QrCodeRef.current
      html5QrCodeRef.current = null

      const cleanupScanner = async () => {
        if (instanceToClean) {
          try {
            const scannerState = instanceToClean.getState()
            console.log(`QrScanner: Instance state at cleanup: ${scannerState}`)

            if (scannerState === Html5QrcodeScannerState.SCANNING || scannerState === Html5QrcodeScannerState.PAUSED) {
              await instanceToClean.stop()
              console.log("QrScanner: Camera stopped successfully in cleanup.")
            }
            await instanceToClean.clear()
            console.log("QrScanner: Scanner UI cleared successfully in cleanup.")
          } catch (cleanupError) {
            console.warn(
              "QrScanner: Warning during cleanup (stop/clear):",
              cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
            )
          }
        }
      }
      cleanupScanner()

      // Remove the qr-reader element from the DOM
      if (containerRef.current && qrReaderElement) {
        try {
          containerRef.current.removeChild(qrReaderElement)
        } catch (e) {
          // Element might already be removed
        }
      }
    }
  }, [onScan, onError])

  return (
    <div className={`h-full w-full ${className || ""}`} ref={containerRef}>
      {cameraError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm text-center backdrop-blur-sm">
            Camera access error. Please check permissions.
          </div>
        </div>
      )}
    </div>
  )
}
\`\`\`

## How the Current Code Works

### 1. CSS Pre-injection (First useEffect)
- Creates a `<style>` element with custom CSS rules
- Injects it into the document head before scanner initialization
- Uses `!important` to override the library's inline styles
- Automatically cleans up styles when component unmounts

### 2. Scanner Initialization (Second useEffect)
- Creates the scanner container element
- Initializes the Html5Qrcode instance with proper configuration
- Sets up success and error callbacks for QR code scanning
- Handles proper cleanup on component unmount

### 3. Dynamic Border Adjustment
- After scanner starts, calculates proper border dimensions
- Ensures the inner scanning area has positive dimensions
- Overrides the library's calculated border-width with correct values
- Uses a short 100ms timeout since most styling is already applied

### 4. Key Features
- **No visual flash**: Elements are styled correctly from creation
- **Proper spacing**: Corner brackets have gaps for QR codes to fit
- **Purple theme**: Custom purple color scheme with glow effects
- **Responsive**: Adapts to different container sizes
- **Clean cleanup**: Removes all styles and stops camera on unmount

## Lessons Learned

1. **Debug first**: Always log the actual dimensions and calculated values to understand what's happening
2. **CSS pre-injection**: Apply styles before elements are created to avoid visual flashes
3. **Border-width calculation**: The library's automatic calculations may not work for all container sizes
4. **Use !important**: Necessary to override inline styles from third-party libraries
5. **Proper cleanup**: Always clean up injected styles and camera resources

## Future Improvements

1. **Responsive qrbox**: Automatically adjust qrbox size based on container dimensions
2. **Theme integration**: Use theme colors from the theme configuration file
3. **Animation**: Add smooth transitions for scanner state changes
4. **Error handling**: Better error messages and recovery mechanisms
