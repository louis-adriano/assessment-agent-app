import Groq from 'groq-sdk'
import { SubmissionType } from '@prisma/client'

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

// LLM Model Configuration - Updated with current Groq models
export const LLM_MODELS = {
  LLAMA_8B: 'llama-3.1-8b-instant',
  LLAMA_70B: 'llama-3.1-70b-versatile', 
  MIXTRAL: 'mixtral-8x7b-32768',
} as const

type LLMModel = typeof LLM_MODELS[keyof typeof LLM_MODELS]

// Assessment complexity levels
export enum AssessmentComplexity {
  SIMPLE = 'simple',
  MEDIUM = 'medium',
  COMPLEX = 'complex'
}

// Assessment result structure
export interface AssessmentResult {
  remark: 'Excellent' | 'Good' | 'Can Improve' | 'Needs Improvement'
  feedback: string
  criteria_met: string[]
  areas_for_improvement: string[]
  confidence: number
  processing_time_ms: number
  model_used: string
}

// Assessment request structure
export interface AssessmentRequest {
  submissionContent: string
  submissionType: SubmissionType
  questionTitle: string
  questionDescription: string
  assessmentPrompt?: string
  criteria: string[]
  redFlags: string[]
  conditionalChecks: string[]
  baseExampleContent?: string
  baseExampleMetadata?: any
}

// LLM routing logic based on submission type and complexity
export function selectLLMModel(submissionType: SubmissionType, contentLength: number, hasBaseExample: boolean): LLMModel {
  // Simple content (< 500 chars) - use Llama 8B
  if (contentLength < 500 && submissionType === SubmissionType.TEXT) {
    return LLM_MODELS.LLAMA_8B
  }

  // Complex submissions always use Llama 70B
  if (submissionType === SubmissionType.GITHUB_REPO || 
      submissionType === SubmissionType.WEBSITE ||
      contentLength > 5000 ||
      hasBaseExample) {
    return LLM_MODELS.LLAMA_70B
  }

  // Medium complexity - documents, screenshots
  if (submissionType === SubmissionType.DOCUMENT || 
      submissionType === SubmissionType.SCREENSHOT ||
      contentLength > 1000) {
    return LLM_MODELS.MIXTRAL
  }

  // Default to Llama 8B for simple cases
  return LLM_MODELS.LLAMA_8B
}

// Build assessment prompt with base example comparison
export function buildAssessmentPrompt(request: AssessmentRequest): string {
  const {
    submissionContent,
    submissionType,
    questionTitle,
    questionDescription,
    assessmentPrompt,
    criteria,
    redFlags,
    conditionalChecks,
    baseExampleContent,
    baseExampleMetadata
  } = request

  let prompt = `You are an expert educational assessor. Please evaluate the following student submission.

**QUESTION CONTEXT:**
Title: ${questionTitle}
Description: ${questionDescription}
Submission Type: ${submissionType}

**STUDENT SUBMISSION:**
${submissionContent}
`

  // Add base example for comparison if available
  if (baseExampleContent) {
    prompt += `

**PERFECT ANSWER REFERENCE (BASE EXAMPLE):**
${baseExampleContent}
`
    if (baseExampleMetadata) {
      prompt += `
Base Example Metadata: ${JSON.stringify(baseExampleMetadata, null, 2)}
`
    }
    prompt += `
**IMPORTANT:** Compare the student's submission against this perfect answer. Identify similarities, differences, and areas where the student's work deviates from the ideal response.
`
  }

  // Add assessment criteria
  if (criteria.length > 0) {
    prompt += `

**ASSESSMENT CRITERIA (Must-Have Elements):**
${criteria.map((criterion, i) => `${i + 1}. ${criterion}`).join('\n')}
`
  }

  // Add red flags
  if (redFlags.length > 0) {
    prompt += `

**RED FLAGS (Automatic Point Deductions):**
${redFlags.map((flag, i) => `- ${flag}`).join('\n')}
`
  }

  // Add conditional checks
  if (conditionalChecks.length > 0) {
    prompt += `

**CONDITIONAL CHECKS:**
${conditionalChecks.map((check, i) => `- ${check}`).join('\n')}
`
  }

  // Add custom assessment prompt if provided
  if (assessmentPrompt) {
    prompt += `

**SPECIFIC ASSESSMENT INSTRUCTIONS:**
${assessmentPrompt}
`
  }

  // Add submission-specific evaluation guidelines
  prompt += getSubmissionTypeGuidelines(submissionType)

  // Add response format requirements
  prompt += `

**RESPONSE FORMAT:**
Please provide your assessment in the following JSON format:

{
  "remark": "Excellent|Good|Can Improve|Needs Improvement",
  "feedback": "Detailed, constructive feedback (2-3 sentences max). Be specific and actionable.",
  "criteria_met": ["List of criteria that were successfully met"],
  "areas_for_improvement": ["Specific areas where the student can improve"],
  "confidence": 0.85
}

**ASSESSMENT GUIDELINES:**
- "Excellent": Exceeds expectations, meets all criteria with exceptional quality
- "Good": Meets most criteria with good quality, minor improvements needed
- "Can Improve": Meets some criteria but has notable gaps or issues
- "Needs Improvement": Fails to meet most criteria, significant issues present

Confidence should be between 0.5 and 1.0 based on how certain you are about the assessment.
Provide specific, actionable feedback that helps the student improve.
`

  return prompt
}

