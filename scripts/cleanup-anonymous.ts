import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupAnonymousSubmissions() {
  try {
    // Use raw SQL since the generated client expects userId to be non-null
    const result = await prisma.$executeRaw`DELETE FROM "Submission" WHERE "userId" IS NULL`
    
    console.log(`✅ Deleted ${result} anonymous submissions`)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupAnonymousSubmissions()
