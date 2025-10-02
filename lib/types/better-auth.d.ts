// lib/types/better-auth.d.ts
import { UserRole } from "@prisma/client"

declare module "better-auth" {
  interface User {
    role: UserRole
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string
      image?: string
      role: UserRole
      emailVerified: boolean
    }
  }
}