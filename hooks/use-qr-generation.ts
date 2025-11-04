"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { encryptQRData } from "@/lib/qr-utils"
import config from "@/lib/theme-config"

interface Student {
  id: string
  first_name: string
  last_name: string
  phonetic_spelling?: string | null
}

export function useQRGeneration(student: Student | null) {
  const [qrCodeData, setQrCodeData] = useState("")
  const [qrImageUrl, setQrImageUrl] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generate QR code data when student changes
  useEffect(() => {
    if (student) {
      console.log("🔄 [QR-HOOK] Generating QR code for student:", student.id, student.first_name, student.last_name)
      setError(null)

      try {
        const encryptedData = encryptQRData(student.id, student.first_name, student.last_name)
        console.log("📝 [QR-HOOK] Encrypted data length:", encryptedData.length)
        console.log("📝 [QR-HOOK] Encrypted data preview:", encryptedData.substring(0, 50) + "...")
        setQrCodeData(encryptedData)
        console.log("✅ [QR-HOOK] QR code data generated successfully")
      } catch (error) {
        console.error("❌ [QR-HOOK] Error generating QR code data:", error)
        setError("Failed to generate QR data")
        setQrCodeData("")
      }
    } else {
      console.log("🔄 [QR-HOOK] No student provided, clearing QR data")
      setQrCodeData("")
      setQrImageUrl("")
      setError(null)
    }
  }, [student])

  // Render QR code to canvas when data changes
  useEffect(() => {
    if (qrCodeData) {
      console.log("🔄 [QR-HOOK] QR data changed, rendering to canvas")
      renderQrCodeToCanvas()
    } else {
      console.log("🔄 [QR-HOOK] No QR data, clearing image URL")
      setQrImageUrl("")
    }
  }, [qrCodeData])

  const renderQrCodeToCanvas = useCallback(async () => {
    if (!qrCodeData) {
      console.log("⚠️ [QR-HOOK] No QR data to render")
      return
    }

    setIsGenerating(true)
    setError(null)
    console.log("🔄 [QR-HOOK] Starting QR code rendering process")

    try {
      // Dynamic import of QR code library
      console.log("📦 [QR-HOOK] Importing QR code library...")
      const QRCodeLib = await import("qrcode")
      console.log("✅ [QR-HOOK] QR code library imported successfully")

      // Create a temporary canvas if ref is not available
      let canvas = canvasRef.current
      if (!canvas) {
        console.log("🔧 [QR-HOOK] Creating temporary canvas")
        canvas = document.createElement("canvas")
      }

      // Set canvas dimensions
      const size = 400
      canvas.width = size
      canvas.height = size
      console.log("📐 [QR-HOOK] Canvas dimensions set to:", size, "x", size)

      // QR code options
      const options = {
        width: size,
        margin: 2,
        color: {
          dark: config.theme.qrCard.qrFgColor || "#000000",
          light: config.theme.qrCard.qrBgColor || "#FFFFFF",
        },
        errorCorrectionLevel: "L" as const, // Low error correction for simpler QR codes
      }

      console.log("⚙️ [QR-HOOK] QR code options:", options)
      console.log("📊 [QR-HOOK] Data to encode length:", qrCodeData.length)

      // Generate QR code to canvas
      await QRCodeLib.toCanvas(canvas, qrCodeData, options)
      console.log("✅ [QR-HOOK] QR code rendered to canvas successfully")

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL("image/png", 0.9)
      console.log("🖼️ [QR-HOOK] Canvas converted to data URL, length:", dataUrl.length)

      setQrImageUrl(dataUrl)
      console.log("✅ [QR-HOOK] QR image URL set successfully")
    } catch (error) {
      console.error("❌ [QR-HOOK] Error rendering QR code:", error)
      console.error("❌ [QR-HOOK] Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        qrDataLength: qrCodeData.length,
        qrDataPreview: qrCodeData.substring(0, 100),
      })
      setError(`Failed to render QR code: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsGenerating(false)
      console.log("🏁 [QR-HOOK] QR code rendering process completed")
    }
  }, [qrCodeData])

  const generateQrCardImage = useCallback(async (): Promise<string | null> => {
    if (!student || !qrImageUrl) {
      console.error("❌ [QR-HOOK] Cannot generate QR card image - missing data")
      return null
    }

    console.log("🔄 [QR-HOOK] Generating QR card image for:", student.first_name, student.last_name)

    try {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        console.error("❌ [QR-HOOK] Cannot get canvas context")
        return null
      }

      canvas.width = 800
      canvas.height = 1000

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "#6B46C1") // Purple
      gradient.addColorStop(1, "#3B82F6") // Blue
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // University Name
      ctx.fillStyle = "#FFFFFF"
      ctx.font = "bold 48px Arial, sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(config.institution.name, canvas.width / 2, 100)

      // Load and draw QR code
      const qrImage = new Image()
      qrImage.crossOrigin = "anonymous"

      await new Promise<void>((resolve, reject) => {
        qrImage.onload = () => {
          console.log("✅ [QR-HOOK] QR image loaded for card generation")
          resolve()
        }
        qrImage.onerror = (err) => {
          console.error("❌ [QR-HOOK] Error loading QR image for card:", err)
          reject(err)
        }
        qrImage.src = qrImageUrl
      })

      // Draw QR code with white background
      const qrSize = 400
      const qrX = (canvas.width - qrSize) / 2
      const qrY = 200

      // White background for QR code
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40)

      // Draw QR code
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

      // Student Name
      const nameY = qrY + qrSize + 80
      ctx.fillStyle = "#FFFFFF"
      ctx.font = "bold 36px Arial, sans-serif"
      ctx.fillText(`${student.first_name} ${student.last_name}`, canvas.width / 2, nameY)

      // Phonetic spelling if available
      if (student.phonetic_spelling) {
        ctx.fillStyle = "#E5E7EB"
        ctx.font = "italic 28px Arial, sans-serif"
        ctx.fillText(`(${student.phonetic_spelling})`, canvas.width / 2, nameY + 50)
      }

      const dataUrl = canvas.toDataURL("image/png", 0.9)
      console.log("✅ [QR-HOOK] QR card image generated successfully")
      return dataUrl
    } catch (error) {
      console.error("❌ [QR-HOOK] Error generating QR card image:", error)
      return null
    }
  }, [student, qrImageUrl])

  // Debug logging
  useEffect(() => {
    console.log("🔍 [QR-HOOK] Hook state:", {
      hasStudent: !!student,
      studentId: student?.id,
      qrCodeDataLength: qrCodeData.length,
      hasQrImageUrl: !!qrImageUrl,
      isGenerating,
      error,
    })
  }, [student, qrCodeData, qrImageUrl, isGenerating, error])

  return {
    qrCodeData,
    qrImageUrl,
    isGenerating,
    error,
    canvasRef,
    generateQrCardImage,
  }
}
