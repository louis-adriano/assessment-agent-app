// scripts/seed-better-auth.ts
import { PrismaClient, UserRole } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting Better Auth demo seed...')

  // Clean existing data
  console.log('🧹 Cleaning existing data...')
  await prisma.submission.deleteMany()
  await prisma.baseExample.deleteMany()
  await prisma.question.deleteMany()
  await prisma.courseEnrollment.deleteMany()
  await prisma.courseAdmin.deleteMany()
  await prisma.course.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.verification.deleteMany()
  await prisma.user.deleteMany()

  console.log('🧹 Cleaned existing data')

  // Create demo users with Better Auth compatible structure
  const hashedPassword = await bcryptjs.hash('password123', 10)

  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@example.com',
      name: 'Super Administrator',
      role: UserRole.SUPER_ADMIN,
      emailVerified: true
    }
  })

  // Create account for super admin (Better Auth structure)
  await prisma.account.create({
    data: {
      userId: superAdmin.id,
      accountId: superAdmin.email,
      providerId: 'credential',
      password: hashedPassword
    }
  })

  const courseAdmin = await prisma.user.create({
    data: {
      email: 'courseadmin@example.com',
      name: 'Course Administrator',
      role: UserRole.COURSE_ADMIN,
      emailVerified: true
    }
  })

  await prisma.account.create({
    data: {
      userId: courseAdmin.id,
      accountId: courseAdmin.email,
      providerId: 'credential',
      password: hashedPassword
    }
  })

  const student = await prisma.user.create({
    data: {
      email: 'student@example.com',
      name: 'Demo Student',
      role: UserRole.STUDENT,
      emailVerified: true
    }
  })

  await prisma.account.create({
    data: {
      userId: student.id,
      accountId: student.email,
      providerId: 'credential',
      password: hashedPassword
    }
  })

  console.log('👥 Created demo users with Better Auth accounts')

  // Create Business Analysis Course
  const baCourse = await prisma.course.create({
    data: {
      name: 'Business Analysis Fundamentals',
      description: 'Learn the core principles of business analysis including requirements gathering, stakeholder management, and process modeling. This course combines theoretical knowledge with practical AI-assisted tools.',
      creatorId: courseAdmin.id
    }
  })

  // Create Web Development Course
  const webDevCourse = await prisma.course.create({
    data: {
      name: 'Full Stack Web Development',
      description: 'Master modern web development with React, Next.js, and Node.js. Build real-world applications and deploy them to production environments.',
      creatorId: superAdmin.id
    }
  })

  // Create Data Science Course
  const dataScienceCourse = await prisma.course.create({
    data: {
      name: 'Data Science & AI',
      description: 'Explore machine learning, data visualization, and artificial intelligence. Work with real datasets and build predictive models.',
      creatorId: courseAdmin.id
    }
  })

  console.log('📚 Created demo courses')

  // Create sample assessments for Business Analysis course
  const requirementsQuestion = await prisma.question.create({
    data: {
      courseId: baCourse.id,
      questionNumber: 1,
      title: 'Requirements Analysis Exercise',
      description: 'Analyze the given business scenario and identify functional and non-functional requirements. Provide a detailed requirements document.',
      submissionType: 'DOCUMENT',
      assessmentPrompt: 'Evaluate the completeness and accuracy of the requirements analysis. Look for clear identification of stakeholders, functional requirements, non-functional requirements, and proper documentation format.',
      criteria: [
        'Identifies all key stakeholders',
        'Lists comprehensive functional requirements',
        'Includes relevant non-functional requirements',
        'Uses proper business analysis terminology',
        'Documents requirements in clear, measurable terms',
        'Includes acceptance criteria for each requirement'
      ],
      redFlags: [
        'Missing key stakeholder identification',
        'Vague or unmeasurable requirements',
        'No acceptance criteria provided',
        'Poor documentation structure',
        'Incorrect business analysis terminology'
      ],
      conditionalChecks: [
        'If requirements are prioritized using MoSCoW method, bonus points',
        'If requirements traceability matrix is included, excellent rating',
        'If risk analysis is provided, additional recognition'
      ],
      guidance: 'Think like a business analyst. Focus on clarity, completeness, and measurability. Use standard BA templates and methodologies.',
      createdBy: courseAdmin.id
    }
  })

  // Create base example for requirements analysis
  await prisma.baseExample.create({
    data: {
      questionId: requirementsQuestion.id,
      title: 'Excellent Requirements Analysis Example',
      description: 'A comprehensive requirements analysis that demonstrates best practices in business analysis.',
      content: `# Requirements Analysis: E-commerce Platform Enhancement

## Executive Summary
This document outlines requirements for enhancing the existing e-commerce platform to improve user experience and increase conversion rates.

## Stakeholder Analysis
- **Primary Stakeholders:** Customers, Product Manager, Development Team
- **Secondary Stakeholders:** Marketing Team, Customer Support, Management
- **External Stakeholders:** Payment Processors, Shipping Partners

## Functional Requirements

### FR001: Enhanced Search Functionality
**Description:** Users must be able to search for products using multiple criteria
**Priority:** Must Have
**Acceptance Criteria:**
- Search by product name, category, price range
- Auto-complete suggestions appear within 300ms
- Search results display within 2 seconds
- Filters can be applied to narrow results

### FR002: Wishlist Management
**Description:** Registered users can save products for future purchase
**Priority:** Should Have
**Acceptance Criteria:**
- Add/remove items from wishlist
- Wishlist accessible from user profile
- Share wishlist via email or social media
- Wishlist items remain saved for 1 year

## Non-Functional Requirements

### NFR001: Performance
- Page load time < 3 seconds on standard broadband
- Support 1000 concurrent users
- 99.9% uptime during business hours

### NFR002: Security
- All transactions encrypted using SSL
- PCI DSS compliance for payment processing
- User data protection per GDPR requirements

## Risk Analysis
- **High Risk:** Integration with existing payment system
- **Medium Risk:** Database performance with increased load
- **Low Risk:** User adoption of new features`,
      fileUrl: null,
      metadata: {
        wordCount: 280,
        grade: 'A+',
        strengths: ['comprehensive stakeholder analysis', 'measurable acceptance criteria', 'proper BA terminology'],
        completeness: 95,
        documentStructure: 'excellent',
        methodology: 'standard BA practices'
      },
      createdBy: courseAdmin.id
    }
  })

  // Create Web Development assessment
  const webDevQuestion = await prisma.question.create({
    data: {
      courseId: webDevCourse.id,
      questionNumber: 1,
      title: 'React TODO Application',
      description: 'Build a full-featured TODO application using React with the following features: add/edit/delete tasks, mark as complete, filter by status, and persist data locally.',
      submissionType: 'GITHUB_REPO',
      assessmentPrompt: 'Evaluate the React application for code quality, functionality, user interface, and adherence to React best practices.',
      criteria: [
        'Application successfully adds, edits, and deletes tasks',
        'Tasks can be marked as complete/incomplete',
        'Filtering functionality works correctly',
        'Data persists using localStorage',
        'Clean, responsive user interface',
        'Proper React component structure and hooks usage'
      ],
      redFlags: [
        'Application does not run or has critical errors',
        'Missing core functionality (add/edit/delete)',
        'No data persistence',
        'Poor code organization',
        'Inline styles instead of CSS/styled-components',
        'No error handling'
      ],
      conditionalChecks: [
        'If TypeScript is used, bonus points',
        'If unit tests are included, excellent rating',
        'If accessibility features are implemented, additional recognition',
        'If custom hooks are used appropriately, bonus points'
      ],
      guidance: 'Focus on writing clean, maintainable React code. Use modern hooks, handle edge cases, and create an intuitive user experience.',
      createdBy: superAdmin.id
    }
  })

  // Enroll student in courses
  await prisma.courseEnrollment.create({
    data: {
      userId: student.id,
      courseId: baCourse.id
    }
  })

  await prisma.courseEnrollment.create({
    data: {
      userId: student.id,
      courseId: webDevCourse.id
    }
  })

  console.log('📝 Created sample assessments and enrollments')
  console.log('✅ Demo seed completed successfully!')
  console.log('\n📋 Demo Accounts Created:')
  console.log('Super Admin: superadmin@example.com / password123')
  console.log('Course Admin: courseadmin@example.com / password123')
  console.log('Student: student@example.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })