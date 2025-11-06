"use server"

import { createClient } from "@/lib/supabase"

export interface GuestBookMessage {
  id: string
  student_id: string
  student_name: string
  student_location: string
  message_image_url: string
  student_photo_url?: string | null
  student_university?: string | null
  student_programme?: string | null
  student_classification?: string | null
  approved: boolean
  created_at: string
  updated_at: string
}

export interface CreateMessageData {
  studentId: string
  studentName: string
  studentLocation: string
  imageBlob: string // Base64 encoded image
  studentPhotoBlob?: string // Base64 encoded student photo (optional)
}

/**
 * Get all approved guest book messages ordered by creation date (newest first)
 */
export async function getGuestBookMessages(): Promise<GuestBookMessage[]> {
  console.log("🔄 [SERVER] getGuestBookMessages - Fetching all approved messages")

  const supabase = createClient()

  // Get all messages using pagination to bypass Supabase's 1000 row limit
  let allMessages: any[] = []
  let from = 0
  const pageSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data: batch, error } = await supabase
      .from("voceo_guest_book_messages")
      .select("*")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1)

    if (error) {
      console.error("❌ [SERVER] getGuestBookMessages - Error:", error)
      throw new Error(`Failed to fetch guest book messages: ${error.message}`)
    }

    if (batch && batch.length > 0) {
      allMessages = allMessages.concat(batch)
      from += pageSize
      hasMore = batch.length === pageSize // Continue if we got a full page
    } else {
      hasMore = false
    }
  }

  if (allMessages.length === 0) {
    console.log("✅ [SERVER] getGuestBookMessages - No messages found")
    return []
  }

  // Fetch student data for each message to get university, programme, and classification
  const studentIds = allMessages.map(m => m.student_id)
  
  // Fetch students with pagination as well
  let allStudents: any[] = []
  from = 0
  hasMore = true

  while (hasMore) {
    const { data: studentBatch, error: studentError } = await supabase
      .from("students")
      .select("id, university, programme, classification")
      .in("id", studentIds)
      .range(from, from + pageSize - 1)

    if (studentError) {
      console.warn("⚠️ [SERVER] getGuestBookMessages - Failed to fetch student data:", studentError)
      break
    }

    if (studentBatch && studentBatch.length > 0) {
      allStudents = allStudents.concat(studentBatch)
      from += pageSize
      hasMore = studentBatch.length === pageSize
    } else {
      hasMore = false
    }
  }

  // Create a map of student data by student_id
  const studentMap = new Map(allStudents.map(s => [s.id, s]))

  // Merge student data into messages
  const enrichedMessages = allMessages.map(message => {
    const student = studentMap.get(message.student_id)
    return {
      ...message,
      student_university: student?.university || message.student_university || null,
      student_programme: student?.programme || message.student_programme || null,
      student_classification: student?.classification || message.student_classification || null,
      student_photo_url: message.student_photo_url || null,
    }
  })

  console.log(`✅ [SERVER] getGuestBookMessages - Successfully fetched ${enrichedMessages.length} messages with student data`)
  return enrichedMessages
}

/**
 * Create a new guest book message with image upload to storage
 */
