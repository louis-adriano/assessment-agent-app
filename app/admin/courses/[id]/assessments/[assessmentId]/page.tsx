// app/admin/courses/[id]/assessments/[assessmentId]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, FileText, Users, Calendar, TrendingUp, Edit, Plus, Eye, CheckCircle, AlertCircle } from 'lucide-react'

// Helper function to extract remark from assessmentResult JSON
function extractRemark(assessmentResult: any): string | null {
  if (!assessmentResult) return null
  
  // If assessmentResult is a string, try to parse it
  if (typeof assessmentResult === 'string') {
    try {
      const parsed = JSON.parse(assessmentResult)
      return parsed?.remark || null
    } catch {
      return null
    }
  }
  
  // If it's already an object
  if (typeof assessmentResult === 'object' && assessmentResult !== null) {
    return assessmentResult.remark || null
  }
  
  return null
}

async function getAssessmentWithStats(courseId: string, assessmentId: string, userRole: string) {
  // First check if user has access to this course
  
  if (userRole === 'COURSE_ADMIN') {
    // Try different possible field names for course owner
    const course = await prisma.course.findFirst({
      where: { id: courseId },
      select: { 
        id: true, 
        name: true,
        createdAt: true,
        // Add all possible owner fields to check which exists
      }
    })
    
    if (!course) return null
    
    // Check if this admin owns this course (you'll need to adjust this based on your actual schema)
    // For now, let's assume all course admins can see all courses
    // You can restrict this later based on your actual ownership field
  }

  const assessment = await prisma.question.findFirst({
    where: {
      id: assessmentId,
      courseId: courseId
    },
    include: {
      course: {
        select: {
          name: true,
          id: true
        }
      },
      baseExamples: {
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      _count: {
        select: {
          submissions: true,
          baseExamples: true
        }
      }
    }
  })

  if (!assessment) return null

  // Get submission statistics with proper includes
  const submissions = await prisma.submission.findMany({
    where: { questionId: assessmentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Calculate statistics
  const stats = {
    totalSubmissions: submissions.length,
    completedSubmissions: submissions.filter(s => s.status === 'COMPLETED').length,
    anonymousSubmissions: submissions.filter(s => !s.userId).length,
    remarkCounts: {
      'Excellent': submissions.filter(s => extractRemark(s.assessmentResult) === 'Excellent').length,
      'Good': submissions.filter(s => extractRemark(s.assessmentResult) === 'Good').length,
      'Can Improve': submissions.filter(s => extractRemark(s.assessmentResult) === 'Can Improve').length,
      'Needs Improvement': submissions.filter(s => extractRemark(s.assessmentResult) === 'Needs Improvement').length,
    }
  }

  return {
    ...assessment,
    stats,
    submissions: submissions.slice(0, 10) // Latest 10 submissions for display
  }
}

interface AssessmentPageProps {
  params: Promise<{
    id: string
    assessmentId: string
  }>
}

export default async function AssessmentDetailPage({ params }: AssessmentPageProps) {
  const user = await getCurrentUser()
  
  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized</h1>
          <p className="text-gray-600">You need to be logged in to access this page.</p>
        </div>
      </div>
    )
  }

  const { id: courseId, assessmentId } = await params
  const assessment = await getAssessmentWithStats(courseId, assessmentId, user.role)

  if (!assessment) {
    notFound()
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href={`/admin/courses/${courseId}`}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {assessment.course.name}
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{assessment.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Assessment #{assessment.questionNumber}
              </div>
              <Badge variant="secondary">{assessment.submissionType}</Badge>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created {new Date(assessment.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          {/* Edit functionality to be added inline - for now, use course management page */}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessment.stats.totalSubmissions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{assessment.stats.completedSubmissions}</div>
            <p className="text-xs text-gray-600">
              {assessment.stats.totalSubmissions > 0 
                ? Math.round((assessment.stats.completedSubmissions / assessment.stats.totalSubmissions) * 100)
                : 0}% success rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Anonymous</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{assessment.stats.anonymousSubmissions}</div>
            <p className="text-xs text-gray-600">
              {assessment.stats.totalSubmissions > 0 
                ? Math.round((assessment.stats.anonymousSubmissions / assessment.stats.totalSubmissions) * 100)
                : 0}% of submissions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Base Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessment._count.baseExamples}</div>
          </CardContent>
        </Card>
      </div>

      {/* Assessment Results Distribution */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Assessment Results
            </CardTitle>
            <CardDescription>
              Distribution of student performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm">Excellent</span>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {assessment.stats.remarkCounts.Excellent}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm">Good</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {assessment.stats.remarkCounts.Good}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-sm">Can Improve</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {assessment.stats.remarkCounts['Can Improve']}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-sm">Needs Improvement</span>
                </div>
                <Badge className="bg-red-100 text-red-800">
                  {assessment.stats.remarkCounts['Needs Improvement']}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assessment Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 whitespace-pre-wrap mb-4">{assessment.description}</p>
            <div className="space-y-2">
              <div>
                <h4 className="font-medium mb-1">Submission Type</h4>
                <Badge variant="secondary">{assessment.submissionType}</Badge>
              </div>
              {assessment.guidance && (
                <div>
                  <h4 className="font-medium mb-1">Guidance</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{assessment.guidance}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Base Examples */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Perfectly Graded Examples ({assessment._count.baseExamples})
              </CardTitle>
              <CardDescription>
                Reference submissions that guide AI assessment for consistent grading
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/courses/${courseId}/assessments/${assessmentId}/examples`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Manage Examples
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {assessment.baseExamples.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-amber-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No base examples yet</h3>
              <p className="text-gray-600 mb-4">
                Base examples are crucial for consistent AI grading. Add perfect reference submissions
                to help the AI understand what excellent work looks like.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href={`/admin/courses/${courseId}/assessments/${assessmentId}/examples`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Example
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {assessment.baseExamples.slice(0, 4).map((example) => (
                  <div key={example.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium line-clamp-1">{example.title}</h4>
                      <div className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {new Date(example.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{example.content}</p>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className="text-xs">
                        {example.content.length > 100 ? `${example.content.length} chars` : 'Short example'}
                      </Badge>
                      <Link href={`/admin/courses/${courseId}/assessments/${assessmentId}/examples`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          View →
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {assessment.baseExamples.length > 4 && (
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-3">
                    And {assessment.baseExamples.length - 4} more examples...
                  </p>
                  <Link href={`/admin/courses/${courseId}/assessments/${assessmentId}/examples`}>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View All {assessment.baseExamples.length} Examples
                    </Button>
                  </Link>
                </div>
              )}

              {assessment.baseExamples.length <= 4 && (
                <div className="text-center pt-4 border-t">
                  <Link href={`/admin/courses/${courseId}/assessments/${assessmentId}/examples`}>
                    <Button variant="outline">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Manage All Examples
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Submissions
              </CardTitle>
              <CardDescription>
                Latest student submissions for this assessment
              </CardDescription>
            </div>
            <Link href={`/admin/submissions?assessmentId=${assessmentId}`}>
              <Button variant="outline" size="sm">
                View All Submissions
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {assessment.submissions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
              <p className="text-gray-600">Submissions will appear here once students start submitting</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessment.submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        {submission.user ? (
                          <div>
                            <div className="font-medium">{submission.user.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-600">{submission.user.email}</div>
                          </div>
                        ) : (
                          <Badge variant="outline">Anonymous</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.status === 'COMPLETED' ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        ) : submission.status === 'PROCESSING' ? (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Processing
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const remark = extractRemark(submission.assessmentResult)
                          return remark ? (
                            <Badge 
                              className={
                                remark === 'Excellent' ? 'bg-green-100 text-green-800' :
                                remark === 'Good' ? 'bg-blue-100 text-blue-800' :
                                remark === 'Can Improve' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {remark}
                            </Badge>
                          ) : (
                            <Badge variant="outline">No Assessment</Badge>
                          )
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/submissions/${submission.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}