// Get submission-type specific guidelines
function getSubmissionTypeGuidelines(submissionType: SubmissionType): string {
  switch (submissionType) {
    case SubmissionType.TEXT:
      return `

**TEXT SUBMISSION EVALUATION:**
- Assess clarity of writing and expression
- Check for technical accuracy and depth
- Evaluate structure and organization
- Look for evidence of understanding vs. memorization
`

    case SubmissionType.GITHUB_REPO:
      return `

**GITHUB REPOSITORY EVALUATION:**
- Assess code quality, organization, and structure
- Check for proper documentation (README, comments)
- Evaluate best practices and coding standards
- Look for working functionality and error handling
- Consider repository organization and file structure
`

    case SubmissionType.DOCUMENT:
      return `

**DOCUMENT SUBMISSION EVALUATION:**
- Assess content completeness and accuracy
- Check formatting and professional presentation
- Evaluate logical flow and structure
- Look for proper use of technical terminology
- Consider adherence to assignment requirements
`

    case SubmissionType.WEBSITE:
      return `

**WEBSITE SUBMISSION EVALUATION:**
- Assess functionality and user experience
- Check responsive design and accessibility
- Evaluate code quality and best practices
- Look for proper implementation of requirements
- Consider performance and optimization
`

    case SubmissionType.SCREENSHOT:
      return `

**SCREENSHOT SUBMISSION EVALUATION:**
- Assess visual elements and layout
- Check for completeness of required components
- Evaluate quality and clarity of the image
- Look for evidence of proper implementation
- Consider adherence to design requirements
`

    default:
      return ''
  }
}

