import { redirect } from 'next/navigation'
import { createCourse } from '@/lib/actions/course-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'

async function handleCreateCourse(formData: FormData) {
  'use server'
  
  const result = await createCourse(formData)
  
  if (result.success) {
    redirect(`/admin/courses/${result.data.id}`)
  } else {
    throw new Error(result.error || 'Failed to create course')
  }
}

export default function NewCoursePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Course</h1>
          <p className="text-gray-600">
            Set up a new course for student assessments
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Course Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Details
              </CardTitle>
              <CardDescription>
                Provide basic information about your course. Students will use the course name to find assessments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handleCreateCourse} className="space-y-6">
                
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-medium">
                    Course Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Business Analyst, Web Development, Data Science"
                    required
                    className="text-base"
                  />
                  <p className="text-sm text-gray-600">
                    Students will use this exact name to access the course. Make it descriptive and easy to remember.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-medium">
                    Course Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="Describe what this course covers, what students will learn, and any prerequisites..."
                    className="text-base"
                  />
                  <p className="text-sm text-gray-600">
                    This description will help students understand what the course is about.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isActive" 
                    name="isActive" 
                    defaultChecked={true}
                    value="true"
                  />
                  <Label htmlFor="isActive" className="text-base">
                    Make course active and available to students
                  </Label>
                </div>

                <div className="flex gap-3 pt-6">
                  <Button type="submit" className="flex-1">
                    Create Course
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" asChild>
                    <Link href="/admin/courses">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Guide */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            
            {/* Course Setup Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Setup Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-semibold text-xs">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-sm">Create Course</p>
                      <p className="text-xs text-gray-600">Set up basic course information</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-400 rounded-full font-semibold text-xs">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-500">Add Questions</p>
                      <p className="text-xs text-gray-500">Create assessment questions</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-400 rounded-full font-semibold text-xs">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-500">Create Base Examples</p>
                      <p className="text-xs text-gray-500">Provide reference answers</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-400 rounded-full font-semibold text-xs">
                      4
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-500">Launch Course</p>
                      <p className="text-xs text-gray-500">Make available to students</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Best Practices */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Best Practices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Course Naming:</strong> Use clear, descriptive names that students can easily remember and type correctly.
                    </p>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      <strong>Descriptions:</strong> Include learning objectives, prerequisites, and what students can expect to achieve.
                    </p>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800">
                      <strong>Course Structure:</strong> Start with 3-5 questions and expand based on student feedback.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Examples */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Name Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-gray-50 rounded border">
                    <p className="font-medium">Business Analyst</p>
                    <p className="text-gray-600 text-xs">Good: Clear, concise</p>
                  </div>
                  
                  <div className="p-2 bg-gray-50 rounded border">
                    <p className="font-medium">Introduction to Python</p>
                    <p className="text-gray-600 text-xs">Good: Descriptive level</p>
                  </div>
                  
                  <div className="p-2 bg-gray-50 rounded border">
                    <p className="font-medium">Advanced React Development</p>
                    <p className="text-gray-600 text-xs">Good: Technology + level</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">After Creating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>Once you create the course, you'll be able to:</p>
                  <ul className="space-y-1 ml-4 text-gray-600">
                    <li>• Add assessment questions</li>
                    <li>• Create base examples</li>
                    <li>• Set assessment criteria</li>
                    <li>• Monitor student submissions</li>
                    <li>• View course analytics</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}