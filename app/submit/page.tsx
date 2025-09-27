'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Github, Globe, FileText, Image, Upload, CheckCircle, XCircle } from 'lucide-react'
import { getCourseByName } from '@/lib/actions/lookup-actions'
import { handleFormSubmission } from '@/lib/actions/submit-page-actions'

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

export default function SubmitPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const [submissionContent, setSubmissionContent] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [validationError, setValidationError] = useState('')
  const [githubValidation, setGithubValidation] = useState<{isValid: boolean, message: string} | null>(null)

  // Get course and question from URL params
  const courseName = searchParams.get('course')
  const questionNumber = searchParams.get('question')

  useEffect(() => {
    if (courseName && questionNumber) {
      loadCourseAndQuestion()
    }
  }, [courseName, questionNumber])

  const loadCourseAndQuestion = async () => {
    if (!courseName || !questionNumber) return

    try {
      const result = await getCourseByName(courseName)
      if (result.success && result.data) {
        setCourse(result.data)
        const q = result.data.questions.find(
          (q: Question) => q.questionNumber === parseInt(questionNumber)
        )
        if (q) {
          setQuestion(q)
        } else {
          setValidationError(`Question ${questionNumber} not found in course "${courseName}"`)
        }
      } else {
        setValidationError(result.error || `Course "${courseName}" not found`)
      }
    } catch (error) {
      console.error('Error loading course:', error)
      setValidationError('Failed to load course information')
    }
  }

  const validateGitHubUrl = (url: string) => {
    if (!url.trim()) {
      setGithubValidation(null)
      return
    }

    const githubPatterns = [
      /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?.*$/,
      /^github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?.*$/
    ]

    const isValid = githubPatterns.some(pattern => pattern.test(url.trim()))
    
    if (isValid) {
      setGithubValidation({
        isValid: true,
        message: 'Valid GitHub repository URL'
      })
    } else {
      setGithubValidation({
        isValid: false,
        message: 'Invalid GitHub URL format. Expected: https://github.com/owner/repository'
      })
    }
  }

  const handleGitHubUrlChange = (url: string) => {
    setSubmissionContent(url)
    if (question?.submissionType === 'github_repo') {
      validateGitHubUrl(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!course || !question) {
      setValidationError('Course or question not loaded')
      return
    }

    if (!submissionContent.trim()) {
      setValidationError('Submission content is required')
      return
    }

    // GitHub-specific validation
    if (question.submissionType === 'github_repo' && githubValidation && !githubValidation.isValid) {
      setValidationError('Please provide a valid GitHub repository URL')
      return
    }

    setIsSubmitting(true)
    setValidationError('')

    try {
      const formData = new FormData()
      formData.append('courseName', course.name)
      formData.append('questionNumber', question.questionNumber.toString())
      formData.append('submissionType', question.submissionType)
      formData.append('content', submissionContent)
      formData.append('additionalInfo', additionalInfo)

      await handleFormSubmission(formData)
    } catch (error) {
      console.error('Submission error:', error)
      setValidationError(error instanceof Error ? error.message : 'Failed to submit assessment')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!courseName || !questionNumber) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Missing course or question parameters. Please access this page through a proper course link.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (validationError && !course) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-red-600">{validationError}</p>
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getSubmissionIcon = (type: string) => {
    switch (type) {
      case 'github_repo':
        return <Github className="w-5 h-5" />
      case 'website':
        return <Globe className="w-5 h-5" />
      case 'document':
        return <FileText className="w-5 h-5" />
      case 'screenshot':
        return <Image className="w-5 h-5" />
      case 'text':
        return <FileText className="w-5 h-5" />
      default:
        return <Upload className="w-5 h-5" />
    }
  }

  const renderSubmissionField = () => {
    if (!question) return null

    switch (question.submissionType) {
      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor="content">Your Response</Label>
            <Textarea
              id="content"
              placeholder="Enter your text response here..."
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
              rows={8}
              className="min-h-[200px]"
            />
          </div>
        )

      case 'github_repo':
        return (
          <div className="space-y-2">
            <Label htmlFor="content">GitHub Repository URL</Label>
            <Input
              id="content"
              type="url"
              placeholder="https://github.com/username/repository-name"
              value={submissionContent}
              onChange={(e) => handleGitHubUrlChange(e.target.value)}
              className={githubValidation?.isValid === false ? 'border-red-500' : ''}
            />
            {githubValidation && (
              <div className={`flex items-center gap-2 text-sm ${
                githubValidation.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {githubValidation.isValid ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {githubValidation.message}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Provide a link to your GitHub repository. The repository should be public for assessment.
            </p>
          </div>
        )

      case 'website':
        return (
          <div className="space-y-2">
            <Label htmlFor="content">Website URL</Label>
            <Input
              id="content"
              type="url"
              placeholder="https://yourwebsite.com"
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Provide a link to your deployed website or web application.
            </p>
          </div>
        )

      case 'document':
        return (
          <div className="space-y-2">
            <Label htmlFor="content">Document URL or Content</Label>
            <Textarea
              id="content"
              placeholder="Paste your document content here or provide a link to your document..."
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
              rows={8}
              className="min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              You can paste document content directly or provide a link to a shared document (Google Docs, etc.).
            </p>
          </div>
        )

      case 'screenshot':
        return (
          <div className="space-y-2">
            <Label htmlFor="content">Image URL or Description</Label>
            <Textarea
              id="content"
              placeholder="Provide a link to your image or describe your screenshot/diagram..."
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Provide a link to your image file or describe the content of your screenshot/diagram.
            </p>
          </div>
        )

      default:
        return (
          <div className="space-y-2">
            <Label htmlFor="content">Submission Content</Label>
            <Textarea
              id="content"
              placeholder="Enter your submission content..."
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
              rows={6}
            />
          </div>
        )
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Submit Assessment</h1>
          <p className="text-muted-foreground">
            Submit your work for automated assessment and instant feedback
          </p>
        </div>

        {/* Course and Question Info */}
        {course && question && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {getSubmissionIcon(question.submissionType)}
                {question.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{course.name}</Badge>
                <Badge variant="secondary">Question {question.questionNumber}</Badge>
                <Badge>{question.submissionType.replace('_', ' ')}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {question.description && (
                  <div>
                    <h4 className="font-medium mb-2">Requirements:</h4>
                    <p className="text-sm text-muted-foreground">{question.description}</p>
                  </div>
                )}
                {question.guidance && (
                  <div>
                    <h4 className="font-medium mb-2">Guidance:</h4>
                    <p className="text-sm text-muted-foreground">{question.guidance}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Submission</CardTitle>
          </CardHeader>
          <CardContent>
            {renderSubmissionField()}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Information (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Notes or Context</Label>
              <Textarea
                id="additionalInfo"
                placeholder="Any additional context, notes, or explanations about your submission..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Validation Error */}
        {validationError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" />
                <p className="font-medium">{validationError}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !submissionContent.trim() || (question?.submissionType === 'github_repo' && githubValidation && !githubValidation.isValid)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Submit for Assessment'
            )}
          </Button>
        </div>

        {/* Information */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-sm space-y-2">
              <p><strong>What happens next?</strong></p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Your submission will be processed immediately using AI assessment</li>
                <li>You'll receive one of four grades: Excellent, Good, Can Improve, or Needs Improvement</li>
                <li>Detailed feedback will explain your grade and provide improvement suggestions</li>
                <li>Your results will be available via a unique link you can save or share</li>
                <li>No personal information is stored - submissions are anonymous</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}