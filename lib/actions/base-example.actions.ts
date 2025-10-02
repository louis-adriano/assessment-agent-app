'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/auth/utils'
import { UserRole } from '@prisma/client'

// Validation schemas
const createBaseExampleSchema = z.object({
  questionId: z.string().cuid(),
  title: z.string().min(1, 'Example title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  content: z.string().min(1, 'Example content is required'),
  fileUrl: z.string().url().optional().or(z.literal('')),
  metadata: z.record(z.any()).optional(),
})

const updateBaseExampleSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'Example title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  content: z.string().min(1, 'Example content is required'),
  fileUrl: z.string().url().optional().or(z.literal('')),
  metadata: z.record(z.any()).optional(),
})

type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Create a new base example (perfectly graded example) for an assessment
 */
export async function createBaseExample(data: {
  questionId: string
  title: string
  description?: string
  content: string
  fileUrl?: string
  metadata?: Record<string, any>
}): Promise<ActionResult> {
  try {
    const user = await requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])

    // Validate input data
    const validatedData = createBaseExampleSchema.parse(data)

    // Check if question exists and user has permission
    const question = await prisma.question.findUnique({
      where: { id: validatedData.questionId },
      include: {
        course: {
          select: { id: true, creatorId: true }
        }
      }
    })

    if (!question) {
      return { success: false, error: 'Assessment not found' }
    }

    // Check permissions
    if (user.role === UserRole.COURSE_ADMIN && question.course.creatorId !== user.id) {
      return { success: false, error: 'You do not have permission to add examples to this assessment' }
    }

    // Create the base example
    const baseExample = await prisma.baseExample.create({
      data: {
        questionId: validatedData.questionId,
        title: validatedData.title,
        description: validatedData.description || null,
        content: validatedData.content,
        fileUrl: validatedData.fileUrl || null,
        metadata: validatedData.metadata || undefined,
        createdBy: user.id,
      },
      include: {
        question: {
          select: { title: true, course: { select: { name: true } } }
        },
        creator: {
          select: { name: true, email: true }
        }
      }
    })

    revalidatePath(`/admin/courses/${question.course.id}`)
    revalidatePath(`/admin/courses/${question.course.id}/assessments/${validatedData.questionId}`)

    return { success: true, data: baseExample }

  } catch (error) {
    console.error('Create base example error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input: ' + error.errors.map(e => e.message).join(', ')
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create base example'
    }
  }
}

/**
 * Update an existing base example
 */
export async function updateBaseExample(data: {
  id: string
  title: string
  description?: string
  content: string
  fileUrl?: string
  metadata?: Record<string, any>
}): Promise<ActionResult> {
  try {
    const user = await requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])

    // Validate input data
    const validatedData = updateBaseExampleSchema.parse(data)

    // Check if base example exists and user has permission
    const existingExample = await prisma.baseExample.findUnique({
      where: { id: validatedData.id },
      include: {
        question: {
          include: {
            course: {
              select: { id: true, creatorId: true }
            }
          }
        }
      }
    })

    if (!existingExample) {
      return { success: false, error: 'Base example not found' }
    }

    // Check permissions
    if (user.role === UserRole.COURSE_ADMIN && existingExample.question.course.creatorId !== user.id) {
      return { success: false, error: 'You do not have permission to edit this base example' }
    }

    // Update the base example
    const updatedExample = await prisma.baseExample.update({
      where: { id: validatedData.id },
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        content: validatedData.content,
        fileUrl: validatedData.fileUrl || null,
        metadata: validatedData.metadata || undefined,
      },
      include: {
        question: {
          select: { title: true, course: { select: { name: true } } }
        },
        creator: {
          select: { name: true, email: true }
        }
      }
    })

    revalidatePath(`/admin/courses/${existingExample.question.course.id}`)
    revalidatePath(`/admin/courses/${existingExample.question.course.id}/assessments/${existingExample.questionId}`)

    return { success: true, data: updatedExample }

  } catch (error) {
    console.error('Update base example error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input: ' + error.errors.map(e => e.message).join(', ')
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update base example'
    }
  }
}

/**
 * Delete a base example
 */
