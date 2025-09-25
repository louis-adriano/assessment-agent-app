'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole, canManageCourse } from '@/lib/auth/utils'
import { UserRole } from '@prisma/client'

// Validation schemas
const createCourseSchema = z.object({
  name: z.string().min(1, 'Course name is required').max(100, 'Course name too long'),
  description: z.string().optional(),
})

const updateCourseSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, 'Course name is required').max(100, 'Course name too long'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

const deleteCourseSchema = z.object({
  id: z.string().cuid(),
})

// Types for better error handling
type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

// Create Course Action
export async function createCourse(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])

    const validatedFields = createCourseSchema.safeParse({
      name: formData.get('name'),
      description: formData.get('description'),
    })

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid form data: ' + validatedFields.error.errors.map(e => e.message).join(', ')
      }
    }

    const { name, description } = validatedFields.data

    // Check if course with same name already exists
    const existingCourse = await prisma.course.findFirst({
      where: { name }
    })

    if (existingCourse) {
      return {
        success: false,
        error: 'A course with this name already exists'
      }
    }

    const course = await prisma.course.create({
      data: {
        name,
        description: description || null,
        creatorId: user.id,
      },
      include: {
        creator: {
          select: { name: true, email: true }
        },
        _count: {
          select: { questions: true, enrollments: true }
        }
      }
    })

    revalidatePath('/admin/courses')
    return {
      success: true,
      data: course
    }
  } catch (error) {
    console.error('Create course error:', error)
    return {
      success: false,
      error: 'Failed to create course. Please try again.'
    }
  }
}

// Get All Courses Action (with role-based filtering) - internal version
export async function getCoursesForUser(user: any): Promise<ActionResult> {
  try {

    let whereClause = {}

    // Super admins see all courses, course admins see only their courses
    if (user.role === UserRole.COURSE_ADMIN) {
      whereClause = { creatorId: user.id }
    } else if (user.role === UserRole.STUDENT) {
      // Students see only courses they're enrolled in
      whereClause = {
        enrollments: {
          some: {
            userId: user.id
          }
        }
      }
    }
    // Super admins get no additional where clause (see all)

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        creator: {
          select: { name: true, email: true, role: true }
        },
        _count: {
          select: { questions: true, enrollments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return {
      success: true,
      data: courses
    }
  } catch (error) {
    console.error('Get courses error:', error)
    return {
      success: false,
      error: 'Failed to fetch courses'
    }
  }
}

// Get All Courses Action (with role-based filtering)
export async function getCourses(): Promise<ActionResult> {
  try {
    const user = await requireAuth()
    return await getCoursesForUser(user)
  } catch (error) {
    console.error('Error fetching courses:', error)
    return {
      success: false,
      error: 'Failed to fetch courses'
    }
  }
}

// Get Single Course Action
export async function getCourse(courseId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        creator: {
          select: { name: true, email: true, role: true }
        },
        questions: {
          orderBy: { questionNumber: 'asc' },
          include: {
            _count: {
              select: { submissions: true, baseExamples: true }
            }
          }
        },
        enrollments: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        _count: {
          select: { questions: true, enrollments: true }
        }
      }
    })

    if (!course) {
      return {
        success: false,
        error: 'Course not found'
      }
    }

    // Check permissions
    if (user.role === UserRole.COURSE_ADMIN && course.creatorId !== user.id) {
      return {
        success: false,
        error: 'You do not have permission to access this course'
      }
    }

    if (user.role === UserRole.STUDENT) {
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          courseId_userId: {
            courseId: course.id,
            userId: user.id
          }
        }
      })

      if (!enrollment) {
        return {
          success: false,
          error: 'You are not enrolled in this course'
        }
      }
    }

    return {
      success: true,
      data: course
    }
  } catch (error) {
    console.error('Get course error:', error)
    return {
      success: false,
      error: 'Failed to fetch course'
    }
  }
}

