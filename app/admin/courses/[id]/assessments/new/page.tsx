'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCourse } from '@/lib/actions/course-actions'
import { createQuestion } from '@/lib/actions/assessment.actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import RubricManager from '@/components/admin/RubricManager'
import Link from 'next/link'
import { ArrowLeft, FileText, GitBranch, Globe, Image, FileIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface NewAssessmentPageProps {
  params: Promise<{
    id: string
  }>
}

export default function NewAssessmentPage({ params }: NewAssessmentPageProps) {
  const router = useRouter()
  const [courseId, setCourseId] = useState<string>('')
  const [course, setCourse] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    submissionType: '',
    assessmentPrompt: '',
    guidance: ''
  })

  // Rubric state
  const [formCriteria, setFormCriteria] = useState<string[]>([])
  const [formRedFlags, setFormRedFlags] = useState<string[]>([])
  const [formConditionalChecks, setFormConditionalChecks] = useState<string[]>([])

  useEffect(() => {
    async function loadCourse() {
      try {
        const { id } = await params
        setCourseId(id)

        const courseResult = await getCourse(id)
        if (courseResult.success) {
          setCourse(courseResult.data)
        } else {
          toast.error(courseResult.error || 'Failed to load course')
        }
      } catch (error) {
        toast.error('Failed to load course data')
      } finally {
        setIsLoading(false)
      }
    }

    loadCourse()
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.title.trim() || !formData.description.trim() || !formData.submissionType) {
        toast.error('Please fill in all required fields')
        setIsSubmitting(false)
        return
      }

      const result = await createQuestion({
        courseId,
        title: formData.title,
        description: formData.description,
        submissionType: formData.submissionType as any,
        assessmentPrompt: formData.assessmentPrompt || undefined,
        criteria: formCriteria,
        redFlags: formRedFlags,
        conditionalChecks: formConditionalChecks,
        guidance: formData.guidance || undefined
      })

      if (result.success) {
        toast.success('Assessment created successfully')
        router.push(`/admin/courses/${courseId}`)
      } else {
        toast.error(result.error || 'Failed to create assessment')
      }
    } catch (error) {
      toast.error('Failed to create assessment')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!course) {
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
            <p className="text-red-600">Error loading course data</p>
          </CardContent>
        </Card>
      </div>
    )
  }

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
              <form onSubmit={handleSubmit} className="space-y-6">

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-base font-medium">
                      Assessment Title *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
                      value={formData.submissionType}
                      onChange={(e) => setFormData(prev => ({ ...prev, submissionType: e.target.value }))}
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
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                    value={formData.assessmentPrompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, assessmentPrompt: e.target.value }))}
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
                    value={formData.guidance}
                    onChange={(e) => setFormData(prev => ({ ...prev, guidance: e.target.value }))}
                    rows={3}
                    placeholder="Additional tips and guidance for students..."
                    className="text-base"
                  />
                  <p className="text-sm text-gray-600">
                    Optional: Helpful tips or guidance to help students succeed with this assessment.
                  </p>
                </div>

                {/* Enhanced Rubric Manager Component */}
                <div className="border-t pt-6">
                  <RubricManager
                    criteria={formCriteria}
                    redFlags={formRedFlags}
                    conditionalChecks={formConditionalChecks}
                    onCriteriaChange={setFormCriteria}
                    onRedFlagsChange={setFormRedFlags}
                    onConditionalChecksChange={setFormConditionalChecks}
                    submissionType={formData.submissionType}
                  />
                </div>

                <div className="flex gap-3 pt-6">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Assessment...
                      </>
                    ) : (
                      'Create Assessment'
                    )}
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