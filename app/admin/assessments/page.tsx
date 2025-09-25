// app/admin/questions/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, BookOpen, Edit, Eye } from 'lucide-react'

async function getAssessmentsForUser() {
  const user = await getCurrentUser()
  if (!user) return []

  let whereClause: any = {}

  // Super admins see all assessments, course admins see only their assessments
  if (user.role === 'COURSE_ADMIN') {
    whereClause = {
      course: {
        creatorId: user.id
      }
    }
  }
  // Super admins get no additional where clause (see all)

  const assessments = await prisma.question.findMany({
    where: whereClause,
    include: {
      course: {
        select: {
          id: true,
          name: true,
          creatorId: true
        }
      },
      _count: {
        select: {
          submissions: true,
          baseExamples: true
        }
      }
    },
    orderBy: [
      { course: { name: 'asc' } },
      { questionNumber: 'asc' }
    ]
  })

  return assessments
}

export default async function AssessmentsPage() {
  const assessments = await getAssessmentsForUser()
  const user = await getCurrentUser()

  if (!user) {
    return <div>Access denied</div>
  }

  // Group assessments by course
  const assessmentsByCourse = assessments.reduce((acc: any, assessment: any) => {
    const courseName = assessment.course.name
    if (!acc[courseName]) {
      acc[courseName] = {
        course: assessment.course,
        assessments: []
      }
    }
    acc[courseName].assessments.push(assessment)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
          <p className="text-gray-600">
            Manage assessment tasks across all courses
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/courses">
            <Plus className="mr-2 h-4 w-4" />
            Add Assessment to Course
          </Link>
        </Button>
      </div>

      {/* Assessment Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessments.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assessments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessments.filter((a: any) => a.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Available to students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessments.reduce((sum: number, a: any) => sum + a._count.submissions, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Student responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base Examples</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessments.reduce((sum: number, a: any) => sum + a._count.baseExamples, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Reference answers
            </p>
          </CardContent>
        </Card>
      </div>

      {Object.keys(assessmentsByCourse).length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <CardTitle className="mb-2">No Assessments Yet</CardTitle>
            <CardDescription className="mb-6">
              Start by creating courses and adding assessments to them
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
        <div className="space-y-8">
          {Object.entries(assessmentsByCourse).map(([courseName, courseData]: [string, any]) => (
            <Card key={courseName}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {courseName}
                    </CardTitle>
                    <CardDescription>
                      {courseData.assessments.length} assessments
                    </CardDescription>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href={`/admin/courses/${courseData.course.id}`}>
                      Manage Course
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {courseData.assessments.map((assessment: any) => (
                    <div key={assessment.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-semibold text-xs">
                              {assessment.questionNumber}
                            </div>
                            <h4 className="font-medium text-sm">{assessment.title}</h4>
                            <Badge 
                              variant={assessment.isActive ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {assessment.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {assessment.submissionType.replace('_', ' ').toLowerCase()}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {assessment.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{assessment._count.submissions} submissions</span>
                          <span>{assessment._count.baseExamples} examples</span>
                          <span>Created {new Date(assessment.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/courses/${encodeURIComponent(courseName)}/${assessment.questionNumber}`}>
                              <Eye className="mr-1 h-3 w-3" />
                              Preview
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/courses/${assessment.course.id}/assessments/${assessment.id}`}>
                              <Edit className="mr-1 h-3 w-3" />
                              Manage
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}