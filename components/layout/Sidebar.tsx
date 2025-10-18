'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, GraduationCap, LayoutDashboard, User, LogOut, Shield, FileText } from 'lucide-react'
import { useSession, signOut } from '@/lib/auth-client'
import { Badge } from '@/components/ui/badge'
import { NotificationBell } from '@/components/notifications/NotificationBell'

interface UserWithRole {
  id: string
  email: string
  name: string
  image?: string | null
  role?: string
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session, isPending } = useSession()

  const handleSignOut = async () => {
    await signOut()
  }

  const user = session?.user as UserWithRole | undefined
  
  // Get proper callback URL for signin
  const getSignInUrl = () => {
    const callback = pathname && !pathname.includes('/auth/') ? pathname : '/courses'
    return `/auth/signin?callbackUrl=${encodeURIComponent(callback)}`
  }

  return (
    <aside className="flex flex-col w-72 fixed inset-y-0 bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl z-50">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-6 pb-5 border-b border-gray-700">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div className="ml-3 flex-1">
            <span className="text-xl font-bold text-white">Assessment</span>
            <span className="text-sm text-gray-400 block">Portal</span>
          </div>
          {user && (
            <NotificationBell userId={user.id} />
          )}
        </div>

        <nav className="mt-8 flex-1 px-4 space-y-2">
          <Link
            href="/"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              pathname === '/'
                ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-500/30'
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          <Link
            href="/courses"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              pathname === '/courses'
                ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-500/30'
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
          >
            <BookOpen className="mr-3 h-5 w-5" />
            Courses
          </Link>
          <Link
            href="/my-submissions"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              pathname === '/my-submissions'
                ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-500/30'
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
          >
            <FileText className="mr-3 h-5 w-5" />
            My Submissions
          </Link>
          {user?.role && (user.role === 'SUPER_ADMIN' || user.role === 'COURSE_ADMIN') && (
            <Link
              href="/admin"
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                pathname.startsWith('/admin')
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-500/30'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <Shield className="mr-3 h-5 w-5" />
              Admin
            </Link>
          )}
        </nav>

        {/* User Section */}
        <div className="flex-shrink-0 px-4 pb-4 border-t border-gray-700 pt-4">
          {!isPending && (
            <>
              {session?.user ? (
                <div className="p-4 bg-gray-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">Welcome,</p>
                      <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                      {user?.role && (user.role === 'SUPER_ADMIN' || user.role === 'COURSE_ADMIN') && (
                        <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0 h-4 bg-teal-600 text-white border-0">
                          {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Course Admin'}
                        </Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-600/20" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <Button variant="link" className="text-teal-400 hover:text-teal-300 p-0 h-auto font-medium" asChild>
                      <Link href={getSignInUrl()}>
                        Sign In
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
