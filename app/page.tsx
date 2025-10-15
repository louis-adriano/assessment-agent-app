import { getAllCourses } from '@/lib/actions/lookup-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, TrendingUp, CheckCircle, Target, ArrowRight, Github, Globe, FileText, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'
import { Sidebar } from '@/components/layout/Sidebar'

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
}

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  const coursesResult = await getAllCourses()
  const courses = coursesResult.success ? coursesResult.data || [] : []

  const getSubmissionTypeIcon = (type: string) => {
    switch (type) {
      case 'github_repo': return <Github className="h-4 w-4" />
      case 'website': return <Globe className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      case 'screenshot': return <FileText className="h-4 w-4" />
      case 'text': return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 lg:pl-72">
        {/* Hero Section */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200">
          <div className="px-6 py-8 md:px-12">
            <div className="max-w-7xl mx-auto">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-2 rounded-full text-sm shadow-lg">
                  <Sparkles className="h-4 w-4" />
                  <span>AI-Powered Learning Platform</span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                    Welcome{session?.user ? `, ${session.user.name}` : ''}
                  </h1>

                  <p className="text-lg md:text-xl text-gray-600">
                    AI Assessment Portal
                  </p>
                </div>

                {/* Login CTA for non-authenticated users */}
                {!session?.user && (
                  <div className="pt-4">
                    <Button asChild size="lg" className="bg-teal-600 hover:bg-teal-700 shadow-lg">
                      <Link href="/auth/signin">
                        Sign In to Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-6 py-8 md:px-12">
          <div className="max-w-7xl mx-auto space-y-12">

            {/* Courses Section */}
            <div id="courses" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">My Courses</h2>
                  <p className="text-muted-foreground">Continue your learning journey</p>
                </div>
                {session?.user?.role === 'admin' && (
                  <Button variant="outline" asChild>
                    <Link href="/admin/courses/new">
                      Create Course
                    </Link>
                  </Button>
                )}
              </div>

              {courses.length === 0 ? (
                <Card className="border-dashed rounded-2xl">
                  <CardContent className="pt-12 pb-12">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">No Courses Yet</h3>
                        <p className="text-sm text-muted-foreground">
                          {session?.user?.role === 'admin'
                            ? "Create your first course to get started"
                            : "Courses will appear here once they're available"}
                        </p>
                      </div>
                      {session?.user?.role === 'admin' && (
                        <Button asChild>
                          <Link href="/admin/courses/new">
                            Create First Course
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course: any) => (
                    <Card key={course.id} className="hover:shadow-xl transition-all hover:border-teal-500 border-l-4 border-l-teal-500 shadow-md rounded-2xl flex flex-col h-full">
                      <CardHeader className="flex-none">
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant="secondary" className="text-xs bg-teal-100 text-teal-700">
                            {course.questions.length} Assessment{course.questions.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg line-clamp-1 group-hover:text-teal-600">{course.name}</CardTitle>
                        <CardDescription className="line-clamp-2 text-sm min-h-[2.5rem]">
                          {course.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col">
                        <div className="flex-1 space-y-4">
                          <div className="space-y-2 min-h-[80px]">
                            {course.questions.slice(0, 2).map((question: any) => (
                              <div key={question.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                {getSubmissionTypeIcon(question.submissionType)}
                                <span className="truncate">{question.title}</span>
                              </div>
                            ))}
                            {course.questions.length > 2 && (
                              <p className="text-xs text-muted-foreground">
                                +{course.questions.length - 2} more assessments
                              </p>
                            )}
                          </div>

                          <Button className="w-full bg-teal-600 hover:bg-teal-700 mt-auto" size="sm" asChild>
                            <Link href={`/courses/${encodeURIComponent(course.name)}`}>
                              View Course
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
