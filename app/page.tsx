import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Github, Zap, ArrowRight, CheckCircle, Clock, Star } from 'lucide-react'
import { getAllCourses } from '@/lib/actions/lookup-actions'

export default async function HomePage() {
  const coursesResult = await getAllCourses()
  const courses = coursesResult.success ? coursesResult.data : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-12 max-w-6xl">
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Assessment Agent
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get instant AI-powered feedback on your code, projects, and assignments. 
                Submit your work and receive detailed assessments in seconds.
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/courses">
                <Button size="lg" className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Browse Courses
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/test/github">
                <Button size="lg" variant="outline" className="flex items-center gap-2">
                  <Github className="w-5 h-5" />
                  Test GitHub Feature
                </Button>
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Instant Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Submit your work and get detailed AI assessment within seconds. No waiting for manual grading.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="w-5 h-5 text-purple-500" />
                  GitHub Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Submit GitHub repositories for comprehensive code analysis, structure review, and best practices assessment.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Multiple Formats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Support for code repositories, documents, websites, screenshots, and text submissions.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Assessment Grades */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Grades</CardTitle>
              <CardDescription>
                All assessments receive one of four detailed grade levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <Star className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-green-800">Excellent</h3>
                  <p className="text-sm text-green-600">Outstanding work</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-blue-800">Good</h3>
                  <p className="text-sm text-blue-600">Meets requirements</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-yellow-800">Can Improve</h3>
                  <p className="text-sm text-yellow-600">Some issues found</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <ArrowRight className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-red-800">Needs Improvement</h3>
                  <p className="text-sm text-red-600">Requires revision</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Courses */}
          {courses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Available Courses
                  <Link href="/courses">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </CardTitle>
                <CardDescription>
                  Popular courses with AI-powered assessments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {courses.slice(0, 4).map((course: any) => (
                    <Card key={course.id} className="border border-gray-200">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{course.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {course.description?.slice(0, 100)}
                            {course.description?.length > 100 && '...'}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">
                              {course.questions?.length || 0} Questions
                            </Badge>
                            <Link href={`/courses`}>
                              <Button size="sm" variant="ghost">
                                View Questions →
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>
                Get started with AI-powered assessments in 3 simple steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto font-bold text-lg">
                    1
                  </div>
                  <h3 className="font-semibold">Choose a Course</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse available courses and select the question you want to submit for
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto font-bold text-lg">
                    2
                  </div>
                  <h3 className="font-semibold">Submit Your Work</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your code, document, website, or provide a GitHub repository link
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto font-bold text-lg">
                    3
                  </div>
                  <h3 className="font-semibold">Get Instant Feedback</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive detailed AI assessment with grade and improvement suggestions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold">Ready to Get Assessed?</h2>
                <p className="text-blue-100">
                  Join thousands of students getting instant feedback on their work
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Link href="/courses">
                    <Button size="lg" variant="secondary">
                      Start Submitting
                    </Button>
                  </Link>
                  <Link href="/test/github">
                    <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
                      Test Features
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}