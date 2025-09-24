import { getAnonymousSubmissionResult } from '@/lib/actions/submission-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react'

interface ResultsPageProps {
  params: {
    submissionId: string
  }
}

function getRemarkIcon(remark: string) {
  switch (remark) {
    case 'Excellent': return <CheckCircle className="h-5 w-5 text-green-600" />
    case 'Good': return <CheckCircle className="h-5 w-5 text-blue-600" />
    case 'Can Improve': return <AlertCircle className="h-5 w-5 text-yellow-600" />
    case 'Needs Improvement': return <XCircle className="h-5 w-5 text-red-600" />
    default: return <Clock className="h-5 w-5 text-gray-600" />
  }
}

function getRemarkColor(remark: string) {
  switch (remark) {
    case 'Excellent': return 'bg-green-100 text-green-800 border-green-200'
    case 'Good': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'Can Improve': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'Needs Improvement': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const result = await getAnonymousSubmissionResult(params.submissionId)

  if (!result.success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader><CardTitle>Results Not Found</CardTitle></CardHeader>
            <CardContent>
              <p className="text-red-600 mb-4">{result.error}</p>
              <Button asChild><a href="/submit">Submit New Assessment</a></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const submission = result.data
  const assessmentResult = submission.assessmentResult as any

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Assessment Results</h1>
          <p className="mt-2 text-gray-600">Here's your AI-powered feedback</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">{submission.question.course.name}</CardTitle>
                <CardDescription>Question {submission.question.questionNumber}: {submission.question.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Badge variant="outline" className="mb-2">{submission.question.submissionType.replace('_', ' ').toLowerCase()}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submitted: {new Date(submission.createdAt).toLocaleString()}</p>
                  {submission.processedAt && <p className="text-sm text-gray-600">Processed: {new Date(submission.processedAt).toLocaleString()}</p>}
                </div>
                <Badge variant={submission.status === 'COMPLETED' ? 'default' : 'secondary'}>{submission.status}</Badge>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {submission.status === 'COMPLETED' && assessmentResult ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {getRemarkIcon(assessmentResult.remark)}
                      <div>
                        <CardTitle>Overall Assessment</CardTitle>
                        <CardDescription>Your submission has been evaluated</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`inline-flex items-center px-4 py-2 rounded-lg border text-lg font-semibold ${getRemarkColor(assessmentResult.remark)}`}>
                      {assessmentResult.remark}
                    </div>
                    {assessmentResult.confidence && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">Confidence: {Math.round(assessmentResult.confidence * 100)}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${assessmentResult.confidence * 100}%` }}></div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Feedback</CardTitle>
                    <CardDescription>Specific comments on your submission</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800 leading-relaxed">{assessmentResult.feedback}</p>
                  </CardContent>
                </Card>

                {assessmentResult.criteria_met && assessmentResult.criteria_met.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Criteria Met
                      </CardTitle>
                      <CardDescription>Requirements successfully addressed</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {assessmentResult.criteria_met.map((criterion: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{criterion}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {assessmentResult.areas_for_improvement && assessmentResult.areas_for_improvement.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        Areas for Improvement
                      </CardTitle>
                      <CardDescription>Suggestions to enhance your work</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {assessmentResult.areas_for_improvement.map((area: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{area}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {(assessmentResult.processing_time_ms || assessmentResult.model_used) && (
                  <Card>
                    <CardHeader><CardTitle>Processing Details</CardTitle></CardHeader>
                    <CardContent className="text-sm text-gray-600 space-y-1">
                      {assessmentResult.processing_time_ms && <p>Processing time: {assessmentResult.processing_time_ms}ms</p>}
                      {assessmentResult.model_used && <p>AI Model: {assessmentResult.model_used}</p>}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Processing...</CardTitle>
                  <CardDescription>Your submission is being assessed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    <span>Please wait while we evaluate your submission...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4">
              <Button asChild className="flex-1"><a href="/submit">Submit Another Assessment</a></Button>
              <Button variant="outline" asChild><a href="/">Browse Courses</a></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}