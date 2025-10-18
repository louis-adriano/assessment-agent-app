'use client'

import { useEffect, useState } from 'react'
import { getAnonymousSubmissionResult } from '@/lib/actions/submission-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  Copy,
  ExternalLink,
  Share2,
  Loader2,
  Edit,
  User,
  BookOpen,
  TrendingUp,
  LogIn,
  FileEdit
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
  const [submissionId, setSubmissionId] = useState<string>('')
  const { data: session } = useSession()

  const isAdmin = (session?.user as any)?.role === 'SUPER_ADMIN' || (session?.user as any)?.role === 'COURSE_ADMIN'

  useEffect(() => {
    async function loadSubmission() {
      try {
        const resolvedParams = await params
        setSubmissionId(resolvedParams.submissionId)
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

  const assessmentResult = submission.assessmentResult as any
  const hasManualReview = !!(submission as any).manualFeedback
  const assessmentMode = submission.question?.assessmentMode || 'AI_ONLY'
  const isPendingManualReview = submission.status === 'PENDING' || (assessmentMode === 'BOTH' && !hasManualReview)

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className="flex-1 lg:pl-72">
        <div className="px-6 py-8 md:px-12">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header with Navigation */}
            <div className="flex items-center justify-between">
              <Link href="/my-submissions">
                <Button variant="outline" size="sm" className="rounded-xl">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  My Submissions
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => copyToClipboard(window.location.href)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    asChild
                  >
                    <Link href={`/admin/manual-submissions/${submission.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      {hasManualReview ? 'Edit Review' : 'Add Review'}
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Submission Info Header */}
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4" />
                      {submission.question.course.name}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Question {submission.question.questionNumber}: {submission.question.title}
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                      {assessmentMode === 'MANUAL_ONLY' && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                          <FileText className="h-3 w-3 mr-1" />
                          Manual Review Only
                        </Badge>
                      )}
                      {assessmentMode === 'BOTH' && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                          AI + Manual Review
                        </Badge>
                      )}
                      {isPendingManualReview && !hasManualReview && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-400">
                          <Clock className="h-3 w-3 mr-1" />
                          Awaiting Instructor Review
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge className={`${getRemarkColor(assessmentResult?.remark || '')} border`}>
                    {assessmentResult?.remark || (isPendingManualReview ? 'Pending Review' : 'Processing')}
                  </Badge>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Submitted {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                  </div>
                  <div className="flex items-center gap-2">
                    {getSubmissionTypeIcon(submission.question.submissionType)}
                    {getSubmissionTypeLabel(submission.question.submissionType)}
                  </div>
                  {submission.user && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {submission.user.name || submission.user.email}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content - Left Side (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Manual Review Section - Show First for Manual Mode */}
                {hasManualReview && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileEdit className="h-5 w-5 text-teal-600" />
                        Instructor Review
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-4xl font-bold text-teal-600">
                            {(submission as any).manualScore || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">Review Score</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-teal-600" />
                          <span className="text-lg font-semibold">Complete</span>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="text-sm text-gray-500">
                        Reviewed {(submission as any).reviewedAt && formatDistanceToNow(new Date((submission as any).reviewedAt), { addSuffix: true })}
                      </div>

                      {/* Feedback */}
                      {(submission as any).manualFeedback && (
                        <div className="mt-4 p-4 bg-teal-50 border-l-4 border-teal-600 rounded-r">
                          <p className="text-gray-800 leading-relaxed">
                            {(submission as any).manualFeedback}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Pending Manual Review Notice */}
                {!hasManualReview && (assessmentMode === 'MANUAL_ONLY' || assessmentMode === 'BOTH') && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Awaiting Instructor Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Your submission is in the review queue. An instructor will review your work and provide detailed feedback soon.
                        {assessmentMode === 'BOTH' && ' You can see the AI assessment below while you wait.'}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* AI Assessment Score - Only show for AI modes */}
                {assessmentResult?.remark && assessmentMode !== 'MANUAL_ONLY' && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="h-5 w-5 text-teal-600" />
                        AI Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-4xl font-bold text-teal-600">
                            {getRemarkScore(assessmentResult.remark)}%
                          </div>
                          <div className="text-sm text-gray-600 mt-1">Assessment Score</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRemarkIcon(assessmentResult.remark)}
                          <span className="text-lg font-semibold">{assessmentResult.remark}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-500"
                          style={{ width: `${getRemarkScore(assessmentResult.remark)}%` }}
                        />
                      </div>

                      {/* Detailed Feedback */}
                      {assessmentResult.detailedFeedback?.summary && (
                        <div className="mt-4 space-y-4">
                          {/* Summary */}
                          <div className="p-4 bg-teal-50 border-l-4 border-teal-600 rounded-r">
                            <p className="text-gray-800 leading-relaxed">
                              {assessmentResult.detailedFeedback.summary}
                            </p>
                          </div>

                          {/* Score Breakdown */}
                          {assessmentResult.scoreBreakdown && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-600 mb-1">Content Quality</div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-teal-600 transition-all"
                                      style={{ width: `${assessmentResult.scoreBreakdown.contentQuality}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-semibold text-gray-700">
                                    {assessmentResult.scoreBreakdown.contentQuality}
                                  </span>
                                </div>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-600 mb-1">Completeness</div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-600 transition-all"
                                      style={{ width: `${assessmentResult.scoreBreakdown.completeness}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-semibold text-gray-700">
                                    {assessmentResult.scoreBreakdown.completeness}
                                  </span>
                                </div>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-600 mb-1">Technical Accuracy</div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-purple-600 transition-all"
                                      style={{ width: `${assessmentResult.scoreBreakdown.technicalAccuracy}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-semibold text-gray-700">
                                    {assessmentResult.scoreBreakdown.technicalAccuracy}
                                  </span>
                                </div>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-600 mb-1">Structure</div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-indigo-600 transition-all"
                                      style={{ width: `${assessmentResult.scoreBreakdown.structure}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-semibold text-gray-700">
                                    {assessmentResult.scoreBreakdown.structure}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Comparison to Example */}
                          {assessmentResult.detailedFeedback.comparisonToExample && (
                            <div className="p-4 bg-purple-50 border-l-4 border-purple-600 rounded-r">
                              <div className="text-xs font-semibold text-purple-900 mb-2">
                                Comparison to Perfect Example
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {assessmentResult.detailedFeedback.comparisonToExample}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Fallback to old feedback if no detailed feedback */}
                      {!assessmentResult.detailedFeedback?.summary && assessmentResult.feedback && (
                        <div className="mt-4 p-4 bg-teal-50 border-l-4 border-teal-600 rounded-r">
                          <p className="text-gray-800 leading-relaxed">
                            {assessmentResult.feedback}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Detailed Strengths, Weaknesses, and Recommendations */}
                {assessmentResult?.detailedFeedback && (
                  <div className="space-y-4">
                    {/* Strengths */}
                    {assessmentResult.detailedFeedback.strengths?.length > 0 && (
                      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2 text-green-800">
                            <CheckCircle2 className="h-5 w-5" />
                            What You Did Well
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3">
                            {assessmentResult.detailedFeedback.strengths.map((strength: string, index: number) => (
                              <li key={index} className="flex items-start gap-3">
                                <div className="mt-0.5 flex-shrink-0">
                                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  </div>
                                </div>
                                <span className="text-sm text-gray-700 leading-relaxed">{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Weaknesses */}
                    {assessmentResult.detailedFeedback.weaknesses?.length > 0 && (
                      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2 text-orange-800">
                            <AlertCircle className="h-5 w-5" />
                            Areas That Need Work
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3">
                            {assessmentResult.detailedFeedback.weaknesses.map((weakness: string, index: number) => (
                              <li key={index} className="flex items-start gap-3">
                                <div className="mt-0.5 flex-shrink-0">
                                  <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center">
                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                  </div>
                                </div>
                                <span className="text-sm text-gray-700 leading-relaxed">{weakness}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Recommendations */}
                    {assessmentResult.detailedFeedback.recommendations?.length > 0 && (
                      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2 text-blue-800">
                            <TrendingUp className="h-5 w-5" />
                            How to Improve
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3">
                            {assessmentResult.detailedFeedback.recommendations.map((recommendation: string, index: number) => (
                              <li key={index} className="flex items-start gap-3">
                                <div className="mt-0.5 flex-shrink-0">
                                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                                  </div>
                                </div>
                                <span className="text-sm text-gray-700 leading-relaxed">{recommendation}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Fallback to old criteria format if no detailed feedback */}
                {!assessmentResult?.detailedFeedback && assessmentResult?.criteriaMetAndBroke && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {assessmentResult.criteriaMetAndBroke.criteriaMet?.length > 0 && (
                      <Card className="border-green-200 bg-green-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2 text-green-800">
                            <CheckCircle2 className="h-5 w-5" />
                            Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {assessmentResult.criteriaMetAndBroke.criteriaMet.map((criteria: string, index: number) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700">{criteria}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {assessmentResult.criteriaMetAndBroke.criteriaBroke?.length > 0 && (
                      <Card className="border-orange-200 bg-orange-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2 text-orange-800">
                            <AlertCircle className="h-5 w-5" />
                            Areas to Improve
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {assessmentResult.criteriaMetAndBroke.criteriaBroke.map((criteria: string, index: number) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700">{criteria}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar - Right Side (1/3) */}
              <div className="space-y-6">
                {/* Instructor Review Status */}
                {!isAdmin && (
                  <Card className={hasManualReview ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">Instructor Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {hasManualReview ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-emerald-900">Complete</div>
                              <div className="text-xs text-emerald-700">
                                {(submission as any).reviewedAt && formatDistanceToNow(new Date((submission as any).reviewedAt), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-emerald-200">
                            <div className="text-xs text-gray-600">See feedback below ↓</div>
                          </div>
                        </div>
                      ) : submission.userId ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                              <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-amber-900">Pending Review</div>
                              <div className="text-xs text-amber-700">In queue</div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            Your instructor will review this submission. You'll receive a notification when feedback is available.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                            <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <p className="text-xs text-blue-900">
                              Sign in to receive personalized instructor feedback
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 w-full" asChild>
                              <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(`/results/${submissionId}`)}`}>
                                <LogIn className="mr-2 h-3 w-3" />
                                Log In
                              </Link>
                            </Button>
                            <Button size="sm" variant="outline" className="w-full" asChild>
                              <Link href="/auth/signup">Sign Up</Link>
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Your Submission */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Your Submission</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {submission.submissionUrl && (
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">URL</div>
                        <a
                          href={submission.submissionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:underline break-all"
                        >
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          <span className="text-xs">{submission.submissionUrl}</span>
                        </a>
                      </div>
                    )}

                    {submission.submissionContent && (
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">Content Preview</div>
                        <div className="bg-gray-50 p-3 rounded text-xs max-h-32 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-gray-700">
                            {submission.submissionContent.substring(0, 200)}
                            {submission.submissionContent.length > 200 && '...'}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Next Actions */}
                <Card className="bg-teal-50 border-teal-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Link
                      href={`/submit?courseName=${encodeURIComponent(submission.question.course.name)}&assessmentNumber=${submission.question.questionNumber}`}
                      className="block"
                    >
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Resubmit
                      </Button>
                    </Link>
                    <Link href="/" className="block">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Browse Courses
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={shareResults}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Results
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