export async function deleteBaseExample(exampleId: string): Promise<ActionResult> {
  try {
    const user = await requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])

    // Check if base example exists and user has permission
    const existingExample = await prisma.baseExample.findUnique({
      where: { id: exampleId },
      include: {
        question: {
          include: {
            course: {
              select: { id: true, creatorId: true }
            }
          }
        }
      }
    })

    if (!existingExample) {
      return { success: false, error: 'Base example not found' }
    }

    // Check permissions
    if (user.role === UserRole.COURSE_ADMIN && existingExample.question.course.creatorId !== user.id) {
      return { success: false, error: 'You do not have permission to delete this base example' }
    }

    // Delete the base example
    await prisma.baseExample.delete({
      where: { id: exampleId }
    })

    revalidatePath(`/admin/courses/${existingExample.question.course.id}`)
    revalidatePath(`/admin/courses/${existingExample.question.course.id}/assessments/${existingExample.questionId}`)

    return { success: true, data: { message: 'Base example deleted successfully' } }

  } catch (error) {
    console.error('Delete base example error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete base example'
    }
  }
}

/**
 * Get all base examples for a question
 */
export async function getBaseExamples(questionId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    // Check if question exists and user has permission
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        course: {
          select: { id: true, creatorId: true }
        }
      }
    })

    if (!question) {
      return { success: false, error: 'Assessment not found' }
    }

    // Check permissions
    if (user.role === UserRole.COURSE_ADMIN && question.course.creatorId !== user.id) {
      return { success: false, error: 'You do not have permission to view examples for this assessment' }
    }

    // Get all base examples for the question
    const baseExamples = await prisma.baseExample.findMany({
      where: { questionId },
      include: {
        creator: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return { success: true, data: baseExamples }

  } catch (error) {
    console.error('Get base examples error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch base examples'
    }
  }
}

/**
 * Get base example details
 */
export async function getBaseExample(exampleId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    const baseExample = await prisma.baseExample.findUnique({
      where: { id: exampleId },
      include: {
        question: {
          include: {
            course: {
              select: { id: true, name: true, creatorId: true }
            }
          }
        },
        creator: {
          select: { name: true, email: true }
        }
      }
    })

    if (!baseExample) {
      return { success: false, error: 'Base example not found' }
    }

    // Check permissions
    if (user.role === UserRole.COURSE_ADMIN && baseExample.question.course.creatorId !== user.id) {
      return { success: false, error: 'You do not have permission to view this base example' }
    }

    return { success: true, data: baseExample }

  } catch (error) {
    console.error('Get base example error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch base example'
    }
  }
}

/**
 * Duplicate a base example (useful for creating variations)
 */
export async function duplicateBaseExample(exampleId: string): Promise<ActionResult> {
  try {
    const user = await requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])

    const originalExample = await prisma.baseExample.findUnique({
      where: { id: exampleId },
      include: {
        question: {
          include: {
            course: {
              select: { id: true, creatorId: true }
            }
          }
        }
      }
    })

    if (!originalExample) {
      return { success: false, error: 'Base example not found' }
    }

    // Check permissions
    if (user.role === UserRole.COURSE_ADMIN && originalExample.question.course.creatorId !== user.id) {
      return { success: false, error: 'You do not have permission to duplicate this base example' }
    }

    // Create duplicate with modified title
    const duplicatedExample = await prisma.baseExample.create({
      data: {
        questionId: originalExample.questionId,
        title: `${originalExample.title} (Copy)`,
        description: originalExample.description,
        content: originalExample.content,
        fileUrl: originalExample.fileUrl,
        metadata: originalExample.metadata || undefined,
        createdBy: user.id,
      },
      include: {
        question: {
          select: { title: true, course: { select: { name: true } } }
        },
        creator: {
          select: { name: true, email: true }
        }
      }
    })

    revalidatePath(`/admin/courses/${originalExample.question.course.id}`)
    revalidatePath(`/admin/courses/${originalExample.question.course.id}/assessments/${originalExample.questionId}`)

    return { success: true, data: duplicatedExample }

  } catch (error) {
    console.error('Duplicate base example error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to duplicate base example'
    }
  }
}