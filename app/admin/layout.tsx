import { redirect } from 'next/navigation'
import { getCurrentUser, requireAdmin } from '@/lib/auth/utils'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Require admin access (SUPER_ADMIN or COURSE_ADMIN)
  const user = await requireAdmin()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex h-screen">
        {/* Fixed Sidebar */}
        <aside className="fixed left-0 top-0 h-full w-64 z-30">
          <AdminSidebar user={user} />
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 ml-64 flex flex-col">
          {/* Top Header */}
          <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between px-8 py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600 mt-0.5">Manage your courses and assessments</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role.replace('_', ' ')}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-semibold text-sm">
                    {user.name?.charAt(0) || user.email?.charAt(0) || 'A'}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-8 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}