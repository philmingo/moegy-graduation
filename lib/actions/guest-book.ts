"use server"

import { createClient } from "@/lib/supabase"

export interface GuestBookMessage {
  id: string
  student_id: string
  student_name: string
  student_location: string
  message_image_url: string
  approved: boolean
  created_at: string
  updated_at: string
}

export interface CreateMessageData {
  studentId: string
  studentName: string
  studentLocation: string
  imageBlob: string // Base64 encoded image
}

/**
 * Get all approved guest book messages ordered by creation date (newest first)
 */
export async function getGuestBookMessages(): Promise<GuestBookMessage[]> {
  console.log("🔄 [SERVER] getGuestBookMessages - Fetching all approved messages")

  const supabase = createClient()

  const { data, error } = await supabase
    .from("voceo_guest_book_messages")
    .select("*")
    .eq("approved", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("❌ [SERVER] getGuestBookMessages - Error:", error)
    throw new Error(`Failed to fetch guest book messages: ${error.message}`)
  }

  console.log(`✅ [SERVER] getGuestBookMessages - Successfully fetched ${data?.length || 0} messages`)
  return data || []
}

/**
 * Create a new guest book message with image upload to storage
 */
export async function createGuestBookMessage(messageData: CreateMessageData): Promise<GuestBookMessage> {
  console.log("🔄 [SERVER] createGuestBookMessage - Creating new message for student:", messageData.studentName)

  const supabase = createClient()

  try {
    // Step 1: Upload image to storage
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

    console.log("🔄 [SERVER] createGuestBookMessage - Uploading image to storage:", filePath)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("voceo-guest-book-messages")
      .upload(filePath, blob, {
        contentType: "image/png",
        upsert: false,
      })

    if (uploadError) {
      console.error("❌ [SERVER] createGuestBookMessage - Upload error:", uploadError)
      throw new Error(`Failed to upload image: ${uploadError.message}`)
    }

    console.log("✅ [SERVER] createGuestBookMessage - Image uploaded successfully:", uploadData.path)

    // Step 2: Get public URL for the uploaded image
    const { data: publicUrlData } = supabase.storage.from("voceo-guest-book-messages").getPublicUrl(filePath)

    const imageUrl = publicUrlData.publicUrl

    console.log("🔄 [SERVER] createGuestBookMessage - Public URL:", imageUrl)

    // Step 3: Insert message record into database
    const messageRecord = {
      student_id: messageData.studentId,
      student_name: messageData.studentName,
      student_location: messageData.studentLocation,
      message_image_url: imageUrl,
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
      
      // Cleanup: Delete uploaded image if database insert fails
      await supabase.storage.from("voceo-guest-book-messages").remove([filePath])
      
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
