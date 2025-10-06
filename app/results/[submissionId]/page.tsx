'use client'

import { useEffect, useState } from 'react'
import { getAnonymousSubmissionResult } from '@/lib/actions/submission-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sidebar } from '@/components/layout/Sidebar'
import { useSession } from '@/lib/auth-client'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Github,
  Globe,
  FileText,
  Image,
  Upload,
  CheckCircle2,
  AlertCircle,
  Target,
  TrendingUp,
  Copy,
  ExternalLink,
  Download,
  Share2,
  Loader2,
  Edit
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  params: Promise<{
    submissionId: string
  }>
}

export default function ResultsPage({ params }: Props) {
  const [submission, setSubmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()

  const isAdmin = session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'COURSE_ADMIN'

  useEffect(() => {
    async function loadSubmission() {
      try {
        const resolvedParams = await params
        const result = await getAnonymousSubmissionResult(resolvedParams.submissionId)

        if (!result) {
          setError('Submission not found')
          return
        }

        setSubmission(result)
      } catch (err) {
        setError('Failed to load submission')
      } finally {
        setLoading(false)
      }
    }

    loadSubmission()
  }, [params])

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-teal-600" />
          <p className="text-gray-600">Loading assessment results...</p>
        </div>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="flex-1 lg:pl-72 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-6xl">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900">Submission Not Found</h1>
            <p className="text-gray-600 max-w-md">
              {error || 'The assessment result you\'re looking for could not be found or may have expired.'}
            </p>
            <Link href="/">
              <Button className="bg-teal-600 hover:bg-teal-700 rounded-xl">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const getRemarkColor = (remark: string) => {
    switch (remark) {
      case 'Excellent': return 'bg-green-100 text-green-800 border-green-300'
      case 'Good': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'Can Improve': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'Needs Improvement': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getRemarkIcon = (remark: string) => {
    switch (remark) {
      case 'Excellent': return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'Good': return <CheckCircle2 className="h-5 w-5 text-blue-600" />
      case 'Can Improve': return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'Needs Improvement': return <AlertCircle className="h-5 w-5 text-red-600" />
      default: return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getRemarkScore = (remark: string) => {
    switch (remark) {
      case 'Excellent': return 95
      case 'Good': return 80
      case 'Can Improve': return 65
      case 'Needs Improvement': return 45
      default: return 0
    }
  }

  const getSubmissionTypeIcon = (type: string) => {
    switch (type) {
      case 'GITHUB_REPO': return <Github className="h-4 w-4" />
      case 'WEBSITE': return <Globe className="h-4 w-4" />
      case 'DOCUMENT': return <FileText className="h-4 w-4" />
      case 'SCREENSHOT': return <Image className="h-4 w-4" />
      case 'TEXT': return <FileText className="h-4 w-4" />
      default: return <Upload className="h-4 w-4" />
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const shareResults = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Assessment Results',
        text: `I got "${(submission.assessmentResult as any)?.remark}" on my assessment!`,
        url: window.location.href
      })
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className="flex-1 lg:pl-72">
        <div className="px-6 py-12 md:px-12">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Link href="/">
                <Button variant="outline" size="sm" className="rounded-xl">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                  onClick={() => copyToClipboard(window.location.href)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </button>
                <button
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                  onClick={shareResults}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </button>
              </div>
            </div>

            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-gray-900">Assessment Results</h1>
              <p className="text-gray-600">
                Detailed feedback and analysis for your submission
              </p>
            </div>

          {/* AI Assessment Results */}
          {(submission.assessmentResult as any)?.remark && (
          <Card className="bg-gradient-to-r from-white to-sky-50 border-0 shadow-xl rounded-2xl">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    {getRemarkIcon((submission.assessmentResult as any)?.remark || '')}
                    <Badge
                      className={`text-lg px-6 py-2 ${getRemarkColor((submission.assessmentResult as any)?.remark || '')}`}
                    >
                      {(submission.assessmentResult as any)?.remark}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="text-5xl font-bold text-sky-600">
                      {getRemarkScore((submission.assessmentResult as any)?.remark || '')}%
                    </div>
                    <p className="text-sm text-gray-600">AI Assessment Score</p>
                    <div className="w-64 mx-auto h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-sky-600 transition-all duration-500"
                        style={{ width: `${getRemarkScore((submission.assessmentResult as any)?.remark || '')}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4 text-sky-600" />
                      <span className="text-sm font-medium">Submitted</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                    </div>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4 text-sky-600" />
                      <span className="text-sm font-medium">Processing Time</span>
                    </div>
                    <div className="text-sm text-gray-700">&lt; 5 seconds</div>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <span className="text-sky-600">{getSubmissionTypeIcon(submission.question.submissionType)}</span>
                      <span className="text-sm font-medium">Type</span>
                    </div>
                    <div className="text-sm text-gray-700">{getSubmissionTypeLabel(submission.question.submissionType)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Admin: Add Manual Review Button */}
          {isAdmin && !(submission as any).manualFeedback && (
            <Card className="border-sky-200 bg-sky-50 rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center">
                      <Edit className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Want to add instructor feedback?</h3>
                      <p className="text-gray-700 text-sm">
                        You can review this submission and provide personalized feedback on top of the AI assessment.
                      </p>
                    </div>
                  </div>
                  <Button
                    className="bg-sky-600 hover:bg-sky-700 rounded-xl whitespace-nowrap"
                    asChild
                  >
                    <Link href={`/admin/manual-submissions/${submission.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Add Manual Review
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructor Manual Feedback (Optional Add-on) */}
          {(submission as any).manualFeedback && (
            <Card className="bg-gradient-to-r from-white to-sky-50 border-0 shadow-xl rounded-2xl">
              <CardContent className="pt-8 pb-8">
                <div className="text-center space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      {getRemarkIcon((submission as any).manualScore || '')}
                      <Badge
                        className={`text-lg px-6 py-2 ${getRemarkColor((submission as any).manualScore || '')}`}
                      >
                        {(submission as any).manualScore}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Instructor Feedback</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">Reviewed by your instructor</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 text-sky-600" />
                        <span className="text-sm font-medium">Submitted</span>
                      </div>
                      <div className="text-sm text-gray-700">
                        {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                      </div>
                    </div>

                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-sky-600" />
                        <span className="text-sm font-medium">Reviewed</span>
                      </div>
                      <div className="text-sm text-gray-700">
                        {(submission as any).reviewedAt && formatDistanceToNow(new Date((submission as any).reviewedAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual Feedback Content */}
          {(submission as any).manualFeedback && (
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-sky-600" />
                    Instructor Feedback
                  </CardTitle>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      asChild
                    >
                      <Link href={`/admin/manual-submissions/${submission.id}`}>
                        <Edit className="mr-2 h-3 w-3" />
                        Edit Review
                      </Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="p-4 bg-sky-50 rounded-lg border border-sky-200">
                    <p className="text-gray-800 whitespace-pre-wrap">{(submission as any).manualFeedback}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submission Details */}
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-teal-600" />
                Submission Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Course</h4>
                  <Badge variant="secondary" className="bg-teal-100 text-teal-700">{submission.question.course.name}</Badge>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Assessment</h4>
                  <div className="space-y-1">
                    <div className="font-medium">#{submission.question.questionNumber}: {submission.question.title}</div>
                    <div className="text-sm text-gray-600">{submission.question.description}</div>
                  </div>
                </div>
              </div>

              {submission.submissionUrl && (
                <div>
                  <h4 className="font-semibold mb-2">Submitted Content</h4>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 text-sm font-mono">
                      <ExternalLink className="h-4 w-4" />
                      <a 
                        href={submission.submissionUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {submission.submissionUrl}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {submission.submissionContent && (
                <div>
                  <h4 className="font-semibold mb-2">Text Content</h4>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-32 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">{submission.submissionContent}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Feedback - MAIN FOCUS */}
          <Card className="rounded-2xl shadow-xl border-2 border-teal-200">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-white pb-6">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                AI Assessment & Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              {(submission.assessmentResult as any)?.feedback && (
                <div>
                  <h4 className="font-bold text-lg mb-4 text-gray-900">Overall Assessment</h4>
                  <div className="bg-teal-50 border-l-4 border-teal-600 p-6 rounded-xl">
                    <p className="text-gray-800 leading-relaxed text-base">
                      {(submission.assessmentResult as any).feedback}
                    </p>
                  </div>
                </div>
              )}

              {(submission.assessmentResult as any)?.criteriaMetAndBroke && (
                <div className="grid gap-6 md:grid-cols-2">
                  {(submission.assessmentResult as any).criteriaMetAndBroke.criteriaMet &&
                   (submission.assessmentResult as any).criteriaMetAndBroke.criteriaMet.length > 0 && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                      <h4 className="font-bold text-lg mb-4 text-green-800 flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6" />
                        Strengths
                      </h4>
                      <ul className="space-y-3">
                        {(submission.assessmentResult as any).criteriaMetAndBroke.criteriaMet.map((criteria: string, index: number) => (
                          <li key={index} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{criteria}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(submission.assessmentResult as any).criteriaMetAndBroke.criteriaBroke &&
                   (submission.assessmentResult as any).criteriaMetAndBroke.criteriaBroke.length > 0 && (
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
                      <h4 className="font-bold text-lg mb-4 text-orange-800 flex items-center gap-2">
                        <AlertCircle className="h-6 w-6" />
                        Areas to Improve
                      </h4>
                      <ul className="space-y-3">
                        {(submission.assessmentResult as any).criteriaMetAndBroke.criteriaBroke.map((criteria: string, index: number) => (
                          <li key={index} className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{criteria}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200 rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="text-gray-900">What's Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Link
                  href="/"
                  className="bg-white border-2 border-teal-200 rounded-xl p-6 hover:border-teal-400 hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col items-start space-y-3">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                      <Upload className="h-6 w-6 text-teal-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Try Another Assessment</div>
                      <div className="text-sm text-gray-600">Submit different work for feedback</div>
                    </div>
                  </div>
                </Link>

                <Link
                  href={`/submit?courseName=${encodeURIComponent(submission.question.course.name)}&assessmentNumber=${submission.question.questionNumber}`}
                  className="bg-white border-2 border-teal-200 rounded-xl p-6 hover:border-teal-400 hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col items-start space-y-3">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                      <TrendingUp className="h-6 w-6 text-teal-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Resubmit Improved Work</div>
                      <div className="text-sm text-gray-600">Apply feedback and try again</div>
                    </div>
                  </div>
                </Link>

                <button
                  onClick={shareResults}
                  className="bg-white border-2 border-teal-200 rounded-xl p-6 hover:border-teal-400 hover:shadow-md transition-all group text-left"
                >
                  <div className="flex flex-col items-start space-y-3">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                      <Share2 className="h-6 w-6 text-teal-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Share Results</div>
                      <div className="text-sm text-gray-600">Show your progress to others</div>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="text-center text-sm text-gray-500">
            <p>Assessment ID: {submission.id}</p>
            <p className="mt-1">Results are stored for your reference and can be accessed anytime with this link</p>
          </div>
          </div>
        </div>
      </main>
    </div>
  )
}