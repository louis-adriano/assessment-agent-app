import { getAllCourses } from '@/lib/actions/lookup-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, GraduationCap, LayoutDashboard, Trophy, TrendingUp, CheckCircle, Clock, Target, ArrowRight, Github, Globe, FileText, Sparkles, User, LogOut } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'

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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-white border-r">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-6">
            <GraduationCap className="h-8 w-8 text-teal-600" />
            <span className="ml-2 text-xl font-bold">Assessment Agent</span>
          </div>

          <nav className="mt-8 flex-1 px-4 space-y-2">
            <Link href="/" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg bg-teal-500 text-white">
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Dashboard
            </Link>
            <Link href="/courses" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100">
              <BookOpen className="mr-3 h-5 w-5" />
              Courses
            </Link>
          </nav>

          {/* User Section */}
          <div className="flex-shrink-0 px-4 pb-4">
            {session?.user ? (
              <Card className="border-0 bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-teal-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Welcome,</p>
                      <p className="text-sm font-medium truncate">{session.user.name}</p>
                    </div>
                    <Link href="/api/auth/sign-out">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button className="w-full" asChild>
                <Link href="/auth/signin">
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-72">
        {/* Hero Section */}
        <div className="relative bg-teal-600 text-white overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative px-6 py-16 md:px-12 md:py-20">
            <div className="max-w-5xl mx-auto">
              <div className="text-center space-y-8">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm border border-white/30 shadow-lg">
                  <Sparkles className="h-4 w-4" />
                  <span>AI-Powered Learning Platform</span>
                </div>

                <div className="space-y-4">
                  <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                    {session?.user
                      ? `Welcome back, ${session.user.name}!`
                      : "Master Your Skills with AI"}
                  </h1>

                  <p className="text-xl md:text-2xl text-teal-100 max-w-3xl mx-auto">
                    {session?.user
                      ? "Continue your learning journey with instant AI-powered feedback"
                      : "Get instant feedback on your code, projects, and assignments. Learn faster with AI-powered assessments."}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  {session?.user ? (
                    <>
                      <Button size="lg" className="bg-white text-teal-600 hover:bg-gray-100 shadow-lg" asChild>
                        <Link href="#courses">
                          Browse Courses
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                      {session.user.role === 'admin' && (
                        <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 backdrop-blur-sm shadow-lg" asChild>
                          <Link href="/admin">Admin Dashboard</Link>
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button size="lg" className="bg-white text-teal-600 hover:bg-gray-100 shadow-lg" asChild>
                        <Link href="/auth/signin">Get Started</Link>
                      </Button>
                      <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 backdrop-blur-sm shadow-lg" asChild>
                        <Link href="#courses">View Courses</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-6 py-8 md:px-12">
          <div className="max-w-7xl mx-auto space-y-12">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-t-4 border-t-teal-500 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Progress</CardTitle>
                  <TrendingUp className="h-4 w-4 text-teal-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-teal-600">0%</div>
                  <p className="text-xs text-muted-foreground mt-1">Start learning to track progress</p>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-teal-500 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-teal-600">0</div>
                  <p className="text-xs text-muted-foreground mt-1">Assessments completed</p>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-teal-500 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <Target className="h-4 w-4 text-teal-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-teal-600">-</div>
                  <p className="text-xs text-muted-foreground mt-1">No scores yet</p>
                </CardContent>
              </Card>
            </div>

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
                <Card className="border-dashed">
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
                    <Card key={course.id} className="hover:shadow-xl transition-all hover:border-teal-500 border-l-4 border-l-teal-500 shadow-md">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant="secondary" className="text-xs bg-teal-100 text-teal-700">
                            {course.questions.length} Assessment{course.questions.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg line-clamp-1 group-hover:text-teal-600">{course.name}</CardTitle>
                        <CardDescription className="line-clamp-2 text-sm">
                          {course.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-2">
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

                          <Button className="w-full bg-teal-600 hover:bg-teal-700" size="sm" asChild>
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
