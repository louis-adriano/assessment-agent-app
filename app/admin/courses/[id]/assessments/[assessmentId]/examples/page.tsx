import Link from 'next/link'
import { getQuestionWithSubmissions } from '@/lib/actions/assessment.actions'
import { getBaseExamples } from '@/lib/actions/base-example.actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Plus,
  FileText,
  Calendar,
  User,
  Copy,
  Edit,
  Trash2,
  BookOpen,
  Target,
  Lightbulb
} from 'lucide-react'
import BaseExampleCard from '@/components/admin/BaseExampleCard'
import CreateBaseExampleDialog from '@/components/admin/CreateBaseExampleDialog'

interface BaseExamplesPageProps {
  params: Promise<{
    id: string
    assessmentId: string
  }>
}

export default async function BaseExamplesPage({ params }: BaseExamplesPageProps) {
  const { id: courseId, assessmentId } = await params

  // Fetch question details and base examples
  const [questionResult, examplesResult] = await Promise.all([
    getQuestionWithSubmissions(assessmentId),
    getBaseExamples(assessmentId)
  ])

  if (!questionResult.success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/courses/${courseId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Assessment Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {questionResult.error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const question = questionResult.data
  const baseExamples = examplesResult.success ? examplesResult.data : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/courses/${courseId}/assessments/${assessmentId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assessment
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Perfectly Graded Examples</h1>
          <p className="text-gray-600">
            Manage reference examples for <span className="font-medium">{question.title}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/courses/${courseId}`}>
              Skip for Now
            </Link>
          </Button>
          <CreateBaseExampleDialog questionId={assessmentId} questionTitle={question.title}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Example
            </Button>
          </CreateBaseExampleDialog>
        </div>
      </div>

      {/* Course and Assessment Info */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Course</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{question.course.name}</div>
            <p className="text-xs text-muted-foreground">Assessment #{question.questionNumber}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submission Type</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{question.submissionType.replace('_', ' ')}</div>
            <p className="text-xs text-muted-foreground">Expected format</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base Examples</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{baseExamples.length}</div>
            <p className="text-xs text-muted-foreground">
              {baseExamples.length === 0 ? 'No examples yet' : 'Reference examples'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assessment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Overview</CardTitle>
          <CardDescription>Understanding what students need to submit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-gray-700 text-sm leading-relaxed">{question.description}</p>
            </div>

            {question.criteria.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Assessment Criteria ({question.criteria.length})</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {question.criteria.map((criterion: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded-lg border">
                      <Target className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-green-800">{criterion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {question.guidance && (
              <div>
                <h4 className="font-medium mb-2">Student Guidance</h4>
                <div className="p-3 bg-blue-50 rounded-lg border">
                  <p className="text-sm text-blue-800">{question.guidance}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Base Examples Section */}
      {baseExamples.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Lightbulb className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <CardTitle className="mb-2">No Base Examples Yet</CardTitle>
            <CardDescription className="mb-6 max-w-md mx-auto">
              Base examples are perfectly graded reference submissions that help the AI provide more consistent and accurate assessments.
              Add at least one example to improve grading quality.
            </CardDescription>
            <CreateBaseExampleDialog questionId={assessmentId} questionTitle={question.title}>
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Example
              </Button>
            </CreateBaseExampleDialog>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Reference Examples</h2>
              <p className="text-gray-600 text-sm">
                These examples guide the AI in evaluating student submissions
              </p>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {baseExamples.length} {baseExamples.length === 1 ? 'Example' : 'Examples'}
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {baseExamples.map((example: any) => (
              <BaseExampleCard
                key={example.id}
                example={example}
                questionId={assessmentId}
                courseId={courseId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Best Practices for Base Examples</CardTitle>
          <CardDescription>Tips for creating effective reference examples</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                📝
              </div>
              <div>
                <p className="font-medium text-sm">Quality Examples</p>
                <p className="text-xs text-gray-600">
                  Create examples that demonstrate excellent work meeting all criteria
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full font-semibold text-sm">
                🎯
              </div>
              <div>
                <p className="font-medium text-sm">Diverse Examples</p>
                <p className="text-xs text-gray-600">
                  Provide multiple examples showing different approaches to success
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full font-semibold text-sm">
                🔍
              </div>
              <div>
                <p className="font-medium text-sm">Clear Metadata</p>
                <p className="text-xs text-gray-600">
                  Add metadata to help the AI understand why examples are perfect
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}