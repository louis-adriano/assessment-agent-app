'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

/**
 * OAuth callback handler page
 * Handles redirects after successful OAuth authentication
 * Falls back to stored callback URL or home page
 */
function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      // Wait a moment for session to be established
      await new Promise(resolve => setTimeout(resolve, 500))

      // Priority: URL param > sessionStorage > home
      const callbackUrl =
        searchParams.get('callbackUrl') ||
        (typeof window !== 'undefined' ? sessionStorage.getItem('auth_callback') : null) ||
        '/courses'

      // Clear stored callback
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('auth_callback')
      }

      // Navigate to the callback URL
      router.push(callbackUrl)
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="max-w-md">
        <CardContent className="py-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <p className="text-gray-600">Completing sign in...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <Card className="max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
