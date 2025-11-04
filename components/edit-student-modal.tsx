"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { useState, useEffect } from "react"
import type { Student } from "@/lib/actions/students"
import config from "@/lib/theme-config"
import { useToast } from "@/components/ui/use-toast"

interface EditStudentModalProps {
  student: Student | null
  isOpen: boolean
  onClose: () => void
  onSave: (studentData: Partial<Student>) => Promise<void>
}

export function EditStudentModal({ student, isOpen, onClose, onSave }: EditStudentModalProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phoneticSpelling, setPhoneticSpelling] = useState("")
  const [email, setEmail] = useState("")
  const [university, setUniversity] = useState("")
  const [programme, setProgramme] = useState("")
  const [classification, setClassification] = useState("")
  const [seatNo, setSeatNo] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Populate form when student changes
  useEffect(() => {
    if (student) {
      setFirstName(student.first_name || "")
      setLastName(student.last_name || "")
      setPhoneticSpelling(student.phonetic_spelling || "")
      setEmail(student.email || "")
      setUniversity(student.university || "")
      setProgramme(student.programme || "")
      setClassification(student.classification || "")
      setSeatNo(student.seat_no || "")
    }
  }, [student])

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const updatedData = {
        id: student?.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phonetic_spelling: phoneticSpelling.trim() || null,
        email: email.trim() || null,
        university: university.trim() || null,
        programme: programme.trim() || null,
        classification: classification.trim() || null,
        seat_no: seatNo.trim() || null,
      }

      await onSave(updatedData)
      onClose()
    } catch (error) {
      console.error("Error saving student:", error)
      toast({
        title: "Save Failed",
        description: "Failed to update student information.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!student) return null

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
            Edit Graduate
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3
              className={`${config.ui.typography.sizes.lg} ${config.ui.typography.weights.semibold} ${config.theme.text.primary} mb-4`}
            >
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-first-name" className={`${config.theme.text.primary}`}>
                  First Name *
                </Label>
                <Input
                  id="edit-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:border-purple-400/50 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last-name" className={`${config.theme.text.primary}`}>
                  Last Name *
                </Label>
                <Input
                  id="edit-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:border-purple-400/50 rounded-xl"
                  required
                />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="edit-phonetic" className={`${config.theme.text.primary}`}>
                Phonetic Spelling
              </Label>
              <Input
                id="edit-phonetic"
                value={phoneticSpelling}
                onChange={(e) => setPhoneticSpelling(e.target.value)}
                className="bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:border-purple-400/50 rounded-xl"
                placeholder="How to pronounce the name"
              />
            </div>
          </div>

          {/* Academic Information */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3
              className={`${config.ui.typography.sizes.lg} ${config.ui.typography.weights.semibold} ${config.theme.text.primary} mb-4`}
            >
              Academic Information
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-university" className={`${config.theme.text.primary}`}>
                  University
                </Label>
                <Input
                  id="edit-university"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:border-purple-400/50 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-programme" className={`${config.theme.text.primary}`}>
                    Programme
                  </Label>
                  <Input
                    id="edit-programme"
                    value={programme}
                    onChange={(e) => setProgramme(e.target.value)}
                    className="bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:border-purple-400/50 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-classification" className={`${config.theme.text.primary}`}>
                    Grade
                  </Label>
                  <Input
                    id="edit-classification"
                    value={classification}
                    onChange={(e) => setClassification(e.target.value)}
                    className="bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:border-purple-400/50 rounded-xl"
                    placeholder="e.g., Distinction, Merit, Pass"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3
              className={`${config.ui.typography.sizes.lg} ${config.ui.typography.weights.semibold} ${config.theme.text.primary} mb-4`}
            >
              Additional Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email" className={`${config.theme.text.primary}`}>
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:border-purple-400/50 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-seat-no" className={`${config.theme.text.primary}`}>
                  Seat Number
                </Label>
                <Input
                  id="edit-seat-no"
                  value={seatNo}
                  onChange={(e) => setSeatNo(e.target.value)}
                  className="bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:border-purple-400/50 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-white/10 hover:bg-white/20 text-white hover:text-white border-white/20 backdrop-blur-sm rounded-xl"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-purple-600/90 to-indigo-600/90 hover:from-purple-500/90 hover:to-indigo-500/90 text-white rounded-xl shadow-sm backdrop-blur-sm"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
