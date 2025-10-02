import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function finalFix() {
  // Delete accounts only, keep users for foreign key constraints
  await prisma.account.deleteMany({
    where: { accountId: { in: ['superadmin@example.com', 'courseadmin@example.com', 'student@example.com'] } }
  })

  // Update user roles
  await prisma.user.updateMany({
    where: { email: 'superadmin@example.com' },
    data: { role: UserRole.SUPER_ADMIN }
  })

  await prisma.user.updateMany({
    where: { email: 'courseadmin@example.com' },
    data: { role: UserRole.COURSE_ADMIN }
  })

  await prisma.user.updateMany({
    where: { email: 'student@example.com' },
    data: { role: UserRole.STUDENT }
  })

  console.log('Cleared accounts and updated roles. Now go to /auth/signin and create new account with superadmin@example.com / superadmin123')
}

finalFix().finally(() => prisma.$disconnect())