// Main assessment function
export async function assessSubmission(request: AssessmentRequest): Promise<AssessmentResult> {
  const startTime = Date.now()
  
  try {
    // Select appropriate model based on complexity
    const contentLength = request.submissionContent.length
    const hasBaseExample = !!request.baseExampleContent
    const selectedModel = selectLLMModel(request.submissionType, contentLength, hasBaseExample)

    // Build the assessment prompt
    const prompt = buildAssessmentPrompt(request)

    console.log(`Assessing submission with ${selectedModel} (content length: ${contentLength})`)

    // Make the API call to Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert educational assessor. Always respond with valid JSON in the exact format requested."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: selectedModel,
      temperature: 0.3, // Lower temperature for more consistent assessments
      max_tokens: 1000,
      response_format: { type: "json_object" }
    })

    const responseContent = completion.choices[0]?.message?.content

    if (!responseContent) {
      throw new Error('No response from LLM')
    }

    // Parse the JSON response
    let assessmentData: any
    try {
      assessmentData = JSON.parse(responseContent)
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', responseContent)
      throw new Error('Invalid JSON response from LLM')
    }

    // Validate required fields
    const requiredFields = ['remark', 'feedback', 'criteria_met', 'areas_for_improvement']
    for (const field of requiredFields) {
      if (!assessmentData[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }

    // Validate remark values
    const validRemarks = ['Excellent', 'Good', 'Can Improve', 'Needs Improvement']
    if (!validRemarks.includes(assessmentData.remark)) {
      assessmentData.remark = 'Can Improve' // Default fallback
    }

    // Ensure arrays are actually arrays
    assessmentData.criteria_met = Array.isArray(assessmentData.criteria_met) 
      ? assessmentData.criteria_met 
      : []
    
    assessmentData.areas_for_improvement = Array.isArray(assessmentData.areas_for_improvement) 
      ? assessmentData.areas_for_improvement 
      : []

    // Validate confidence score
    const confidence = typeof assessmentData.confidence === 'number' 
      ? Math.max(0.5, Math.min(1.0, assessmentData.confidence))
      : 0.75 // Default confidence

    const processingTime = Date.now() - startTime

    return {
      remark: assessmentData.remark,
      feedback: assessmentData.feedback,
      criteria_met: assessmentData.criteria_met,
      areas_for_improvement: assessmentData.areas_for_improvement,
      confidence,
      processing_time_ms: processingTime,
      model_used: selectedModel
    }

  } catch (error) {
    console.error('Assessment error:', error)
    
    // Return a fallback assessment
    const processingTime = Date.now() - startTime
    return {
      remark: 'Can Improve',
      feedback: 'Assessment could not be completed due to a technical error. Please try submitting again or contact support.',
      criteria_met: [],
      areas_for_improvement: ['Please resubmit your work for proper assessment'],
      confidence: 0.5,
      processing_time_ms: processingTime,
      model_used: 'error_fallback'
    }
  }
}

// Rate limiting and usage tracking
export class LLMRateLimiter {
  private static requests: Map<string, number[]> = new Map()
  private static readonly RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
  private static readonly MAX_REQUESTS_PER_MINUTE = 10

  static canMakeRequest(userId: string): boolean {
    const now = Date.now()
    const userRequests = this.requests.get(userId) || []
    
    // Filter out requests outside the current window
    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < this.RATE_LIMIT_WINDOW_MS
    )
    
    this.requests.set(userId, recentRequests)
    
    return recentRequests.length < this.MAX_REQUESTS_PER_MINUTE
  }

  static recordRequest(userId: string): void {
    const now = Date.now()
    const userRequests = this.requests.get(userId) || []
    userRequests.push(now)
    this.requests.set(userId, userRequests)
  }

  static getRequestsRemaining(userId: string): number {
    const now = Date.now()
    const userRequests = this.requests.get(userId) || []
    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < this.RATE_LIMIT_WINDOW_MS
    )
    
    return Math.max(0, this.MAX_REQUESTS_PER_MINUTE - recentRequests.length)
  }
}

// Utility function to test LLM connectivity
export async function testLLMConnection(): Promise<{ success: boolean; error?: string; models: string[] }> {
  try {
    // Test with a simple prompt
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: "Respond with: 'Connection successful'"
        }
      ],
      model: LLM_MODELS.LLAMA_8B,
      max_tokens: 10
    })

    const response = completion.choices[0]?.message?.content

    return {
      success: response?.includes('Connection successful') || false,
      models: Object.values(LLM_MODELS)
    }
  } catch (error) {
    console.error('LLM connection test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      models: []
    }
  }
}