"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, GraduationCap, Building, Award, X, QrCode, Edit, Trash2 } from "lucide-react"
import type { Student } from "@/lib/actions/students"
import config from "@/lib/theme-config"

interface StudentDetailModalProps {
  student: Student | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (student: Student) => void
  onDelete?: (student: Student) => void
  onGenerateQR?: (student: Student) => void
}

export function StudentDetailModal({
  student,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onGenerateQR,
}: StudentDetailModalProps) {
  if (!student) return null

  const initials = `${student.first_name?.[0] || ""}${student.last_name?.[0] || ""}`.toUpperCase()
  const avatarGradient = config.avatarGradients[0] // Use first gradient for consistency

  // Helper function to get classification badge styling
  const getClassificationBadge = (classification: string) => {
    const lowerClass = classification.toLowerCase()
    if (lowerClass.includes("distinction")) {
      return {
        className: "bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 backdrop-blur-sm",
        icon: "🏆",
        label: "Distinction",
      }
    } else if (lowerClass.includes("merit")) {
      return {
        className: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 backdrop-blur-sm",
        icon: "🥈",
        label: "Merit",
      }
    } else if (lowerClass.includes("pass")) {
      return {
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 backdrop-blur-sm",
        icon: "✅",
        label: "Pass",
      }
    } else {
      return {
        className: "bg-white/10 backdrop-blur-sm text-white border border-white/20",
        icon: "📋",
        label: classification,
      }
    }
  }

  // Check what information is available
  const hasContactInfo = student.email
  const hasAcademicInfo = student.programme || student.university || student.classification
  const hasAdditionalInfo = student.phonetic_spelling || student.seat_no

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-indigo-900/70 via-purple-900/70 to-purple-800/70 backdrop-blur-xl border border-white/10 shadow-xl rounded-3xl">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute -top-2 -right-2 bg-white/10 hover:bg-red-500/80 rounded-full h-8 w-8 transition-colors border border-white/20 backdrop-blur-sm"
          >
            <X className="h-4 w-4 text-white" />
          </Button>
          <DialogTitle
            className={`${config.ui.typography.sizes.xl} ${config.ui.typography.weights.bold} ${config.theme.text.gradient.primary} text-center mb-6`}
          >
            Graduate Details
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detailed information for student {student.first_name} {student.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Header */}
          <div className="flex items-center space-x-6">
            <div
              className={`w-20 h-20 ${config.ui.borderRadius.large} flex items-center justify-center text-white ${config.ui.typography.weights.bold} ${config.ui.typography.sizes.xl} ${config.ui.shadows.large} ${avatarGradient}`}
            >
              {initials}
            </div>
            <div className="flex-1">
              <h2
                className={`${config.ui.typography.sizes["2xl"]} ${config.ui.typography.weights.bold} ${config.theme.text.primary} mb-2`}
              >
                {student.first_name} {student.last_name}
              </h2>

              {/* Phonetic Spelling */}
              {student.phonetic_spelling && (
                <p className={`${config.ui.typography.sizes.md} ${config.theme.text.secondary} italic mb-2`}>
                  Pronunciation: "{student.phonetic_spelling}"
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                {/* Classification Badge */}
                {student.classification && (
                  <Badge className={getClassificationBadge(student.classification).className}>
                    <span className="mr-1">{getClassificationBadge(student.classification).icon}</span>
                    {getClassificationBadge(student.classification).label}
                  </Badge>
                )}

                {/* Seat Number */}
                {student.seat_no && (
                  <Badge className="bg-white/10 backdrop-blur-sm text-white border border-white/20">
                    Seat: {student.seat_no}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Information Sections */}
          <div className="grid grid-cols-1 gap-6">
            {/* Academic Information - Always show if programme exists */}
            {hasAcademicInfo && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Academic Information
                </h3>
                <div className="space-y-3">
                  {student.programme && (
                    <div className="flex items-start space-x-3">
                      <GraduationCap className="h-4 w-4 text-white/70 mt-0.5" />
                      <div>
                        <span className="text-white/90 font-medium">Programme: </span>
                        <span className="text-white/80">{student.programme}</span>
                      </div>
                    </div>
                  )}
                  {student.university && (
                    <div className="flex items-start space-x-3">
                      <Building className="h-4 w-4 text-white/70 mt-0.5" />
                      <div>
                        <span className="text-white/90 font-medium">University: </span>
                        <span className="text-white/80">{student.university}</span>
                      </div>
                    </div>
                  )}
                  {student.classification && (
                    <div className="flex items-start space-x-3">
                      <Award className="h-4 w-4 text-white/70 mt-0.5" />
                      <div>
                        <span className="text-white/90 font-medium">Grade: </span>
                        <span className="text-white/80 capitalize font-semibold">{student.classification}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Information - Only show if email exists */}
            {hasContactInfo && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-white/70" />
                    <span className="text-white/80 break-all">{student.email}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {onGenerateQR && (
              <Button
                onClick={() => onGenerateQR(student)}
                className="flex-1 bg-gradient-to-r from-purple-600/90 to-indigo-600/90 hover:from-purple-500/90 hover:to-indigo-500/90 text-white rounded-xl shadow-sm backdrop-blur-sm"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR Code
              </Button>
            )}
            {onEdit && (
              <Button
                onClick={() => {
                  onEdit?.(student)
                  onClose()
                }}
                variant="outline"
                className="flex-1 bg-white/10 hover:bg-white/20 text-white hover:text-white border-white/20 backdrop-blur-sm rounded-xl"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Student
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={() => onDelete(student)}
                className="bg-gradient-to-r from-red-600/90 to-orange-600/90 hover:from-red-500/90 hover:to-orange-500/90 text-white rounded-xl backdrop-blur-sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
