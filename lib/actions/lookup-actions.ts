'use server'

import { prisma } from '@/lib/prisma'

// Types for better error handling
type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

// Public lookup for courses by name (no authentication required)
export async function findCourseByName(courseName: string): Promise<ActionResult> {
  try {
    if (!courseName || courseName.trim().length === 0) {
      return {
        success: false,
        error: 'Course name is required'
      }
    }

    const course = await prisma.course.findFirst({
      where: {
        name: {
          equals: courseName.trim(),
          mode: 'insensitive'
        },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: { questions: true }
        }
      }
    })

    if (!course) {
      return {
        success: false,
        error: 'Course not found'
      }
    }

    return {
      success: true,
      data: course
    }
  } catch (error) {
    console.error('Find course by name error:', error)
    return {
      success: false,
      error: 'Failed to find course'
    }
  }
}

// Public lookup for question by course name + question number (no authentication required)
export async function findQuestionByNumber(courseName: string, questionNumber: number): Promise<ActionResult> {
  try {
    if (!courseName || courseName.trim().length === 0) {
      return {
        success: false,
        error: 'Course name is required'
      }
    }

    if (!questionNumber || questionNumber < 1) {
      return {
        success: false,
        error: 'Valid question number is required'
      }
    }

    const question = await prisma.question.findFirst({
      where: {
        course: {
          name: {
            equals: courseName.trim(),
            mode: 'insensitive'
          },
          isActive: true
        },
        questionNumber: questionNumber,
        isActive: true
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        baseExamples: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!question) {
      return {
        success: false,
        error: 'Question not found'
      }
    }

    return {
      success: true,
      data: question
    }
  } catch (error) {
    console.error('Find question by number error:', error)
    return {
      success: false,
      error: 'Failed to find question'
    }
  }
}

// Get all active courses (public access)
export async function getActiveCourses(): Promise<ActionResult> {
  try {
    const courses = await prisma.course.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: { questions: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return {
      success: true,
      data: courses
    }
  } catch (error) {
    console.error('Get active courses error:', error)
    return {
      success: false,
      error: 'Failed to fetch courses'
    }
  }
}

// Get questions for a course (public access)
export async function getCourseQuestions(courseName: string): Promise<ActionResult> {
  try {
    if (!courseName || courseName.trim().length === 0) {
      return {
        success: false,
        error: 'Course name is required'
      }
    }

    const questions = await prisma.question.findMany({
      where: {
        course: {
          name: {
            equals: courseName.trim(),
            mode: 'insensitive'
          },
          isActive: true
        },
        isActive: true
      },
      select: {
        id: true,
        questionNumber: true,
        title: true,
        description: true,
        submissionType: true,
        guidance: true,
        course: {
          select: {
            name: true
          }
        }
      },
      orderBy: { questionNumber: 'asc' }
    })

    if (questions.length === 0) {
      return {
        success: false,
        error: 'No questions found for this course'
      }
    }

    return {
      success: true,
      data: questions
    }
  } catch (error) {
    console.error('Get course questions error:', error)
    return {
      success: false,
      error: 'Failed to fetch questions'
    }
  }
}