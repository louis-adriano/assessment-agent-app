'use client'

import { useEffect, useState } from 'react'
import { getAnonymousSubmissionResult } from '@/lib/actions/submission-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Loader2
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p>Loading assessment results...</p>
        </div>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🔍</div>
          <h1 className="text-2xl font-bold">Submission Not Found</h1>
          <p className="text-muted-foreground max-w-md">
            {error || 'The assessment result you\'re looking for could not be found or may have expired.'}
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-12 max-w-4xl">
        <div className="space-y-8">
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => copyToClipboard(window.location.href)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </button>
              <button
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={shareResults}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </button>
            </div>
          </div>

          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Assessment Results</h1>
            <p className="text-muted-foreground">
              Detailed feedback and analysis for your submission
            </p>
          </div>

          {/* Assessment Score Card */}
          <Card className="bg-gradient-to-r from-white to-blue-50 border-0 shadow-xl">
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
                    <div className="text-5xl font-bold text-gray-700">
                      {getRemarkScore((submission.assessmentResult as any)?.remark || '')}%
                    </div>
                    <div className="w-64 mx-auto h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${getRemarkScore((submission.assessmentResult as any)?.remark || '')}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">Submitted</span>
                    </div>
                    <div className="text-sm">
                      {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Processing Time</span>
                    </div>
                    <div className="text-sm">&lt; 5 seconds</div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      {getSubmissionTypeIcon(submission.question.submissionType)}
                      <span className="text-sm font-medium">Type</span>
                    </div>
                    <div className="text-sm">{getSubmissionTypeLabel(submission.question.submissionType)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submission Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Submission Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Course</h4>
                  <Badge variant="secondary">{submission.question.course.name}</Badge>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Assessment</h4>
                  <div className="space-y-1">
                    <div className="font-medium">#{submission.question.questionNumber}: {submission.question.title}</div>
                    <div className="text-sm text-muted-foreground">{submission.question.description}</div>
                  </div>
                </div>
              </div>

              {submission.submissionUrl && (
                <div>
                  <h4 className="font-semibold mb-2">Submitted Content</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
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

          {/* Detailed Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Detailed Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {(submission.assessmentResult as any)?.feedback && (
                <div>
                  <h4 className="font-semibold mb-3">AI Assessment</h4>
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-900">
                      {(submission.assessmentResult as any).feedback}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {(submission.assessmentResult as any)?.criteriaMetAndBroke && (
                <div className="grid gap-6 md:grid-cols-2">
                  {(submission.assessmentResult as any).criteriaMetAndBroke.criteriaMet &&
                   (submission.assessmentResult as any).criteriaMetAndBroke.criteriaMet.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 text-green-700">✅ Criteria Met</h4>
                      <ul className="space-y-2">
                        {(submission.assessmentResult as any).criteriaMetAndBroke.criteriaMet.map((criteria: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{criteria}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(submission.assessmentResult as any).criteriaMetAndBroke.criteriaBroke &&
                   (submission.assessmentResult as any).criteriaMetAndBroke.criteriaBroke.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 text-red-700">❌ Areas for Improvement</h4>
                      <ul className="space-y-2">
                        {(submission.assessmentResult as any).criteriaMetAndBroke.criteriaBroke.map((criteria: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <span>{criteria}</span>
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
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2" asChild>
                  <Link href="/">
                    <Upload className="h-6 w-6" />
                    <div className="text-left">
                      <div className="font-semibold">Try Another Assessment</div>
                      <div className="text-xs text-muted-foreground">Submit different work for feedback</div>
                    </div>
                  </Link>
                </Button>

                <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2" asChild>
                  <Link href={`/submit?courseName=${encodeURIComponent(submission.question.course.name)}&assessmentNumber=${submission.question.questionNumber}`}>
                    <TrendingUp className="h-6 w-6" />
                    <div className="text-left">
                      <div className="font-semibold">Resubmit Improved Work</div>
                      <div className="text-xs text-muted-foreground">Apply feedback and try again</div>
                    </div>
                  </Link>
                </Button>

                <button
                  className="border border-gray-300 rounded-md h-auto p-4 flex flex-col items-start space-y-2 hover:bg-gray-50"
                  onClick={shareResults}
                >
                  <Share2 className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">Share Results</div>
                    <div className="text-xs text-muted-foreground">Show your progress to others</div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Assessment ID: {submission.id}</p>
            <p className="mt-1">Results are stored for your reference and can be accessed anytime with this link</p>
          </div>
        </div>
      </div>
    </div>
  )
}