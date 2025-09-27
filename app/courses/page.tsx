'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Code, FileText, Github, Globe, Image, ArrowRight } from 'lucide-react'
import { getAllCourses } from '@/lib/actions/lookup-actions'

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

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const result = await getAllCourses()
      if (result.success && result.data) {
        setCourses(result.data)
      } else {
        setError(result.error || 'Failed to load courses')
      }
    } catch (err) {
      console.error('Error loading courses:', err)
      setError('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const getSubmissionIcon = (type: string) => {
    switch (type) {
      case 'github_repo':
        return <Github className="w-4 h-4" />
      case 'website':
        return <Globe className="w-4 h-4" />
      case 'document':
        return <FileText className="w-4 h-4" />
      case 'screenshot':
        return <Image className="w-4 h-4" />
      case 'text':
        return <FileText className="w-4 h-4" />
      default:
        return <Code className="w-4 h-4" />
    }
  }

  const getSubmissionTypeColor = (type: string) => {
    switch (type) {
      case 'github_repo':
        return 'bg-purple-100 text-purple-800'
      case 'website':
        return 'bg-blue-100 text-blue-800'
      case 'document':
        return 'bg-green-100 text-green-800'
      case 'screenshot':
        return 'bg-orange-100 text-orange-800'
      case 'text':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <BookOpen className="w-8 h-8" />
            Available Courses
          </h1>
          <p className="text-muted-foreground">
            Browse courses and submit your assessments for instant AI-powered feedback
          </p>
        </div>

        {/* Quick Links */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Quick Test</h3>
                <p className="text-sm text-muted-foreground">
                  Test the GitHub repository analysis feature
                </p>
              </div>
              <Link href="/test/github">
                <Button variant="outline" className="flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  GitHub Test Page
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Courses List */}
        {courses.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <p>No courses available yet. Please add some courses through the admin panel.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {courses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle className="text-xl">{course.name}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {course.questions.length} Questions
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h4 className="font-medium">Available Assessments:</h4>
                    <div className="grid gap-3">
                      {course.questions.map((question) => (
                        <Card key={question.id} className="border border-gray-200">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary">
                                    Question {question.questionNumber}
                                  </Badge>
                                  <Badge 
                                    className={`${getSubmissionTypeColor(question.submissionType)} flex items-center gap-1`}
                                  >
                                    {getSubmissionIcon(question.submissionType)}
                                    {question.submissionType.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <h5 className="font-medium mb-1">{question.title}</h5>
                                {question.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {question.description.slice(0, 150)}
                                    {question.description.length > 150 && '...'}
                                  </p>
                                )}
                                {question.guidance && (
                                  <p className="text-xs text-blue-600">
                                    💡 {question.guidance.slice(0, 100)}
                                    {question.guidance.length > 100 && '...'}
                                  </p>
                                )}
                              </div>
                              <div className="ml-4">
                                <Link 
                                  href={`/submit?course=${encodeURIComponent(course.name)}&question=${question.questionNumber}`}
                                >
                                  <Button className="flex items-center gap-2">
                                    Submit Assessment
                                    <ArrowRight className="w-4 h-4" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Instructions */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="text-sm space-y-2">
              <p><strong>How it works:</strong></p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Choose a course and question that matches your submission type</li>
                <li>Click "Submit Assessment" to access the submission form</li>
                <li>Provide your work (GitHub repo, document, website, etc.)</li>
                <li>Get instant AI-powered feedback with detailed analysis</li>
                <li>Use the feedback to improve your work and resubmit if needed</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}