"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getStudents, addStudent, deleteStudent, deleteManyStudents, markStudentAsShared } from "@/lib/actions/students"
import { useToast } from "@/components/ui/use-toast"

export const STUDENTS_QUERY_KEY = ["students"]

export function useStudents() {
  const { toast } = useToast()

  return useQuery({
    queryKey: STUDENTS_QUERY_KEY,
    queryFn: async () => {
      console.log("🔄 [OPTIMIZATION] React Query - Fetching students data")
      try {
        const students = await getStudents()
        console.log(`✅ [OPTIMIZATION] React Query - Successfully fetched ${students.length} students`)

        // Sort students alphabetically by full name
        return students.sort((a, b) => {
          const nameA = `${a.first_name} ${a.last_name}`.toLowerCase()
          const nameB = `${b.first_name} ${b.last_name}`.toLowerCase()
          return nameA.localeCompare(nameB)
        })
      } catch (error) {
        console.error("❌ [OPTIMIZATION] React Query - Error in queryFn:", error)

        // Check if it's a rate limit error
        if (error instanceof Error && error.message.includes("Too Many")) {
          toast({
            title: "Rate limit exceeded",
            description: "Please wait a moment before trying again.",
            variant: "destructive",
          })
          return []
        }

        // Show error toast for other errors
        toast({
          title: "Error loading students",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        })

        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors
      if (error instanceof Error && error.message.includes("Too Many")) {
        return false
      }
      return failureCount < 3
    },
  })
}

export function useAddStudent() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: addStudent,
    onMutate: () => {
      console.log("🔄 [OPTIMIZATION] Optimistic Update - Starting add student mutation")
    },
    onSuccess: (student) => {
      console.log("✅ [OPTIMIZATION] Optimistic Update - Student added successfully")
      // Invalidate and refetch students
      queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY })
      toast({
        title: "Student Added",
        description: "Student has been added to the list.",
      })
    },
    onError: (error) => {
      console.error("❌ [OPTIMIZATION] Optimistic Update - Error in addStudent mutation:", error)
      toast({
        title: "Error Adding Student",
        description: error instanceof Error ? error.message : "Failed to add student",
        variant: "destructive",
      })
    },
  })
}

export function useDeleteStudent() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteStudent,
    onSuccess: (result, studentId) => {
      console.log(`✅ [OPTIMIZATION] Single Delete - Student ${studentId} deleted successfully`)
      // Use pessimistic update - invalidate cache after successful deletion
      queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY })
      toast({
        title: "Student Deleted",
        description: "The student has been removed from the list.",
      })
    },
    onError: (error, studentId) => {
      console.error(`❌ [OPTIMIZATION] Single Delete - Error deleting student ${studentId}:`, error)
      toast({
        title: "Error Deleting Student",
        description: error instanceof Error ? error.message : "Failed to delete student",
        variant: "destructive",
      })
    },
  })
}

export function useBulkDeleteStudents() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteManyStudents,
    retry: 2,
    retryDelay: (attempt) => 1000 * 2 ** attempt,
    onMutate: (studentIds) => {
      console.log(`🔄 [OPTIMIZATION] Bulk Delete - Starting bulk delete for ${studentIds.length} students`)
    },
    onSuccess: (result, studentIds) => {
      console.log(`✅ [OPTIMIZATION] Bulk Delete - Successfully deleted ${result.deletedCount} students`)
      // Use pessimistic update - invalidate cache after successful bulk deletion
      queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY })
      toast({
        title: "Students Deleted",
        description: `${result.deletedCount} student${result.deletedCount !== 1 ? "s" : ""} have been deleted successfully.`,
      })
    },
    onError: (error, studentIds) => {
      console.error(`❌ [OPTIMIZATION] Bulk Delete - Error deleting ${studentIds.length} students:`, error)
      toast({
        title: "Bulk Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete selected students",
        variant: "destructive",
      })
    },
  })
}

export function useMarkStudentAsShared() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: markStudentAsShared,
    onSuccess: (student) => {
      console.log(`✅ [OPTIMIZATION] Mark as Shared - Student marked as shared successfully`)
      // Use pessimistic update - invalidate cache after successful update
      queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY })
    },
    onError: (error, studentId) => {
      console.error(`❌ [OPTIMIZATION] Mark as Shared - Error marking student as shared:`, error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update student status",
        variant: "destructive",
      })
    },
  })
}

// Hook for manual refresh (fallback)
export function useRefreshStudents() {
  const queryClient = useQueryClient()

  return () => {
    console.log("🔄 [OPTIMIZATION] Manual Refresh - Invalidating students cache")
    queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY })
  }
}
