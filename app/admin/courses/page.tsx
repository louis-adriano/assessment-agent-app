import Link from 'next/link'
import { getCourses } from '@/lib/actions/course-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Plus, Users, FileText, Calendar } from 'lucide-react'

export default async function CoursesPage() {
  const coursesResult = await getCourses()
  
  if (!coursesResult.success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading courses: {coursesResult.error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const courses = coursesResult.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
        <Button asChild>
          <Link href="/admin/courses/new">
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <CardTitle className="mb-2">No courses yet</CardTitle>
            <CardDescription className="mb-6">
              Create your first course to start building assessments for students
            </CardDescription>
            <Button asChild>
              <Link href="/admin/courses/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Course
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course: any) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="line-clamp-2">{course.name}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {course.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <Badge variant={course.isActive ? "default" : "secondary"}>
                    {course.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{course._count.questions} questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{course._count.enrollments} enrolled</span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mb-4">
                  Created by {course.creator.name || course.creator.email}
                  <br />
                  {new Date(course.createdAt).toLocaleDateString()}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/admin/courses/${course.id}`}>View Details</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/admin/courses/${course.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}