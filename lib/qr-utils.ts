/**
 * QR Code Utilities - Simplified and optimized for better generation
 */

// Simple app identifier
const APP_ID = "Voceo_Echo"

/**
 * Creates QR code data - simplified to avoid complexity issues
 */
export function encryptQRData(studentId: string, firstName: string, lastName: string): string {
  console.log("🔐 [QR-UTILS] Creating QR data for student:", studentId)

  try {
    // Create simple, compact data structure
    const timestamp = Date.now()
    const simpleData = {
      app: APP_ID,
      id: studentId,
      fn: firstName.substring(0, 20), // Limit length to keep QR simple
      ln: lastName.substring(0, 20), // Limit length to keep QR simple
      ts: timestamp,
    }

    // Convert to JSON - keep it simple
    const jsonString = JSON.stringify(simpleData)
    console.log("📝 [QR-UTILS] Generated QR data:", jsonString)
    console.log("📊 [QR-UTILS] QR data length:", jsonString.length)

    return jsonString
  } catch (error) {
    console.error("❌ [QR-UTILS] Error creating QR data:", error)
    throw new Error("Failed to create QR data")
  }
}

/**
 * Validates and extracts data from QR code
 *
 * NOTE: This function is exported with two names for backward compatibility:
 * - decryptQRData (original name used by scanner)
 * - decryptAndValidateQRData (new descriptive name)
 */
export function decryptQRData(qrData: string): {
  isValid: boolean
  studentData?: { id: string; firstName: string; lastName: string; timestamp: number }
  error?: string
} {
  console.log("🔍 [QR-UTILS] Validating QR data")

  try {
    const parsed = JSON.parse(qrData)
    console.log("📝 [QR-UTILS] Parsed QR data:", parsed)

    // Check if it's from our app
    if (parsed.app !== APP_ID) {
      console.warn("⚠️ [QR-UTILS] QR code not from our app")
      return { isValid: false, error: "Invalid QR code - not from this app" }
    }

    // Check required fields
    if (!parsed.id || !parsed.fn || !parsed.ln) {
      console.warn("⚠️ [QR-UTILS] Missing required fields in QR data")
      return { isValid: false, error: "Invalid QR code format" }
    }

    // Check timestamp (30 days max age)
    const now = Date.now()
    const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days
    if (now - parsed.ts > maxAge) {
      console.warn("⚠️ [QR-UTILS] QR code is too old")
      return { isValid: false, error: "QR code expired" }
    }

    console.log("✅ [QR-UTILS] QR data is valid")
    return {
      isValid: true,
      studentData: {
        id: parsed.id,
        firstName: parsed.fn,
        lastName: parsed.ln,
        timestamp: parsed.ts,
      },
    }
  } catch (error) {
    console.error("❌ [QR-UTILS] Error validating QR data:", error)
    return { isValid: false, error: "Invalid QR code format" }
  }
}

// Export the same function with the alternative name for new code
export const decryptAndValidateQRData = decryptQRData

/**
 * Quick check if QR data is from our app
 */
export function isValidAppQR(qrData: string): boolean {
  try {
    const parsed = JSON.parse(qrData)
    return parsed.app === APP_ID
  } catch {
    return false
  }
}

/**
 * Validates student exists in database
 */
export function validateStudentInDB(studentId: string, students: any[]): boolean {
  return students.some((student) => student.id === studentId)
}
