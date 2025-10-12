import Link from 'next/link'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { findQuestionByNumber } from '@/lib/actions/lookup-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sidebar } from '@/components/layout/Sidebar'
import {
  ArrowLeft,
  FileText,
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  GitBranch,
  Globe,
  Image,
  FileIcon
} from 'lucide-react'

interface QuestionDetailPageProps {
  params: Promise<{
    courseName: string
    assessmentNumber: string
  }>
}

function getSubmissionTypeIcon(submissionType: string) {
  switch (submissionType) {
    case 'GITHUB_REPO':
      return <GitBranch className="h-5 w-5" />
    case 'WEBSITE':
      return <Globe className="h-5 w-5" />
    case 'SCREENSHOT':
      return <Image className="h-5 w-5" />
    case 'DOCUMENT':
      return <FileIcon className="h-5 w-5" />
    case 'TEXT':
    default:
      return <FileText className="h-5 w-5" />
  }
}

function getSubmissionTypeDescription(submissionType: string) {
  switch (submissionType) {
    case 'TEXT':
      return 'Write your response directly in the text area'
    case 'GITHUB_REPO':
      return 'Submit a link to your GitHub repository'
    case 'WEBSITE':
      return 'Submit a link to your live website or web application'
    case 'DOCUMENT':
      return 'Upload or paste your document content'
    case 'SCREENSHOT':
      return 'Upload a screenshot or describe your visual work'
    default:
      return 'Follow the submission instructions below'
  }
}

