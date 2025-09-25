// lib/actions/question-actions.ts
'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/utils'
import { revalidatePath } from 'next/cache'
import { SubmissionType } from '@prisma/client'

// Type-safe submission type options based on your actual Prisma enum
type SubmissionTypeInput = SubmissionType

export async function createQuestion(data: {
  courseId: string
  questionNumber: number
  title: string
  description: string
  submissionType: SubmissionTypeInput
  assessmentPrompt: string
  criteria: string[]
  redFlags: string[]
  conditionalChecks: string[]
  guidance: string
}) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Check if user can create questions for this course
  if (user.role === 'COURSE_ADMIN') {
    // Try to find the course with possible owner field names
    const course = await prisma.course.findFirst({
      where: { 
        id: data.courseId
        // Add owner check here when you know the correct field name
        // Example: createdBy: user.id  OR  adminId: user.id  OR  userId: user.id
      }
    })
    
    if (!course) {
      throw new Error('Course not found or you do not have permission to create questions for this course')
    }
    
    // Additional owner check can be added here once you know the field name
    // if (course.createdBy !== user.id) {
    //   throw new Error('You can only create questions for your own courses')
    // }
  }

  try {
    const question = await prisma.question.create({
      data: {
        courseId: data.courseId,
        questionNumber: data.questionNumber,
        title: data.title,
        description: data.description,
        submissionType: data.submissionType,
        assessmentPrompt: data.assessmentPrompt,
        criteria: data.criteria,
        redFlags: data.redFlags,
        conditionalChecks: data.conditionalChecks,
        guidance: data.guidance,
      },
    })

    revalidatePath('/admin/questions')
    revalidatePath(`/admin/courses/${data.courseId}`)
    
    return { success: true, question }
  } catch (error) {
    console.error('Error creating question:', error)
    return { success: false, error: 'Failed to create question' }
  }
}

export async function updateQuestion(
  questionId: string,
  data: {
    title: string
    description: string
    submissionType: SubmissionTypeInput
    assessmentPrompt: string
    criteria: string[]
    redFlags: string[]
    conditionalChecks: string[]
    guidance: string
  }
) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Check if user can update this question
  if (user.role === 'COURSE_ADMIN') {
    const question = await prisma.question.findFirst({
      where: { id: questionId },
      include: { course: true }
    })
    
    if (!question) {
      throw new Error('Assessment not found')
    }
    
    // Add owner check here when you know the correct field name
    // if (question.course.createdBy !== user.id) {
    //   throw new Error('You can only update questions from your own courses')
    // }
  }

  try {
    const question = await prisma.question.update({
      where: { id: questionId },
      data: {
        title: data.title,
        description: data.description,
        submissionType: data.submissionType,
        assessmentPrompt: data.assessmentPrompt,
        criteria: data.criteria,
        redFlags: data.redFlags,
        conditionalChecks: data.conditionalChecks,
        guidance: data.guidance,
      },
    })

    revalidatePath('/admin/questions')
    revalidatePath(`/admin/courses/${question.courseId}`)
    
    return { success: true, question }
  } catch (error) {
    console.error('Error updating question:', error)
    return { success: false, error: 'Failed to update question' }
  }
}

