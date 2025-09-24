import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import AdminSidebar from '@/components/admin/AdminSidebar'

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect('/auth/signin')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  })

  if (!user) {
    redirect('/auth/signin')
  }

  // Only admins can access admin area
  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.COURSE_ADMIN) {
    redirect('/unauthorized')
  }

  return user
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthenticatedUser()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar user={user} />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Assessment Agent Admin</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user.name} ({user.role})
              </span>
            </div>
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}