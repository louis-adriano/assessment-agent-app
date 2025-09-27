const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Checking database contents...')
    
    // Check courses
    const courses = await prisma.course.findMany({
      include: {
        questions: true
      }
    })
    
    console.log(`📚 Found ${courses.length} courses:`)
    courses.forEach(course => {
      console.log(`  - ${course.name} (${course.questions.length} questions)`)
    })
    
    // Check questions
    const questions = await prisma.question.findMany()
    console.log(`❓ Found ${questions.length} total questions`)
    
    // Check submissions
    const submissions = await prisma.submission.findMany()
    console.log(`📝 Found ${submissions.length} submissions`)
    
    if (courses.length === 0) {
      console.log('❌ No courses found! The seed might not have run properly.')
      console.log('💡 Try running: npx prisma db seed')
    } else {
      console.log('✅ Database looks good!')
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()