'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth/utils'
import { UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'

type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

const updateUserRoleSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(['SUPER_ADMIN', 'COURSE_ADMIN', 'STUDENT']),
})

const createUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['SUPER_ADMIN', 'COURSE_ADMIN', 'STUDENT']),
})

/**
 * Create a new user (Super Admin only)
 */
export async function createUser(data: {
  name?: string
  email: string
  password: string
  role: UserRole
}): Promise<ActionResult> {
  try {
    await requireSuperAdmin()

    // Validate input
    const validatedData = createUserSchema.parse(data)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return { success: false, error: 'Email already in use' }
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 10)

    // Create the user with an account entry for email/password auth
    const newUser = await prisma.user.create({
      data: {
        name: validatedData.name || null,
        email: validatedData.email,
        role: validatedData.role,
        emailVerified: true, // Auto-verify admin-created accounts
        accounts: {
          create: {
            accountId: validatedData.email,
            providerId: 'credential',
            password: hashedPassword,
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    revalidatePath('/admin/users')

    return {
      success: true,
      data: newUser
    }

  } catch (error) {
    console.error('Create user error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input: ' + error.errors.map(e => e.message).join(', ')
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user'
    }
  }
}

/**
 * Update a user's role (Super Admin only)
 */
export async function updateUserRole(data: {
  userId: string
  role: UserRole
}): Promise<ActionResult> {
  try {
    const currentUser = await requireSuperAdmin()

    // Validate input
    const validatedData = updateUserRoleSchema.parse(data)

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: validatedData.userId }
    })

    if (!targetUser) {
      return { success: false, error: 'User not found' }
    }

    // Prevent removing the last super admin
    if (targetUser.role === 'SUPER_ADMIN' && validatedData.role !== 'SUPER_ADMIN') {
      const superAdminCount = await prisma.user.count({
        where: { role: 'SUPER_ADMIN' }
      })

      if (superAdminCount <= 1) {
        return {
          success: false,
          error: 'Cannot remove the last super admin. Assign another user as super admin first.'
        }
      }
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: validatedData.userId },
      data: { role: validatedData.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    revalidatePath('/admin/users')

    return {
      success: true,
      data: updatedUser
    }

  } catch (error) {
    console.error('Update user role error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input: ' + error.errors.map(e => e.message).join(', ')
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user role'
    }
  }
}

/**
 * Delete a user (Super Admin only)
 */
export async function deleteUser(userId: string): Promise<ActionResult> {
  try {
    const currentUser = await requireSuperAdmin()

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            createdCourses: true,
            submissions: true
          }
        }
      }
    })

    if (!targetUser) {
      return { success: false, error: 'User not found' }
    }

    // Prevent deleting super admins
    if (targetUser.role === 'SUPER_ADMIN') {
      return {
        success: false,
        error: 'Cannot delete super admin accounts'
      }
    }

    // Prevent deleting yourself
    if (targetUser.id === currentUser.id) {
      return {
        success: false,
        error: 'You cannot delete your own account'
      }
    }

    // Warn if user has created content
    if (targetUser._count.createdCourses > 0) {
      return {
        success: false,
        error: `This user has created ${targetUser._count.createdCourses} course(s). Transfer course ownership before deleting.`
      }
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: userId }
    })

    revalidatePath('/admin/users')

    return {
      success: true,
      data: { message: 'User deleted successfully' }
    }

  } catch (error) {
    console.error('Delete user error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user'
    }
  }
}

/**
 * Get all users (Super Admin only)
 */
export async function getAllUsers(): Promise<ActionResult> {
  try {
    await requireSuperAdmin()

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            createdCourses: true,
            submissions: true,
            enrollments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return { success: true, data: users }

  } catch (error) {
    console.error('Get all users error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users'
    }
  }
}
