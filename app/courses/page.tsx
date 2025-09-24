import Link from 'next/link'
import { getActiveCourses } from '@/lib/actions/lookup-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, FileText, ArrowRight, Home } from 'lucide-react'

export default async function PublicCoursesPage() {
  const coursesResult = await getActiveCourses()
  const courses = coursesResult.success ? coursesResult.data : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Browse Courses</h1>
              <p className="mt-1 text-gray-600">
                Explore available courses and start your learning journey
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
              <Button asChild>
                <Link href="/submit">Start Assessment</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {courses.length === 0 ? (
          <Card className="max-w-2xl mx-auto text-center py-12">
            <CardContent>
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <CardTitle className="mb-2">No Courses Available</CardTitle>
              <CardDescription className="mb-6">
                Courses will appear here once they are created and activated by instructors.
                Check back soon!
              </CardDescription>
              <Button asChild>
                <Link href="/">Return Home</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Available Courses ({courses.length})
              </h2>
              <p className="text-gray-600">
                Choose a course to view questions and start your assessments
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course: any) => (
                <Card key={course.id} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <CardTitle className="line-clamp-2 text-lg">
                          {course.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-3">
                          {course.description || 'Explore this course to learn more and test your knowledge'}
                        </CardDescription>
                      </div>
                      <Badge variant="default" className="ml-2">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Course Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>{course._count.questions} Questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>Self-paced</span>
                        </div>
                      </div>

                      {/* Course Preview */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700 mb-2 font-medium">
                          What you'll work on:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Interactive assessments</li>
                          <li>• Instant AI-powered feedback</li>
                          <li>• Self-paced learning</li>
                        </ul>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button className="flex-1" asChild>
                          <Link href={`/courses/${encodeURIComponent(course.name)}`}>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            View Course
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href={`/submit?courseName=${encodeURIComponent(course.name)}`}>
                            Quick Start
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Call to Action */}
            <div className="mt-12 text-center bg-white rounded-xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Ready to Begin?
              </h3>
              <p className="text-gray-600 mb-6">
                No registration required. Choose any course and start getting instant feedback on your work.
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/submit">
                    Start Your First Assessment
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/health">
                    System Status
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Assessment Agent</h4>
              <p className="text-gray-600 text-sm">
                AI-powered assessment platform providing instant feedback for self-paced learning.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Link href="/submit" className="block text-gray-600 hover:text-gray-900">Submit Assessment</Link>
                <Link href="/health" className="block text-gray-600 hover:text-gray-900">System Health</Link>
                <Link href="/admin" className="block text-gray-600 hover:text-gray-900">Admin Portal</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">How It Works</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>1. Choose your course</p>
                <p>2. Submit your work</p>
                <p>3. Get instant AI feedback</p>
                <p>4. Improve and resubmit</p>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; 2024 Assessment Agent. Powered by AI for better learning outcomes.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}