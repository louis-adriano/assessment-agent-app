import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixProvider() {
  await prisma.account.updateMany({
    where: {
      accountId: { in: ['superadmin@example.com', 'courseadmin@example.com', 'student@example.com'] }
    },
    data: { providerId: 'email' }
  })
  console.log('Updated provider to email')
}

fixProvider().finally(() => prisma.$disconnect())