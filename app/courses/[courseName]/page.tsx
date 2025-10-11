import Link from 'next/link'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { findCourseByName, getCourseQuestions } from '@/lib/actions/lookup-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sidebar } from '@/components/layout/Sidebar'
import { ArrowLeft, FileText, Play, Clock, CheckCircle, ArrowRight, BookOpen } from 'lucide-react'

interface CourseDetailPageProps {
  params: Promise<{
    courseName: string
  }>
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseName: rawCourseName } = await params
  
  // Require authentication to view course details
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/courses/${rawCourseName}`)}`)
  }

  const courseName = decodeURIComponent(rawCourseName)
  
  // Get course information
  const courseResult = await findCourseByName(courseName)
  if (!courseResult.success) {
    notFound()
  }
  
  // Get course questions
  const questionsResult = await getCourseQuestions(courseName)
  const questions = questionsResult.success ? questionsResult.data : []
  
  const course = courseResult.data

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />

      <main className="flex-1 lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200">
          <div className="px-6 py-6 md:px-12">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="rounded-xl" asChild>
                <Link href="/courses">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  All Courses
                </Link>
              </Button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{course.name}</h1>
                <p className="mt-1 text-gray-600">
                  {questions.length} questions • Self-paced learning • Instant feedback
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-6 py-8 md:px-12">
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Course Information Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-teal-600" />
                  Course Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {course.description || 'This course provides hands-on assessments to test your knowledge and skills. Get instant AI-powered feedback to improve your understanding.'}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Course Features</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-teal-600" />
                      <span>Instant AI feedback</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-teal-600" />
                      <span>Self-paced learning</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-teal-600" />
                      <span>Registration required</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-teal-600" />
                      <span>Multiple submission types</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Quick Stats</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 bg-teal-50 rounded-xl">
                      <div className="font-bold text-teal-600">{questions.length}</div>
                      <div className="text-gray-600">Questions</div>
                    </div>
                    <div className="text-center p-3 bg-teal-50 rounded-xl">
                      <div className="font-bold text-teal-600">∞</div>
                      <div className="text-gray-600">Attempts</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button className="w-full bg-teal-600 hover:bg-teal-700 rounded-xl" asChild>
                    <Link href={`/courses/${encodeURIComponent(courseName)}/1`}>
                      <Play className="mr-2 h-4 w-4" />
                      Start Course
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Questions List */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Course Assessments
              </h2>
              <p className="text-gray-600">
                Complete assessments at your own pace and track your progress throughout the course.
              </p>
            </div>

            {questions.length === 0 ? (
              <Card className="text-center py-12 rounded-2xl shadow-md">
                <CardContent>
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <CardTitle className="mb-2">No Questions Available</CardTitle>
                  <CardDescription className="mb-6">
                    Questions for this course are being prepared. Please check back soon.
                  </CardDescription>
                  <Button variant="outline" className="rounded-xl" asChild>
                    <Link href="/courses">Browse Other Courses</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {questions.map((question: any) => (
                  <Card key={question.id} className="hover:shadow-xl transition-all duration-200 rounded-2xl shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-full font-semibold text-sm shadow-lg">
                              {question.questionNumber}
                            </div>
                            <CardTitle className="text-lg">{question.title}</CardTitle>
                            <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                              {question.submissionType.replace('_', ' ').toLowerCase()}
                            </Badge>
                          </div>
                          <CardDescription className="text-sm leading-relaxed">
                            {question.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Self-paced</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>
                              {question.submissionType === 'TEXT' ? 'Text response' :
                               question.submissionType === 'GITHUB_REPO' ? 'GitHub repository' :
                               question.submissionType === 'WEBSITE' ? 'Website URL' :
                               question.submissionType === 'DOCUMENT' ? 'Document upload' :
                               'Screenshot/Image'}
                            </span>
                          </div>
                        </div>

                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 rounded-xl" asChild>
                          <Link href={`/courses/${encodeURIComponent(courseName)}/${question.questionNumber}`}>
                            Start Assessment
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>

                      {question.guidance && (
                        <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-xl">
                          <p className="text-sm text-teal-800">
                            <strong>Guidance:</strong> {question.guidance}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

          </div>
        </div>
        </div>
      </main>
    </div>
  )
}