// app/admin/page.tsx
import Link from 'next/link'
import { getCoursesForUser } from '@/lib/actions/course-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, FileText, BarChart3, Plus, TrendingUp, Users, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/utils'

async function getDashboardStats() {
  try {
    const [courseCount, assessmentCount, submissionCount, activeSubmissions] = await Promise.all([
      prisma.course.count(),
      prisma.question.count(),
      prisma.submission.count(),
      prisma.submission.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ])

    // Get recent submissions for activity feed
    const recentSubmissions = await prisma.submission.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        question: {
          select: {
            title: true,
            questionNumber: true,
            course: {
              select: { name: true }
            }
          }
        }
      }
    })

    // Get submission status breakdown
    const submissionsByStatus = await prisma.submission.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    const statusCounts = {
      completed: submissionsByStatus.find(s => s.status === 'COMPLETED')?._count.id || 0,
      processing: submissionsByStatus.find(s => s.status === 'PROCESSING')?._count.id || 0,
      failed: submissionsByStatus.find(s => s.status === 'FAILED')?._count.id || 0,
    }

    return {
      courseCount,
      assessmentCount,
      submissionCount,
      activeSubmissions,
      recentSubmissions,
      statusCounts
    }
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return {
      courseCount: 0,
      assessmentCount: 0,
      submissionCount: 0,
      activeSubmissions: 0,
      recentSubmissions: [],
      statusCounts: { completed: 0, processing: 0, failed: 0 }
    }
  }
}

export default async function AdminDashboard() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const coursesResult = await getCoursesForUser(user)
  const courses = coursesResult.success ? coursesResult.data : []
  const stats = await getDashboardStats()

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-white tracking-tight">
                Welcome back, {user.name?.split(' ')[0] || 'Admin'}!
              </h1>
              <p className="text-blue-100 text-lg max-w-2xl">
                Monitor your assessment platform, track student progress, and manage courses all in one place
              </p>
            </div>
            <Button
              size="lg"
              asChild
              className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all font-semibold"
            >
              <Link href="/admin/courses/new">
                <Plus className="mr-2 h-5 w-5" />
                Create Course
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Courses</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.courseCount}</div>
            <p className="text-xs text-gray-600 mt-1">
              {courses.filter((c: any) => c.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-green-100/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Assessments</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.assessmentCount}</div>
            <p className="text-xs text-gray-600 mt-1">
              Across all courses
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Submissions</CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.submissionCount}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.statusCounts.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Recent Activity</CardTitle>
            <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.activeSubmissions}</div>
            <p className="text-xs text-gray-600 mt-1">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity Feed */}
        <Card className="lg:col-span-2 border-none shadow-lg">
          <CardHeader className="border-b bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Recent Submissions</CardTitle>
                <CardDescription className="mt-1">Latest assessment activity from students</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/submissions">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {stats.recentSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
                <p className="text-gray-600 text-sm">Submissions will appear here once students start completing assessments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentSubmissions.map((submission: any) => (
                  <div key={submission.id} className="flex items-start gap-4 p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      submission.status === 'COMPLETED' ? 'bg-green-100' :
                      submission.status === 'PROCESSING' ? 'bg-yellow-100' :
                      'bg-red-100'
                    }`}>
                      {submission.status === 'COMPLETED' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : submission.status === 'PROCESSING' ? (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900">
                        {submission.question.course.name}
                      </h4>
                      <p className="text-sm text-gray-600 truncate">
                        Assessment {submission.question.questionNumber}: {submission.question.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(submission.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Badge variant={
                      submission.status === 'COMPLETED' ? 'default' :
                      submission.status === 'PROCESSING' ? 'secondary' :
                      'destructive'
                    } className="text-xs">
                      {submission.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b bg-gray-50/50">
            <CardTitle className="text-xl">Status Overview</CardTitle>
            <CardDescription className="mt-1">Submission breakdown</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">Completed</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{stats.statusCounts.completed}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-gray-900">Processing</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600">{stats.statusCounts.processing}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-gray-900">Failed</span>
                </div>
                <span className="text-2xl font-bold text-red-600">{stats.statusCounts.failed}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Grid */}
      <Card className="border-none shadow-lg">
        <CardHeader className="border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Your Courses</CardTitle>
              <CardDescription className="mt-1">Manage and monitor your courses</CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/courses">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {courses.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">Get started by creating your first course and adding assessments</p>
              <Button size="lg" asChild>
                <Link href="/admin/courses/new">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Course
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.slice(0, 6).map((course: any) => (
                <Card key={course.id} className="group hover:shadow-xl transition-all border-2 hover:border-blue-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant={course.isActive ? "default" : "secondary"}>
                        {course.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {course.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm mt-1">
                      {course.description || 'No description provided'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 pb-4 border-b">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{course._count.questions} assessments</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course._count.enrollments}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="default" size="sm" className="flex-1" asChild>
                        <Link href={`/admin/courses/${course.id}`}>Manage</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/courses/${encodeURIComponent(course.name)}`}>View</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-none shadow-lg">
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="text-xl">Quick Actions</CardTitle>
          <CardDescription className="mt-1">Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto p-6 flex-col gap-3 hover:bg-blue-50 hover:border-blue-300 transition-all group" asChild>
              <Link href="/admin/courses/new">
                <div className="h-12 w-12 rounded-full bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">Create Course</div>
                  <div className="text-xs text-gray-600 mt-1">Add a new course</div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto p-6 flex-col gap-3 hover:bg-green-50 hover:border-green-300 transition-all group" asChild>
              <Link href="/admin/assessments">
                <div className="h-12 w-12 rounded-full bg-green-100 group-hover:bg-green-200 flex items-center justify-center transition-colors">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">Assessments</div>
                  <div className="text-xs text-gray-600 mt-1">Manage tasks</div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto p-6 flex-col gap-3 hover:bg-purple-50 hover:border-purple-300 transition-all group" asChild>
              <Link href="/admin/submissions">
                <div className="h-12 w-12 rounded-full bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">Submissions</div>
                  <div className="text-xs text-gray-600 mt-1">View all results</div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto p-6 flex-col gap-3 hover:bg-orange-50 hover:border-orange-300 transition-all group" asChild>
              <Link href="/admin/analytics">
                <div className="h-12 w-12 rounded-full bg-orange-100 group-hover:bg-orange-200 flex items-center justify-center transition-colors">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">Analytics</div>
                  <div className="text-xs text-gray-600 mt-1">View insights</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
