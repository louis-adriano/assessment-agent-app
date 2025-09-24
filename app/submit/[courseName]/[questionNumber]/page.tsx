import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { findQuestionByNumber } from '@/lib/actions/lookup-actions'
import { submitAnonymousAssessment } from '@/lib/actions/submission-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  FileText, 
  Github,
  Globe,
  Image,
  FileIcon,
  Upload,
  AlertCircle,
  Info,
  Send
} from 'lucide-react'

interface SubmissionFormPageProps {
  params: {
    courseName: string
    questionNumber: string
  }
}

async function handleSubmission(formData: FormData) {
  'use server'
  
  const result = await submitAnonymousAssessment(formData)
  
  if (result.success) {
    redirect(`/results/${result.data.submissionId}`)
  } else {
    throw new Error(result.error || 'Failed to submit assessment')
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

function TextSubmissionForm({ question }: { question: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Text Response Required</h4>
            <p className="text-blue-800 text-sm">
              Provide a comprehensive written response. Your answer will be evaluated for 
              completeness, accuracy, and depth of understanding.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="submissionContent" className="text-base font-medium">
          Your Response *
        </Label>
        <Textarea
          id="submissionContent"
          name="submissionContent"
          rows={12}
          placeholder="Write your detailed response here..."
          required
          className="min-h-[300px] text-base"
        />
        <p className="text-sm text-gray-600">
          Tip: Be thorough and specific. The AI will assess your response against the question requirements.
        </p>
      </div>
    </div>
  )
}

function GitHubSubmissionForm({ question }: { question: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Github className="h-5 w-5 text-gray-700 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900 mb-1">GitHub Repository Submission</h4>
            <p className="text-gray-700 text-sm mb-2">
              Submit a link to your GitHub repository. Make sure it includes:
            </p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4">
              <li>• A comprehensive README.md file</li>
              <li>• Well-organized code structure</li>
              <li>• Clear documentation and comments</li>
              <li>• Working functionality as requested</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="submissionUrl" className="text-base font-medium">
            GitHub Repository URL *
          </Label>
          <Input
            id="submissionUrl"
            name="submissionUrl"
            type="url"
            placeholder="https://github.com/your-username/your-repository"
            required
            className="text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="submissionContent" className="text-base font-medium">
            Repository Description
          </Label>
          <Textarea
            id="submissionContent"
            name="submissionContent"
            rows={6}
            placeholder="Describe your repository: key features, technologies used, how to run it, and any special considerations..."
            className="text-base"
          />
          <p className="text-sm text-gray-600">
            Optional but recommended: Provide context about your implementation choices and features.
          </p>
        </div>
      </div>
    </div>
  )
}

function WebsiteSubmissionForm({ question }: { question: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Globe className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900 mb-1">Live Website Submission</h4>
            <p className="text-green-800 text-sm mb-2">
              Submit a link to your live website or web application. Ensure:
            </p>
            <ul className="text-sm text-green-800 space-y-1 ml-4">
              <li>• The website is publicly accessible</li>
              <li>• All functionality works as expected</li>
              <li>• The design is responsive and professional</li>
              <li>• Loading times are reasonable</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="submissionUrl" className="text-base font-medium">
            Website URL *
          </Label>
          <Input
            id="submissionUrl"
            name="submissionUrl"
            type="url"
            placeholder="https://your-website.com or https://your-project.vercel.app"
            required
            className="text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="submissionContent" className="text-base font-medium">
            Website Description
          </Label>
          <Textarea
            id="submissionContent"
            name="submissionContent"
            rows={6}
            placeholder="Describe your website: main features, technologies used, design decisions, and any special functionality..."
            className="text-base"
          />
          <p className="text-sm text-gray-600">
            Optional but recommended: Highlight key features and technical decisions for better assessment.
          </p>
        </div>
      </div>
    </div>
  )
}

function DocumentSubmissionForm({ question }: { question: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileIcon className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-purple-900 mb-1">Document Submission</h4>
            <p className="text-purple-800 text-sm">
              You can either paste your document content directly or provide a link to 
              an online document (Google Docs, etc.). Ensure proper formatting and completeness.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="submissionContent" className="text-base font-medium">
            Document Content *
          </Label>
          <Textarea
            id="submissionContent"
            name="submissionContent"
            rows={12}
            placeholder="Paste your complete document content here..."
            required
            className="min-h-[300px] text-base font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="submissionUrl" className="text-base font-medium">
            Document URL (Optional)
          </Label>
          <Input
            id="submissionUrl"
            name="submissionUrl"
            type="url"
            placeholder="https://docs.google.com/document/... (optional)"
            className="text-base"
          />
          <p className="text-sm text-gray-600">
            If you have your document hosted online, you can include the link here.
          </p>
        </div>
      </div>
    </div>
  )
}

function ScreenshotSubmissionForm({ question }: { question: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Image className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-orange-900 mb-1">Screenshot/Visual Submission</h4>
            <p className="text-orange-800 text-sm">
              Provide a detailed description of your screenshot or visual work. 
              If you have an image hosted online, you can include the link.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="submissionContent" className="text-base font-medium">
            Visual Description *
          </Label>
          <Textarea
            id="submissionContent"
            name="submissionContent"
            rows={8}
            placeholder="Describe your screenshot/visual work in detail: what it shows, key elements, design decisions, functionality demonstrated..."
            required
            className="text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="submissionUrl" className="text-base font-medium">
            Image URL (Optional)
          </Label>
          <Input
            id="submissionUrl"
            name="submissionUrl"
            type="url"
            placeholder="https://example.com/your-image.png (optional)"
            className="text-base"
          />
          <p className="text-sm text-gray-600">
            If you have your image hosted online (imgur, dropbox, etc.), include the link.
          </p>
        </div>
      </div>
    </div>
  )
}

export default async function SubmissionFormPage({ params }: SubmissionFormPageProps) {
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
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/courses/${encodeURIComponent(courseName)}/${questionNumber}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Question Details
              </Link>
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                  {questionNumber}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{question.title}</h1>
              </div>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="text-sm">{question.course.name}</span>
                <Badge variant="outline">
                  {question.submissionType.replace('_', ' ').toLowerCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Submission Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getSubmissionTypeIcon(question.submissionType)}
                  Submit Your Work
                </CardTitle>
                <CardDescription>
                  Complete the form below to submit your work for AI assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={handleSubmission} className="space-y-6">
                  <input type="hidden" name="courseName" value={courseName} />
                  <input type="hidden" name="questionNumber" value={questionNumber} />
                  
                  {/* Dynamic Form Based on Submission Type */}
                  {question.submissionType === 'TEXT' && <TextSubmissionForm question={question} />}
                  {question.submissionType === 'GITHUB_REPO' && <GitHubSubmissionForm question={question} />}
                  {question.submissionType === 'WEBSITE' && <WebsiteSubmissionForm question={question} />}
                  {question.submissionType === 'DOCUMENT' && <DocumentSubmissionForm question={question} />}
                  {question.submissionType === 'SCREENSHOT' && <ScreenshotSubmissionForm question={question} />}

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-6">
                    <Button type="submit" size="lg" className="flex-1">
                      <Send className="mr-2 h-4 w-4" />
                      Submit for Assessment
                    </Button>
                    <Button type="button" variant="outline" size="lg" asChild>
                      <Link href={`/courses/${encodeURIComponent(courseName)}`}>
                        Cancel
                      </Link>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              
              {/* Question Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assessment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Question</h4>
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {question.description}
                    </p>
                  </div>

                  {question.guidance && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Guidance</h4>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-amber-800 text-sm">
                          {question.guidance}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* What Happens Next */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className="h-5 w-5" />
                    What Happens Next
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-semibold text-xs">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">AI Assessment</p>
                        <p className="text-xs text-gray-600">Your work is evaluated in 5-10 seconds</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-semibold text-xs">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">Instant Results</p>
                        <p className="text-xs text-gray-600">See your grade and detailed feedback</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-semibold text-xs">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">Improve & Retry</p>
                        <p className="text-xs text-gray-600">Make improvements and submit again</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assessment Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assessment Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <AlertCircle className="h-4 w-4 text-green-600" />
                      <span>AI-powered evaluation</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <AlertCircle className="h-4 w-4 text-green-600" />
                      <span>Instant detailed feedback</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <AlertCircle className="h-4 w-4 text-green-600" />
                      <span>Base example comparison</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <AlertCircle className="h-4 w-4 text-green-600" />
                      <span>Unlimited submissions</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <AlertCircle className="h-4 w-4 text-green-600" />
                      <span>No registration required</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}