export async function createGuestBookMessage(messageData: CreateMessageData): Promise<GuestBookMessage> {
  console.log("🔄 [SERVER] createGuestBookMessage - Creating new message for student:", messageData.studentName)

  const supabase = createClient()

  try {
    // Step 1: Upload student photo if provided
    let studentPhotoUrl: string | null = null
    if (messageData.studentPhotoBlob) {
      const photoFileName = `${messageData.studentId}-photo-${Date.now()}.png`
      const photoFilePath = `photos/${photoFileName}`

      // Convert base64 to blob for student photo
      const photoBase64Data = messageData.studentPhotoBlob.split(",")[1] || messageData.studentPhotoBlob
      const photoByteCharacters = atob(photoBase64Data)
      const photoByteNumbers = new Array(photoByteCharacters.length)
      for (let i = 0; i < photoByteCharacters.length; i++) {
        photoByteNumbers[i] = photoByteCharacters.charCodeAt(i)
      }
      const photoByteArray = new Uint8Array(photoByteNumbers)
      const photoBlob = new Blob([photoByteArray], { type: "image/png" })

      console.log("🔄 [SERVER] createGuestBookMessage - Uploading student photo to storage:", photoFilePath)

      const { data: photoUploadData, error: photoUploadError } = await supabase.storage
        .from("voceo-guest-book-messages")
        .upload(photoFilePath, photoBlob, {
          contentType: "image/png",
          upsert: false,
        })

      if (photoUploadError) {
        console.error("❌ [SERVER] createGuestBookMessage - Photo upload error:", photoUploadError)
        // Don't throw error, just log it and continue without photo
        console.warn("⚠️ [SERVER] createGuestBookMessage - Continuing without student photo")
      } else {
        console.log("✅ [SERVER] createGuestBookMessage - Student photo uploaded successfully:", photoUploadData.path)
        const { data: photoPublicUrlData } = supabase.storage
          .from("voceo-guest-book-messages")
          .getPublicUrl(photoFilePath)
        studentPhotoUrl = photoPublicUrlData.publicUrl
        console.log("🔄 [SERVER] createGuestBookMessage - Student photo public URL:", studentPhotoUrl)
      }
    }

    // Step 2: Upload message image to storage
    const fileName = `${messageData.studentId}-${Date.now()}.png`
    const filePath = `messages/${fileName}`

    // Convert base64 to blob
    const base64Data = messageData.imageBlob.split(",")[1] || messageData.imageBlob
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: "image/png" })

    console.log("🔄 [SERVER] createGuestBookMessage - Uploading message image to storage:", filePath)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("voceo-guest-book-messages")
      .upload(filePath, blob, {
        contentType: "image/png",
        upsert: false,
      })

    if (uploadError) {
      console.error("❌ [SERVER] createGuestBookMessage - Upload error:", uploadError)
      // Cleanup student photo if message upload fails
      if (studentPhotoUrl) {
        const photoPath = studentPhotoUrl.split("/").slice(-2).join("/")
        await supabase.storage.from("voceo-guest-book-messages").remove([photoPath])
      }
      throw new Error(`Failed to upload image: ${uploadError.message}`)
    }

    console.log("✅ [SERVER] createGuestBookMessage - Message image uploaded successfully:", uploadData.path)

    // Step 3: Get public URL for the uploaded message image
    const { data: publicUrlData } = supabase.storage.from("voceo-guest-book-messages").getPublicUrl(filePath)

    const imageUrl = publicUrlData.publicUrl

    console.log("🔄 [SERVER] createGuestBookMessage - Message image public URL:", imageUrl)

    // Step 3: Fetch student data to include in the message
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("university, programme, classification")
      .eq("id", messageData.studentId)
      .single()

    if (studentError) {
      console.error("❌ [SERVER] createGuestBookMessage - Failed to fetch student data:", studentError)
    } else {
      console.log("✅ [SERVER] createGuestBookMessage - Student data fetched:", studentData)
    }

    // Step 4: Insert message record into database
    const messageRecord = {
      student_id: messageData.studentId,
      student_name: messageData.studentName,
      student_location: messageData.studentLocation,
      message_image_url: imageUrl,
      student_photo_url: studentPhotoUrl, // Use uploaded student photo URL or null
      student_university: studentData?.university || null,
      student_programme: studentData?.programme || null,
      student_classification: studentData?.classification || null,
      approved: true,
    }

    console.log("🔄 [SERVER] createGuestBookMessage - Inserting message record:", messageRecord)

    const { data, error } = await supabase
      .from("voceo_guest_book_messages")
      .insert([messageRecord])
      .select()
      .single()

    if (error) {
      console.error("❌ [SERVER] createGuestBookMessage - Database error:", error)
      
      // Cleanup: Delete uploaded images if database insert fails
      const filesToRemove = [filePath]
      if (studentPhotoUrl) {
        const photoPath = studentPhotoUrl.split("/").slice(-2).join("/")
        filesToRemove.push(photoPath)
      }
      await supabase.storage.from("voceo-guest-book-messages").remove(filesToRemove)
      
      throw new Error(`Failed to create message: ${error.message}`)
    }

    console.log("✅ [SERVER] createGuestBookMessage - Successfully created message:", data.id)
    return data
  } catch (error) {
    console.error("❌ [SERVER] createGuestBookMessage - Error:", error)
    throw error
  }
}

/**
 * Delete a guest book message and its associated image
 */
