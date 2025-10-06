'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Github, Globe, FileText, Image, Upload, CheckCircle, XCircle, ArrowLeft, Info, LogIn } from 'lucide-react'
import { getCourseByName } from '@/lib/actions/lookup-actions'
import { submitAnonymousAssessment, submitAuthenticatedAssessment } from '@/lib/actions/submission-actions'
import { Sidebar } from '@/components/layout/Sidebar'
import { useSession } from '@/lib/auth-client'
import Link from 'next/link'

interface Course {
  id: string
  name: string
  description: string
  questions: Question[]
}

interface Question {
  id: string
  questionNumber: number
  title: string
  description: string
  submissionType: string
  guidance?: string
}

function SubmitPageContent() {
  const [course, setCourse] = useState<Course | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const [submissionData, setSubmissionData] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submissionId, setSubmissionId] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const courseName = searchParams.get('courseName')
  const assessmentNumber = searchParams.get('assessmentNumber')

  useEffect(() => {
    if (courseName && assessmentNumber) {
      loadCourseAndQuestion()
    }
  }, [courseName, assessmentNumber])

  const loadCourseAndQuestion = async () => {
    if (!courseName || !assessmentNumber) return
    
    try {
      const courseResult = await getCourseByName(courseName)
      if (courseResult.success && courseResult.data) {
        setCourse(courseResult.data)
        const foundQuestion = courseResult.data.questions.find(
          (q: any) => q.questionNumber === parseInt(assessmentNumber)
        )
        if (foundQuestion) {
          setQuestion(foundQuestion)
        } else {
          setError(`Assessment #${assessmentNumber} not found in course "${courseName}"`)
        }
      } else {
        setError(`Course "${courseName}" not found`)
      }
    } catch (err) {
      setError('Failed to load course information')
    }
  }

  const validateSubmission = (): string[] => {
    const errors: string[] = []

    if (!question) return ['Question not loaded']

    switch (question.submissionType) {
      case 'GITHUB_REPO':
        if (!submissionData.trim()) {
          errors.push('GitHub repository URL is required')
        } else if (!submissionData.match(/^https:\/\/github\.com\/[\w-]+\/[\w.-]+/)) {
          errors.push('Please provide a valid GitHub repository URL (e.g., https://github.com/username/repo)')
        }
        break

      case 'WEBSITE':
        if (!submissionData.trim()) {
          errors.push('Website URL is required')
        } else if (!submissionData.match(/^https?:\/\/.+/)) {
          errors.push('Please provide a valid website URL starting with http:// or https://')
        }
        break

      case 'TEXT':
        if (!submissionData.trim()) {
          errors.push('Text content is required')
        } else if (submissionData.trim().length < 10) {
          errors.push('Please provide at least 10 characters of text')
        }
        break

      case 'DOCUMENT':
      case 'SCREENSHOT':
        if (!file) {
          errors.push('File upload is required')
        } else {
          const maxSize = 10 * 1024 * 1024 // 10MB
          if (file.size > maxSize) {
            errors.push('File size must be less than 10MB')
          }
          
          if (question.submissionType === 'DOCUMENT') {
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
            if (!allowedTypes.includes(file.type)) {
              errors.push('Document must be PDF, Word document, or text file')
            }
          } else if (question.submissionType === 'SCREENSHOT') {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            if (!allowedTypes.includes(file.type)) {
              errors.push('Screenshot must be JPEG, PNG, GIF, or WebP image')
            }
          }
        }
        break
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateSubmission()
    setValidationErrors(errors)
    
    if (errors.length > 0) {
      return
    }
    
    if (!question || !course) {
      setError('Course or question not loaded')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')
    
    try {
      const formData = new FormData()
      formData.append('courseName', course.name)
      formData.append('assessmentNumber', question.questionNumber.toString())
      
      if (['GITHUB_REPO', 'WEBSITE', 'TEXT'].includes(question.submissionType)) {
        formData.append('submissionContent', submissionData)
      }

      if (file && ['DOCUMENT', 'SCREENSHOT'].includes(question.submissionType)) {
        formData.append('file', file)
      }

      // Submit assessment (AI will grade automatically)
      const result = await submitAnonymousAssessment(formData)

      if (result.success && result.submissionId) {
        setSuccess('Assessment completed successfully!')
        setSubmissionId(result.submissionId)
        // Redirect to results page after 2 seconds
        setTimeout(() => {
          router.push(`/results/${result.submissionId}`)
        }, 2000)
      } else {
        setError(result.error || 'Submission failed')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSubmissionTypeIcon = (type: string) => {
    switch (type) {
      case 'GITHUB_REPO': return <Github className="h-5 w-5" />
      case 'WEBSITE': return <Globe className="h-5 w-5" />
      case 'DOCUMENT': return <FileText className="h-5 w-5" />
      case 'SCREENSHOT': return <Image className="h-5 w-5" />
      case 'TEXT': return <FileText className="h-5 w-5" />
      default: return <Upload className="h-5 w-5" />
    }
  }

  const getSubmissionTypeLabel = (type: string) => {
    switch (type) {
      case 'GITHUB_REPO': return 'GitHub Repository'
      case 'WEBSITE': return 'Website URL'
      case 'DOCUMENT': return 'Document Upload'
      case 'SCREENSHOT': return 'Screenshot Upload'
      case 'TEXT': return 'Text Submission'
      default: return 'File Upload'
    }
  }

  const renderSubmissionForm = () => {
    if (!question) return null

    switch (question.submissionType) {
      case 'GITHUB_REPO':
        return (
          <div className="space-y-4">
            <Label htmlFor="repo-url">GitHub Repository URL</Label>
            <Input
              id="repo-url"
              type="url"
              placeholder="https://github.com/username/repository"
              value={submissionData}
              onChange={(e) => setSubmissionData(e.target.value)}
              className="font-mono"
            />
            <div className="text-sm text-muted-foreground">
              <Info className="h-4 w-4 inline mr-1" />
              Make sure your repository is public or provide access to our assessment bot
            </div>
          </div>
        )

      case 'WEBSITE':
        return (
          <div className="space-y-4">
            <Label htmlFor="website-url">Website URL</Label>
            <Input
              id="website-url"
              type="url"
              placeholder="https://your-website.com"
              value={submissionData}
              onChange={(e) => setSubmissionData(e.target.value)}
              className="font-mono"
            />
            <div className="text-sm text-muted-foreground">
              <Info className="h-4 w-4 inline mr-1" />
              We'll test your website for functionality and accessibility
            </div>
          </div>
        )

      case 'TEXT':
        return (
          <div className="space-y-4">
            <Label htmlFor="text-content">Your Submission</Label>
            <Textarea
              id="text-content"
              placeholder="Enter your text submission here..."
              value={submissionData}
              onChange={(e) => setSubmissionData(e.target.value)}
              className="min-h-32"
            />
            <div className="text-sm text-muted-foreground">
              <Info className="h-4 w-4 inline mr-1" />
              Provide detailed content for accurate assessment
            </div>
          </div>
        )

      case 'DOCUMENT':
        return (
          <div className="space-y-4">
            <Label htmlFor="document-file">Upload Document</Label>
            <Input
              id="document-file"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="text-sm text-muted-foreground">
              <Info className="h-4 w-4 inline mr-1" />
              Accepted formats: PDF, Word documents, or text files (max 10MB)
            </div>
          </div>
        )

      case 'SCREENSHOT':
        return (
          <div className="space-y-4">
            <Label htmlFor="screenshot-file">Upload Screenshot</Label>
            <Input
              id="screenshot-file"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="text-sm text-muted-foreground">
              <Info className="h-4 w-4 inline mr-1" />
              Accepted formats: JPEG, PNG, GIF, WebP (max 10MB)
            </div>
          </div>
        )
        
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Unsupported submission type: {question.submissionType}
          </div>
        )
    }
  }

  if (!courseName || !assessmentNumber) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="flex-1 lg:pl-72">
          <div className="px-6 py-12 md:px-12">
            <div className="max-w-2xl mx-auto">
              <Card className="rounded-2xl shadow-md">
                <CardContent className="pt-6">
                  <Alert variant="destructive" className="rounded-xl">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Invalid submission URL. Please access this page from a course assessment link.
                    </AlertDescription>
                  </Alert>
                  <div className="mt-4">
                    <Link href="/">
                      <Button variant="outline" className="rounded-xl">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Courses
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className="flex-1 lg:pl-72">
        <div className="px-6 py-12 md:px-12">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Navigation */}
            <Link href="/">
              <Button variant="outline" size="sm" className="rounded-xl">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Courses
              </Button>
            </Link>

            {/* Course and Question Info */}
            {course && question && (
              <Card className="rounded-2xl shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-teal-100 text-teal-700">{course.name}</Badge>
                        <Badge variant="outline" className="border-teal-200 text-teal-700">Assessment #{question.questionNumber}</Badge>
                      </div>
                      <CardTitle className="text-2xl">{question.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-teal-600">
                      {getSubmissionTypeIcon(question.submissionType)}
                      <span className="text-sm font-medium">
                        {getSubmissionTypeLabel(question.submissionType)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-gray-600">{question.description}</p>
                    </div>

                    {question.guidance && (
                      <div>
                        <h3 className="font-semibold mb-2">Guidance</h3>
                        <div className="bg-teal-50 p-4 rounded-xl border border-teal-200">
                          <p className="text-teal-800">{question.guidance}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}


          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="rounded-xl">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="rounded-xl">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-teal-200 bg-teal-50 rounded-xl">
              <CheckCircle className="h-4 w-4 text-teal-600" />
              <AlertDescription className="text-teal-800">
                {success} Redirecting to results...
              </AlertDescription>
            </Alert>
          )}

          {/* Submission Form */}
          {question && !success && (
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle>Submit Your Work</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {renderSubmissionForm()}

                  <Button
                    type="submit"
                    disabled={isSubmitting || !!success}
                    className="w-full bg-teal-600 hover:bg-teal-700 rounded-xl"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Assessment...
                      </>
                    ) : (
                      <>
                        Submit for Assessment
                        <Upload className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Results Link */}
          {submissionId && (
            <Card className="bg-teal-50 border-teal-200 rounded-2xl shadow-md">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="text-teal-800">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-teal-600" />
                    <h3 className="font-semibold">Assessment Complete!</h3>
                  </div>
                  <Link href={`/results/${submissionId}`}>
                    <Button className="bg-teal-600 hover:bg-teal-700 rounded-xl">
                      View Your Results
                    </Button>
                  </Link>
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

export default function SubmitPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-teal-600" />
          <p className="text-gray-600">Loading submission form...</p>
        </div>
      </div>
    }>
      <SubmitPageContent />
    </Suspense>
  )
}