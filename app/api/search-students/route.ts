import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const searchQuery = request.nextUrl.searchParams.get("q")

    if (!searchQuery || searchQuery.length < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Search query must be at least 1 character",
          students: [],
        },
        { status: 400 },
      )
    }

    // Sanitize the search query to prevent SQL injection and invalid characters
    const sanitizedQuery = searchQuery
      .trim()
      .replace(/[%_\\]/g, "\\$&") // Escape SQL wildcards
      .replace(/[^\w\s'-]/g, "") // Remove invalid characters except letters, numbers, spaces, hyphens, and apostrophes

    if (!sanitizedQuery) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid search characters. Please use only letters, numbers, spaces, hyphens, and apostrophes.",
          students: [],
        },
        { status: 400 },
      )
    }

    console.log(`🔍 [API] search-students - Searching for: "${sanitizedQuery}" (original: "${searchQuery}")`)

    const allMatches: any[] = []

    try {
      // First get students where first name starts with the query (highest priority)
      const { data: firstNameMatches, error: firstNameError } = await supabase
        .from("students")
        .select("id, first_name, last_name, phonetic_spelling")
        .ilike("first_name", `${sanitizedQuery}%`)
        .order("first_name", { ascending: true })
        .limit(10)

      if (firstNameError) {
        console.error("❌ [API] search-students - First name search error:", firstNameError)
      } else {
        allMatches.push(...(firstNameMatches || []))
      }

      // Then get students where last name starts with the query (medium priority)
      const { data: lastNameMatches, error: lastNameError } = await supabase
        .from("students")
        .select("id, first_name, last_name, phonetic_spelling")
        .ilike("last_name", `${sanitizedQuery}%`)
        .order("last_name", { ascending: true })
        .limit(10)

      if (lastNameError) {
        console.error("❌ [API] search-students - Last name search error:", lastNameError)
      } else {
        allMatches.push(...(lastNameMatches || []))
      }

      // For longer queries, also search for contains matches
      if (sanitizedQuery.length >= 2) {
        const { data: containsMatches, error: containsError } = await supabase
          .from("students")
          .select("id, first_name, last_name, phonetic_spelling")
          .or(
            `first_name.ilike.%${sanitizedQuery}%,last_name.ilike.%${sanitizedQuery}%,phonetic_spelling.ilike.%${sanitizedQuery}%`,
          )
          .order("first_name", { ascending: true })
          .limit(15)

        if (containsError) {
          console.error("❌ [API] search-students - Contains search error:", containsError)
        } else {
          allMatches.push(...(containsMatches || []))
        }
      }

      // Also search phonetic spelling specifically
      const { data: phoneticMatches, error: phoneticError } = await supabase
        .from("students")
        .select("id, first_name, last_name, phonetic_spelling")
        .ilike("phonetic_spelling", `${sanitizedQuery}%`)
        .order("phonetic_spelling", { ascending: true })
        .limit(5)

      if (phoneticError) {
        console.error("❌ [API] search-students - Phonetic search error:", phoneticError)
      } else {
        allMatches.push(...(phoneticMatches || []))
      }
    } catch (dbError) {
      console.error("❌ [API] search-students - Database query error:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: "Database search failed. Please try again.",
          students: [],
        },
        { status: 500 },
      )
    }

    // Remove duplicates by ID while maintaining priority order
    const uniqueMatches = allMatches.filter(
      (student, index, array) => array.findIndex((s) => s.id === student.id) === index,
    )

    // Filter for relevance based on query length and position
    const relevantMatches = uniqueMatches.filter((student) => {
      const query = sanitizedQuery.toLowerCase()
      const firstName = student.first_name.toLowerCase()
      const lastName = student.last_name.toLowerCase()
      const phonetic = (student.phonetic_spelling || "").toLowerCase()

      // Always include if first name or last name starts with query
      if (firstName.startsWith(query) || lastName.startsWith(query)) {
        return true
      }

      // Include if phonetic spelling starts with or contains query
      if (phonetic.startsWith(query) || phonetic.includes(query)) {
        return true
      }

      // For longer queries (2+ chars), include partial matches
      if (query.length >= 2 && (firstName.includes(query) || lastName.includes(query))) {
        return true
      }

      return false
    })

    // Limit final results to 10
    const finalResults = relevantMatches.slice(0, 10)

    // Transform the data to match the expected format
    const formattedStudents = finalResults.map((student) => ({
      id: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      phoneticSpelling: student.phonetic_spelling,
    }))

    console.log(`✅ [API] search-students - Found ${formattedStudents.length} relevant results`)

    return NextResponse.json({
      success: true,
      count: formattedStudents.length,
      students: formattedStudents,
    })
  } catch (error) {
    console.error("❌ [API] search-students - Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred during search",
        students: [],
      },
      { status: 500 },
    )
  }
}
