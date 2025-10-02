'use client'

import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { updateBaseExample } from '@/lib/actions/base-example.actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Edit, Save } from 'lucide-react'

interface EditBaseExampleDialogProps {
  example: {
    id: string
    title: string
    description: string | null
    content: string
    fileUrl: string | null
    metadata: any
  }
  children: React.ReactNode
}

export default function EditBaseExampleDialog({
  example,
  children
}: EditBaseExampleDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: example.title,
    description: example.description || '',
    content: example.content,
    fileUrl: example.fileUrl || '',
    metadata: example.metadata ? JSON.stringify(example.metadata, null, 2) : ''
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Parse metadata if it's provided as JSON string
      let metadata = {}
      if (formData.metadata.trim()) {
        try {
          metadata = JSON.parse(formData.metadata)
        } catch (error) {
          toast.error('Invalid metadata JSON format')
          setIsLoading(false)
          return
        }
      }

      const result = await updateBaseExample({
        id: example.id,
        title: formData.title,
        description: formData.description || undefined,
        content: formData.content,
        fileUrl: formData.fileUrl || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      })

      if (result.success) {
        toast.success('Base example updated successfully')
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update base example')
      }
    } catch (error) {
      toast.error('Failed to update base example')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form data when closing
      setFormData({
        title: example.title,
        description: example.description || '',
        content: example.content,
        fileUrl: example.fileUrl || '',
        metadata: example.metadata ? JSON.stringify(example.metadata, null, 2) : ''
      })
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Base Example
          </DialogTitle>
          <DialogDescription>
            Update this reference example to improve AI assessment accuracy.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-medium">
                Example Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Excellent AI Tools Comparison"
                required
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                placeholder="Brief description of what makes this example perfect..."
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-base font-medium">
                Example Content *
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={8}
                placeholder="Paste the perfect example content here..."
                required
                className="text-base font-mono"
              />
              <p className="text-sm text-gray-600">
                Character count: {formData.content.length}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileUrl" className="text-base font-medium">
                File URL (Optional)
              </Label>
              <Input
                id="fileUrl"
                type="url"
                value={formData.fileUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, fileUrl: e.target.value }))}
                placeholder="https://example.com/perfect-submission.pdf"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metadata" className="text-base font-medium">
                Metadata (JSON)
              </Label>
              <Textarea
                id="metadata"
                value={formData.metadata}
                onChange={(e) => setFormData(prev => ({ ...prev, metadata: e.target.value }))}
                rows={4}
                placeholder='{\n  "wordCount": 1200,\n  "grade": "A+",\n  "strengths": ["comprehensive", "well-structured"]\n}'
                className="text-base font-mono"
              />
              <p className="text-sm text-gray-600">
                Optional: Structured data to help the AI understand why this example is perfect.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Example
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}