'use server'

import { prisma } from '@/lib/prisma'
import { assessSubmission, AssessmentRequest, AssessmentResult, LLMRateLimiter } from './llm-service'
import { SubmissionType, SubmissionStatus } from '@prisma/client'

// Add type definition for stored assessment result
interface StoredAssessmentResult {
  remark: string
  feedback: string
  criteria_met: string[]
  areas_for_improvement: string[]
  confidence: number
  processing_time_ms: number
  model_used: string
  baseExampleUsed?: string
  criteriaComparison?: {
    totalCriteria: number
    criteriaMet: number
    completionPercentage: number
  }
}

// Enhanced assessment result with database integration
export interface EnhancedAssessmentResult extends AssessmentResult {
  submissionId: string
  baseExampleUsed?: string
  criteriaComparison?: {
    totalCriteria: number
    criteriaMet: number
    completionPercentage: number
  }
}

// Assessment options for authenticated users
export interface AssessmentOptions {
  userId: string
  questionId: string
  submissionContent: string
  submissionUrl?: string
  fileUrl?: string
  forceReassessment?: boolean
}

// Anonymous assessment options
export interface AnonymousAssessmentOptions {
  submissionId: string
  questionId: string
  submissionContent: string
  submissionUrl?: string
  fileUrl?: string
  question: any // The question object with course and baseExamples
}

// NEW: Anonymous assessment function for Sprint 1
export async function processAnonymousAssessment(options: AnonymousAssessmentOptions): Promise<EnhancedAssessmentResult> {
  const { submissionId, submissionContent, question } = options

  try {
    // For anonymous submissions, we use a simple rate limit based on IP or session
    // In a real implementation, you might use request IP or session ID
    const anonymousUserId = 'anonymous_' + Date.now()

    if (!LLMRateLimiter.canMakeRequest(anonymousUserId)) {
      throw new Error('Rate limit exceeded. Please wait before submitting another assessment.')
    }

    // Record rate limit request
    LLMRateLimiter.recordRequest(anonymousUserId)

    try {
      // Select best base example for comparison
      const baseExample = selectBestBaseExample(question.baseExamples, question.submissionType)

      // Prepare assessment request
      const assessmentRequest: AssessmentRequest = {
        submissionContent,
        submissionType: question.submissionType,
        questionTitle: question.title,
        questionDescription: question.description,
        assessmentPrompt: question.assessmentPrompt || undefined,
        criteria: question.criteria,
        redFlags: question.redFlags,
        conditionalChecks: question.conditionalChecks,
        baseExampleContent: baseExample?.content,
        baseExampleMetadata: baseExample?.metadata
      }

      // Perform the assessment
      const assessmentResult = await assessSubmission(assessmentRequest)

      // Calculate criteria comparison
      const criteriaComparison = calculateCriteriaComparison(
        assessmentResult.criteria_met,
        question.criteria
      )

      // Enhanced result with base example info
      const enhancedResult: EnhancedAssessmentResult = {
        ...assessmentResult,
        submissionId: submissionId,
        baseExampleUsed: baseExample?.title,
        criteriaComparison
      }

      // Store the assessment result
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: SubmissionStatus.COMPLETED,
          assessmentResult: {
            ...assessmentResult,
            baseExampleUsed: baseExample?.title,
            criteriaComparison
          },
          confidence: assessmentResult.confidence,
          processedAt: new Date()
        }
      })

      return enhancedResult

    } catch (assessmentError) {
      // Update submission status to failed
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: SubmissionStatus.FAILED,
          assessmentResult: {
            error: assessmentError instanceof Error ? assessmentError.message : 'Assessment failed'
          }
        }
      })

      throw assessmentError
    }

  } catch (error) {
    console.error('Anonymous assessment processing error:', error)
    throw error
  }
}

