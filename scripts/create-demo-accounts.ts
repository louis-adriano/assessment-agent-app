import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function createDemoAccounts() {
  console.log('Creating demo accounts with Better Auth...')

  // First, handle foreign key constraints by updating courses to reference a different user
  // or delete courses if needed
  try {
    // Delete courses created by demo users
    const coursesToDelete = await prisma.course.findMany({
      where: {
        creator: {
          email: { in: ['superadmin@example.com', 'courseadmin@example.com', 'student@example.com'] }
        }
      }
    })

    if (coursesToDelete.length > 0) {
      console.log(`Deleting ${coursesToDelete.length} courses created by demo users...`)
      await prisma.course.deleteMany({
        where: {
          creator: {
            email: { in: ['superadmin@example.com', 'courseadmin@example.com', 'student@example.com'] }
          }
        }
      })
    }

    // Delete accounts
    await prisma.account.deleteMany({
      where: { accountId: { in: ['superadmin@example.com', 'courseadmin@example.com', 'student@example.com'] } }
    })

    // Delete users
    await prisma.user.deleteMany({
      where: { email: { in: ['superadmin@example.com', 'courseadmin@example.com', 'student@example.com'] } }
    })

    console.log('Cleaned up existing demo accounts and users')
  } catch (error) {
    console.log('Error during cleanup:', error)
  }

  // Now use Better Auth signup API to create accounts
  const users = [
    {
      email: 'superadmin@example.com',
      name: 'Super Admin',
      password: 'superadmin123',
      role: UserRole.SUPER_ADMIN
    },
    {
      email: 'courseadmin@example.com',
      name: 'Course Admin',
      password: 'courseadmin123',
      role: UserRole.COURSE_ADMIN
    },
    {
      email: 'student@example.com',
      name: 'Student',
      password: 'student123',
      role: UserRole.STUDENT
    }
  ]

  for (const userData of users) {
    try {
      console.log(`Creating account for ${userData.email}...`)

      // Use Better Auth signup API
      const response = await fetch('http://localhost:3005/api/auth/sign-up/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          name: userData.name,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✓ Successfully created account for ${userData.email}`)

        // Update the user's role after creation
        await prisma.user.update({
          where: { email: userData.email },
          data: { role: userData.role }
        })
        console.log(`✓ Updated role to ${userData.role} for ${userData.email}`)
      } else {
        const error = await response.json()
        console.log(`✗ Failed to create account for ${userData.email}:`, error)
      }
    } catch (error) {
      console.log(`✗ Error creating account for ${userData.email}:`, error)
    }
  }

  console.log('\nDemo account creation complete!')
  console.log('You can now sign in with:')
  console.log('- superadmin@example.com / superadmin123')
  console.log('- courseadmin@example.com / courseadmin123')
  console.log('- student@example.com / student123')
}

createDemoAccounts().finally(() => prisma.$disconnect())