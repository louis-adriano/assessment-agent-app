// lib/actions/lookup-actions.ts
'use server'

import { prisma } from '@/lib/prisma'

type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Get all courses with their questions
 */
export async function getAllCourses(): Promise<ActionResult> {
  try {
    const courses = await prisma.course.findMany({
      where: {
        isActive: true
      },
      include: {
        questions: {
          where: {
            isActive: true
          },
          orderBy: { questionNumber: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    })

    return { success: true, data: courses }
  } catch (error) {
    console.error('Error getting all courses:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get courses'
    }
  }
}

/**
 * Get course by name
 */
export async function findCourseByName(name: string): Promise<ActionResult> {
  try {
    const course = await prisma.course.findFirst({
      where: { 
        name: {
          equals: name,
          mode: 'insensitive'
        },
        isActive: true
      }
    })

    if (!course) {
      return { success: false, error: `Course "${name}" not found` }
    }

    return { success: true, data: course }
  } catch (error) {
    console.error('Error finding course by name:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find course'
    }
  }
}

/**
 * Get course by name with questions
 */
export async function getCourseByName(name: string): Promise<ActionResult> {
  try {
    const course = await prisma.course.findFirst({
      where: { 
        name: {
          equals: name,
          mode: 'insensitive'
        },
        isActive: true
      },
      include: {
        questions: {
          where: {
            isActive: true
          },
          orderBy: { questionNumber: 'asc' }
        }
      }
    })

    if (!course) {
      return { success: false, error: `Course "${name}" not found` }
    }

    return { success: true, data: course }
  } catch (error) {
    console.error('Error getting course by name:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get course'
    }
  }
}

/**
 * Get course questions by course name
 */
export async function getCourseQuestions(courseName: string): Promise<ActionResult> {
  try {
    const course = await prisma.course.findFirst({
      where: { 
        name: {
          equals: courseName,
          mode: 'insensitive'
        },
        isActive: true
      }
    })

    if (!course) {
      return { success: false, error: `Course "${courseName}" not found` }
    }

    const questions = await prisma.question.findMany({
      where: {
        courseId: course.id,
        isActive: true
      },
      orderBy: { questionNumber: 'asc' }
    })

    return { success: true, data: questions }
  } catch (error) {
    console.error('Error getting course questions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get questions'
    }
  }
}

/**
 * Get question by course name and question number
 */
export async function findQuestionByNumber(
  courseName: string, 
  questionNumber: number
): Promise<ActionResult> {
  try {
    const course = await prisma.course.findFirst({
      where: { 
        name: {
          equals: courseName,
          mode: 'insensitive'
        },
        isActive: true
      }
    })

    if (!course) {
      return { success: false, error: `Course "${courseName}" not found` }
    }

    const question = await prisma.question.findFirst({
      where: {
        courseId: course.id,
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
        error: `Question ${questionNumber} not found in course "${courseName}"` 
      }
    }

    return { success: true, data: question }
  } catch (error) {
    console.error('Error finding question by number:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find question'
    }
  }
}

/**
 * Legacy function name for compatibility
 */
export async function getQuestionByCourseAndNumber(
  courseName: string, 
  questionNumber: number
): Promise<ActionResult> {
  return await findQuestionByNumber(courseName, questionNumber)
}