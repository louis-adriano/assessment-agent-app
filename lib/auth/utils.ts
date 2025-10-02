// lib/auth/utils.ts - Better Auth utilities
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "./config"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export async function getCurrentUser() {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })


    if (!session?.user) {
      return null
    }

    // Fetch full user data from database to get role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        emailVerified: true,
      }
    })

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
      emailVerified: user.emailVerified,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/signin")
  }
  return user
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    redirect("/unauthorized")
  }
  return user
}

export async function requireAdmin() {
  return requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])
}

export async function requireSuperAdmin() {
  return requireRole([UserRole.SUPER_ADMIN])
}

export function canManageCourse(userRole: UserRole, courseCreatorId: string, userId: string) {
  if (userRole === UserRole.SUPER_ADMIN) return true
  if (userRole === UserRole.COURSE_ADMIN && courseCreatorId === userId) return true
  return false
}

// Client-side session hook
export async function getSession() {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })
    return session
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}