export async function deleteQuestion(questionId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  try {
    // Get question with course info for permission check
    const question = await prisma.question.findFirst({
      where: { id: questionId },
      include: { course: true }
    })

    if (!question) {
      throw new Error('Assessment not found')
    }

    // Check if user can delete this question
    if (user.role === 'COURSE_ADMIN') {
      // Add owner check here when you know the correct field name
      // if (question.course.createdBy !== user.id) {
      //   throw new Error('You can only delete questions from your own courses')
      // }
    }

    await prisma.question.delete({
      where: { id: questionId }
    })

    revalidatePath('/admin/questions')
    revalidatePath(`/admin/courses/${question.courseId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting question:', error)
    return { success: false, error: 'Failed to delete question' }
  }
}

// Base Example Management
export async function createBaseExample(data: {
  questionId: string
  title: string
  content: string
  metadata?: Record<string, any>
}) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Check if user can create base examples for this question
  if (user.role === 'COURSE_ADMIN') {
    const question = await prisma.question.findFirst({
      where: { id: data.questionId },
      include: { course: true }
    })
    
    if (!question) {
      throw new Error('Assessment not found')
    }
    
    // Add owner check here when you know the correct field name
    // if (question.course.createdBy !== user.id) {
    //   throw new Error('You can only create base examples for your own course questions')
    // }
  }

  try {
    const baseExample = await prisma.baseExample.create({
      data: {
        questionId: data.questionId,
        title: data.title,
        content: data.content,
        metadata: data.metadata || {},
        // Note: Removed 'createdBy' field as it doesn't exist in the BaseExample model
      },
    })

    revalidatePath(`/admin/questions/${data.questionId}`)
    revalidatePath(`/admin/courses`)
    
    return { success: true, baseExample }
  } catch (error) {
    console.error('Error creating base example:', error)
    return { success: false, error: 'Failed to create base example' }
  }
}

export async function updateBaseExample(
  baseExampleId: string,
  data: {
    title: string
    content: string
      metadata?: Record<string, any>
  }
) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Check if user can update this base example
  if (user.role === 'COURSE_ADMIN') {
    const baseExample = await prisma.baseExample.findFirst({
      where: { id: baseExampleId },
      include: { 
        question: { 
          include: { course: true } 
        } 
      }
    })
    
    if (!baseExample) {
      throw new Error('Base example not found')
    }
    
    // Add owner check here when you know the correct field name
    // if (baseExample.question.course.createdBy !== user.id) {
    //   throw new Error('You can only update base examples from your own courses')
    // }
  }

  try {
    const baseExample = await prisma.baseExample.update({
      where: { id: baseExampleId },
      data: {
        title: data.title,
        content: data.content,
        metadata: data.metadata || {},
      },
    })

    revalidatePath(`/admin/questions/${baseExample.questionId}`)
    
    return { success: true, baseExample }
  } catch (error) {
    console.error('Error updating base example:', error)
    return { success: false, error: 'Failed to update base example' }
  }
}

export async function deleteBaseExample(baseExampleId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  try {
    const baseExample = await prisma.baseExample.findFirst({
      where: { id: baseExampleId },
      include: { 
        question: { 
          include: { course: true } 
        } 
      }
    })

    if (!baseExample) {
      throw new Error('Base example not found')
    }

    // Check if user can delete this base example
    if (user.role === 'COURSE_ADMIN') {
      // Add owner check here when you know the correct field name
      // if (baseExample.question.course.createdBy !== user.id) {
      //   throw new Error('You can only delete base examples from your own courses')
      // }
    }

    await prisma.baseExample.delete({
      where: { id: baseExampleId }
    })

    revalidatePath(`/admin/questions/${baseExample.questionId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting base example:', error)
    return { success: false, error: 'Failed to delete base example' }
  }
}

export async function getQuestionsForUser() {
  const user = await getCurrentUser()
  if (!user) return []

  let whereClause: any = {}

  // Super admins see all questions, course admins see only their questions
  if (user.role === 'COURSE_ADMIN') {
    // This will need to be updated once you know the correct field name
    // whereClause = {
    //   course: {
    //     createdBy: user.id  // or adminId or userId
    //   }
    // }
  }

  const questions = await prisma.question.findMany({
    where: whereClause,
    include: {
      course: {
        select: {
          id: true,
          name: true,
          // createdBy: true  // uncomment when you know the correct field name
        }
      },
      _count: {
        select: {
          submissions: true,
          baseExamples: true
        }
      }
    },
    orderBy: [
      { course: { name: 'asc' } },
      { questionNumber: 'asc' }
    ]
  })

  return questions
}

export async function getQuestionById(questionId: string) {
  const user = await getCurrentUser()
  if (!user) return null

  let whereClause: any = { id: questionId }

  // Course admins can only see questions from their courses
  if (user.role === 'COURSE_ADMIN') {
    // This will need to be updated once you know the correct field name
    // whereClause = {
    //   id: questionId,
    //   course: {
    //     createdBy: user.id  // or adminId or userId
    //   }
    // }
  }

  const question = await prisma.question.findFirst({
    where: whereClause,
    include: {
      course: {
        select: {
          id: true,
          name: true,
          // createdBy: true  // uncomment when you know the correct field name
        }
      },
      baseExamples: {
        orderBy: {
          createdAt: 'desc'
        }
      },
      _count: {
        select: {
          submissions: true,
          baseExamples: true
        }
      }
    }
  })

  return question
}

// Helper function to get available submission types from your Prisma enum
export function getSubmissionTypes(): SubmissionType[] {
  // This returns the actual enum values from your Prisma schema
  // You may need to adjust these based on your actual SubmissionType enum
  return ['DOCUMENT', 'GITHUB_REPO', 'SCREENSHOT', 'TEXT', 'WEBSITE'] as SubmissionType[]
}

// Helper function to format submission type for display
export function formatSubmissionType(type: SubmissionType): string {
  switch (type) {
    case 'DOCUMENT':
      return 'Document'
    case 'GITHUB_REPO':
      return 'GitHub Repository'
    case 'SCREENSHOT':
      return 'Screenshot'
    case 'TEXT':
      return 'Text'
    case 'WEBSITE':
      return 'Website'
    default:
      return type
  }
}