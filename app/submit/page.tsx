import { findQuestionByNumber } from '@/lib/actions/lookup-actions'
import { submitAnonymousAssessment } from '@/lib/actions/submission-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { redirect } from 'next/navigation'

// Add proper TypeScript interfaces
interface Course {
  id: string
  name: string
  description?: string | null
}

interface Question {
  id: string
  questionNumber: number
  title: string
  description: string
  submissionType: string
  guidance?: string | null
  course: Course
}

interface SubmitPageProps {
  searchParams: Promise<{
    courseName?: string
    assessmentNumber?: string
  }>
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

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const { courseName, assessmentNumber } = await searchParams
  
  let question: Question | null = null
  let course: Course | null = null
  let error: string | null = null

  if (courseName && assessmentNumber) {
    const questionResult = await findQuestionByNumber(courseName, parseInt(assessmentNumber))
    if (questionResult.success) {
      question = questionResult.data
      course = question ? question.course : null
    } else {
      error = questionResult.error || 'Failed to find question'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Assessment Submission</h1>
          <p className="mt-2 text-gray-600">Submit your work and get instant AI-powered feedback</p>
        </div>

        {!courseName || !assessmentNumber ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Find Your Assessment</CardTitle>
              <CardDescription>Enter your course name and question number to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form method="GET" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="courseName">Course Name</Label>
                    <Input
                      id="courseName"
                      name="courseName"
                      placeholder="e.g., Business Analyst"
                      defaultValue={courseName || ''}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assessmentNumber">Assessment Number</Label>
                    <Input
                      id="assessmentNumber"
                      name="assessmentNumber"
                      type="number"
                      placeholder="1"
                      min="1"
                      defaultValue={assessmentNumber || ''}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Find Assessment</Button>
              </form>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Assessment Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-4">{error}</p>
              <Button asChild>
                <a href="/submit">Try Again</a>
              </Button>
            </CardContent>
          </Card>
        ) : question && course ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Assessment Details */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>{course.name}</CardTitle>
                  <CardDescription>Assessment {question.questionNumber}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">{question.title}</h3>
                    <p className="text-sm text-gray-600">{question.description}</p>
                  </div>
                  
                  {question.guidance && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Guidance</h4>
                      <p className="text-sm text-gray-600">{question.guidance}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 rounded">
                      {question.submissionType.replace('_', ' ').toLowerCase()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Submission Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Submit Your Work</CardTitle>
                  <CardDescription>
                    Upload your submission and get instant feedback
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={handleSubmission} className="space-y-4">
                    <input type="hidden" name="courseName" value={courseName} />
                    <input type="hidden" name="assessmentNumber" value={assessmentNumber} />
                    
                    {question.submissionType === 'TEXT' && (
                      <div className="space-y-2">
                        <Label htmlFor="submissionContent">Your Answer *</Label>
                        <Textarea
                          id="submissionContent"
                          name="submissionContent"
                          rows={10}
                          placeholder="Enter your response here..."
                          required
                        />
                      </div>
                    )}

                    {question.submissionType === 'GITHUB_REPO' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="submissionUrl">GitHub Repository URL *</Label>
                          <Input
                            id="submissionUrl"
                            name="submissionUrl"
                            type="url"
                            placeholder="https://github.com/username/repo"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="submissionContent">Description</Label>
                          <Textarea
                            id="submissionContent"
                            name="submissionContent"
                            rows={4}
                            placeholder="Briefly describe your repository and key features..."
                          />
                        </div>
                      </>
                    )}

                    {question.submissionType === 'WEBSITE' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="submissionUrl">Website URL *</Label>
                          <Input
                            id="submissionUrl"
                            name="submissionUrl"
                            type="url"
                            placeholder="https://your-website.com"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="submissionContent">Description</Label>
                          <Textarea
                            id="submissionContent"
                            name="submissionContent"
                            rows={4}
                            placeholder="Describe your website's features and functionality..."
                          />
                        </div>
                      </>
                    )}

                    {question.submissionType === 'DOCUMENT' && (
                      <div className="space-y-2">
                        <Label htmlFor="submissionContent">Document Content *</Label>
                        <Textarea
                          id="submissionContent"
                          name="submissionContent"
                          rows={10}
                          placeholder="Paste your document content here or provide a detailed summary..."
                          required
                        />
                        <div className="space-y-2">
                          <Label htmlFor="submissionUrl">Document URL (Optional)</Label>
                          <Input
                            id="submissionUrl"
                            name="submissionUrl"
                            type="url"
                            placeholder="https://docs.google.com/document/..."
                          />
                        </div>
                      </div>
                    )}

                    {question.submissionType === 'SCREENSHOT' && (
                      <div className="space-y-2">
                        <Label htmlFor="submissionContent">Description of Screenshot *</Label>
                        <Textarea
                          id="submissionContent"
                          name="submissionContent"
                          rows={6}
                          placeholder="Describe what your screenshot shows and explain the key elements..."
                          required
                        />
                        <div className="space-y-2">
                          <Label htmlFor="submissionUrl">Image URL (if hosted online)</Label>
                          <Input
                            id="submissionUrl"
                            name="submissionUrl"
                            type="url"
                            placeholder="https://example.com/image.png"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        Submit for Assessment
                      </Button>
                      <Button type="button" variant="outline" asChild>
                        <a href="/submit">Start Over</a>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}