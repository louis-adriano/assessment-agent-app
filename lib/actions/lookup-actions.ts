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
      include: {
        questions: {
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
 * Get course by name with questions
 */
export async function getCourseByName(name: string): Promise<ActionResult> {
  try {
    const course = await prisma.course.findFirst({
      where: { 
        name: {
          equals: name,
          mode: 'insensitive'
        }
      },
      include: {
        questions: {
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
 * Get question by course name and question number
 */
export async function getQuestionByCourseAndNumber(
  courseName: string, 
  questionNumber: number
): Promise<ActionResult> {
  try {
    const course = await prisma.course.findFirst({
      where: { 
        name: {
          equals: courseName,
          mode: 'insensitive'
        }
      }
    })

    if (!course) {
      return { success: false, error: `Course "${courseName}" not found` }
    }

    const question = await prisma.question.findFirst({
      where: {
        courseId: course.id,
        questionNumber: questionNumber
      },
      include: {
        course: true,
        baseExamples: true
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
    console.error('Error getting question:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get question'
    }
  }
}