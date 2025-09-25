import Link from 'next/link'
import { getCourses } from '@/lib/actions/course-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Plus, Users, FileText, Calendar, Eye, Edit, BarChart3 } from 'lucide-react'

export default async function CoursesPage() {
  const coursesResult = await getCourses()
  
  if (!coursesResult.success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
            <p className="text-gray-600">Manage your assessment courses</p>
          </div>
          <Button asChild>
            <Link href="/admin/courses/new">
              <Plus className="mr-2 h-4 w-4" />
              New Course
            </Link>
          </Button>
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-gray-600">
            Manage your assessment courses and monitor student progress
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/courses/new">
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Link>
        </Button>
      </div>

      {/* Course Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground">
              {courses.filter((c: any) => c.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courses.reduce((sum: number, course: any) => sum + course._count.questions, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courses.reduce((sum: number, course: any) => sum + course._count.enrollments, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Active students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Assessments</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courses.length > 0 ? Math.round(courses.reduce((sum: number, course: any) => sum + course._count.questions, 0) / courses.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Per course
            </p>
          </CardContent>
        </Card>
      </div>

      {courses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <CardTitle className="mb-2">No courses yet</CardTitle>
            <CardDescription className="mb-6 max-w-sm mx-auto">
              Create your first course to start building assessments for students. 
              You can add questions, set criteria, and monitor progress.
            </CardDescription>
            <Button size="lg" asChild>
              <Link href="/admin/courses/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Course
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course: any) => (
            <Card key={course.id} className="hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="line-clamp-2 text-lg">{course.name}</CardTitle>
                    <CardDescription className="line-clamp-3 min-h-[3rem]">
                      {course.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <Badge variant={course.isActive ? "default" : "secondary"} className="ml-2">
                    {course.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Course Metrics */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{course._count.questions}</div>
                      <div className="text-xs text-blue-800">Assessments</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">{course._count.enrollments}</div>
                      <div className="text-xs text-green-800">Enrolled</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">
                        {course.isActive ? '✓' : '○'}
                      </div>
                      <div className="text-xs text-purple-800">Status</div>
                    </div>
                  </div>

                  {/* Course Meta Info */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      <span>By {course.creator.name || course.creator.email}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="text-xs" asChild>
                      <Link href={`/admin/courses/${course.id}`}>
                        <Eye className="mr-1 h-3 w-3" />
                        Manage
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" asChild>
                      <Link href={`/admin/courses/${course.id}/edit`}>
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Link>
                    </Button>
                  </div>

                  {/* Quick Preview Link */}
                  <Button variant="ghost" size="sm" className="w-full text-xs text-gray-600" asChild>
                    <Link href={`/courses/${encodeURIComponent(course.name)}`} target="_blank">
                      View as Student →
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bulk Actions & Tips */}
      {courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Course Management Tips</CardTitle>
            <CardDescription>Best practices for managing your courses effectively</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                  📝
                </div>
                <div>
                  <p className="font-medium text-sm">Add Base Examples</p>
                  <p className="text-xs text-gray-600">
                    Provide reference answers to ensure consistent AI assessments
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full font-semibold text-sm">
                  🎯
                </div>
                <div>
                  <p className="font-medium text-sm">Set Clear Criteria</p>
                  <p className="text-xs text-gray-600">
                    Define assessment criteria for better student guidance
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full font-semibold text-sm">
                  📊
                </div>
                <div>
                  <p className="font-medium text-sm">Monitor Progress</p>
                  <p className="text-xs text-gray-600">
                    Review student submissions to identify improvement areas
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}