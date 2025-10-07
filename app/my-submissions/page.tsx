'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sidebar } from '@/components/layout/Sidebar'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Calendar,
  BookOpen,
  FileEdit,
  LogIn
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Submission {
  id: string
  status: string
  createdAt: Date
  processedAt: Date | null
  assessmentResult: any
  manualFeedback: string | null
  manualScore: string | null
  reviewedAt: Date | null
  question: {
    id: string
    title: string
    questionNumber: number
    submissionType: string
    course: {
      id: string
      name: string
    }
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'PROCESSING':
      return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
    case 'FAILED':
      return <XCircle className="h-4 w-4 text-red-600" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-600" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'default'
    case 'PROCESSING':
      return 'secondary'
    case 'FAILED':
      return 'destructive'
    default:
      return 'outline'
  }
}

function getRemarkColor(remark: string) {
  switch (remark) {
    case 'Excellent':
      return 'bg-yellow-100 text-yellow-800'
    case 'Good':
      return 'bg-green-100 text-green-800'
    case 'Can Improve':
      return 'bg-blue-100 text-blue-800'
    case 'Needs Improvement':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !session?.user) {
      // Not logged in - show login prompt
      setLoading(false)
      return
    }

    if (session?.user) {
      loadSubmissions()
    }
  }, [session, isPending])

  const loadSubmissions = async () => {
    try {
      const response = await fetch('/api/my-submissions')
      const data = await response.json()

      if (data.success) {
        setSubmissions(data.submissions)
      }
    } catch (error) {
      console.error('Failed to load submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isPending && !session?.user) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="flex-1 lg:pl-72">
          <div className="px-6 py-12 md:px-12">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
                <FileText className="h-10 w-10 text-teal-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
              <p className="text-gray-600 text-lg">
                Sign in to view all your submissions and track your progress across courses.
              </p>
              <div className="flex gap-3 justify-center pt-4">
                <Button
                  className="bg-teal-600 hover:bg-teal-700 rounded-xl"
                  asChild
                >
                  <Link href="/auth/signin">
                    <LogIn className="mr-2 h-4 w-4" />
                    Log In
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  asChild
                >
                  <Link href="/auth/signup">
                    Sign Up
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="flex-1 lg:pl-72 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Clock className="h-8 w-8 animate-spin text-teal-600 mx-auto" />
            <p className="text-gray-600">Loading your submissions...</p>
          </div>
        </main>
      </div>
    )
  }

  const stats = {
    total: submissions.length,
    completed: submissions.filter(s => s.status === 'COMPLETED').length,
    pending: submissions.filter(s => s.status === 'PROCESSING').length,
    reviewed: submissions.filter(s => s.manualFeedback).length,
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <main className="flex-1 lg:pl-72">
        <div className="px-6 py-12 md:px-12">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Submissions</h1>
              <p className="text-gray-600 mt-2">
                View all your submissions and track your progress
              </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">All submissions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <p className="text-xs text-muted-foreground">Assessed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Processing</CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
                  <p className="text-xs text-muted-foreground">In progress</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
                  <FileEdit className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{stats.reviewed}</div>
                  <p className="text-xs text-muted-foreground">Manual feedback</p>
                </CardContent>
              </Card>
            </div>

            {/* Submissions List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Submissions</CardTitle>
                <CardDescription>
                  {submissions.length} submission{submissions.length !== 1 ? 's' : ''} total
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
                    <p className="text-gray-600 mb-4">Start by submitting your first assessment</p>
                    <Button
                      className="bg-teal-600 hover:bg-teal-700 rounded-xl"
                      asChild
                    >
                      <Link href="/">
                        Browse Courses
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => {
                      const assessmentResult = submission.assessmentResult as any
                      const hasManualReview = !!submission.manualFeedback
                      return (
                        <div
                          key={submission.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {getStatusIcon(submission.status)}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium text-sm">
                                    {submission.question.course.name} - Q{submission.question.questionNumber}
                                  </h4>
                                  <Badge
                                    variant={getStatusColor(submission.status) as any}
                                    className="text-xs"
                                  >
                                    {submission.status}
                                  </Badge>
                                  {hasManualReview && (
                                    <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-300">
                                      <FileEdit className="mr-1 h-3 w-3" />
                                      Reviewed
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                                {submission.question.title}
                              </p>

                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                                </span>
                                {submission.reviewedAt && (
                                  <span className="text-emerald-600 font-medium">
                                    Instructor review added
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {assessmentResult?.remark && (
                                <div className={`px-2 py-1 rounded text-xs font-medium ${getRemarkColor(assessmentResult.remark)}`}>
                                  {assessmentResult.remark}
                                </div>
                              )}

                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/results/${submission.id}`}>
                                  <Eye className="mr-1 h-3 w-3" />
                                  View
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
