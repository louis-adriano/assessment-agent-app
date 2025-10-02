import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixAuth() {
  // Check current accounts
  const accounts = await prisma.account.findMany({
    where: {
      OR: [
        { accountId: 'superadmin@example.com' },
        { accountId: 'courseadmin@example.com' },
        { accountId: 'student@example.com' }
      ]
    },
    include: { user: true }
  })

  console.log('Current accounts:')
  accounts.forEach(acc => {
    console.log(`- ${acc.user.email}: providerId="${acc.providerId}", hasPassword=${!!acc.password}`)
  })

  // Update provider IDs to what Better Auth expects
  for (const account of accounts) {
    await prisma.account.update({
      where: { id: account.id },
      data: { providerId: 'credential' }
    })
    console.log(`Updated ${account.user.email} providerId to "credential"`)
  }
}

fixAuth().finally(() => prisma.$disconnect())