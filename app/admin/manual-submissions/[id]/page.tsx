'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSubmissionForReview, submitManualFeedback } from '@/lib/actions/admin-submissions.actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, User, Calendar, FileText, Send, CheckCircle, Github, Globe, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'sonner'

interface SubmissionData {
  id: string
  submissionContent: string | null
  submissionUrl: string | null
  fileUrl: string | null
  status: string
  createdAt: Date
  reviewedAt: Date | null
  manualFeedback: string | null
  manualScore: string | null
  manualGrade: number | null
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
  question: {
    id: string
    title: string
    description: string
    questionNumber: number
    submissionType: string
    guidance: string | null
    criteria: string[]
    course: {
      id: string
      name: string
      description: string | null
    }
  }
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function SubmissionReviewPage({ params }: PageProps) {
  const router = useRouter()
  const [submissionId, setSubmissionId] = useState<string>('')
  const [submission, setSubmission] = useState<SubmissionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [score, setScore] = useState('')
  const [grade, setGrade] = useState('')

  useEffect(() => {
    async function loadSubmission() {
      const { id } = await params
      setSubmissionId(id)

      const result = await getSubmissionForReview(id)

      if (result.success && result.data) {
        setSubmission(result.data)
        setFeedback(result.data.manualFeedback || '')
        setScore(result.data.manualScore || '')
        setGrade(result.data.manualGrade?.toString() || '')
      } else {
        toast.error(result.error || 'Failed to load submission')
      }

      setLoading(false)
    }

    loadSubmission()
  }, [params])

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      toast.error('Please provide feedback')
      return
    }

    if (!score) {
      toast.error('Please select a score')
      return
    }

    const gradeNum = grade ? parseFloat(grade) : undefined
    if (gradeNum !== undefined && (gradeNum < 0 || gradeNum > 100)) {
      toast.error('Grade must be between 0 and 100')
      return
    }

    setSubmitting(true)

    try {
      const result = await submitManualFeedback(submissionId, feedback, score, gradeNum)

      if (result.success) {
        toast.success('Feedback submitted successfully!')
        // Reload submission data
        const updated = await getSubmissionForReview(submissionId)
        if (updated.success && updated.data) {
          setSubmission(updated.data)
        }
      } else {
        toast.error(result.error || 'Failed to submit feedback')
      }
    } catch (error) {
      toast.error('An error occurred while submitting feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const getSubmissionTypeIcon = (type: string) => {
    switch (type) {
      case 'GITHUB_REPO':
        return <Github className="h-5 w-5" />
      case 'WEBSITE':
        return <Globe className="h-5 w-5" />
      case 'SCREENSHOT':
        return <ImageIcon className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="space-y-6">
        <Button variant="outline" asChild>
          <Link href="/admin/manual-submissions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Submissions
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Submission not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isReviewed = !!submission.reviewedAt

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/manual-submissions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Submissions
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Review Submission</h1>
          <p className="text-gray-600 mt-1">
            {submission.question.course.name} - Assessment #{submission.question.questionNumber}
          </p>
        </div>
        {isReviewed && (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle className="mr-1 h-3 w-3" />
            Reviewed
            {submission.manualGrade !== null && submission.manualGrade !== undefined && (
              <span className="ml-2">• {submission.manualGrade}%</span>
            )}
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label className="text-gray-600">Name</Label>
                  <p className="font-medium">{submission.user?.name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <p className="font-medium">{submission.user?.email}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Submitted</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <p className="font-medium">
                      {format(new Date(submission.createdAt), 'PPP p')}
                    </p>
                    <span className="text-sm text-gray-600">
                      ({formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })})
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submission Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getSubmissionTypeIcon(submission.question.submissionType)}
                Student Submission
              </CardTitle>
              <Badge variant="outline" className="w-fit">
                {submission.question.submissionType}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submission.submissionContent && (
                  <div>
                    <Label className="text-gray-600">Content</Label>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                      <pre className="whitespace-pre-wrap font-mono text-sm">
                        {submission.submissionContent}
                      </pre>
                    </div>
                  </div>
                )}

                {submission.submissionUrl && (
                  <div>
                    <Label className="text-gray-600">URL</Label>
                    <a
                      href={submission.submissionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-2 text-sky-600 hover:text-sky-700 underline"
                    >
                      {submission.submissionUrl}
                      <Globe className="h-4 w-4" />
                    </a>
                  </div>
                )}

                {submission.fileUrl && (
                  <div>
                    <Label className="text-gray-600">File</Label>
                    <a
                      href={submission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-2 text-sky-600 hover:text-sky-700 underline"
                    >
                      View uploaded file
                      <FileText className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Feedback Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Provide Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="score">Score *</Label>
                  <select
                    id="score"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md mt-2"
                  >
                    <option value="">Select a score</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Great">Great</option>
                    <option value="Good">Good</option>
                    <option value="Pass">Pass</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="grade">Numeric Grade (Optional)</Label>
                  <input
                    id="grade"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="Enter grade (0-100)"
                    className="w-full px-3 py-2 border border-input rounded-md mt-2"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Enter a numeric grade between 0 and 100 (optional).
                  </p>
                </div>

                <div>
                  <Label htmlFor="feedback">Feedback *</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={8}
                    placeholder="Provide detailed, constructive feedback to help the student improve..."
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Provide specific examples and actionable suggestions for improvement.
                  </p>
                </div>

                {isReviewed && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Last reviewed on {format(new Date(submission.reviewedAt!), 'PPP p')}. You can update your feedback below.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleSubmitFeedback}
                  disabled={submitting || !feedback.trim() || !score}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isReviewed ? 'Updating Feedback...' : 'Submitting Feedback...'}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {isReviewed ? 'Update Feedback' : 'Submit Feedback'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            {/* Assessment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assessment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-600">Course</Label>
                  <p className="font-medium">{submission.question.course.name}</p>
                </div>

                <div>
                  <Label className="text-gray-600">Question</Label>
                  <p className="font-medium">{submission.question.title}</p>
                </div>

                <div>
                  <Label className="text-gray-600">Description</Label>
                  <p className="text-sm text-gray-700">{submission.question.description}</p>
                </div>

                {submission.question.guidance && (
                  <div>
                    <Label className="text-gray-600">Guidance</Label>
                    <div className="mt-1 p-3 bg-sky-50 border border-sky-200 rounded-lg">
                      <p className="text-sm text-sky-800">{submission.question.guidance}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Grading Criteria */}
            {submission.question.criteria && submission.question.criteria.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Grading Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {submission.question.criteria.map((criterion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-sky-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{criterion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/admin/courses/${submission.question.course.id}`}>
                    View Course
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/results/${submission.id}`}>
                    View as Student
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
