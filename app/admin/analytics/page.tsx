// app/admin/analytics/page.tsx
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  CheckCircle,
  Target,
  Clock,
  Activity
} from 'lucide-react'

async function getAnalyticsData() {
  const user = await getCurrentUser()
  if (!user) return null

  let whereClause: any = {}
  
  // Course admins see only their data
  if (user.role === 'COURSE_ADMIN') {
    whereClause = {
      question: {
        course: {
          creatorId: user.id
        }
      }
    }
  }

  // Get submission analytics
  const submissions = await prisma.submission.findMany({
    where: whereClause,
    include: {
      question: {
        select: {
          course: {
            select: { name: true }
          },
          submissionType: true
        }
      }
    }
  })

  // Get recent activity (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentSubmissions = submissions.filter(
    s => s.createdAt >= thirtyDaysAgo
  )

  // Calculate completion rates by remark
  const completedSubmissions = submissions.filter(s => s.status === 'COMPLETED')
  const remarkDistribution = {
    'Excellent': 0,
    'Good': 0,
    'Can Improve': 0,
    'Needs Improvement': 0
  }

  completedSubmissions.forEach(submission => {
    const result = submission.assessmentResult as any
    if (result && result.remark && remarkDistribution.hasOwnProperty(result.remark)) {
      remarkDistribution[result.remark as keyof typeof remarkDistribution]++
    }
  })

  // Group by submission type
  const submissionTypes: Record<string, number> = {}
  submissions.forEach(s => {
    const type = s.question.submissionType
    submissionTypes[type] = (submissionTypes[type] || 0) + 1
  })

  // Group by course
  const courseStats: Record<string, number> = {}
  submissions.forEach(s => {
    const course = s.question.course.name
    courseStats[course] = (courseStats[course] || 0) + 1
  })

  // Calculate averages
  const totalProcessingTime = completedSubmissions.reduce((sum, s) => {
    const result = s.assessmentResult as any
    return sum + (result?.processing_time_ms || 0)
  }, 0)

  const avgProcessingTime = completedSubmissions.length > 0 
    ? Math.round(totalProcessingTime / completedSubmissions.length)
    : 0

  const avgConfidence = completedSubmissions.reduce((sum, s) => {
    const result = s.assessmentResult as any
    return sum + (result?.confidence || 0)
  }, 0) / (completedSubmissions.length || 1)

  return {
    totalSubmissions: submissions.length,
    completedSubmissions: completedSubmissions.length,
    recentSubmissions: recentSubmissions.length,
    anonymousSubmissions: submissions.filter(s => !s.userId).length,
    remarkDistribution,
    submissionTypes,
    courseStats,
    avgProcessingTime,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    successRate: completedSubmissions.length > 0 
      ? Math.round(((remarkDistribution.Excellent + remarkDistribution.Good) / completedSubmissions.length) * 100)
      : 0
  }
}

function getRemarkColor(remark: string) {
  switch (remark) {
    case 'Excellent':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'Good':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'Can Improve':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'Needs Improvement':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default async function AnalyticsPage() {
  const analytics = await getAnalyticsData()
  
  if (!analytics) {
    return <div>Access denied</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-gray-600">
            Assessment performance and usage insights
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.recentSubmissions} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Excellent + Good ratings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics.avgProcessingTime}ms</div>
            <p className="text-xs text-muted-foreground">
              AI assessment time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anonymous Users</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{analytics.anonymousSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((analytics.anonymousSubmissions / analytics.totalSubmissions) * 100)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assessment Results Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Assessment Results Distribution
            </CardTitle>
            <CardDescription>
              How students are performing across all assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.remarkDistribution).map(([remark, count]) => {
                const percentage = analytics.completedSubmissions > 0 
                  ? Math.round((count / analytics.completedSubmissions) * 100)
                  : 0
                
                return (
                  <div key={remark} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-lg border text-sm font-medium ${getRemarkColor(remark)}`}>
                        {remark}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 min-w-[3rem]">{count} ({percentage}%)</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            remark === 'Excellent' ? 'bg-yellow-500' :
                            remark === 'Good' ? 'bg-green-500' :
                            remark === 'Can Improve' ? 'bg-blue-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Submission Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Submission Types
            </CardTitle>
            <CardDescription>
              Popular assessment formats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.submissionTypes)
                .sort(([,a], [,b]) => b - a)
                .map(([type, count]) => {
                const percentage = Math.round((count / analytics.totalSubmissions) * 100)
                const displayType = type.replace('_', ' ').toLowerCase()
                
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm capitalize">{displayType}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 min-w-[3rem]">{count} ({percentage}%)</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Course Activity
          </CardTitle>
          <CardDescription>
            Submission activity by course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.courseStats)
              .sort(([,a], [,b]) => b - a)
              .map(([course, count]) => {
              const percentage = Math.round((count / analytics.totalSubmissions) * 100)
              
              return (
                <div key={course} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    <span className="font-medium">{course}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{count} submissions ({percentage}%)</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            System Performance
          </CardTitle>
          <CardDescription>
            AI assessment quality and reliability metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {analytics.avgConfidence}
              </div>
              <div className="text-sm text-green-800">Average Confidence</div>
              <div className="text-xs text-green-600 mt-1">AI assessment certainty</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {Math.round((analytics.completedSubmissions / analytics.totalSubmissions) * 100)}%
              </div>
              <div className="text-sm text-blue-800">Success Rate</div>
              <div className="text-xs text-blue-600 mt-1">Completed assessments</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {analytics.avgProcessingTime / 1000}s
              </div>
              <div className="text-sm text-purple-800">Avg Response Time</div>
              <div className="text-xs text-purple-600 mt-1">Time to assessment</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}