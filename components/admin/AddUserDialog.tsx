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
import { Input } from '@/components/ui/input'
import { createUser } from '@/lib/actions/user-actions'
import { toast } from 'sonner'
import { Loader2, Shield, UserCheck, GraduationCap } from 'lucide-react'

interface AddUserDialogProps {
  children: React.ReactNode
}

export default function AddUserDialog({ children }: AddUserDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT' as 'SUPER_ADMIN' | 'COURSE_ADMIN' | 'STUDENT'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      toast.error('Email and password are required')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createUser(formData)

      if (result.success) {
        toast.success('User created successfully')
        setFormData({ name: '', email: '', password: '', role: 'STUDENT' })
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to create user')
      }
    } catch (error) {
      toast.error('Failed to create user')
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
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account with email and password
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
              <p className="text-xs text-gray-600">Minimum 8 characters</p>
            </div>

            <div className="space-y-3">
              <Label>Select Role *</Label>

              <div
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.role === 'SUPER_ADMIN'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, role: 'SUPER_ADMIN' }))}
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">Super Administrator</h4>
                    <p className="text-xs text-gray-600">Full system access</p>
                  </div>
                  {formData.role === 'SUPER_ADMIN' && (
                    <div className="h-2 w-2 rounded-full bg-red-600"></div>
                  )}
                </div>
              </div>

              <div
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.role === 'COURSE_ADMIN'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, role: 'COURSE_ADMIN' }))}
              >
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">Course Administrator</h4>
                    <p className="text-xs text-gray-600">Create and manage courses</p>
                  </div>
                  {formData.role === 'COURSE_ADMIN' && (
                    <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                  )}
                </div>
              </div>

              <div
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.role === 'STUDENT'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, role: 'STUDENT' }))}
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">Student</h4>
                    <p className="text-xs text-gray-600">Enroll and submit assessments</p>
                  </div>
                  {formData.role === 'STUDENT' && (
                    <div className="h-2 w-2 rounded-full bg-green-600"></div>
                  )}
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
