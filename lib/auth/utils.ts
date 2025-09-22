import { getServerSession } from "next-auth/next"
import { authOptions } from "./config"
import { UserRole } from "@prisma/client"
import { redirect } from "next/navigation"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
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