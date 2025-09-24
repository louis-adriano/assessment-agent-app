import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAnonymousSubmissionResult } from '@/lib/actions/submission-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShareResultsButton } from '@/components/ShareResultsButton'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  RotateCcw,
  BookOpen,
  TrendingUp,
  Star,
  Target,
  Lightbulb,
  ExternalLink
} from 'lucide-react'

interface ResultsPageProps {
  params: {
    submissionId: string
  }
}

function getRemarkIcon(remark: string) {
  switch (remark) {
    case 'Excellent': return <Star className="h-6 w-6 text-yellow-500" />
    case 'Good': return <CheckCircle className="h-6 w-6 text-green-600" />
    case 'Can Improve': return <AlertCircle className="h-6 w-6 text-yellow-600" />
    case 'Needs Improvement': return <XCircle className="h-6 w-6 text-red-600" />
    default: return <Clock className="h-6 w-6 text-gray-600" />
  }
}

function getRemarkColor(remark: string) {
  switch (remark) {
    case 'Excellent': return 'bg-yellow-50 text-yellow-800 border-yellow-200'
    case 'Good': return 'bg-green-50 text-green-800 border-green-200'
    case 'Can Improve': return 'bg-yellow-50 text-yellow-800 border-yellow-200'
    case 'Needs Improvement': return 'bg-red-50 text-red-800 border-red-200'
    default: return 'bg-gray-50 text-gray-800 border-gray-200'
  }
}

function getRemarkDescription(remark: string) {
  switch (remark) {
    case 'Excellent': return 'Outstanding work that exceeds expectations!'
    case 'Good': return 'Solid work that meets most requirements well.'
    case 'Can Improve': return 'Good foundation with room for enhancement.'
    case 'Needs Improvement': return 'Requires significant improvements to meet standards.'
    default: return 'Assessment in progress...'
  }
}



export default async function ResultsPage({ params }: ResultsPageProps) {
  const result = await getAnonymousSubmissionResult(params.submissionId)

  if (!result.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">Results Not Found</CardTitle>
              <CardDescription>
                The assessment results you're looking for could not be found.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-6">{result.error}</p>
              <div className="flex gap-3 justify-center">
                <Button asChild>
                  <Link href="/submit">Submit New Assessment</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/courses">Browse Courses</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const submission = result.data
  const assessmentResult = submission.assessmentResult as any

  // Handle processing state
  if (submission.status !== 'COMPLETED' || !assessmentResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
              <Clock className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
              <CardTitle className="text-2xl">Processing Your Assessment</CardTitle>
              <CardDescription>
                Please wait while we evaluate your submission...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                This usually takes 5-10 seconds. Your page will automatically update when ready.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => window.location.reload()}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/submit">Submit Another</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assessment Results</h1>
              <p className="mt-1 text-gray-600">
                {submission.question.course.name} • Question {submission.question.questionNumber}
              </p>
            </div>
            <div className="flex gap-3">
              <ShareResultsButton submissionId={params.submissionId} />
              <Button asChild>
                <Link href="/submit">Submit Another</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Results Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Overall Assessment */}
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <div className="flex items-center gap-4">
                  {getRemarkIcon(assessmentResult.remark)}
                  <div className="flex-1">
                    <CardTitle className="text-2xl">Overall Assessment</CardTitle>
                    <CardDescription>
                      {getRemarkDescription(assessmentResult.remark)}
                    </CardDescription>
                  </div>
                  <div className={`px-6 py-3 rounded-lg border text-lg font-semibold ${getRemarkColor(assessmentResult.remark)}`}>
                    {assessmentResult.remark}
                  </div>
                </div>
              </CardHeader>
              
              {assessmentResult.confidence && (
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Assessment Confidence</span>
                    <span>{Math.round(assessmentResult.confidence * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${assessmentResult.confidence * 100}%` }}
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Detailed Feedback */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Detailed Feedback
                </CardTitle>
                <CardDescription>
                  Specific comments on your submission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                    {assessmentResult.feedback}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Criteria Met */}
            {assessmentResult.criteria_met && assessmentResult.criteria_met.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Criteria Successfully Met ({assessmentResult.criteria_met.length})
                  </CardTitle>
                  <CardDescription>
                    Requirements you've successfully addressed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {assessmentResult.criteria_met.map((criterion: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-green-800 text-sm leading-relaxed">{criterion}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Areas for Improvement */}
            {assessmentResult.areas_for_improvement && assessmentResult.areas_for_improvement.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                    Areas for Improvement ({assessmentResult.areas_for_improvement.length})
                  </CardTitle>
                  <CardDescription>
                    Specific suggestions to enhance your work
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {assessmentResult.areas_for_improvement.map((area: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-amber-800 text-sm leading-relaxed">{area}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Base Example Comparison */}
            {assessmentResult.baseExampleUsed && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Compared Against: {assessmentResult.baseExampleUsed}
                  </CardTitle>
                  <CardDescription>
                    Your work was evaluated against this exemplary answer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm">
                      Your submission was compared against our best practice example to provide 
                      accurate and consistent feedback. This helps ensure fair assessment standards 
                      across all submissions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle>What's Next?</CardTitle>
                <CardDescription>
                  Continue your learning journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  <Button className="justify-start h-auto p-4" asChild>
                    <Link href={`/submit/${encodeURIComponent(submission.question.course.name)}/${submission.question.questionNumber}`}>
                      <RotateCcw className="mr-3 h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">Improve & Resubmit</div>
                        <div className="text-xs opacity-80">Apply the feedback and try again</div>
                      </div>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="justify-start h-auto p-4" asChild>
                    <Link href={`/courses/${encodeURIComponent(submission.question.course.name)}`}>
                      <ArrowRight className="mr-3 h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">Try Next Question</div>
                        <div className="text-xs opacity-80">Continue with other questions</div>
                      </div>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              
              {/* Question Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Question Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Course</h4>
                    <p className="text-gray-600 text-sm">{submission.question.course.name}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Question</h4>
                    <p className="text-gray-900 text-sm font-medium">
                      #{submission.question.questionNumber}: {submission.question.title}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Submission Type</h4>
                    <Badge variant="outline" className="text-xs">
                      {submission.question.submissionType.replace('_', ' ').toLowerCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Assessment Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assessment Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    <div>
                      <p className="font-medium">Submitted</p>
                      <p className="text-gray-600 text-xs">
                        {new Date(submission.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {submission.processedAt && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                      <div>
                        <p className="font-medium">Processed</p>
                        <p className="text-gray-600 text-xs">
                          {new Date(submission.processedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Technical Details */}
              {(assessmentResult.processing_time_ms || assessmentResult.model_used) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Technical Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-gray-600">
                    {assessmentResult.processing_time_ms && (
                      <div className="flex justify-between">
                        <span>Processing time:</span>
                        <span>{assessmentResult.processing_time_ms}ms</span>
                      </div>
                    )}
                    {assessmentResult.model_used && (
                      <div className="flex justify-between">
                        <span>AI Model:</span>
                        <span className="font-mono text-xs">{assessmentResult.model_used}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Submission ID:</span>
                      <span className="font-mono text-xs">{params.submissionId.slice(-8)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`/courses/${encodeURIComponent(submission.question.course.name)}/${submission.question.questionNumber}`}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      View Question Details
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/courses">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Browse All Courses
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}