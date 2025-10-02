'use client'

// Better Auth doesn't need a SessionProvider wrapper like NextAuth
// The client hooks work directly
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}