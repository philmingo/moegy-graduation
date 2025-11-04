"use server"

import { createClient } from "@/lib/supabase"

export interface Student {
  id: string
  first_name: string
  last_name: string
  phonetic_spelling?: string | null
  email?: string | null
  university?: string | null
  programme?: string | null
  classification?: string | null
  seat_no?: string | null
  status: "Pending" | "Shared"
  shared: boolean
  created_at: string
  updated_at: string
}

export async function getStudents(): Promise<Student[]> {
  console.log("🔄 [SERVER] getStudents - Fetching all students")

  const supabase = createClient()

  const { data, error } = await supabase.from("students").select("*").order("first_name", { ascending: true })

  if (error) {
    console.error("❌ [SERVER] getStudents - Error:", error)
    throw new Error(`Failed to fetch students: ${error.message}`)
  }

  console.log(`✅ [SERVER] getStudents - Successfully fetched ${data?.length || 0} students`)
  return data || []
}

export async function addStudent(formData: FormData) {
  console.log("🔄 [SERVER] addStudent - Adding new student")

  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const phoneticSpelling = formData.get("phoneticSpelling") as string

  if (!firstName?.trim() || !lastName?.trim()) {
    console.error("❌ [SERVER] addStudent - Missing required fields")
    throw new Error("First name and last name are required")
  }

  const supabase = createClient()

  const studentData = {
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    phonetic_spelling: phoneticSpelling?.trim() || null,
    status: "Pending" as const,
    shared: false,
  }

  console.log("🔄 [SERVER] addStudent - Inserting student:", studentData)

  const { data, error } = await supabase.from("students").insert([studentData]).select().single()

  if (error) {
    console.error("❌ [SERVER] addStudent - Error:", error)
    throw new Error(`Failed to add student: ${error.message}`)
  }

  console.log("✅ [SERVER] addStudent - Successfully added student:", data.id)
  return data
}

export async function updateStudent(studentData: Partial<Student>) {
  console.log("🔄 [SERVER] updateStudent - Updating student:", studentData.id)

  if (!studentData.id) {
    throw new Error("Student ID is required for update")
  }

  const supabase = createClient()

  // Remove id from the update data
  const { id, created_at, updated_at, ...updateData } = studentData

  console.log("🔄 [SERVER] updateStudent - Update data:", updateData)

  const { data, error } = await supabase.from("students").update(updateData).eq("id", id).select().single()

  if (error) {
    console.error("❌ [SERVER] updateStudent - Error:", error)
    throw new Error(`Failed to update student: ${error.message}`)
  }

  console.log("✅ [SERVER] updateStudent - Successfully updated student:", data.id)
  return data
}

export async function deleteStudent(id: string) {
  console.log("🔄 [SERVER] deleteStudent - Deleting student:", id)

  const supabase = createClient()

  const { error } = await supabase.from("students").delete().eq("id", id)

  if (error) {
    console.error("❌ [SERVER] deleteStudent - Error:", error)
    throw new Error(`Failed to delete student: ${error.message}`)
  }

  console.log("✅ [SERVER] deleteStudent - Successfully deleted student:", id)
}

export async function deleteManyStudents(ids: string[]) {
  console.log("🔄 [SERVER] deleteManyStudents - Deleting students:", ids.length)

  if (!ids || ids.length === 0) {
    throw new Error("No student IDs provided for deletion")
  }

  const supabase = createClient()

  const { error } = await supabase.from("students").delete().in("id", ids)

  if (error) {
    console.error("❌ [SERVER] deleteManyStudents - Error:", error)
    throw new Error(`Failed to delete students: ${error.message}`)
  }

  console.log("✅ [SERVER] deleteManyStudents - Successfully deleted students:", ids.length)
  return { deletedCount: ids.length }
}

export async function markStudentAsShared(id: string) {
  console.log("🔄 [SERVER] markStudentAsShared - Marking student as shared:", id)

  const supabase = createClient()

  const { data, error } = await supabase
    .from("students")
    .update({
      shared: true,
      status: "Shared" as const,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("❌ [SERVER] markStudentAsShared - Error:", error)
    throw new Error(`Failed to mark student as shared: ${error.message}`)
  }

  console.log("✅ [SERVER] markStudentAsShared - Successfully marked student as shared:", data.id)
  return data
}

export async function importStudents(
  students: Array<{
    seatNo?: string
    firstName: string
    lastName: string
    university?: string
    programme?: string
    classification?: string
    phoneticSpelling?: string
    email?: string
  }>,
) {
  console.log("🔄 [SERVER] importStudents - Importing", students.length, "students")

  if (!students || students.length === 0) {
    throw new Error("No students provided for import")
  }

  const supabase = createClient()

  // Format students for database insertion
  const formattedStudents = students.map((student) => ({
    first_name: student.firstName,
    last_name: student.lastName,
    seat_no: student.seatNo || null,
    university: student.university || null,
    programme: student.programme || null,
    classification: student.classification || null,
    phonetic_spelling: student.phoneticSpelling || null,
    email: student.email || null,
    status: "Pending" as const,
    shared: false,
  }))

  console.log("🔄 [SERVER] importStudents - Formatted students for import:", formattedStudents[0])

  const { data, error } = await supabase.from("students").insert(formattedStudents).select()

  if (error) {
    console.error("❌ [SERVER] importStudents - Error:", error)
    return {
      success: false,
      error: `Failed to import students: ${error.message}`,
      count: 0,
    }
  }

  console.log("✅ [SERVER] importStudents - Successfully imported", data.length, "students")
  return {
    success: true,
    count: data.length,
    students: data,
  }
}
