// scripts/fix-submission-types.js
// This script will fix the submission type enum issue

const { execSync } = require('child_process')
const fs = require('fs')

async function fixSubmissionTypes() {
  console.log('🔄 Starting submission type fix process...')
  
  try {
    console.log('📝 Step 1: Generating migration for updated schema...')
    
    // Generate migration for the updated schema
    execSync('npx prisma migrate dev --name add-uppercase-submission-types', { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    
    console.log('✅ Step 1 completed: Migration generated and applied')
    
    console.log('📝 Step 2: Running data normalization...')
    
    // Now run the data normalization
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    // Update Questions table
    const questionsUpdated = await prisma.question.updateMany({
      where: { submissionType: 'GITHUB_REPO' },
      data: { submissionType: 'github_repo' }
    })
    console.log(`✅ Updated ${questionsUpdated.count} questions: GITHUB_REPO → github_repo`)

    const questionsUpdated2 = await prisma.question.updateMany({
      where: { submissionType: 'DOCUMENT' },
      data: { submissionType: 'document' }
    })
    console.log(`✅ Updated ${questionsUpdated2.count} questions: DOCUMENT → document`)

    const questionsUpdated3 = await prisma.question.updateMany({
      where: { submissionType: 'SCREENSHOT' },
      data: { submissionType: 'screenshot' }
    })
    console.log(`✅ Updated ${questionsUpdated3.count} questions: SCREENSHOT → screenshot`)

    const questionsUpdated4 = await prisma.question.updateMany({
      where: { submissionType: 'WEBSITE' },
      data: { submissionType: 'website' }
    })
    console.log(`✅ Updated ${questionsUpdated4.count} questions: WEBSITE → website`)

    const questionsUpdated5 = await prisma.question.updateMany({
      where: { submissionType: 'TEXT' },
      data: { submissionType: 'text' }
    })
    console.log(`✅ Updated ${questionsUpdated5.count} questions: TEXT → text`)

    // Update Submissions table
    const submissionsUpdated = await prisma.submission.updateMany({
      where: { submissionType: 'GITHUB_REPO' },
      data: { submissionType: 'github_repo' }
    })
    console.log(`✅ Updated ${submissionsUpdated.count} submissions: GITHUB_REPO → github_repo`)

    const submissionsUpdated2 = await prisma.submission.updateMany({
      where: { submissionType: 'DOCUMENT' },
      data: { submissionType: 'document' }
    })
    console.log(`✅ Updated ${submissionsUpdated2.count} submissions: DOCUMENT → document`)

    const submissionsUpdated3 = await prisma.submission.updateMany({
      where: { submissionType: 'SCREENSHOT' },
      data: { submissionType: 'screenshot' }
    })
    console.log(`✅ Updated ${submissionsUpdated3.count} submissions: SCREENSHOT → screenshot`)

    const submissionsUpdated4 = await prisma.submission.updateMany({
      where: { submissionType: 'WEBSITE' },
      data: { submissionType: 'website' }
    })
    console.log(`✅ Updated ${submissionsUpdated4.count} submissions: WEBSITE → website`)

    const submissionsUpdated5 = await prisma.submission.updateMany({
      where: { submissionType: 'TEXT' },
      data: { submissionType: 'text' }
    })
    console.log(`✅ Updated ${submissionsUpdated5.count} submissions: TEXT → text`)

    await prisma.$disconnect()
    
    console.log('✅ Step 2 completed: Data normalization finished')
    
    console.log('📝 Step 3: Cleaning up schema (removing uppercase variants)...')
    
    // Create the final clean schema
    const cleanSchema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum SubmissionType {
  document
  github_repo
  screenshot
  text
  website
}

enum UserRole {
  SUPER_ADMIN
  COURSE_ADMIN
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      UserRole @default(COURSE_ADMIN)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  submissions Submission[]
  courses     Course[]
  baseExamples BaseExample[]

  @@map("users")
}

model Course {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  questions Question[]
  createdBy User?      @relation(fields: [createdById], references: [id])
  createdById String?

  @@map("courses")
}

model Question {
  id             String         @id @default(cuid())
  questionNumber Int
  title          String
  description    String?
  submissionType SubmissionType
  criteria       String[]       @default([])
  redFlags       String[]       @default([])
  conditionalChecks String[]    @default([])
  guidance       String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  // Relations
  course       Course        @relation(fields: [courseId], references: [id], onDelete: Cascade)
  courseId     String
  submissions  Submission[]
  baseExamples BaseExample[]

  @@unique([courseId, questionNumber])
  @@map("questions")
}

model BaseExample {
  id          String   @id @default(cuid())
  title       String
  content     String
  explanation String?
  isGood      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  questionId String
  createdBy  User?    @relation(fields: [createdById], references: [id])
  createdById String?

  @@map("base_examples")
}

model Submission {
  id               String         @id @default(cuid())
  submissionType   SubmissionType
  submissionContent String
  additionalInfo   String?
  assessmentResult Json?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  // Relations
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  questionId String
  user       User?    @relation(fields: [userId], references: [id])
  userId     String?

  @@map("submissions")
}`

    // Write the clean schema
    fs.writeFileSync('prisma/schema.prisma', cleanSchema)
    
    console.log('📝 Step 4: Generating final migration...')
    
    // Generate final migration to remove uppercase variants
    execSync('npx prisma migrate dev --name remove-uppercase-submission-types', { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    
    console.log('✅ Step 4 completed: Clean schema migration applied')
    
    console.log('📝 Step 5: Regenerating Prisma client...')
    
    // Regenerate the Prisma client
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    
    console.log('✅ Step 5 completed: Prisma client regenerated')
    
    console.log('🎉 All steps completed successfully!')
    console.log('📊 The submission type enum issue has been fixed.')
    console.log('🚀 You can now submit GitHub repositories without errors!')
    
  } catch (error) {
    console.error('❌ Error during fix process:', error)
    console.log('💡 You may need to run this step by step manually.')
  }
}

// Run the fix
fixSubmissionTypes()