// Main assessment function that integrates with database (AUTHENTICATED)
export async function processAssessment(options: AssessmentOptions): Promise<EnhancedAssessmentResult> {
  const { userId, questionId, submissionContent, submissionUrl, fileUrl, forceReassessment } = options

  try {
    // Check rate limiting
    if (!LLMRateLimiter.canMakeRequest(userId)) {
      throw new Error('Rate limit exceeded. Please wait before submitting another assessment.')
    }

    // Get question with course and base examples
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        course: {
          select: { id: true, name: true, creatorId: true }
        },
        baseExamples: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!question) {
      throw new Error('Assessment not found')
    }

    if (!question.isActive) {
      throw new Error('Assessment is not active for submissions')
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId: question.course.id,
          userId: userId
        }
      }
    })

    if (!enrollment) {
      throw new Error('You are not enrolled in this course')
    }

    // Check for existing submission
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        questionId,
        userId,
        status: SubmissionStatus.COMPLETED
      },
      orderBy: { createdAt: 'desc' }
    })

    if (existingSubmission && !forceReassessment) {
      // Return existing assessment - safely cast the Json type
      const assessmentResult = existingSubmission.assessmentResult as any
      
      return {
        remark: assessmentResult?.remark || 'Can Improve',
        feedback: assessmentResult?.feedback || 'No feedback available',
        criteria_met: assessmentResult?.criteria_met || [],
        areas_for_improvement: assessmentResult?.areas_for_improvement || [],
        confidence: assessmentResult?.confidence || 0.5,
        processing_time_ms: assessmentResult?.processing_time_ms || 0,
        model_used: assessmentResult?.model_used || 'unknown',
        submissionId: existingSubmission.id,
        baseExampleUsed: assessmentResult?.baseExampleUsed,
        criteriaComparison: calculateCriteriaComparison(
          assessmentResult?.criteria_met || [],
          question.criteria
        )
      }
    }

    // Create new submission record
    const submission = await prisma.submission.create({
      data: {
        questionId,
        userId,
        submissionContent,
        submissionUrl,
        fileUrl,
        status: SubmissionStatus.PROCESSING
      }
    })

    // Record rate limit request
    LLMRateLimiter.recordRequest(userId)

    try {
      // Select best base example for comparison
      const baseExample = selectBestBaseExample(question.baseExamples, question.submissionType)

      // Prepare assessment request
      const assessmentRequest: AssessmentRequest = {
        submissionContent,
        submissionType: question.submissionType,
        questionTitle: question.title,
        questionDescription: question.description,
        assessmentPrompt: question.assessmentPrompt || undefined,
        criteria: question.criteria,
        redFlags: question.redFlags,
        conditionalChecks: question.conditionalChecks,
        baseExampleContent: baseExample?.content,
        baseExampleMetadata: baseExample?.metadata
      }

      // Perform the assessment
      const assessmentResult = await assessSubmission(assessmentRequest)

      // Calculate criteria comparison
      const criteriaComparison = calculateCriteriaComparison(
        assessmentResult.criteria_met,
        question.criteria
      )

      // Enhanced result with base example info
      const enhancedResult: EnhancedAssessmentResult = {
        ...assessmentResult,
        submissionId: submission.id,
        baseExampleUsed: baseExample?.title,
        criteriaComparison
      }

      // Store the assessment result
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: SubmissionStatus.COMPLETED,
          assessmentResult: {
            ...assessmentResult,
            baseExampleUsed: baseExample?.title,
            criteriaComparison
          },
          confidence: assessmentResult.confidence,
          processedAt: new Date()
        }
      })

      return enhancedResult

    } catch (assessmentError) {
      // Update submission status to failed
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: SubmissionStatus.FAILED,
          assessmentResult: {
            error: assessmentError instanceof Error ? assessmentError.message : 'Assessment failed'
          }
        }
      })

      throw assessmentError
    }

  } catch (error) {
    console.error('Assessment processing error:', error)
    throw error
  }
}

// Select the most appropriate base example for comparison
function selectBestBaseExample(baseExamples: any[], submissionType: SubmissionType) {
  if (!baseExamples || baseExamples.length === 0) {
    return null
  }

  // If only one base example, use it
  if (baseExamples.length === 1) {
    return baseExamples[0]
  }

  // For multiple base examples, prefer ones with relevant metadata
  const examplesWithMetadata = baseExamples.filter(example => 
    example.metadata && Object.keys(example.metadata).length > 0
  )

  if (examplesWithMetadata.length > 0) {
    // For GitHub repos, prefer examples with file structure info
    if (submissionType === SubmissionType.GITHUB_REPO) {
      const repoExample = examplesWithMetadata.find(example => 
        example.metadata.fileStructure || example.metadata.features
      )
      if (repoExample) return repoExample
    }

    // For documents, prefer examples with word count or topic info
    if (submissionType === SubmissionType.DOCUMENT) {
      const docExample = examplesWithMetadata.find(example => 
        example.metadata.wordCount || example.metadata.topics
      )
      if (docExample) return docExample
    }

    return examplesWithMetadata[0]
  }

  // Fallback to first available example
  return baseExamples[0]
}

// Calculate criteria comparison metrics
function calculateCriteriaComparison(criteriaMet: string[], totalCriteria: string[]) {
  const totalCount = totalCriteria.length
  const metCount = criteriaMet.length
  const completionPercentage = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 0

  return {
    totalCriteria: totalCount,
    criteriaMet: metCount,
    completionPercentage
  }
}

