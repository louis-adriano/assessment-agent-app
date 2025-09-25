// app/admin/courses/[id]/assessments/new/page.tsx
import { redirect } from 'next/navigation'
import { getCourse } from '@/lib/actions/course-actions'
import { createQuestion } from '@/lib/actions/assessment.actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { ArrowLeft, FileText, GitBranch, Globe, Image, FileIcon } from 'lucide-react'

interface NewAssessmentPageProps {
  params: Promise<{
    id: string
  }>
}

async function handleCreateAssessment(formData: FormData) {
  'use server'

  const courseId = formData.get('courseId') as string

  // Convert FormData to expected object format
  const data = {
    courseId,
    questionNumber: 1, // Auto-increment this in the actual implementation
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    submissionType: formData.get('submissionType') as any,
    assessmentPrompt: formData.get('assessmentPrompt') as string || '',
    criteria: formData.getAll('criteria').filter(c => c !== '') as string[],
    redFlags: formData.getAll('redFlags').filter(r => r !== '') as string[],
    conditionalChecks: formData.getAll('conditionalChecks').filter(c => c !== '') as string[],
    guidance: formData.get('guidance') as string || ''
  }

  const result = await createQuestion(data)

  if (result.success) {
    redirect(`/admin/courses/${courseId}`)
  } else {
    throw new Error(result.error || 'Failed to create assessment')
  }
}

export default async function NewAssessmentPage({ params }: NewAssessmentPageProps) {
  const { id } = await params
  const courseResult = await getCourse(id)

  if (!courseResult.success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/courses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Course Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {courseResult.error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const course = courseResult.data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/courses/${course.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {course.name}
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Assessment</h1>
          <p className="text-gray-600">
            Create a new assessment for {course.name}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Assessment Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Assessment Details
              </CardTitle>
              <CardDescription>
                Configure the assessment requirements and evaluation criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handleCreateAssessment} className="space-y-6">
                <input type="hidden" name="courseId" value={course.id} />
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-base font-medium">
                      Assessment Title *
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g., AI Tools Comparison Essay"
                      required
                      className="text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="submissionType" className="text-base font-medium">
                      Submission Type *
                    </Label>
                    <select
                      id="submissionType"
                      name="submissionType"
                      required
                      className="w-full px-3 py-2 border border-input rounded-md text-base"
                    >
                      <option value="">Select submission type</option>
                      <option value="TEXT">Text Response</option>
                      <option value="DOCUMENT">Document Upload</option>
                      <option value="GITHUB_REPO">GitHub Repository</option>
                      <option value="WEBSITE">Website URL</option>
                      <option value="SCREENSHOT">Screenshot/Visual</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-medium">
                    Assessment Description *
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="Describe what students need to do for this assessment..."
                    required
                    className="text-base"
                  />
                  <p className="text-sm text-gray-600">
                    Provide clear instructions on what students should submit and how they should approach the task.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assessmentPrompt" className="text-base font-medium">
                    AI Assessment Prompt
                  </Label>
                  <Textarea
                    id="assessmentPrompt"
                    name="assessmentPrompt"
                    rows={3}
                    placeholder="Custom instructions for the AI assessor..."
                    className="text-base"
                  />
                  <p className="text-sm text-gray-600">
                    Optional: Provide specific instructions for how the AI should evaluate submissions.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guidance" className="text-base font-medium">
                    Student Guidance
                  </Label>
                  <Textarea
                    id="guidance"
                    name="guidance"
                    rows={3}
                    placeholder="Additional tips and guidance for students..."
                    className="text-base"
                  />
                  <p className="text-sm text-gray-600">
                    Optional: Helpful tips or guidance to help students succeed with this assessment.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-base font-medium">
                      Assessment Criteria
                    </Label>
                    <div className="space-y-2">
                      <Input
                        name="criteria"
                        placeholder="Must include comparison of all three tools"
                        className="text-sm"
                      />
                      <Input
                        name="criteria"
                        placeholder="Discusses pricing models and costs"
                        className="text-sm"
                      />
                      <Input
                        name="criteria"
                        placeholder="Explains practical use cases"
                        className="text-sm"
                      />
                      <Input
                        name="criteria"
                        placeholder="Uses proper technical terminology"
                        className="text-sm"
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Define what students must include to receive full marks.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-medium">
                      Red Flags (Automatic Deductions)
                    </Label>
                    <div className="space-y-2">
                      <Input
                        name="redFlags"
                        placeholder="Missing required comparison elements"
                        className="text-sm"
                      />
                      <Input
                        name="redFlags"
                        placeholder="No mention of costs or pricing"
                        className="text-sm"
                      />
                      <Input
                        name="redFlags"
                        placeholder="Unclear or incorrect explanations"
                        className="text-sm"
                      />
                      <Input
                        name="redFlags"
                        placeholder="No practical examples provided"
                        className="text-sm"
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Issues that will result in lower grades.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">
                    Conditional Checks
                  </Label>
                  <div className="space-y-2">
                    <Input
                      name="conditionalChecks"
                      placeholder="If examples are detailed, bonus points"
                      className="text-sm"
                    />
                    <Input
                      name="conditionalChecks"
                      placeholder="If MAS implementation explained, bonus points"
                      className="text-sm"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Conditional logic for bonus points or additional deductions.
                  </p>
                </div>

                <div className="flex gap-3 pt-6">
                  <Button type="submit" className="flex-1">
                    Create Assessment
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" asChild>
                    <Link href={`/admin/courses/${course.id}`}>Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Guide */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            
            {/* Submission Types Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submission Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <FileText className="h-4 w-4 text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Text Response</p>
                      <p className="text-xs text-gray-600">Students write directly in a text field</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 items-start">
                    <FileIcon className="h-4 w-4 text-purple-600 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Document Upload</p>
                      <p className="text-xs text-gray-600">PDF, DOCX, or pasted content</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 items-start">
                    <GitBranch className="h-4 w-4 text-gray-600 mt-1" />
                    <div>
                      <p className="font-medium text-sm">GitHub Repository</p>
                      <p className="text-xs text-gray-600">Code projects and repositories</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 items-start">
                    <Globe className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Website URL</p>
                      <p className="text-xs text-gray-600">Live websites and web apps</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 items-start">
                    <Image className="h-4 w-4 text-orange-600 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Screenshot/Visual</p>
                      <p className="text-xs text-gray-600">Images, diagrams, mockups</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assessment Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Best Practices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Clear Instructions:</strong> Be specific about what you want students to submit.
                    </p>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      <strong>Assessment Criteria:</strong> Define 4-6 clear criteria that students must meet.
                    </p>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800">
                      <strong>Base Examples:</strong> Create reference answers after creating the assessment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Context */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course: {course.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p className="text-gray-600">
                    {course.description || 'No course description available'}
                  </p>
                  <div className="pt-3 border-t">
                    <p className="font-medium text-gray-900">Current Stats:</p>
                    <div className="mt-2 space-y-1 text-gray-600">
                      <div className="flex justify-between">
                        <span>Assessments:</span>
                        <span>{course._count.questions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Enrolled:</span>
                        <span>{course._count.enrollments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}