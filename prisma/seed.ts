import { PrismaClient, UserRole, SubmissionType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('superadmin123', 12)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      email: 'superadmin@example.com',
      name: 'Super Admin',
      password: superAdminPassword,
      role: UserRole.SUPER_ADMIN,
    },
  })
  console.log('✅ Created Super Admin:', superAdmin.email)

  // Create Course Admin
  const courseAdminPassword = await bcrypt.hash('courseadmin123', 12)
  const courseAdmin = await prisma.user.upsert({
    where: { email: 'courseadmin@example.com' },
    update: {},
    create: {
      email: 'courseadmin@example.com',
      name: 'Course Admin',
      password: courseAdminPassword,
      role: UserRole.COURSE_ADMIN,
    },
  })
  console.log('✅ Created Course Admin:', courseAdmin.email)

  // Create Student
  const studentPassword = await bcrypt.hash('student123', 12)
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      name: 'Test Student',
      password: studentPassword,
      role: UserRole.STUDENT,
    },
  })
  console.log('✅ Created Student:', student.email)

  // Create Sample Course
  const course = await prisma.course.upsert({
    where: { id: 'sample-course-1' },
    update: {},
    create: {
      id: 'sample-course-1',
      name: 'Introduction to Web Development',
      description: 'A comprehensive course covering HTML, CSS, JavaScript, and modern web frameworks.',
      creatorId: courseAdmin.id,
      isActive: true,
    },
  })
  console.log('✅ Created Course:', course.name)

  // Enroll student in course
  await prisma.courseEnrollment.upsert({
    where: {
      courseId_userId: {
        courseId: course.id,
        userId: student.id,
      },
    },
    update: {},
    create: {
      courseId: course.id,
      userId: student.id,
    },
  })
  console.log('✅ Enrolled student in course')

  // Create Sample Questions with Base Examples
  const textQuestion = await prisma.question.upsert({
    where: {
      courseId_questionNumber: {
        courseId: course.id,
        questionNumber: 1,
      },
    },
    update: {},
    create: {
      courseId: course.id,
      questionNumber: 1,
      title: 'HTML Fundamentals Essay',
      description: 'Write a comprehensive essay about HTML fundamentals, including semantic elements, accessibility, and best practices.',
      submissionType: SubmissionType.TEXT,
      assessmentPrompt: 'Assess the student\'s understanding of HTML fundamentals based on their essay.',
      criteria: [
        'Demonstrates understanding of semantic HTML',
        'Explains accessibility principles',
        'Mentions HTML5 best practices',
        'Uses proper technical terminology'
      ],
      redFlags: [
        'Outdated HTML practices mentioned',
        'No mention of accessibility',
        'Unclear or incorrect explanations'
      ],
      conditionalChecks: [
        'If accessibility not mentioned, deduct points',
        'If semantic elements explained well, bonus points'
      ],
      guidance: 'Look for depth of understanding and practical knowledge.',
    },
  })

  await prisma.baseExample.create({
    data: {
      questionId: textQuestion.id,
      title: 'Perfect HTML Fundamentals Essay',
      description: 'An exemplary essay covering all required HTML fundamentals',
      content: `HTML (HyperText Markup Language) is the foundation of web development, providing the structural backbone for web pages through semantic elements and accessibility features.

Semantic HTML elements like <header>, <nav>, <main>, <article>, and <footer> provide meaning to content, making it more accessible to screen readers and improving SEO. These elements replace generic <div> tags with meaningful structure.

Accessibility is crucial in modern HTML. Using proper heading hierarchy (h1-h6), alt attributes for images, ARIA labels, and form labels ensures content is usable by people with disabilities. The lang attribute helps screen readers pronounce content correctly.

HTML5 best practices include using semantic elements, providing fallbacks for older browsers, optimizing for performance with proper resource loading, and ensuring valid markup through W3C validation.

Modern HTML also emphasizes progressive enhancement, where basic functionality works without JavaScript, and enhanced features are added progressively for capable browsers.`,
      metadata: {
        wordCount: 150,
        topics: ['semantic elements', 'accessibility', 'best practices', 'HTML5']
      }
    },
  })

  const githubQuestion = await prisma.question.upsert({
    where: {
      courseId_questionNumber: {
        courseId: course.id,
        questionNumber: 2,
      },
    },
    update: {},
    create: {
      courseId: course.id,
      questionNumber: 2,
      title: 'Personal Portfolio Website',
      description: 'Create a personal portfolio website using HTML, CSS, and JavaScript. Submit your GitHub repository.',
      submissionType: SubmissionType.GITHUB_REPO,
      assessmentPrompt: 'Evaluate the portfolio website code quality, structure, and implementation.',
      criteria: [
        'Clean, organized file structure',
        'Responsive design implementation',
        'Proper HTML semantics',
        'CSS best practices',
        'JavaScript functionality',
        'README documentation'
      ],
      redFlags: [
        'No README file',
        'Broken links or functionality',
        'Poor code organization',
        'No responsive design'
      ],
      conditionalChecks: [
        'If README is comprehensive, bonus points',
        'If site is fully responsive, bonus points'
      ],
      guidance: 'Focus on code quality, organization, and functionality.',
    },
  })

  await prisma.baseExample.create({
    data: {
      questionId: githubQuestion.id,
      title: 'Excellent Portfolio Repository',
      description: 'A well-structured portfolio repository with best practices',
      content: 'https://github.com/example-user/perfect-portfolio',
      metadata: {
        fileStructure: {
          'index.html': 'Main portfolio page with semantic structure',
          'css/styles.css': 'Organized CSS with responsive design',
          'js/script.js': 'Clean JavaScript for interactions',
          'README.md': 'Comprehensive documentation',
          'images/': 'Optimized image assets'
        },
        features: ['responsive design', 'semantic HTML', 'CSS Grid/Flexbox', 'accessibility', 'performance optimization']
      }
    },
  })

  console.log('✅ Created sample questions with base examples')

  console.log('🎉 Seed completed successfully!')
  console.log('\n📋 Test Accounts:')
  console.log('Super Admin: superadmin@example.com / superadmin123')
  console.log('Course Admin: courseadmin@example.com / courseadmin123')
  console.log('Student: student@example.com / student123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })