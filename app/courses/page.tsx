'use client'

import { useState, useEffect } from 'react'
import { getAllCourses } from '@/lib/actions/lookup-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, ArrowRight, Github, Globe, FileText } from 'lucide-react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [sortedCourses, setSortedCourses] = useState<Course[]>([])
  const [sortBy, setSortBy] = useState<string>('name-asc')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    sortCourses()
  }, [courses, sortBy])

  const loadCourses = async () => {
    const result = await getAllCourses()
    if (result.success && result.data) {
      setCourses(result.data)
    }
    setLoading(false)
  }

  const sortCourses = () => {
    const sorted = [...courses]

    switch (sortBy) {
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'assessments-asc':
        sorted.sort((a, b) => a.questions.length - b.questions.length)
        break
      case 'assessments-desc':
        sorted.sort((a, b) => b.questions.length - a.questions.length)
        break
    }

    setSortedCourses(sorted)
  }

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
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 lg:pl-72">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="px-6 py-8 md:px-12">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">All Courses</h1>
                  <p className="text-muted-foreground">
                    Browse and enroll in courses to start learning
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="assessments-desc">Most Assessments</SelectItem>
                      <SelectItem value="assessments-asc">Least Assessments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="px-6 py-8 md:px-12">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading courses...</p>
              </div>
            ) : sortedCourses.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-12 pb-12">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <BookOpen className="h-10 w-10 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">No Courses Available</h3>
                      <p className="text-muted-foreground">
                        Courses will appear here once they're created
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedCourses.map((course: any) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow group">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {course.questions.length} Assessment{course.questions.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl line-clamp-2 group-hover:text-teal-600 transition-colors">
                        {course.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-3 mt-2">
                        {course.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Assessments Preview */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Assessments:</p>
                          <div className="space-y-2">
                            {course.questions.slice(0, 3).map((question: any) => (
                              <div key={question.id} className="flex items-center gap-2 text-sm">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  {getSubmissionTypeIcon(question.submissionType)}
                                  <span className="truncate">{question.title}</span>
                                </div>
                              </div>
                            ))}
                            {course.questions.length > 3 && (
                              <p className="text-xs text-muted-foreground pl-6">
                                +{course.questions.length - 3} more
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Start Course Button */}
                        <Button className="w-full group-hover:bg-teal-600" size="sm" asChild>
                          <Link href={`/courses/${encodeURIComponent(course.name)}`}>
                            Start Course
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
      </main>
    </div>
  )
}
