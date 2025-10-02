import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function quickFix() {
  // Delete and recreate accounts only
  await prisma.account.deleteMany({
    where: {
      OR: [
        { accountId: 'superadmin@example.com' },
        { accountId: 'courseadmin@example.com' },
        { accountId: 'student@example.com' }
      ]
    }
  })

  const users = await prisma.user.findMany({
    where: {
      email: { in: ['superadmin@example.com', 'courseadmin@example.com', 'student@example.com'] }
    }
  })

  const passwords = {
    'superadmin@example.com': 'superadmin123',
    'courseadmin@example.com': 'courseadmin123',
    'student@example.com': 'student123'
  }

  for (const user of users) {
    const password = passwords[user.email as keyof typeof passwords]
    const hashedPassword = await hash(password, 12)

    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.email,
        providerId: 'credential',
        password: hashedPassword
      }
    })
    console.log(`✅ Fixed ${user.email}`)
  }
}

quickFix().finally(() => prisma.$disconnect())