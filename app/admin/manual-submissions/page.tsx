'use client'

import { useState, useEffect } from 'react'
import { getManualSubmissions, getCoursesWithManualFeedback } from '@/lib/actions/admin-submissions.actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Search, Filter, Eye, Calendar, User, FileText, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Submission {
  id: string
  status: string
  createdAt: Date
  reviewedAt: Date | null
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
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

interface Course {
  id: string
  name: string
  _count: {
    questions: number
  }
}

export default function ManualSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    courseId: '',
    status: '',
    studentEmail: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const [submissionsResult, coursesResult] = await Promise.all([
      getManualSubmissions(),
      getCoursesWithManualFeedback()
    ])

    if (submissionsResult.success && submissionsResult.data) {
      setSubmissions(submissionsResult.data)
    }

    if (coursesResult.success && coursesResult.data) {
      setCourses(coursesResult.data)
    }

    setLoading(false)
  }

  const applyFilters = async () => {
    setLoading(true)
    const result = await getManualSubmissions({
      courseId: filters.courseId || undefined,
      status: filters.status || undefined,
      studentEmail: filters.studentEmail || undefined
    })

    if (result.success && result.data) {
      setSubmissions(result.data)
    }

    setLoading(false)
  }

  const getStatusBadge = (submission: Submission) => {
    if (submission.reviewedAt) {
      return <Badge className="bg-green-100 text-green-700 border-green-300">Reviewed</Badge>
    }
    return <Badge className="bg-amber-100 text-amber-700 border-amber-300">Pending Review</Badge>
  }

  const pendingCount = submissions.filter(s => !s.reviewedAt).length
  const reviewedCount = submissions.filter(s => s.reviewedAt).length

  if (loading && submissions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manual Submissions</h1>
        <p className="text-gray-600 mt-1">
          Review and provide feedback for student submissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{reviewedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="course-filter">Course</Label>
              <select
                id="course-filter"
                value={filters.courseId}
                onChange={(e) => setFilters(prev => ({ ...prev, courseId: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-md"
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name} ({course._count.questions})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-md"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="REVIEWED">Reviewed</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-filter">Student Email</Label>
              <Input
                id="student-filter"
                type="text"
                placeholder="Search by email..."
                value={filters.studentEmail}
                onChange={(e) => setFilters(prev => ({ ...prev, studentEmail: e.target.value }))}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={applyFilters} className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Apply Filters
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>
            Click on a submission to review and provide feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No submissions found</p>
              <p className="text-sm mt-1">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium">{submission.user?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-600">{submission.user?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{submission.question.course.name}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">#{submission.question.questionNumber}</p>
                          <p className="text-sm text-gray-600">{submission.question.title}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{submission.question.submissionType}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(submission)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/manual-submissions/${submission.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Review
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
