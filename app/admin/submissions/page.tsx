'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BarChart3,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  User,
  Filter,
  Download,
  Eye,
  FileEdit,
  Search,
  ChevronRight,
  BookOpen,
  Calendar,
  List,
  LayoutGrid,
  ArrowLeft
} from 'lucide-react'
import { getManualSubmissions } from '@/lib/actions/admin-submissions.actions'

interface Submission {
  id: string
  status: string
  createdAt: Date
  processedAt: Date | null
  submissionContent: string
  assessmentResult: any
  manualFeedback: string | null
  manualScore: string | null
  reviewedAt: Date | null
  reviewedBy: string | null
  userId: string | null
  user: {
    name: string | null
    email: string
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

interface CourseGroup {
  id: string
  name: string
  submissions: Submission[]
  assessmentCount: number
}

interface AssessmentGroup {
  id: string
  questionNumber: number
  title: string
  submissionType: string
  submissions: Submission[]
}

type ViewMode = 'all' | 'hierarchy'
type HierarchyLevel = 'courses' | 'assessments' | 'students'

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

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy')

  // Hierarchy navigation state
  const [hierarchyLevel, setHierarchyLevel] = useState<HierarchyLevel>('courses')
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null)

  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    studentEmail: '',
    reviewStatus: '',
    dateFrom: '',
    dateTo: ''
  })

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    setLoading(true)
    const result = await getManualSubmissions()

    if (result.success && result.data) {
      setSubmissions(result.data as any)
    }
    setLoading(false)
  }

  const applyFilters = async () => {
    setLoading(true)
    const result = await getManualSubmissions({
      status: filters.status || undefined,
      studentEmail: filters.studentEmail || undefined
    })

    if (result.success && result.data) {
      setSubmissions(result.data as any)
    }
    setLoading(false)
  }

  // Group submissions by course
  const courseGroups: CourseGroup[] = submissions.reduce((acc, submission) => {
    const courseId = submission.question.course.id
    const courseName = submission.question.course.name

    let group = acc.find(g => g.id === courseId)
    if (!group) {
      group = {
        id: courseId,
        name: courseName,
        submissions: [],
        assessmentCount: 0
      }
      acc.push(group)
    }

    group.submissions.push(submission)
    return acc
  }, [] as CourseGroup[])

  // Calculate unique assessments per course
  courseGroups.forEach(course => {
    const uniqueAssessments = new Set(course.submissions.map(s => s.question.id))
    course.assessmentCount = uniqueAssessments.size
  })

  // Group submissions by assessment for selected course
  const assessmentGroups: AssessmentGroup[] = selectedCourse
    ? submissions
        .filter(s => s.question.course.id === selectedCourse)
        .reduce((acc, submission) => {
          const assessmentId = submission.question.id

          let group = acc.find(g => g.id === assessmentId)
          if (!group) {
            group = {
              id: assessmentId,
              questionNumber: submission.question.questionNumber,
              title: submission.question.title,
              submissionType: submission.question.submissionType,
              submissions: []
            }
            acc.push(group)
          }

          group.submissions.push(submission)
          return acc
        }, [] as AssessmentGroup[])
        .sort((a, b) => a.questionNumber - b.questionNumber)
    : []

  // Get submissions for selected assessment
  const studentSubmissions = selectedAssessment
    ? submissions.filter(s => s.question.id === selectedAssessment)
    : []

  // Apply filters to student submissions
  const filteredSubmissions = studentSubmissions.filter(s => {
    if (filters.reviewStatus === 'reviewed' && !s.manualFeedback) return false
    if (filters.reviewStatus === 'pending' && s.manualFeedback) return false
    if (filters.status && s.status !== filters.status) return false
    if (filters.studentEmail && !s.user?.email.toLowerCase().includes(filters.studentEmail.toLowerCase())) return false
    if (filters.dateFrom && new Date(s.createdAt) < new Date(filters.dateFrom)) return false
    if (filters.dateTo && new Date(s.createdAt) > new Date(filters.dateTo)) return false
    return true
  })

  // For "View All" mode
  const allFilteredSubmissions = submissions.filter(s => {
    if (filters.reviewStatus === 'reviewed' && !s.manualFeedback) return false
    if (filters.reviewStatus === 'pending' && s.manualFeedback) return false
    if (filters.status && s.status !== filters.status) return false
    if (filters.studentEmail && !s.user?.email.toLowerCase().includes(filters.studentEmail.toLowerCase())) return false
    if (filters.dateFrom && new Date(s.createdAt) < new Date(filters.dateFrom)) return false
    if (filters.dateTo && new Date(s.createdAt) > new Date(filters.dateTo)) return false
    return true
  })

  const displaySubmissions = viewMode === 'all' ? allFilteredSubmissions : filteredSubmissions

  // Stats should always be based on ALL submissions, regardless of view mode or hierarchy level
  const stats = {
    total: submissions.length,
    completed: submissions.filter(s => s.status === 'COMPLETED').length,
    processing: submissions.filter(s => s.status === 'PROCESSING').length,
    failed: submissions.filter(s => s.status === 'FAILED').length,
    anonymous: submissions.filter(s => !s.userId).length,
    authenticated: submissions.filter(s => s.userId).length,
    reviewed: submissions.filter(s => s.manualFeedback).length,
    pendingReview: submissions.filter(s => !s.manualFeedback).length
  }

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId)
    setHierarchyLevel('assessments')
    setSelectedAssessment(null)
  }

  const handleAssessmentSelect = (assessmentId: string) => {
    setSelectedAssessment(assessmentId)
    setHierarchyLevel('students')
  }

  const handleBackToCourses = () => {
    setHierarchyLevel('courses')
    setSelectedCourse(null)
    setSelectedAssessment(null)
  }

  const handleBackToAssessments = () => {
    setHierarchyLevel('assessments')
    setSelectedAssessment(null)
  }

  return (
    <div className="space-y-6">
      {/* Header with View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submissions</h1>
          <p className="text-gray-600">
            {viewMode === 'hierarchy' && hierarchyLevel === 'courses' && 'Select a course to view submissions'}
            {viewMode === 'hierarchy' && hierarchyLevel === 'assessments' && 'Select an assessment to view student submissions'}
            {viewMode === 'hierarchy' && hierarchyLevel === 'students' && 'Review individual student submissions'}
            {viewMode === 'all' && 'All submissions across all courses'}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'hierarchy' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setViewMode('hierarchy')
                handleBackToCourses()
              }}
              className={viewMode === 'hierarchy' ? '' : 'hover:bg-gray-200'}
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              By Course
            </Button>
            <Button
              variant={viewMode === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('all')}
              className={viewMode === 'all' ? '' : 'hover:bg-gray-200'}
            >
              <List className="mr-2 h-4 w-4" />
              View All
            </Button>
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? 'Hide' : 'Filters'}
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {viewMode === 'hierarchy' && hierarchyLevel !== 'courses' && (
        <div className="flex items-center gap-2 text-sm">
          <Button variant="ghost" size="sm" onClick={handleBackToCourses}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Courses
          </Button>
          {hierarchyLevel === 'students' && selectedCourse && (
            <>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <Button variant="ghost" size="sm" onClick={handleBackToAssessments}>
                Assessments
              </Button>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Students</span>
            </>
          )}
          {hierarchyLevel === 'assessments' && (
            <>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Assessments</span>
            </>
          )}
        </div>
      )}

      {/* Submissions Statistics */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
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
            <Clock className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-600">{stats.processing}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Errors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manually Reviewed</CardTitle>
            <FileEdit className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.reviewed}</div>
            <p className="text-xs text-muted-foreground">Has feedback</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">No feedback</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anonymous</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.anonymous}</div>
            <p className="text-xs text-muted-foreground">No login</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered</CardTitle>
            <Users className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-600">{stats.authenticated}</div>
            <p className="text-xs text-muted-foreground">With login</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-7">
              <div className="space-y-2">
                <Label htmlFor="status-filter">AI Status</Label>
                <select
                  id="status-filter"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-md"
                >
                  <option value="">All</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-filter">Review Status</Label>
                <select
                  id="review-filter"
                  value={filters.reviewStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, reviewStatus: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-md"
                >
                  <option value="">All</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="pending">Pending Review</option>
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

              <div className="space-y-2">
                <Label htmlFor="date-from">Date From</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-to">Date To</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>

              <div className="flex items-end">
                <Button onClick={applyFilters} className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Apply
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({ status: '', studentEmail: '', reviewStatus: '', dateFrom: '', dateTo: '' })
                    loadSubmissions()
                  }}
                  className="w-full"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* HIERARCHY VIEW - Course Selection */}
      {viewMode === 'hierarchy' && hierarchyLevel === 'courses' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courseGroups.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-600">Create a course to start receiving submissions</p>
              </CardContent>
            </Card>
          ) : (
            courseGroups.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleCourseSelect(course.id)}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-sky-100 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-sky-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{course.name}</CardTitle>
                      <CardDescription>{course.assessmentCount} assessment{course.assessmentCount !== 1 ? 's' : ''}</CardDescription>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{course.submissions.length}</div>
                      <div className="text-xs text-gray-600">Total</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">{course.submissions.filter(s => s.manualFeedback).length}</div>
                      <div className="text-xs text-gray-600">Reviewed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-amber-600">{course.submissions.filter(s => !s.manualFeedback).length}</div>
                      <div className="text-xs text-gray-600">Pending</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* HIERARCHY VIEW - Assessment Selection */}
      {viewMode === 'hierarchy' && hierarchyLevel === 'assessments' && (
        <div className="space-y-4">
          {assessmentGroups.map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleAssessmentSelect(assessment.id)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-sky-100 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Question {assessment.questionNumber}</h3>
                      <p className="text-gray-600">{assessment.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{assessment.submissionType.replace('_', ' ')}</Badge>
                        <span className="text-sm text-gray-500">{assessment.submissions.length} submission{assessment.submissions.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-xl font-bold text-emerald-600">{assessment.submissions.filter(s => s.manualFeedback).length}</div>
                      <div className="text-xs text-gray-600">Reviewed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-amber-600">{assessment.submissions.filter(s => !s.manualFeedback).length}</div>
                      <div className="text-xs text-gray-600">Pending</div>
                    </div>
                    <ChevronRight className="h-6 w-6 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* HIERARCHY VIEW - Student Submissions */}
      {viewMode === 'hierarchy' && hierarchyLevel === 'students' && (
        <Card>
          <CardHeader>
            <CardTitle>Student Submissions</CardTitle>
            <CardDescription>
              {displaySubmissions.length} submission{displaySubmissions.length !== 1 ? 's' : ''} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && displaySubmissions.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Clock className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : displaySubmissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
                <p className="text-gray-600">Try adjusting your filters or check back later</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displaySubmissions.map((submission) => {
                const assessmentResult = submission.assessmentResult as any
                const hasManualReview = !!submission.manualFeedback
                return (
                  <div key={submission.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
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
                            <Badge variant="outline" className="text-xs">
                              {submission.question.submissionType.replace('_', ' ').toLowerCase()}
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
                            <User className="h-3 w-3" />
                            {submission.user ? submission.user.name || submission.user.email : 'Anonymous'}
                          </span>
                          <span>
                            {new Date(submission.createdAt).toLocaleString()}
                          </span>
                          {submission.reviewedAt && (
                            <span className="text-emerald-600 font-medium">
                              Reviewed {new Date(submission.reviewedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {assessmentResult?.remark && (
                          <div className={`px-2 py-1 rounded text-xs font-medium ${getRemarkColor(assessmentResult.remark)}`}>
                            AI: {assessmentResult.remark}
                          </div>
                        )}

                        {hasManualReview ? (
                          <Button variant="default" size="sm" asChild className="bg-emerald-600 hover:bg-emerald-700">
                            <Link href={`/admin/manual-submissions/${submission.id}`}>
                              <FileEdit className="mr-1 h-3 w-3" />
                              Edit Review
                            </Link>
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/manual-submissions/${submission.id}`}>
                              <FileEdit className="mr-1 h-3 w-3" />
                              Add Review
                            </Link>
                          </Button>
                        )}

                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/results/${submission.id}`}>
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {submission.submissionContent && (
                      <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                        <p className="text-gray-600 line-clamp-2">
                          {submission.submissionContent.substring(0, 200)}
                          {submission.submissionContent.length > 200 && '...'}
                        </p>
                      </div>
                    )}

                    {hasManualReview && (
                      <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <FileEdit className="h-4 w-4 text-emerald-600" />
                          <span className="font-medium text-emerald-900">Instructor Review</span>
                          {submission.manualScore && (
                            <Badge variant="outline" className="text-xs">
                              Score: {submission.manualScore}
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-700 line-clamp-2">
                          {submission.manualFeedback}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* VIEW ALL MODE - Flat List */}
      {viewMode === 'all' && (
        <Card>
          <CardHeader>
            <CardTitle>All Submissions</CardTitle>
            <CardDescription>
              {displaySubmissions.length} submission{displaySubmissions.length !== 1 ? 's' : ''} across all courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && displaySubmissions.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Clock className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : displaySubmissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
                <p className="text-gray-600">Try adjusting your filters or check back later</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displaySubmissions.map((submission) => {
                  const assessmentResult = submission.assessmentResult as any
                  const hasManualReview = !!submission.manualFeedback
                  return (
                    <div key={submission.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
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
                              <Badge variant="outline" className="text-xs">
                                {submission.question.submissionType.replace('_', ' ').toLowerCase()}
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
                              <User className="h-3 w-3" />
                              {submission.user ? submission.user.name || submission.user.email : 'Anonymous'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(submission.createdAt).toLocaleString()}
                            </span>
                            {submission.reviewedAt && (
                              <span className="text-emerald-600 font-medium">
                                Reviewed {new Date(submission.reviewedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {assessmentResult?.remark && (
                            <div className={`px-2 py-1 rounded text-xs font-medium ${getRemarkColor(assessmentResult.remark)}`}>
                              AI: {assessmentResult.remark}
                            </div>
                          )}

                          {hasManualReview ? (
                            <Button variant="default" size="sm" asChild className="bg-emerald-600 hover:bg-emerald-700">
                              <Link href={`/admin/manual-submissions/${submission.id}`}>
                                <FileEdit className="mr-1 h-3 w-3" />
                                Edit Review
                              </Link>
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/manual-submissions/${submission.id}`}>
                                <FileEdit className="mr-1 h-3 w-3" />
                                Add Review
                              </Link>
                            </Button>
                          )}

                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/results/${submission.id}`}>
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>

                      {submission.submissionContent && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                          <p className="text-gray-600 line-clamp-2">
                            {submission.submissionContent.substring(0, 200)}
                            {submission.submissionContent.length > 200 && '...'}
                          </p>
                        </div>
                      )}

                      {hasManualReview && (
                        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <FileEdit className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium text-emerald-900">Instructor Review</span>
                            {submission.manualScore && (
                              <Badge variant="outline" className="text-xs">
                                Score: {submission.manualScore}
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-700 line-clamp-2">
                            {submission.manualFeedback}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}