import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findQuestionByNumber } from '@/lib/actions/lookup-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  FileText, 
  Play, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Github,
  Globe,
  Image,
  FileIcon
} from 'lucide-react'

interface QuestionDetailPageProps {
  params: {
    courseName: string
    questionNumber: string
  }
}

function getSubmissionTypeIcon(submissionType: string) {
  switch (submissionType) {
    case 'GITHUB_REPO':
      return <Github className="h-5 w-5" />
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
  const courseName = decodeURIComponent(params.courseName)
  const questionNumber = parseInt(params.questionNumber)
  
  const questionResult = await findQuestionByNumber(courseName, questionNumber)
  
  if (!questionResult.success) {
    notFound()
  }
  
  const question = questionResult.data

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/courses/${encodeURIComponent(courseName)}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {question.course.name}
              </Link>
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                  {questionNumber}
                </div>
                <h1 className="text-3xl font-bold text-gray-900">{question.title}</h1>
              </div>
              <div className="flex items-center gap-4 text-gray-600">
                <Badge variant="outline">
                  {question.submissionType.replace('_', ' ').toLowerCase()}
                </Badge>
                <span className="text-sm">Self-paced • Instant feedback</span>
              </div>
            </div>
            <Button asChild>
              <Link href={`/submit?courseName=${encodeURIComponent(courseName)}&questionNumber=${questionNumber}`}>
                <Play className="mr-2 h-4 w-4" />
                Start Assessment
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Question Content */}
          <div className="lg:col-span-2">
            {/* Question Description */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Question Description
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
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getSubmissionTypeIcon(question.submissionType)}
                  Submission Requirements
                </CardTitle>
                <CardDescription>
                  {getSubmissionTypeDescription(question.submissionType)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {question.submissionType === 'TEXT' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Text Submission</h4>
                      <p className="text-blue-800 text-sm">
                        Provide a detailed written response. Your answer will be evaluated for completeness, 
                        accuracy, and depth of understanding.
                      </p>
                    </div>
                  )}

                  {question.submissionType === 'GITHUB_REPO' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
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
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">Website Submission</h4>
                      <p className="text-green-800 text-sm mb-3">
                        Submit a link to your live website or web application. Ensure:
                      </p>
                      <ul className="text-sm text-green-800 space-y-1 ml-4">
                        <li>• The website is publicly accessible</li>
                        <li>• All functionality works as expected</li>
                        <li>• The design is responsive and professional</li>
                        <li>• Loading times are reasonable</li>
                      </ul>
                    </div>
                  )}

                  {question.submissionType === 'DOCUMENT' && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-medium text-purple-900 mb-2">Document Submission</h4>
                      <p className="text-purple-800 text-sm">
                        You can either paste your document content directly or provide a link to 
                        an online document (Google Docs, etc.). Ensure proper formatting and completeness.
                      </p>
                    </div>
                  )}

                  {question.submissionType === 'SCREENSHOT' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="font-medium text-orange-900 mb-2">Screenshot/Visual Submission</h4>
                      <p className="text-orange-800 text-sm">
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Assessment Guidance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-800 leading-relaxed">
                      {question.guidance}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" asChild>
                    <Link href={`/submit?courseName=${encodeURIComponent(courseName)}&questionNumber=${questionNumber}`}>
                      <Play className="mr-2 h-4 w-4" />
                      Start Assessment
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/courses/${encodeURIComponent(courseName)}`}>
                      View All Questions
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Question Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Question Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Course</h4>
                    <p className="text-gray-600 text-sm">{question.course.name}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Question Number</h4>
                    <p className="text-gray-600 text-sm">#{questionNumber}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Submission Type</h4>
                    <Badge variant="outline" className="text-xs">
                      {question.submissionType.replace('_', ' ').toLowerCase()}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Assessment Features</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Instant AI feedback</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Base example comparison</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Detailed improvement suggestions</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Unlimited attempts</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assessment Process */}
              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-semibold text-xs">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">Submit Your Work</p>
                        <p className="text-xs text-gray-600">
                          Follow the submission requirements above
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-semibold text-xs">
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
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-semibold text-xs">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">Review Results</p>
                        <p className="text-xs text-gray-600">
                          See your grade and improvement areas
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-semibold text-xs">
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
              <Card>
                <CardHeader>
                  <CardTitle>Navigation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <Link 
                      href="/courses" 
                      className="block text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      ← All Courses
                    </Link>
                    <Link 
                      href={`/courses/${encodeURIComponent(courseName)}`}
                      className="block text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      ← {question.course.name}
                    </Link>
                    <Link 
                      href="/submit" 
                      className="block text-blue-600 hover:text-blue-800 hover:underline"
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
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="text-center py-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Ready to Get Started?
              </h3>
              <p className="text-gray-600 mb-6">
                Submit your work now and receive instant AI-powered feedback to help you improve.
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href={`/submit?courseName=${encodeURIComponent(courseName)}&questionNumber=${questionNumber}`}>
                    <Play className="mr-2 h-4 w-4" />
                    Start Assessment
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href={`/courses/${encodeURIComponent(courseName)}`}>
                    View Other Questions
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}