// Get submission history for a user (ONLY FOR AUTHENTICATED USERS)
export async function getSubmissionHistory(userId: string, courseId?: string): Promise<any[]> {
  try {
    const whereClause: any = { 
      userId: userId,  // Only get submissions for this specific user
      NOT: { userId: null } // Exclude anonymous submissions
    }
    
    if (courseId) {
      whereClause.question = {
        courseId
      }
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        question: {
          select: {
            id: true,
            title: true,
            questionNumber: true,
            submissionType: true,
            course: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return submissions
  } catch (error) {
    console.error('Get submission history error:', error)
    throw new Error('Failed to fetch submission history')
  }
}

// Get detailed submission by ID (HANDLES BOTH AUTHENTICATED AND ANONYMOUS)
export async function getSubmissionDetails(submissionId: string, userId?: string): Promise<any> {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        question: {
          include: {
            course: {
              select: { id: true, name: true }
            },
            baseExamples: true
          }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!submission) {
      throw new Error('Submission not found')
    }

    // If no userId provided, this is anonymous access - allow it
    if (!userId) {
      return submission
    }

    // Check if user has permission to view this submission
    if (submission.userId && submission.userId !== userId) {
      // Check if user is course admin or super admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      })

      if (user?.role === 'STUDENT') {
        throw new Error('You do not have permission to view this submission')
      }

      // Course admins can only view submissions from their courses
      if (user?.role === 'COURSE_ADMIN') {
        const course = await prisma.course.findUnique({
          where: { id: submission.question.course.id },
          select: { creatorId: true }
        })

        if (course?.creatorId !== userId) {
          throw new Error('You do not have permission to view this submission')
        }
      }
    }

    return submission
  } catch (error) {
    console.error('Get submission details error:', error)
    throw error
  }
}

// Reprocess assessment for a submission
export async function reprocessAssessment(submissionId: string, userId: string): Promise<EnhancedAssessmentResult> {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        question: {
          include: {
            course: true,
            baseExamples: {
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      }
    })

    if (!submission) {
      throw new Error('Submission not found')
    }

    // Check permissions - only course admin or super admin can reprocess
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (user?.role === 'STUDENT') {
      throw new Error('You do not have permission to reprocess assessments')
    }

    if (user?.role === 'COURSE_ADMIN' && submission.question.course.creatorId !== userId) {
      throw new Error('You do not have permission to reprocess this assessment')
    }

    // For anonymous submissions, we need to use the anonymous assessment flow
    if (!submission.userId) {
      return await processAnonymousAssessment({
        submissionId: submission.id,
        questionId: submission.questionId,
        submissionContent: submission.submissionContent || '',
        submissionUrl: submission.submissionUrl || undefined,
        fileUrl: submission.fileUrl || undefined,
        question: submission.question
      })
    }

    // Reprocess the assessment for authenticated users
    return await processAssessment({
      userId: submission.userId,
      questionId: submission.questionId,
      submissionContent: submission.submissionContent || '',
      submissionUrl: submission.submissionUrl || undefined,
      fileUrl: submission.fileUrl || undefined,
      forceReassessment: true
    })

  } catch (error) {
    console.error('Reprocess assessment error:', error)
    throw error
  }
}

// Get assessment analytics for admins
export async function getAssessmentAnalytics(courseId?: string, userId?: string): Promise<any> {
  try {
    const whereClause: any = {
      status: SubmissionStatus.COMPLETED
    }

    if (courseId) {
      whereClause.question = { courseId }
    }

    if (userId) {
      whereClause.userId = userId
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        question: {
          select: {
            title: true,
            submissionType: true,
            course: {
              select: { name: true }
            }
          }
        }
      }
    })

    const analytics = {
      totalSubmissions: submissions.length,
      anonymousSubmissions: submissions.filter(s => !s.userId).length,
      authenticatedSubmissions: submissions.filter(s => s.userId).length,
      remarkDistribution: {
        'Excellent': 0,
        'Good': 0,
        'Can Improve': 0,
        'Needs Improvement': 0
      },
      averageConfidence: 0,
      submissionsByType: {} as Record<string, number>,
      averageProcessingTime: 0
    }

    let totalConfidence = 0
    let totalProcessingTime = 0

    submissions.forEach(submission => {
      const result = submission.assessmentResult as StoredAssessmentResult | null
      if (result && typeof result === 'object') {
        // Count remarks
        const remark = result.remark as keyof typeof analytics.remarkDistribution
        if (analytics.remarkDistribution[remark] !== undefined) {
          analytics.remarkDistribution[remark]++
        }

        // Sum confidence
        if (typeof result.confidence === 'number') {
          totalConfidence += result.confidence
        }

        // Sum processing time
        if (typeof result.processing_time_ms === 'number') {
          totalProcessingTime += result.processing_time_ms
        }

        // Count by submission type
        const submissionType = submission.question.submissionType
        analytics.submissionsByType[submissionType] = (analytics.submissionsByType[submissionType] || 0) + 1
      }
    })

    // Calculate averages
    if (submissions.length > 0) {
      analytics.averageConfidence = totalConfidence / submissions.length
      analytics.averageProcessingTime = totalProcessingTime / submissions.length
    }

    return analytics
  } catch (error) {
    console.error('Get assessment analytics error:', error)
    throw new Error('Failed to fetch assessment analytics')
  }
}