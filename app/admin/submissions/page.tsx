// app/admin/submissions/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users,
  Filter,
  Download,
  Eye
} from 'lucide-react'

async function getSubmissionsForUser() {
  const user = await getCurrentUser()
  if (!user) return { submissions: [], stats: null }

  let whereClause: any = {}

  // Course admins see only submissions from their courses
  if (user.role === 'COURSE_ADMIN') {
    whereClause = {
      question: {
        course: {
          creatorId: user.id
        }
      }
    }
  }

  const submissions = await prisma.submission.findMany({
    where: whereClause,
    include: {
      question: {
        select: {
          title: true,
          questionNumber: true,
          submissionType: true,
          course: {
            select: {
              name: true
            }
          }
        }
      },
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100 // Limit to recent submissions
  })

  // Calculate stats
  const stats = {
    total: submissions.length,
    completed: submissions.filter(s => s.status === 'COMPLETED').length,
    processing: submissions.filter(s => s.status === 'PROCESSING').length,
    failed: submissions.filter(s => s.status === 'FAILED').length,
    anonymous: submissions.filter(s => !s.userId).length,
    authenticated: submissions.filter(s => s.userId).length
  }

  return { submissions, stats }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'PROCESSING':
      return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
    case 'FAILED':
      return <XCircle className="h-4 w-4 text-red-600" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-600" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'default'
    case 'PROCESSING':
      return 'secondary'
    case 'FAILED':
      return 'destructive'
    default:
      return 'outline'
  }
}

function getRemarkColor(remark: string) {
  switch (remark) {
    case 'Excellent':
      return 'bg-yellow-100 text-yellow-800'
    case 'Good':
      return 'bg-green-100 text-green-800'
    case 'Can Improve':
      return 'bg-blue-100 text-blue-800'
    case 'Needs Improvement':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default async function SubmissionsPage() {
  const { submissions, stats } = await getSubmissionsForUser()
  const user = await getCurrentUser()

  if (!user) {
    return <div>Access denied</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submissions</h1>
          <p className="text-gray-600">
            Monitor and review student assessment submissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Submissions Statistics */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">All submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">Assessed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.processing || 0}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
            <p className="text-xs text-muted-foreground">Errors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anonymous</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.anonymous || 0}</div>
            <p className="text-xs text-muted-foreground">No login</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.authenticated || 0}</div>
            <p className="text-xs text-muted-foreground">With login</p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>
            Latest {submissions.length} submissions from students
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
              <p className="text-gray-600">Submissions will appear here once students start using your courses</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission: any) => {
                const assessmentResult = submission.assessmentResult as any
                return (
                  <div key={submission.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(submission.status)}
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">
                              {submission.question.course.name} - Q{submission.question.questionNumber}
                            </h4>
                            <Badge 
                              variant={getStatusColor(submission.status) as any}
                              className="text-xs"
                            >
                              {submission.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {submission.question.submissionType.replace('_', ' ').toLowerCase()}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                          {submission.question.title}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {submission.user ? submission.user.name || submission.user.email : 'Anonymous'}
                          </span>
                          <span>
                            {new Date(submission.createdAt).toLocaleString()}
                          </span>
                          {submission.processedAt && (
                            <span>
                              Processed {new Date(submission.processedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {assessmentResult?.remark && (
                          <div className={`px-2 py-1 rounded text-xs font-medium ${getRemarkColor(assessmentResult.remark)}`}>
                            {assessmentResult.remark}
                          </div>
                        )}
                        
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/results/${submission.id}`}>
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                    
                    {submission.submissionContent && (
                      <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                        <p className="text-gray-600 line-clamp-2">
                          {submission.submissionContent.substring(0, 200)}
                          {submission.submissionContent.length > 200 && '...'}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}