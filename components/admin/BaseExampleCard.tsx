'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  User,
  Copy,
  Edit,
  Trash2,
  FileText,
  ExternalLink,
  MoreHorizontal,
  AlertTriangle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { duplicateBaseExample, deleteBaseExample } from '@/lib/actions/base-example.actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import EditBaseExampleDialog from './EditBaseExampleDialog'

interface BaseExampleCardProps {
  example: {
    id: string
    title: string
    description: string | null
    content: string
    fileUrl: string | null
    metadata: any
    createdAt: string
    creator: {
      name: string | null
      email: string
    }
  }
  questionId: string
  courseId: string
}

export default function BaseExampleCard({ example, questionId, courseId }: BaseExampleCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      const result = await duplicateBaseExample(example.id)
      if (result.success) {
        toast.success('Example duplicated successfully')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to duplicate example')
      }
    } catch (error) {
      toast.error('Failed to duplicate example')
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteBaseExample(example.id)
      if (result.success) {
        toast.success('Example deleted successfully')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to delete example')
      }
    } catch (error) {
      toast.error('Failed to delete example')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const formatMetadata = (metadata: any) => {
    if (!metadata || typeof metadata !== 'object') return null

    const entries = Object.entries(metadata).filter(([key, value]) =>
      value !== null && value !== undefined && value !== ''
    )

    return entries.length > 0 ? entries : null
  }

  const metadataEntries = formatMetadata(example.metadata)

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2">{example.title}</CardTitle>
              {example.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {example.description}
                </CardDescription>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <EditBaseExampleDialog example={example}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                </EditBaseExampleDialog>
                <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
                  <Copy className="mr-2 h-4 w-4" />
                  {isDuplicating ? 'Duplicating...' : 'Duplicate'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Content Preview */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Content
              </h4>
              <div className="bg-gray-50 rounded-lg p-3 border">
                <p className="text-sm text-gray-700 line-clamp-3 whitespace-pre-wrap">
                  {example.content}
                </p>
                {example.content.length > 150 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {example.content.length} characters
                  </p>
                )}
              </div>
            </div>

            {/* File URL if available */}
            {example.fileUrl && (
              <div>
                <h4 className="text-sm font-medium mb-2">Attached File</h4>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  asChild
                >
                  <a
                    href={example.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    View File
                  </a>
                </Button>
              </div>
            )}

            {/* Metadata */}
            {metadataEntries && (
              <div>
                <h4 className="text-sm font-medium mb-2">Metadata</h4>
                <div className="space-y-1">
                  {metadataEntries.map(([key, value], index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="text-gray-900 font-medium">
                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Creator and Date Info */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{example.creator.name || example.creator.email}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(example.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Base Example
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{example.title}"? This action cannot be undone.
              <br />
              <br />
              <strong>Important:</strong> Removing this example may affect the quality and consistency of AI assessments for future submissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Example'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}