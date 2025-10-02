import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteUsers() {
  await prisma.account.deleteMany({
    where: { accountId: { in: ['superadmin@example.com', 'courseadmin@example.com', 'student@example.com'] } }
  })

  await prisma.user.deleteMany({
    where: { email: { in: ['superadmin@example.com', 'courseadmin@example.com', 'student@example.com'] } }
  })

  console.log('Deleted users')
}

deleteUsers().finally(() => prisma.$disconnect())