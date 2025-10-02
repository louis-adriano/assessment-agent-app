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
import { createBaseExample } from '@/lib/actions/base-example.actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus, Lightbulb } from 'lucide-react'

interface CreateBaseExampleDialogProps {
  questionId: string
  questionTitle: string
  children: React.ReactNode
}

export default function CreateBaseExampleDialog({
  questionId,
  questionTitle,
  children
}: CreateBaseExampleDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    fileUrl: '',
    metadata: {}
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Parse metadata if it's provided as JSON string
      let metadata = {}
      if (formData.metadata) {
        try {
          if (typeof formData.metadata === 'string') {
            metadata = JSON.parse(formData.metadata as string)
          } else {
            metadata = formData.metadata
          }
        } catch (error) {
          toast.error('Invalid metadata JSON format')
          setIsLoading(false)
          return
        }
      }

      const result = await createBaseExample({
        questionId,
        title: formData.title,
        description: formData.description || undefined,
        content: formData.content,
        fileUrl: formData.fileUrl || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      })

      if (result.success) {
        toast.success('Base example created successfully')
        setOpen(false)
        setFormData({
          title: '',
          description: '',
          content: '',
          fileUrl: '',
          metadata: {}
        })
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to create base example')
      }
    } catch (error) {
      toast.error('Failed to create base example')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMetadataChange = (value: string) => {
    setFormData(prev => ({ ...prev, metadata: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Base Example
          </DialogTitle>
          <DialogDescription>
            Create a perfectly graded reference example for "{questionTitle}".
            This will help the AI provide more consistent and accurate assessments.
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
              <p className="text-sm text-gray-600">
                A clear, descriptive title for this reference example.
              </p>
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
              <p className="text-sm text-gray-600">
                Optional: Explain why this example represents perfect work.
              </p>
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
                The actual content that demonstrates perfect completion of the assessment.
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
              <p className="text-sm text-gray-600">
                Optional: Link to a file (PDF, image, etc.) that supplements this example.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metadata" className="text-base font-medium">
                Metadata (JSON)
              </Label>
              <Textarea
                id="metadata"
                value={typeof formData.metadata === 'string' ? formData.metadata : JSON.stringify(formData.metadata, null, 2)}
                onChange={(e) => handleMetadataChange(e.target.value)}
                rows={4}
                placeholder='{\n  "wordCount": 1200,\n  "grade": "A+",\n  "strengths": ["comprehensive", "well-structured"],\n  "features": ["detailed comparison", "practical examples"]\n}'
                className="text-base font-mono"
              />
              <p className="text-sm text-gray-600">
                Optional: Add structured metadata to help the AI understand why this example is perfect.
              </p>
            </div>
          </div>

          {/* Best Practices Tip */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Tips for Great Base Examples</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Include examples that meet all assessment criteria perfectly</li>
                  <li>• Add metadata explaining what makes the example excellent</li>
                  <li>• Create diverse examples showing different approaches to success</li>
                  <li>• Use clear, descriptive titles and descriptions</li>
                </ul>
              </div>
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
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Example
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}