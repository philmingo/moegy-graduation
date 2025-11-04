/**
 * Formats student information into an announcement text with natural pauses
 * Uses punctuation to create pauses in speech synthesis
 */
export function getAnnouncementText(student: {
  name?: string
  first_name?: string
  last_name?: string
  phonetic?: string
  phonetic_spelling?: string
  programme?: string
  university?: string
  classification?: string
}): string {
  // Handle different name formats (full name or first/last name)
  let name = student.name
  if (!name && (student.first_name || student.last_name)) {
    name = `${student.first_name || ""} ${student.last_name || ""}`.trim()
  }

  // Use phonetic spelling if available
  const speakableName = student.phonetic || student.phonetic_spelling || name || ""

  // Split the name into parts if possible
  let announcement = ""
  if (speakableName.includes(" ")) {
    const [firstName, ...lastNameParts] = speakableName.split(" ")
    const lastName = lastNameParts.join(" ")
    announcement = `${firstName}, ${lastName}........ `
  } else {
    // If name can't be split (single name or empty), use as is
    announcement = `${speakableName}........ `
  }

  // Add programme/degree if available
  if (student.programme) {
    announcement += `${student.programme}... `
  }

  // Add university/institution if available
  if (student.university) {
    announcement += `From ${student.university}`
  }

  // Add classification if available (with period for longer pause)
  if (student.classification) {
    // Add connecting word if university was mentioned
    if (student.university) {
      announcement += `. Passed with ${student.classification}.`
    } else {
      announcement += `Passed with ${student.classification}.`
    }
  }

  return announcement
}
