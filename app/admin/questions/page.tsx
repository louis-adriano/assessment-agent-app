// app/admin/questions/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, BookOpen, Edit, Eye, Calendar } from 'lucide-react'

async function getQuestionsForUser() {
  const user = await getCurrentUser()
  if (!user) return []

  let whereClause: any = {}

  // Super admins see all questions, course admins see only their questions
  if (user.role === 'COURSE_ADMIN') {
    whereClause = {
      course: {
        creatorId: user.id
      }
    }
  }
  // Super admins get no additional where clause (see all)

  const questions = await prisma.question.findMany({
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

  return questions
}

export default async function QuestionsPage() {
  const questions = await getQuestionsForUser()
  const user = await getCurrentUser()

  if (!user) {
    return <div>Access denied</div>
  }

  // Group questions by course
  const questionsByCourse = questions.reduce((acc: any, question: any) => {
    const courseName = question.course.name
    if (!acc[courseName]) {
      acc[courseName] = {
        course: question.course,
        questions: []
      }
    }
    acc[courseName].questions.push(question)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Questions</h1>
          <p className="text-gray-600">
            Manage assessment questions across all courses
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/courses">
            <Plus className="mr-2 h-4 w-4" />
            Add Question to Course
          </Link>
        </Button>
      </div>

      {/* Questions Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questions.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Questions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {questions.filter((q: any) => q.isActive).length}
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
              {questions.reduce((sum: number, q: any) => sum + q._count.submissions, 0)}
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
              {questions.reduce((sum: number, q: any) => sum + q._count.baseExamples, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Reference answers
            </p>
          </CardContent>
        </Card>
      </div>

      {Object.keys(questionsByCourse).length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <CardTitle className="mb-2">No Questions Yet</CardTitle>
            <CardDescription className="mb-6">
              Start by creating courses and adding questions to them
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
          {Object.entries(questionsByCourse).map(([courseName, courseData]: [string, any]) => (
            <Card key={courseName}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {courseName}
                    </CardTitle>
                    <CardDescription>
                      {courseData.questions.length} questions
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
                  {courseData.questions.map((question: any) => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-semibold text-xs">
                              {question.questionNumber}
                            </div>
                            <h4 className="font-medium text-sm">{question.title}</h4>
                            <Badge 
                              variant={question.isActive ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {question.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {question.submissionType.replace('_', ' ').toLowerCase()}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {question.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{question._count.submissions} submissions</span>
                          <span>{question._count.baseExamples} examples</span>
                          <span>Created {new Date(question.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/courses/${encodeURIComponent(courseName)}/${question.questionNumber}`}>
                              <Eye className="mr-1 h-3 w-3" />
                              Preview
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/courses/${question.course.id}`}>
                              <Edit className="mr-1 h-3 w-3" />
                              Edit
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