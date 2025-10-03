'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { updateUserRole } from '@/lib/actions/user-actions'
import { toast } from 'sonner'
import { Loader2, Shield, UserCheck, GraduationCap } from 'lucide-react'

interface EditUserDialogProps {
  user: {
    id: string
    name: string | null
    email: string
    role: string
  }
  children: React.ReactNode
}

export default function EditUserDialog({ user, children }: EditUserDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState(user.role)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (selectedRole === user.role) {
      toast.info('No changes made')
      setOpen(false)
      return
    }

    setIsSubmitting(true)

    try {
      const result = await updateUserRole({
        userId: user.id,
        role: selectedRole as any
      })

      if (result.success) {
        toast.success('User role updated successfully')
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update user role')
      }
    } catch (error) {
      toast.error('Failed to update user role')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User Role</DialogTitle>
          <DialogDescription>
            Change the role and permissions for {user.name || user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>User Information</Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-sm">{user.name || 'No Name'}</p>
              <p className="text-xs text-gray-600">{user.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Select Role</Label>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedRole === 'SUPER_ADMIN'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedRole('SUPER_ADMIN')}
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    Super Administrator
                    {selectedRole === 'SUPER_ADMIN' && (
                      <div className="h-2 w-2 rounded-full bg-red-600"></div>
                    )}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Full system access - manage all users, courses, and settings
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedRole === 'COURSE_ADMIN'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedRole('COURSE_ADMIN')}
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    Course Administrator
                    {selectedRole === 'COURSE_ADMIN' && (
                      <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                    )}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Create and manage courses and assessments
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedRole === 'STUDENT'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedRole('STUDENT')}
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                  <GraduationCap className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    Student
                    {selectedRole === 'STUDENT' && (
                      <div className="h-2 w-2 rounded-full bg-green-600"></div>
                    )}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Enroll in courses and submit assessments
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedRole === user.role}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Role'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
