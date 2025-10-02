import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function setupBetterAuth() {
  console.log('Setting up Better Auth demo accounts...')

  // Delete existing accounts first
  await prisma.account.deleteMany({
    where: { accountId: { in: ['superadmin@example.com', 'courseadmin@example.com', 'student@example.com'] } }
  })

  console.log('Deleted existing demo accounts')

  // Skip deleting users due to foreign key constraints
  // Instead we'll update existing users or create new ones if they don't exist

  // Create users with Better Auth compatible password hashes
  const saltRounds = 10

  const users = [
    {
      email: 'superadmin@example.com',
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
      password: 'superadmin123'
    },
    {
      email: 'courseadmin@example.com',
      name: 'Course Admin',
      role: UserRole.COURSE_ADMIN,
      password: 'courseadmin123'
    },
    {
      email: 'student@example.com',
      name: 'Student',
      role: UserRole.STUDENT,
      password: 'student123'
    }
  ]

  for (const userData of users) {
    // Check if user exists, if not create
    let user = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          emailVerified: true
        }
      })
      console.log(`Created new user: ${userData.email}`)
    } else {
      // Update existing user's role and name
      user = await prisma.user.update({
        where: { email: userData.email },
        data: {
          name: userData.name,
          role: userData.role,
          emailVerified: true
        }
      })
      console.log(`Updated existing user: ${userData.email}`)
    }

    // Create Better Auth account with properly hashed password
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds)

    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: userData.email,
        providerId: 'credential',
        password: hashedPassword
      }
    })

    console.log(`Created Better Auth account for: ${userData.email}`)
  }

  console.log('Better Auth demo accounts setup complete!')
  console.log('You can now sign in with:')
  console.log('- superadmin@example.com / superadmin123')
  console.log('- courseadmin@example.com / courseadmin123')
  console.log('- student@example.com / student123')
}

setupBetterAuth().finally(() => prisma.$disconnect())