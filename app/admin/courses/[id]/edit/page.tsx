// app/admin/courses/[id]/edit/page.tsx
import { redirect } from 'next/navigation'
import { getCourse, updateCourse } from '@/lib/actions/course-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface EditCoursePageProps {
  params: {
    id: string
  }
}

async function handleUpdateCourse(formData: FormData) {
  'use server'
  
  const courseId = formData.get('id') as string
  const result = await updateCourse(formData)
  
  if (result.success) {
    redirect(`/admin/courses/${courseId}`)
  } else {
    throw new Error(result.error || 'Failed to update course')
  }
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const courseResult = await getCourse(params.id)

  if (!courseResult.success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/courses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Course Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {courseResult.error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const course = courseResult.data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/courses/${course.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {course.name}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Course</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
          <CardDescription>
            Update the course information and settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleUpdateCourse} className="space-y-4">
            <input type="hidden" name="id" value={course.id} />
            
            <div className="space-y-2">
              <Label htmlFor="name">Course Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={course.name}
                placeholder="e.g., Business Analyst, Web Development"
                required
              />
              <p className="text-sm text-muted-foreground">
                Students use this exact name to access the course
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={course.description || ''}
                placeholder="Describe what this course covers..."
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isActive" 
                name="isActive" 
                defaultChecked={course.isActive}
                value="true"
              />
              <Label htmlFor="isActive">Course is active and accepting submissions</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit">Update Course</Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/admin/courses/${course.id}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}