// Update Course Action
export async function updateCourse(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])

    const validatedFields = updateCourseSchema.safeParse({
      id: formData.get('id'),
      name: formData.get('name'),
      description: formData.get('description'),
      isActive: formData.get('isActive') === 'true',
    })

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid form data: ' + validatedFields.error.errors.map(e => e.message).join(', ')
      }
    }

    const { id, name, description, isActive } = validatedFields.data

    // Check if course exists and user has permission
    const existingCourse = await prisma.course.findUnique({
      where: { id }
    })

    if (!existingCourse) {
      return {
        success: false,
        error: 'Course not found'
      }
    }

    if (!canManageCourse(user.role, existingCourse.creatorId, user.id)) {
      return {
        success: false,
        error: 'You do not have permission to edit this course'
      }
    }

    // Check if another course with the same name exists (excluding current course)
    const duplicateCourse = await prisma.course.findFirst({
      where: {
        name,
        id: { not: id }
      }
    })

    if (duplicateCourse) {
      return {
        success: false,
        error: 'A course with this name already exists'
      }
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        name,
        description: description || null,
        isActive: isActive ?? undefined,
      },
      include: {
        creator: {
          select: { name: true, email: true }
        },
        _count: {
          select: { questions: true, enrollments: true }
        }
      }
    })

    revalidatePath('/admin/courses')
    revalidatePath(`/admin/courses/${id}`)
    return {
      success: true,
      data: updatedCourse
    }
  } catch (error) {
    console.error('Update course error:', error)
    return {
      success: false,
      error: 'Failed to update course'
    }
  }
}

// Delete Course Action
export async function deleteCourse(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])

    const validatedFields = deleteCourseSchema.safeParse({
      id: formData.get('id'),
    })

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid course ID'
      }
    }

    const { id } = validatedFields.data

    // Check if course exists and user has permission
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: { questions: true, enrollments: true }
        }
      }
    })

    if (!existingCourse) {
      return {
        success: false,
        error: 'Course not found'
      }
    }

    if (!canManageCourse(user.role, existingCourse.creatorId, user.id)) {
      return {
        success: false,
        error: 'You do not have permission to delete this course'
      }
    }

    // Check if course has enrollments or questions
    if (existingCourse._count.enrollments > 0) {
      return {
        success: false,
        error: 'Cannot delete course with enrolled students. Remove enrollments first.'
      }
    }

    if (existingCourse._count.questions > 0) {
      return {
        success: false,
        error: 'Cannot delete course with questions. Remove questions first.'
      }
    }

    await prisma.course.delete({
      where: { id }
    })

    revalidatePath('/admin/courses')
    return {
      success: true,
      data: { message: 'Course deleted successfully' }
    }
  } catch (error) {
    console.error('Delete course error:', error)
    return {
      success: false,
      error: 'Failed to delete course'
    }
  }
}

// Enroll Student Action
export async function enrollStudent(courseId: string, userId?: string): Promise<ActionResult> {
  try {
    const user = await requireAuth()
    
    // If userId is not provided, enroll the current user (self-enrollment)
    const targetUserId = userId || user.id

    // Check permissions - only super admins can enroll other users
    if (userId && userId !== user.id && user.role !== UserRole.SUPER_ADMIN) {
      return {
        success: false,
        error: 'You do not have permission to enroll other users'
      }
    }

    // Check if course exists and is active
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return {
        success: false,
        error: 'Course not found'
      }
    }

    if (!course.isActive) {
      return {
        success: false,
        error: 'Course is not active for enrollment'
      }
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId: targetUserId
        }
      }
    })

    if (existingEnrollment) {
      return {
        success: false,
        error: 'User is already enrolled in this course'
      }
    }

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        courseId,
        userId: targetUserId
      },
      include: {
        user: {
          select: { name: true, email: true }
        },
        course: {
          select: { name: true }
        }
      }
    })

    revalidatePath('/courses')
    revalidatePath(`/admin/courses/${courseId}`)
    return {
      success: true,
      data: enrollment
    }
  } catch (error) {
    console.error('Enroll student error:', error)
    return {
      success: false,
      error: 'Failed to enroll in course'
    }
  }
}