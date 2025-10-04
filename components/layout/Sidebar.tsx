'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, GraduationCap, LayoutDashboard, User, LogOut } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSession()
  }, [])

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/get-session')
      if (response.ok) {
        const data = await response.json()
        setSession(data)
      }
    } catch (error) {
      console.error('Failed to fetch session:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-white border-r">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-6">
          <GraduationCap className="h-8 w-8 text-teal-600" />
          <span className="ml-2 text-xl font-bold">Assessment Agent</span>
        </div>

        <nav className="mt-8 flex-1 px-4 space-y-2">
          <Link
            href="/"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
              pathname === '/'
                ? 'bg-teal-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          <Link
            href="/courses"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
              pathname === '/courses'
                ? 'bg-teal-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="mr-3 h-5 w-5" />
            Courses
          </Link>
        </nav>

        {/* User Section */}
        <div className="flex-shrink-0 px-4 pb-4">
          {!loading && (
            <>
              {session?.user ? (
                <Card className="border-0 bg-gray-50">
                  <CardContent className="p-4">
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
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-teal-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Welcome,</p>
                        <p className="text-sm font-medium truncate">{session.user.name}</p>
                      </div>
                      <Link href="/api/auth/sign-out">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Button className="w-full" asChild>
                  <Link href="/auth/signin">
                    Sign In
                  </Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
