// scripts/reset-demo-users.ts
import { PrismaClient, UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function resetDemoUsers() {
  console.log('🔄 Updating demo users with Better Auth compatible passwords...')

  // Demo users data
  const demoUsers = [
    {
      email: 'superadmin@example.com',
      name: 'Super Admin',
      password: 'superadmin123',
      role: UserRole.SUPER_ADMIN,
    },
    {
      email: 'courseadmin@example.com',
      name: 'Course Admin',
      password: 'courseadmin123',
      role: UserRole.COURSE_ADMIN,
    },
    {
      email: 'student@example.com',
      name: 'Student User',
      password: 'student123',
      role: UserRole.STUDENT,
    },
  ]

  for (const userData of demoUsers) {
    // Hash password using bcryptjs (compatible with Better Auth)
    const hashedPassword = await hash(userData.password, 12)

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          emailVerified: true,
        },
      })
      console.log(`✅ Created new user: ${userData.email} (${userData.role})`)
    } else {
      // Update existing user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: userData.name,
          role: userData.role,
          emailVerified: true,
        },
      })
      console.log(`✅ Updated existing user: ${userData.email} (${userData.role})`)
    }

    // Check if account exists
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        accountId: userData.email
      }
    })

    if (existingAccount) {
      // Update existing account with new password hash
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: {
          password: hashedPassword,
          accountId: userData.email,
        },
      })
      console.log(`✅ Updated password for: ${userData.email}`)
    } else {
      // Create new account
      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: userData.email,
          providerId: 'credential',
          password: hashedPassword,
        },
      })
      console.log(`✅ Created account for: ${userData.email}`)
    }
  }

  console.log('🎉 Demo users updated successfully!')
}

resetDemoUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect())