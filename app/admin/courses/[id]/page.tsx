import Link from 'next/link'
import { getCourse } from '@/lib/actions/course-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, FileText, Users, Edit } from 'lucide-react'

interface CourseDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
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
        <h1 className="text-3xl font-bold tracking-tight">{course.name}</h1>
        <Badge variant={course.isActive ? "default" : "secondary"}>
          {course.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Course Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Description</h4>
                <p className="text-sm text-gray-600">
                  {course.description || 'No description provided'}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Created by</h4>
                <p className="text-sm text-gray-600">
                  {course.creator.name || course.creator.email}
                  <br />
                  <span className="text-xs">Role: {course.creator.role}</span>
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1">Statistics</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Assessments:</span>
                    <span>{course._count.questions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enrolled:</span>
                    <span>{course._count.enrollments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{new Date(course.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button className="w-full" asChild>
                  <Link href={`/admin/courses/${course.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Course
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/admin/courses/${course.id}/assessments/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Assessment
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assessments */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Assessments ({course.questions.length})</CardTitle>
                <Button size="sm" asChild>
                  <Link href={`/admin/courses/${course.id}/assessments/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Assessment
                  </Link>
                </Button>
              </div>
              <CardDescription>
                Assessment tasks for this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              {course.questions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments yet</h3>
                  <p className="text-gray-600 mb-4">Add assessments to start accepting student submissions</p>
                  <Button asChild>
                    <Link href={`/admin/courses/${course.id}/assessments/new`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Assessment
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {course.questions.map((question: any) => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">Assessment {question.questionNumber}</h4>
                            <Badge variant="outline" className="text-xs">
                              {question.submissionType.replace('_', ' ').toLowerCase()}
                            </Badge>
                          </div>
                          <h5 className="text-sm font-medium text-gray-900 mb-1">
                            {question.title}
                          </h5>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {question.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex gap-4">
                          <span>{question._count.submissions} submissions</span>
                          <span>{question._count.baseExamples} base examples</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/courses/${course.id}/assessments/${question.id}`}>View</Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/courses/${course.id}/assessments/${question.id}/edit`}>Edit</Link>
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
      </div>

      {/* Enrollments */}
      {course.enrollments && course.enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Enrolled Students ({course.enrollments.length})</CardTitle>
            <CardDescription>Students currently enrolled in this course</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {course.enrollments.map((enrollment: any) => (
                <div key={enrollment.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-sm">
                      {enrollment.user.name || enrollment.user.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      Enrolled {new Date(enrollment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}