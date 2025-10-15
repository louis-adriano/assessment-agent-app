// app/admin/courses/[id]/edit/page.tsx
import { redirect } from 'next/navigation'
import { getCourse, updateCourse } from '@/lib/actions/course-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Plus, FileText, Edit } from 'lucide-react'

interface EditCoursePageProps {
  params: Promise<{
    id: string
  }>
}

async function handleUpdateCourse(formData: FormData) {
  'use server'
  
  const result = await updateCourse(formData)
  
  if (result.success) {
    redirect('/admin/courses')
  } else {
    throw new Error(result.error || 'Failed to update course')
  }
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const { id } = await params
  const courseResult = await getCourse(id)

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
          <Link href="/admin/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Manage Course</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Course Edit Form */}
        <div className="lg:col-span-2">
          <Card>
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
                  <Button type="submit">Save Changes</Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/admin/courses">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Course Info Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Course Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-1 text-sm text-gray-600">Status</h4>
                <Badge variant={course.isActive ? "default" : "secondary"}>
                  {course.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div>
                <h4 className="font-medium mb-1 text-sm text-gray-600">Statistics</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assessments:</span>
                    <span className="font-medium">{course._count.questions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Students:</span>
                    <span className="font-medium">{course._count.enrollments}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/courses/${encodeURIComponent(course.name)}`}>
                    View as Student
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assessments Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assessments ({course.questions.length})</CardTitle>
              <CardDescription>Manage assessment tasks for this course</CardDescription>
            </div>
            <Button size="sm" asChild>
              <Link href={`/admin/courses/${course.id}/assessments/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Assessment
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {course.questions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments yet</h3>
              <p className="text-gray-600 mb-4">Add assessments for students to complete</p>
              <Button asChild>
                <Link href={`/admin/courses/${course.id}/assessments/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Assessment
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {course.questions.map((question: any) => (
                <div key={question.id} className="py-4 first:pt-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">Assessment {question.questionNumber}</span>
                        <Badge variant="outline" className="text-xs">
                          {question.submissionType.replace('_', ' ').toLowerCase()}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">{question.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{question.description}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>{question._count.submissions} submissions</span>
                        <span>{question._count.baseExamples} examples</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" asChild>
                        <Link href={`/admin/courses/${course.id}/assessments/${question.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          View & Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}