export async function deleteGuestBookMessage(id: string): Promise<void> {
  console.log("🔄 [SERVER] deleteGuestBookMessage - Deleting message:", id)

  const supabase = createClient()

  try {
    // Step 1: Get the message to find the image URL
    const { data: message, error: fetchError } = await supabase
      .from("voceo_guest_book_messages")
      .select("message_image_url")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("❌ [SERVER] deleteGuestBookMessage - Fetch error:", fetchError)
      throw new Error(`Failed to fetch message: ${fetchError.message}`)
    }

    // Step 2: Extract file path from URL
    const url = new URL(message.message_image_url)
    const pathParts = url.pathname.split("/")
    const filePath = pathParts.slice(pathParts.indexOf("messages")).join("/")

    console.log("🔄 [SERVER] deleteGuestBookMessage - Deleting image:", filePath)

    // Step 3: Delete the image from storage
    const { error: storageError } = await supabase.storage
      .from("voceo-guest-book-messages")
      .remove([filePath])

    if (storageError) {
      console.warn("⚠️ [SERVER] deleteGuestBookMessage - Storage deletion warning:", storageError)
      // Continue even if storage deletion fails
    }

    // Step 4: Delete the database record
    const { error: deleteError } = await supabase
      .from("voceo_guest_book_messages")
      .delete()
      .eq("id", id)

    if (deleteError) {
      console.error("❌ [SERVER] deleteGuestBookMessage - Delete error:", deleteError)
      throw new Error(`Failed to delete message: ${deleteError.message}`)
    }

    console.log("✅ [SERVER] deleteGuestBookMessage - Successfully deleted message:", id)
  } catch (error) {
    console.error("❌ [SERVER] deleteGuestBookMessage - Error:", error)
    throw error
  }
}

/**
 * Delete all guest book messages and their associated images
 */
export async function deleteAllGuestBookMessages(): Promise<void> {
  console.log("🔄 [SERVER] deleteAllGuestBookMessages - Deleting all messages")

  const supabase = createClient()

  try {
    // Get all messages using pagination to bypass Supabase's 1000 row limit
    let allMessages: any[] = []
    let from = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data: batch, error: fetchError } = await supabase
        .from("voceo_guest_book_messages")
        .select("id, message_image_url")
        .range(from, from + pageSize - 1)

      if (fetchError) {
        console.error("❌ [SERVER] deleteAllGuestBookMessages - Fetch error:", fetchError)
        throw new Error(`Failed to fetch messages: ${fetchError.message}`)
      }

      if (batch && batch.length > 0) {
        allMessages = allMessages.concat(batch)
        from += pageSize
        hasMore = batch.length === pageSize
      } else {
        hasMore = false
      }
    }

    if (allMessages.length === 0) {
      console.log("✅ [SERVER] deleteAllGuestBookMessages - No messages to delete")
      return
    }

    // Step 2: Extract all file paths and delete from storage
    const filePaths = allMessages.map(message => {
      const url = new URL(message.message_image_url)
      const pathParts = url.pathname.split("/")
      return pathParts.slice(pathParts.indexOf("messages")).join("/")
    })

    console.log(`🔄 [SERVER] deleteAllGuestBookMessages - Deleting ${filePaths.length} images from storage`)

    const { error: storageError } = await supabase.storage
      .from("voceo-guest-book-messages")
      .remove(filePaths)

    if (storageError) {
      console.warn("⚠️ [SERVER] deleteAllGuestBookMessages - Storage deletion warning:", storageError)
      // Continue even if storage deletion fails
    }

    // Step 3: Delete all database records
    const { error: deleteError } = await supabase
      .from("voceo_guest_book_messages")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all records

    if (deleteError) {
      console.error("❌ [SERVER] deleteAllGuestBookMessages - Delete error:", deleteError)
      throw new Error(`Failed to delete messages: ${deleteError.message}`)
    }

    console.log(`✅ [SERVER] deleteAllGuestBookMessages - Successfully deleted ${allMessages.length} messages`)
  } catch (error) {
    console.error("❌ [SERVER] deleteAllGuestBookMessages - Error:", error)
    throw error
  }
}

/**
 * Update message approval status
 */
export async function updateMessageApproval(id: string, approved: boolean): Promise<GuestBookMessage> {
  console.log("🔄 [SERVER] updateMessageApproval - Updating message:", id, "to approved:", approved)

  const supabase = createClient()

  const { data, error } = await supabase
    .from("voceo_guest_book_messages")
    .update({ approved })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("❌ [SERVER] updateMessageApproval - Error:", error)
    throw new Error(`Failed to update message approval: ${error.message}`)
  }

  console.log("✅ [SERVER] updateMessageApproval - Successfully updated message:", data.id)
  return data
}
