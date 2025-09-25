// app/admin/page.tsx
import Link from 'next/link'
import { getCoursesForUser } from '@/lib/actions/course-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, FileText, BarChart3, Plus, TrendingUp, CheckCircle } from 'lucide-react'
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
      take: 8,
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

    // Get submissions by remark (from assessment results)
    const completedSubmissions = await prisma.submission.findMany({
      where: { status: 'COMPLETED' },
      take: 100 // Sample recent completed submissions
    })

    const remarkCounts = {
      'Excellent': 0,
      'Good': 0,
      'Can Improve': 0,
      'Needs Improvement': 0
    }

    completedSubmissions.forEach(submission => {
      const result = submission.assessmentResult as any
      if (result && result.remark && remarkCounts.hasOwnProperty(result.remark)) {
        remarkCounts[result.remark as keyof typeof remarkCounts]++
      }
    })

    return {
      courseCount,
      assessmentCount,
      submissionCount,
      activeSubmissions,
      recentSubmissions,
      submissionsByStatus,
      remarkCounts
    }
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return {
      courseCount: 0,
      assessmentCount: 0,
      submissionCount: 0,
      activeSubmissions: 0,
      recentSubmissions: [],
      submissionsByStatus: [],
      remarkCounts: { 'Excellent': 0, 'Good': 0, 'Can Improve': 0, 'Needs Improvement': 0 }
    }
  }
}

export default async function AdminDashboard() {
  // Get authenticated user (admin layout already ensures user is authenticated and is admin)
  const user = await getCurrentUser()

  // If no user, return null (should not happen due to layout auth, but safety check)
  if (!user) {
    return null
  }

  const coursesResult = await getCoursesForUser(user)
  const courses = coursesResult.success ? coursesResult.data : []
  const stats = await getDashboardStats()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back! Here's what's happening with your assessments.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/courses">Manage Courses</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/courses/new">
              <Plus className="mr-2 h-4 w-4" />
              New Course
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.courseCount}</div>
            <p className="text-xs text-muted-foreground">
              {courses.filter((c: any) => c.isActive).length} active courses
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assessmentCount}</div>
            <p className="text-xs text-muted-foreground">
              Across all courses
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submissionCount}</div>
            <p className="text-xs text-muted-foreground">
              All time submissions
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              Submissions in last 24h
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Assessment Results Overview */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Assessment Results</CardTitle>
            <CardDescription>Distribution of recent assessment outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span className="text-sm">Excellent</span>
                </div>
                <span className="text-sm font-medium">{stats.remarkCounts.Excellent}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm">Good</span>
                </div>
                <span className="text-sm font-medium">{stats.remarkCounts.Good}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  <span className="text-sm">Can Improve</span>
                </div>
                <span className="text-sm font-medium">{stats.remarkCounts['Can Improve']}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-sm">Needs Improvement</span>
                </div>
                <span className="text-sm font-medium">{stats.remarkCounts['Needs Improvement']}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Latest assessment activity from students</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
                <p className="text-gray-600">Submissions will appear here once students start using your courses</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {stats.recentSubmissions.map((submission: any) => (
                  <div key={submission.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">
                        {submission.question.course.name} - Assessment {submission.question.questionNumber}
                      </h4>
                      <p className="text-xs text-gray-600 truncate">
                        {submission.question.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(submission.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {submission.userId ? (
                        <Badge variant="outline" className="text-xs">Registered</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Anonymous</Badge>
                      )}
                      <Badge variant={
                        submission.status === 'COMPLETED' ? 'default' : 
                        submission.status === 'PROCESSING' ? 'secondary' : 
                        'destructive'
                      } className="text-xs">
                        {submission.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Courses Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Courses</CardTitle>
              <CardDescription>Manage and monitor your course performance</CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/courses">
                View All Courses
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first course</p>
              <Button asChild>
                <Link href="/admin/courses/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Course
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.slice(0, 6).map((course: any) => (
                <Card key={course.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-2">{course.name}</CardTitle>
                        <CardDescription className="text-xs mt-1 line-clamp-2">
                          {course.description || 'No description'}
                        </CardDescription>
                      </div>
                      <Badge variant={course.isActive ? "default" : "secondary"} className="text-xs">
                        {course.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                      <span>{course._count.questions} assessments</span>
                      <span>{course._count.enrollments} enrolled</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
                        <Link href={`/admin/courses/${course.id}`}>Manage</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
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
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start h-auto p-4" asChild>
              <Link href="/admin/courses/new">
                <Plus className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Create Course</div>
                  <div className="text-xs text-gray-600">Add a new course</div>
                </div>
              </Link>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4" asChild>
              <Link href="/admin/assessments">
                <FileText className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Manage Assessments</div>
                  <div className="text-xs text-gray-600">Edit assessment tasks</div>
                </div>
              </Link>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4" asChild>
              <Link href="/admin/submissions">
                <BarChart3 className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">View Submissions</div>
                  <div className="text-xs text-gray-600">Monitor student progress</div>
                </div>
              </Link>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4" asChild>
              <Link href="/health">
                <CheckCircle className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">System Health</div>
                  <div className="text-xs text-gray-600">Check system status</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}