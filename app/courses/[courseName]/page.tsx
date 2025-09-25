import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findCourseByName, getCourseQuestions } from '@/lib/actions/lookup-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Play, Clock, CheckCircle, ArrowRight, BookOpen } from 'lucide-react'

interface CourseDetailPageProps {
  params: Promise<{
    courseName: string
  }>
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseName: rawCourseName } = await params
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
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
            <Button asChild>
              <Link href={`/submit?courseName=${encodeURIComponent(courseName)}`}>
                Start Assessment
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Course Information Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
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
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Instant AI feedback</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Self-paced learning</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>No registration required</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Multiple submission types</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Quick Stats</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="font-bold text-blue-600">{questions.length}</div>
                      <div className="text-gray-600">Questions</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="font-bold text-green-600">∞</div>
                      <div className="text-gray-600">Attempts</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button className="w-full" asChild>
                    <Link href={`/submit?courseName=${encodeURIComponent(courseName)}`}>
                      <Play className="mr-2 h-4 w-4" />
                      Start First Question
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
                Assessment Questions
              </h2>
              <p className="text-gray-600">
                Complete questions in any order. Each provides instant feedback to help you learn.
              </p>
            </div>

            {questions.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <CardTitle className="mb-2">No Questions Available</CardTitle>
                  <CardDescription className="mb-6">
                    Questions for this course are being prepared. Please check back soon.
                  </CardDescription>
                  <Button variant="outline" asChild>
                    <Link href="/courses">Browse Other Courses</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {questions.map((question: any, index: number) => (
                  <Card key={question.id} className="hover:shadow-lg transition-all duration-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                              {question.questionNumber}
                            </div>
                            <CardTitle className="text-lg">{question.title}</CardTitle>
                            <Badge variant="outline" className="text-xs">
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
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/courses/${encodeURIComponent(courseName)}/${question.questionNumber}`}>
                              View Details
                            </Link>
                          </Button>
                          <Button size="sm" asChild>
                            <Link href={`/submit?courseName=${encodeURIComponent(courseName)}&questionNumber=${question.questionNumber}`}>
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Start
                            </Link>
                          </Button>
                        </div>
                      </div>

                      {question.guidance && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-800">
                            <strong>Guidance:</strong> {question.guidance}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Course Completion CTA */}
            {questions.length > 0 && (
              <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="text-center py-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Ready to Test Your Knowledge?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Start with any question and get instant AI-powered feedback to improve your understanding.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button size="lg" asChild>
                      <Link href={`/submit?courseName=${encodeURIComponent(courseName)}&questionNumber=1`}>
                        Start Question 1
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <Link href={`/submit?courseName=${encodeURIComponent(courseName)}`}>
                        Choose Question
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}