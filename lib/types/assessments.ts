// lib/types/assessment.ts

import { AssessmentResult } from '@/lib/services/llm-service'
import { GitHubAssessmentData } from '@/lib/services/github-service'

/**
 * Extended assessment result that can include additional data without conflicts
 */
export interface ExtendedAssessmentResult extends AssessmentResult {
  // GitHub-specific data (optional)
  detailedAssessment?: GitHubAssessmentData | null
  
  // General metadata (optional)
  metadata?: {
    github?: GitHubAssessmentData
    submissionType?: string
    processingNotes?: string[]
    [key: string]: any
  }
  
  // Processing information (optional)
  processingSteps?: string[]
  validationResults?: {
    urlValid?: boolean
    contentAccessible?: boolean
    formatCorrect?: boolean
  }
}

/**
 * Assessment request for the service
 */
export interface AssessmentRequest {
  questionId: string
  content: string
  submissionType: 'document' | 'github_repo' | 'screenshot' | 'text' | 'website'
  additionalContext?: string
}

/**
 * Submission result with proper typing
 */
export interface SubmissionResult {
  success: boolean
  submissionId?: string
  data?: {
    submissionId: string
    assessment?: ExtendedAssessmentResult
  }
  error?: string
}