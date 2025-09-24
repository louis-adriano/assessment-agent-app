import Link from 'next/link'
import { getCourses } from '@/lib/actions/course-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, FileText, BarChart3, Plus } from 'lucide-react'
import { prisma } from '@/lib/prisma'

async function getDashboardStats() {
  try {
    const [courseCount, questionCount, submissionCount, userCount] = await Promise.all([
      prisma.course.count(),
      prisma.question.count(),
      prisma.submission.count(),
      prisma.user.count()
    ])

    // Get recent submissions for activity
    const recentSubmissions = await prisma.submission.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        question: {
          select: {
            title: true,
            course: {
              select: { name: true }
            }
          }
        }
      }
    })

    return {
      courseCount,
      questionCount,
      submissionCount,
      userCount,
      recentSubmissions
    }
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return {
      courseCount: 0,
      questionCount: 0,
      submissionCount: 0,
      userCount: 0,
      recentSubmissions: []
    }
  }
}

export default async function AdminDashboard() {
  const coursesResult = await getCourses()
  const courses = coursesResult.success ? coursesResult.data : []
  const stats = await getDashboardStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/courses/new">
              <Plus className="mr-2 h-4 w-4" />
              New Course
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.courseCount}</div>
            <p className="text-xs text-muted-foreground">
              {courses.filter(c => c.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.questionCount}</div>
            <p className="text-xs text-muted-foreground">
              Across all courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submissionCount}</div>
            <p className="text-xs text-muted-foreground">
              Total assessments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userCount}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Courses Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Courses</CardTitle>
            <CardDescription>Your most recently created courses</CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <div className="text-center py-6">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                <p className="text-gray-600 mb-4">Get started by creating your first course</p>
                <Button asChild>
                  <Link href="/admin/courses/new">Create Course</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.slice(0, 5).map((course: any) => (
                  <div key={course.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <h4 className="font-medium">{course.name}</h4>
                      <p className="text-sm text-gray-600">
                        {course._count.questions} questions • {course._count.enrollments} enrolled
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={course.isActive ? "default" : "secondary"}>
                        {course.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/courses/${course.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
                {courses.length > 5 && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/admin/courses">View All Courses</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest submissions and assessments</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentSubmissions.length === 0 ? (
              <div className="text-center py-6">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
                <p className="text-gray-600">Submissions will appear here once students start using your courses</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentSubmissions.map((submission: any) => (
                  <div key={submission.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <h4 className="font-medium text-sm">{submission.question.title}</h4>
                      <p className="text-xs text-gray-600">
                        {submission.question.course.name} • {new Date(submission.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={
                      submission.status === 'COMPLETED' ? 'default' : 
                      submission.status === 'PROCESSING' ? 'secondary' : 
                      'destructive'
                    }>
                      {submission.status}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/submissions">View All Activity</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/admin/courses">
                <BookOpen className="mr-2 h-4 w-4" />
                Manage Courses
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/admin/questions">
                <FileText className="mr-2 h-4 w-4" />
                Manage Questions
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/admin/submissions">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Submissions
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/test">
                <Users className="mr-2 h-4 w-4" />
                System Test
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}