// app/admin/page.tsx
import Link from 'next/link'
import { getCoursesForUser } from '@/lib/actions/course-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, FileText, Plus, Settings, Users, Eye, TrendingUp, Clock } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/utils'

async function getBasicStats() {
  try {
    const [courseCount, assessmentCount, submissionCount] = await Promise.all([
      prisma.course.count(),
      prisma.question.count(),
      prisma.submission.count(),
    ])

    return { courseCount, assessmentCount, submissionCount }
  } catch (error) {
    console.error('Stats error:', error)
    return { courseCount: 0, assessmentCount: 0, submissionCount: 0 }
  }
}

export default async function AdminDashboard() {
  // Require admin role - redirects to /unauthorized if not admin
  const user = await requireAdmin()

  const coursesResult = await getCoursesForUser(user)
  const courses = coursesResult.success ? coursesResult.data : []
  const stats = await getBasicStats()

  return (
    <div className="space-y-8 pb-8">
      {/* Header with Gradient Background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-8 shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-blue-100">Welcome back, {user.name || 'Admin'}</p>
          </div>
          <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg">
            <Link href="/admin/courses/new">
              <Plus className="mr-2 h-5 w-5" />
              New Course
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards with Modern Design */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Courses</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.courseCount}</div>
            <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Active learning paths
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Assessments</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.assessmentCount}</div>
            <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Ready for students
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Submissions</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.submissionCount}</div>
            <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Student progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Courses List with Modern Card */}
      <Card className="border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Your Courses</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Manage and monitor your course catalog</p>
            </div>
            <Button variant="outline" size="sm" className="shadow-sm" asChild>
              <Link href="/admin/courses">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {courses.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">Create your first course to start building assessments and engaging with students</p>
              <Button asChild size="lg" className="shadow-lg">
                <Link href="/admin/courses/new">
                  <Plus className="mr-2 h-5 w-5" />
                  Create First Course
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {courses.map((course: any) => (
                <div key={course.id} className="p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-200">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{course.name}</h3>
                        <Badge 
                          variant={course.isActive ? "default" : "secondary"} 
                          className={`shrink-0 ${course.isActive ? 'bg-green-100 text-green-700 border-green-200' : ''}`}
                        >
                          {course.isActive ? "● Active" : "○ Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description || 'No description provided'}</p>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span className="font-medium">{course._count.questions}</span>
                          <span className="text-gray-500">assessments</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <div className="w-2 h-2 bg-purple-500 rounded-full" />
                          <span className="font-medium">{course._count.enrollments}</span>
                          <span className="text-gray-500">students</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="shadow-sm hover:shadow" asChild>
                        <Link href={`/courses/${encodeURIComponent(course.name)}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Link>
                      </Button>
                      <Button size="sm" className="shadow-sm hover:shadow" asChild>
                        <Link href={`/admin/courses/${course.id}/edit`}>
                          <Settings className="mr-2 h-4 w-4" />
                          Manage
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

      {/* Quick Actions with Modern Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/admin/courses" className="group">
            <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 h-full bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">All Courses</h3>
                    <p className="text-sm text-gray-600">View and manage all courses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/submissions" className="group">
            <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 h-full bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl group-hover:scale-110 transition-transform">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Submissions</h3>
                    <p className="text-sm text-gray-600">Review student submissions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/users" className="group">
            <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 h-full bg-gradient-to-br from-green-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-xl group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Users</h3>
                    <p className="text-sm text-gray-600">Manage user accounts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
