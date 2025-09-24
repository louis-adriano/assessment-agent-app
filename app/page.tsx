import Link from 'next/link'
import { getActiveCourses } from '@/lib/actions/lookup-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, CheckCircle } from 'lucide-react'

interface Course {
  id: string
  name: string
  description?: string | null
  _count: {
    questions: number
  }
}

export default async function HomePage() {
  const coursesResult = await getActiveCourses()
  const courses = coursesResult.success ? coursesResult.data : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assessment Agent</h1>
              <p className="mt-1 text-gray-600">AI-powered assessment and instant feedback</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/submit">Submit Assessment</Link>
              </Button>
              <Button asChild>
                <Link href="/admin">Admin Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Get Instant AI-Powered Feedback on Your Work
          </h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Submit your assignments, projects, and assessments to receive detailed, 
            constructive feedback powered by advanced AI. No registration required.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/submit">
                <CheckCircle className="mr-2 h-5 w-5" />
                Submit Your Work
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#courses">Browse Courses</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">How It Works</h3>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Choose Your Course</h4>
              <p className="text-gray-600">Select from available courses and find the question you want to submit for.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Submit Your Work</h4>
              <p className="text-gray-600">Upload your documents, code repositories, or text responses for assessment.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Get Instant Feedback</h4>
              <p className="text-gray-600">Receive detailed, personalized feedback with specific areas for improvement.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="courses" className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Available Courses</h3>
            <p className="text-gray-600">Choose from our selection of courses and start your assessment journey</p>
          </div>

          {courses.length === 0 ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">No Courses Available</h4>
                <p className="text-gray-600 mb-4">Courses will appear here once they are created by administrators.</p>
                <Button asChild><Link href="/admin">Admin Dashboard</Link></Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course: Course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{course.name}</CardTitle>
                    <CardDescription className="line-clamp-3 mt-2">
                      {course.description || 'Explore this course and test your knowledge'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BookOpen className="h-4 w-4" />
                        <span>{course._count.questions} Questions</span>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <Button asChild className="w-full">
                      <Link href={`/submit?courseName=${encodeURIComponent(course.name)}`}>View Questions</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Ready to submit your work for any course?</p>
            <Button size="lg" asChild><Link href="/submit">Start Assessment</Link></Button>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h4 className="text-lg font-semibold mb-4">Assessment Agent</h4>
              <p className="text-gray-400 mb-4">AI-powered assessment platform providing instant, detailed feedback on student submissions across multiple formats and subjects.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link href="/submit" className="block text-gray-400 hover:text-white">Submit Assessment</Link>
                <Link href="/health" className="block text-gray-400 hover:text-white">System Health</Link>
                <Link href="/admin" className="block text-gray-400 hover:text-white">Admin Dashboard</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-400">
            <p>&copy; 2024 Assessment Agent. Built with Next.js and powered by AI.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}