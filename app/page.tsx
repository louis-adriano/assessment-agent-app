import { getAllCourses } from '@/lib/actions/lookup-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Github, Globe, FileText, Image, Upload, Clock, Users, Star, Zap } from 'lucide-react'
import Link from 'next/link'

interface Course {
  id: string
  name: string
  description: string
  questions: Question[]
}

interface Question {
  id: string
  questionNumber: number
  title: string
  description: string
  submissionType: string
  guidance?: string
}

export default async function HomePage() {
  const coursesResult = await getAllCourses()
  const courses = coursesResult.success ? coursesResult.data || [] : []

  const getSubmissionTypeIcon = (type: string) => {
    switch (type) {
      case 'github_repo': return <Github className="h-4 w-4" />
      case 'website': return <Globe className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      case 'screenshot': return <Image className="h-4 w-4" />
      case 'text': return <FileText className="h-4 w-4" />
      default: return <Upload className="h-4 w-4" />
    }
  }

  const getSubmissionTypeLabel = (type: string) => {
    switch (type) {
      case 'github_repo': return 'GitHub Repo'
      case 'website': return 'Website'
      case 'document': return 'Document'
      case 'screenshot': return 'Screenshot'
      case 'text': return 'Text'
      default: return 'Upload'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto py-12 max-w-7xl">
        <div className="space-y-16">
          {/* Hero Section */}
          <div className="text-center space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                <Zap className="h-4 w-4 mr-2" />
                AI-Powered Assessment • Instant Feedback
              </div>
              
              <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                Assessment Agent
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Get instant AI-powered feedback on your code, projects, and assignments. 
                Submit your work and receive detailed assessments in seconds, no registration required.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild>
                  <Link href="#courses">
                    Start Assessment
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
                  <Link href="/admin">
                    Admin Dashboard
                  </Link>
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-blue-600">
                  {courses.reduce((total: number, course: any) => total + course.questions.length, 0)}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Available Assessments</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-purple-600">&lt;5s</div>
                <div className="text-sm text-muted-foreground font-medium">Average Response Time</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-indigo-600">5</div>
                <div className="text-sm text-muted-foreground font-medium">Submission Types</div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center">
                    <Github className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Code Assessment</h3>
                    <p className="text-sm text-muted-foreground">
                      Submit GitHub repositories for comprehensive code review and feedback
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg flex items-center justify-center">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Website Testing</h3>
                    <p className="text-sm text-muted-foreground">
                      Evaluate website functionality, accessibility, and performance
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Document Review</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload documents for content analysis and structural feedback
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg flex items-center justify-center">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Instant Results</h3>
                    <p className="text-sm text-muted-foreground">
                      Get detailed feedback in seconds with AI-powered assessment
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Showcase */}
          <div id="courses" className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold">Available Assessments</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Choose from our comprehensive collection of assessments designed for different skills and learning objectives
              </p>
            </div>

            {courses.length === 0 ? (
              <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-dashed">
                <CardContent className="pt-8 pb-8">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-600">No Courses Available Yet</h3>
                      <p className="text-gray-500">Courses will appear here once they're created by administrators.</p>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href="/admin">
                        Create First Course
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course: any) => (
                  <Card key={course.id} className="border-0 shadow-lg bg-white/80 backdrop-blur hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <Badge variant="secondary" className="text-xs font-medium">
                            {course.questions.length} Assessment{course.questions.length !== 1 ? 's' : ''}
                          </Badge>
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="text-xs font-medium">New</span>
                          </div>
                        </div>
                        <CardTitle className="text-xl leading-tight">{course.name}</CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {course.description}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Question Preview */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Available Assessments:</h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {course.questions.map((question: any) => (
                              <div key={question.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      #{question.questionNumber}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      {getSubmissionTypeIcon(question.submissionType)}
                                      <span className="text-xs">{getSubmissionTypeLabel(question.submissionType)}</span>
                                    </div>
                                  </div>
                                  <h5 className="font-medium text-sm truncate">{question.title}</h5>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {question.description}
                                  </p>
                                </div>
                                <div className="flex-shrink-0 ml-3">
                                  <Link
                                    href={`/submit?courseName=${encodeURIComponent(course.name)}&assessmentNumber=${question.questionNumber}`}
                                  >
                                    <Button size="sm" variant="ghost" className="text-xs px-3 py-1">
                                      Submit
                                      <ArrowRight className="ml-1 h-3 w-3" />
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Course Action */}
                        <div className="pt-4 border-t">
                          <Button className="w-full" variant="outline" asChild>
                            <Link href={`/courses/${encodeURIComponent(course.name)}`}>
                              View All Assessments
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* How It Works */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
            <CardHeader>
              <CardTitle className="text-center text-3xl">How Assessment Agent Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl">
                    1
                  </div>
                  <h3 className="font-bold text-lg">Choose Assessment</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse courses and select an assessment that matches your submission type
                  </p>
                </div>
                
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl">
                    2
                  </div>
                  <h3 className="font-bold text-lg">Submit Your Work</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your code, document, website, or provide a GitHub repository link
                  </p>
                </div>
                
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl">
                    3
                  </div>
                  <h3 className="font-bold text-lg">AI Assessment</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI analyzes your submission against best practices and course criteria
                  </p>
                </div>
                
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl">
                    4
                  </div>
                  <h3 className="font-bold text-lg">Get Instant Feedback</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive detailed assessment with grade and actionable improvement suggestions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white border-0 shadow-2xl">
            <CardContent className="pt-12 pb-12">
              <div className="text-center space-y-8">
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold">Ready to Get Assessed?</h2>
                  <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                    Join thousands of students getting instant feedback on their work. 
                    No registration required - start submitting today!
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-6" asChild>
                    <Link href="#courses">
                      Browse Assessments
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent border-white text-white hover:bg-white hover:text-blue-600" asChild>
                    <Link href="/admin">
                      Create Course
                    </Link>
                  </Button>
                </div>
                
                <div className="flex items-center justify-center gap-8 pt-8 text-blue-100">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span className="text-sm">Instant Results</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span className="text-sm">No Registration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    <span className="text-sm">AI Powered</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground border-t pt-8">
            <p>Assessment Agent - Powered by AI for instant, intelligent feedback</p>
          </div>
        </div>
      </div>
    </div>
  )
}