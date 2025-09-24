'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// Fixed User interface with proper typing
interface User {
  id: string
  email: string
  name: string | null
  role: 'SUPER_ADMIN' | 'COURSE_ADMIN' | 'STUDENT'
}

interface AdminSidebarProps {
  user: User
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    roles: ['SUPER_ADMIN', 'COURSE_ADMIN'] as const
  },
  {
    name: 'Courses',
    href: '/admin/courses',
    roles: ['SUPER_ADMIN', 'COURSE_ADMIN'] as const
  },
  {
    name: 'Questions',
    href: '/admin/questions',
    roles: ['SUPER_ADMIN', 'COURSE_ADMIN'] as const
  },
  {
    name: 'Submissions',
    href: '/admin/submissions',
    roles: ['SUPER_ADMIN', 'COURSE_ADMIN'] as const
  },
  {
    name: 'Users',
    href: '/admin/users',
    roles: ['SUPER_ADMIN'] as const
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    roles: ['SUPER_ADMIN', 'COURSE_ADMIN'] as const
  }
]

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user.role as any)
  )

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white">
      <div className="p-6">
        <h2 className="text-xl font-bold">Assessment Agent</h2>
      </div>
      
      <nav className="mt-6">
        <div className="px-3">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                )}
              >
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-700">
        <div className="text-sm text-gray-300">
          <div className="font-medium">{user.name}</div>
          <div className="text-xs text-gray-400">{user.email}</div>
          <div className="text-xs text-gray-500 mt-1">{user.role}</div>
        </div>
      </div>
    </div>
  )
}