export default async function QuestionDetailPage({ params }: QuestionDetailPageProps) {
  const { courseName: rawCourseName, assessmentNumber: rawAssessmentNumber } = await params
  const courseName = decodeURIComponent(rawCourseName)
  // Require authentication to view assessment details
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/courses/${rawCourseName}/${rawAssessmentNumber}`)}`)
  }

  const assessmentNumber = parseInt(rawAssessmentNumber)
  
  const questionResult = await findQuestionByNumber(courseName, assessmentNumber)
  
  if (!questionResult.success) {
    notFound()
  }
  
  const question = questionResult.data

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />

      <main className="flex-1 lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200">
          <div className="px-6 py-6 md:px-12">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="rounded-xl" asChild>
                <Link href={`/courses/${encodeURIComponent(courseName)}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {question.course.name}
                </Link>
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-full font-semibold text-sm shadow-lg">
                    {assessmentNumber}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">{question.title}</h1>
                </div>
                <div className="flex items-center gap-4 text-gray-600">
                  <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                    {question.submissionType.replace('_', ' ').toLowerCase()}
                  </Badge>
                  <span className="text-sm">Self-paced • Instant feedback</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-6 py-8 md:px-12">
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Assessment Content */}
          <div className="lg:col-span-2">
            {/* Assessment Description */}
            <Card className="mb-6 rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-teal-600" />
                  Assessment Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {question.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Submission Requirements */}
            <Card className="mb-6 rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-teal-600">{getSubmissionTypeIcon(question.submissionType)}</span>
                  Submission Requirements
                </CardTitle>
                <CardDescription>
                  {getSubmissionTypeDescription(question.submissionType)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {question.submissionType === 'TEXT' && (
                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                      <h4 className="font-medium text-teal-900 mb-2">Text Submission</h4>
                      <p className="text-teal-800 text-sm">
                        Provide a detailed written response. Your answer will be evaluated for completeness,
                        accuracy, and depth of understanding.
                      </p>
                    </div>
                  )}

                  {question.submissionType === 'GITHUB_REPO' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <h4 className="font-medium text-gray-900 mb-2">GitHub Repository Submission</h4>
                      <p className="text-gray-700 text-sm mb-3">
                        Submit a link to your GitHub repository. Make sure your repository includes:
                      </p>
                      <ul className="text-sm text-gray-700 space-y-1 ml-4">
                        <li>• A comprehensive README.md file</li>
                        <li>• Well-organized code structure</li>
                        <li>• Clear documentation and comments</li>
                        <li>• Working functionality as requested</li>
                      </ul>
                    </div>
                  )}

                  {question.submissionType === 'WEBSITE' && (
                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                      <h4 className="font-medium text-teal-900 mb-2">Website Submission</h4>
                      <p className="text-teal-800 text-sm mb-3">
                        Submit a link to your live website or web application. Ensure:
                      </p>
                      <ul className="text-sm text-teal-800 space-y-1 ml-4">
                        <li>• The website is publicly accessible</li>
                        <li>• All functionality works as expected</li>
                        <li>• The design is responsive and professional</li>
                        <li>• Loading times are reasonable</li>
                      </ul>
                    </div>
                  )}

                  {question.submissionType === 'DOCUMENT' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Document Submission</h4>
                      <p className="text-gray-700 text-sm">
                        You can either paste your document content directly or provide a link to
                        an online document (Google Docs, etc.). Ensure proper formatting and completeness.
                      </p>
                    </div>
                  )}

                  {question.submissionType === 'SCREENSHOT' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Screenshot/Visual Submission</h4>
                      <p className="text-gray-700 text-sm">
                        Provide a detailed description of your screenshot or visual work.
                        If you have an image hosted online, you can include the link.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Guidance */}
            {question.guidance && (
              <Card className="rounded-2xl shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-teal-600" />
                    Assessment Guidance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                    <p className="text-teal-800 leading-relaxed">
                      {question.guidance}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">

              {/* Quick Actions */}
              <Card className="rounded-2xl shadow-md">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-teal-600 hover:bg-teal-700 rounded-xl" asChild>
                    <Link href={`/submit/${encodeURIComponent(courseName)}/${assessmentNumber}`}>
                      <Play className="mr-2 h-4 w-4" />
                      Submit Assessment
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full rounded-xl" asChild>
                    <Link href={`/courses/${encodeURIComponent(courseName)}`}>
                      Back to Course
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Assessment Info */}
              <Card className="rounded-2xl shadow-md">
                <CardHeader>
                  <CardTitle>Assessment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Course</h4>
                    <p className="text-gray-600 text-sm">{question.course.name}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Assessment Number</h4>
                    <p className="text-gray-600 text-sm">#{assessmentNumber}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Submission Type</h4>
                    <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                      {question.submissionType.replace('_', ' ').toLowerCase()}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Assessment Features</h4>
                    <div className="space-y-2">
                      {(question.assessmentMode === 'AI_ONLY' || question.assessmentMode === 'BOTH') && (
                        <>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-teal-600" />
                            <span>Instant AI feedback</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-teal-600" />
                            <span>Base example comparison</span>
                          </div>
                        </>
                      )}
                      {question.assessmentMode === 'MANUAL_ONLY' && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-amber-600" />
                          <span>Instructor review and feedback</span>
                        </div>
                      )}
                      {question.assessmentMode === 'BOTH' && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-purple-600" />
                          <span>Instructor review after AI assessment</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-teal-600" />
                        <span>Detailed improvement suggestions</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-teal-600" />
                        <span>Unlimited attempts</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assessment Process */}
              <Card className="rounded-2xl shadow-md">
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-full font-semibold text-xs shadow-lg">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">Submit Your Work</p>
                        <p className="text-xs text-gray-600">
                          Follow the submission requirements above
                        </p>
                      </div>
                    </div>

                    {question.assessmentMode === 'AI_ONLY' && (
                      <>
                        <div className="flex gap-3">
                          <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-full font-semibold text-xs shadow-lg">
                            2
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">AI Assessment</p>
                            <p className="text-xs text-gray-600">
                              Get instant feedback in 5-10 seconds
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-full font-semibold text-xs shadow-lg">
                            3
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">Review Results</p>
                            <p className="text-xs text-gray-600">
                              See your grade and improvement areas
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                    {question.assessmentMode === 'MANUAL_ONLY' && (
                      <>
                        <div className="flex gap-3">
                          <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-full font-semibold text-xs shadow-lg">
                            2
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">Instructor Review</p>
                            <p className="text-xs text-gray-600">
                              Your work will be reviewed by an instructor
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-full font-semibold text-xs shadow-lg">
                            3
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">Receive Feedback</p>
                            <p className="text-xs text-gray-600">
                              Get detailed manual feedback and grade
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                    {question.assessmentMode === 'BOTH' && (
                      <>
                        <div className="flex gap-3">
                          <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-full font-semibold text-xs shadow-lg">
                            2
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">AI Assessment</p>
                            <p className="text-xs text-gray-600">
                              Get instant feedback in 5-10 seconds
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full font-semibold text-xs shadow-lg">
                            3
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">Instructor Review</p>
                            <p className="text-xs text-gray-600">
                              Then receive additional instructor feedback
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex gap-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-full font-semibold text-xs shadow-lg">
                        4
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">Improve & Retry</p>
                        <p className="text-xs text-gray-600">
                          Make improvements and submit again
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <Card className="rounded-2xl shadow-md">
                <CardHeader>
                  <CardTitle>Navigation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <Link
                      href="/courses"
                      className="block text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      ← All Courses
                    </Link>
                    <Link
                      href={`/courses/${encodeURIComponent(courseName)}`}
                      className="block text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      ← {question.course.name}
                    </Link>
                    <Link
                      href="/submit"
                      className="block text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      Submit Any Assessment →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12">
          <Card className="bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200 rounded-2xl shadow-md">
            <CardContent className="text-center py-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Ready to Get Started?
              </h3>
              <p className="text-gray-600 mb-6">
                Submit your work now and receive instant AI-powered feedback to help you improve.
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" className="bg-teal-600 hover:bg-teal-700 rounded-xl" asChild>
                  <Link href={`/submit/${encodeURIComponent(courseName)}/${assessmentNumber}`}>
                    <Play className="mr-2 h-4 w-4" />
                    Submit Assessment
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-xl" asChild>
                  <Link href={`/courses/${encodeURIComponent(courseName)}`}>
                    View Other Assessments
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </main>
    </div>
  )
}
