import Groq from 'groq-sdk'
// import { SubmissionType } from '@prisma/client'

// Define our own SubmissionType
type SubmissionType = 'TEXT' | 'DOCUMENT' | 'GITHUB_REPO' | 'SCREENSHOT' | 'WEBSITE'

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

// Add debug logging for API key
if (!process.env.GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY environment variable is not set!');
} else {
  console.log('✅ GROQ_API_KEY is configured');
}

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
  feedback: string // Keep for backward compatibility
  detailedFeedback: {
    summary: string // Comprehensive overview (4-6 sentences)
    strengths: string[] // Specific strengths with examples
    weaknesses: string[] // Specific weaknesses with examples
    recommendations: string[] // Actionable next steps
    comparisonToExample?: string // How it compares to perfect example
  }
  scoreBreakdown: {
    contentQuality: number // 0-100
    completeness: number // 0-100
    technicalAccuracy: number // 0-100
    structure: number // 0-100
  }
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
  if (contentLength < 500 && submissionType === 'TEXT') {
    return LLM_MODELS.LLAMA_8B
  }

  // Complex submissions always use Llama 70B
  if (submissionType === 'GITHUB_REPO' || 
      submissionType === 'WEBSITE' ||
      contentLength > 5000 ||
      hasBaseExample) {
    return LLM_MODELS.LLAMA_70B
  }

  // Medium complexity - documents, screenshots
  if (submissionType === 'DOCUMENT' || 
      submissionType === 'SCREENSHOT' ||
      contentLength > 1000) {
    return LLM_MODELS.MIXTRAL
  }

  // Default to Llama 8B for simple cases
  return LLM_MODELS.LLAMA_8B
}

// Enhanced assessment prompt builder with better comparison logic
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

  // Enhanced context understanding based on submission type
  const getSubmissionTypeContext = (type: SubmissionType) => {
    const contexts = {
      TEXT: "This is a text-based response. Focus on content quality, structure, clarity, and completeness.",
      DOCUMENT: "This is a document submission. Evaluate formatting, organization, completeness, and professional presentation.",
      GITHUB_REPO: "This is a GitHub repository. Assess code quality, documentation, project structure, and functionality.",
      WEBSITE: "This is a website URL. Evaluate functionality, design, user experience, and technical implementation.",
      SCREENSHOT: "This is a visual submission. Assess clarity, completeness, and whether it demonstrates the required elements."
    }
    return contexts[type] || contexts.TEXT
  }

  let prompt = `You are an expert educational assessor. Please evaluate the following student submission.

**ASSESSMENT CONTEXT:**
Title: ${questionTitle}
Description: ${questionDescription}
Submission Type: ${submissionType}

**STUDENT SUBMISSION:**
${submissionContent}
`

  // Enhanced base example comparison with detailed analysis
  if (baseExampleContent) {
    prompt += `

**PERFECT ANSWER REFERENCE (BASE EXAMPLE):**
${baseExampleContent}
`
    if (baseExampleMetadata) {
      const formattedMetadata = Object.entries(baseExampleMetadata)
        .map(([key, value]) => `- ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
        .join('\n')

      prompt += `

**Why This Example is Perfect (Metadata Analysis):**
${formattedMetadata}
`
    }

    prompt += `

**DETAILED COMPARISON ANALYSIS REQUIRED:**
1. **Content Quality**: How does the student's submission compare to the reference in terms of depth, accuracy, and completeness?
2. **Structure & Organization**: Does the student follow a similar logical flow and structure as the perfect example?
3. **Technical Accuracy**: Are the concepts, terminology, and facts presented correctly compared to the reference?
4. **Completeness**: Does the student cover all the key points addressed in the perfect example?
5. **Innovation & Insight**: Does the student demonstrate original thinking while maintaining the quality standards of the reference?

**COMPARISON SCORING:**
- If the submission closely matches the perfect example quality: Lean towards "Excellent" or "Good"
- If it has similar structure but lacks depth compared to the example: "Can Improve"
- If it significantly deviates or fails to meet the example's standards: "Needs Improvement"

**IMPORTANT:** Use the base example as your quality benchmark. The student doesn't need to be identical to the example, but should demonstrate similar levels of understanding, completeness, and quality.
`
  }

  // Enhanced criteria evaluation
  if (criteria.length > 0) {
    prompt += `

**ASSESSMENT CRITERIA (Must-Have Elements for Full Marks):**
${criteria.map((criterion, i) => `${i + 1}. ${criterion}`).join('\n')}

**CRITERIA EVALUATION INSTRUCTIONS:**
- For each criterion, determine if it's "Met", "Partially Met", or "Not Met"
- Only include fully met criteria in the "criteria_met" array
- A submission should receive "Excellent" only if it meets ALL or nearly all criteria
- "Good" should be given if it meets most criteria (70%+)
- "Can Improve" for meeting some criteria (40-69%)
- "Needs Improvement" for meeting few criteria (<40%)
`
  }

  // Enhanced red flags evaluation
  if (redFlags.length > 0) {
    prompt += `

**RED FLAGS (Critical Issues - Automatic Grade Reduction):**
${redFlags.map((flag, i) => `${i + 1}. ${flag}`).join('\n')}

**RED FLAG IMPACT:**
- ANY red flag present should prevent "Excellent" rating
- Multiple red flags should result in "Needs Improvement" regardless of other factors
- Consider the severity and frequency of red flag issues
- Be specific about which red flags are present in your feedback
`
  }

  // Enhanced conditional checks for bonus recognition
  if (conditionalChecks.length > 0) {
    prompt += `

**BONUS CRITERIA (Conditional Excellence Indicators):**
${conditionalChecks.map((check, i) => `${i + 1}. ${check}`).join('\n')}

**BONUS EVALUATION:**
- These can elevate a "Good" submission to "Excellent"
- Meeting bonus criteria shows exceptional understanding or effort
- Consider these as opportunities for positive recognition
- Include bonus achievements in your feedback to encourage continued excellence
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
  "feedback": "Brief summary (2-3 sentences for backward compatibility)",
  "detailedFeedback": {
    "summary": "Comprehensive 4-6 sentence overview analyzing the overall quality, approach, and results of this submission",
    "strengths": [
      "Specific strength with concrete example from the submission",
      "Another strength with specific reference to what was done well",
      "At least 2-4 strengths total"
    ],
    "weaknesses": [
      "Specific weakness with concrete example of what's missing or incorrect",
      "Another weakness with clear explanation of the issue",
      "At least 2-4 weaknesses total (or empty array if excellent)"
    ],
    "recommendations": [
      "Actionable step: 'Try doing X to improve Y'",
      "Specific technique: 'Consider using Z approach for better results'",
      "Resource suggestion: 'Review topic A to strengthen understanding of B'",
      "At least 3-5 concrete, actionable recommendations"
    ],
    "comparisonToExample": "Only if base example exists: 2-3 sentences comparing student work to the perfect example, highlighting what matched well and what differed"
  },
  "scoreBreakdown": {
    "contentQuality": 85,
    "completeness": 90,
    "technicalAccuracy": 80,
    "structure": 88
  },
  "criteria_met": ["List of criteria that were successfully met"],
  "areas_for_improvement": ["Specific areas where the student can improve"],
  "confidence": 0.85
}

**DETAILED FEEDBACK INSTRUCTIONS:**

1. **Summary**: Write a thorough 4-6 sentence analysis that:
   - Opens with an overall assessment of the submission quality
   - Identifies the main approach or strategy used
   - Highlights the most significant strengths
   - Notes the most critical areas for improvement
   - Ends with encouragement or guidance for next steps

2. **Strengths**: Provide 2-4 specific strengths that:
   - Reference concrete examples from the submission
   - Explain WHY it's a strength (not just "good job")
   - Connect to learning objectives or best practices
   - Be specific, not generic (bad: "Good work", good: "Excellent use of async/await for handling asynchronous GitHub API calls, which prevents callback hell")

3. **Weaknesses**: Provide 2-4 specific weaknesses that:
   - Point to exact issues or omissions
   - Explain the impact or why it matters
   - Are constructive, not discouraging
   - Be specific with examples (bad: "Needs improvement", good: "Missing error handling for network failures, which could cause the app to crash when GitHub API is unavailable")

4. **Recommendations**: Provide 3-5 actionable recommendations that:
   - Start with action verbs (Try, Consider, Add, Review, Refactor, etc.)
   - Are specific and implementable
   - Prioritize high-impact improvements
   - Include learning resources when relevant
   - Example: "Add try-catch blocks around API calls to handle network errors gracefully"

5. **Score Breakdown** (0-100 for each):
   - **contentQuality**: Depth, insight, and overall quality of the work
   - **completeness**: How fully the requirements were addressed
   - **technicalAccuracy**: Correctness of facts, code, concepts
   - **structure**: Organization, clarity, logical flow

**ASSESSMENT GUIDELINES:**
- "Excellent": Exceeds expectations, meets all criteria with exceptional quality
- "Good": Meets most criteria with good quality, minor improvements needed
- "Can Improve": Meets some criteria but has notable gaps or issues
- "Needs Improvement": Fails to meet most criteria, significant issues present

**CRITICAL**: Be specific, use examples from the submission, and make feedback actionable. Avoid generic praise or vague criticism.
`

  return prompt
}

// Sanitize text for PostgreSQL database compatibility
function sanitizeForDatabase(text: string): string {
  if (!text) return text;

  // Aggressive sanitization for PostgreSQL compatibility
  return text
    // Remove literal null bytes
    .replace(/\u0000/g, '')
    // Remove escaped null bytes in various formats
    .replace(/\\u0000/g, '')
    .replace(/\\x00/g, '')
    .replace(/\0/g, '')
    // Remove other control characters
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    // Remove Unicode non-characters
    .replace(/\uFFFE|\uFFFF/g, '')
    // Remove any remaining Unicode escape sequences that could be problematic
    .replace(/\\u[\dA-Fa-f]{4}/g, (match) => {
      const code = parseInt(match.slice(2), 16);
      // Allow only safe printable characters
      if (code >= 0x0020 && code <= 0x007E) {
        return String.fromCharCode(code);
      } else if (code >= 0x00A0 && code <= 0xFFFF && code !== 0xFFFE && code !== 0xFFFF) {
        // Allow extended Unicode but exclude problematic ranges
        return String.fromCharCode(code);
      }
      return ''; // Remove everything else
    })
    // Replace any remaining problematic sequences
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
}

// Get submission-type specific guidelines
function getSubmissionTypeGuidelines(submissionType: SubmissionType): string {
  switch (submissionType) {
    case 'TEXT':
      return `

**TEXT SUBMISSION EVALUATION:**
- Assess clarity of writing and expression
- Check for technical accuracy and depth
- Evaluate structure and organization
- Look for evidence of understanding vs. memorization
`

    case 'GITHUB_REPO':
      return `

**GITHUB REPOSITORY EVALUATION:**
- Assess code quality, organization, and structure
- Check for proper documentation (README, comments)
- Evaluate best practices and coding standards
- Look for working functionality and error handling
- Consider repository organization and file structure
`

    case 'DOCUMENT':
      return `

**DOCUMENT SUBMISSION EVALUATION:**
- Assess content completeness and accuracy
- Check formatting and professional presentation
- Evaluate logical flow and structure
- Look for proper use of technical terminology
- Consider adherence to assignment requirements
`

    case 'WEBSITE':
      return `

**WEBSITE SUBMISSION EVALUATION:**
- Assess functionality and user experience
- Check responsive design and accessibility
- Evaluate code quality and best practices
- Look for proper implementation of requirements
- Consider performance and optimization
`

    case 'SCREENSHOT':
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

    console.log(`🤖 Assessing submission with ${selectedModel} (content length: ${contentLength})`)
    console.log('📤 About to make Groq API call...');

    // Make the API call to Groq with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API call timeout after 30 seconds')), 30000)
    });

    // Try the selected model first, fallback to LLAMA_8B if it fails
    let completion: any;
    try {
      completion = await Promise.race([
        groq.chat.completions.create({
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
        }),
        timeoutPromise
      ]);
    } catch (modelError) {
      console.warn(`⚠️ Model ${selectedModel} failed, trying fallback model...`);
      // Fallback to LLAMA_8B
      completion = await Promise.race([
        groq.chat.completions.create({
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
          model: LLM_MODELS.LLAMA_8B,
          temperature: 0.3,
          max_tokens: 1000,
          response_format: { type: "json_object" }
        }),
        timeoutPromise
      ]);
    }

    console.log('📥 Groq API call completed');

    const responseContent = completion.choices[0]?.message?.content

    if (!responseContent) {
      console.error('❌ No response from LLM');
      throw new Error('No response from LLM')
    }

    // Sanitize response content to remove null bytes and other problematic characters
    const sanitizedContent = sanitizeForDatabase(responseContent)
    console.log('📝 Original response length:', responseContent.length);
    console.log('📝 Sanitized response length:', sanitizedContent.length);
    console.log('📝 Contains null bytes:', responseContent.includes('\u0000'));
    console.log('📝 Contains escaped null bytes:', responseContent.includes('\\u0000'));

    // Parse the JSON response
    let assessmentData: any
    try {
      assessmentData = JSON.parse(sanitizedContent)
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', sanitizedContent)
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

    // Validate and sanitize detailedFeedback
    const detailedFeedback = assessmentData.detailedFeedback || {
      summary: assessmentData.feedback || 'No detailed feedback available',
      strengths: [],
      weaknesses: assessmentData.areas_for_improvement || [],
      recommendations: []
    }

    // Ensure detailedFeedback arrays are valid
    detailedFeedback.strengths = Array.isArray(detailedFeedback.strengths) ? detailedFeedback.strengths : []
    detailedFeedback.weaknesses = Array.isArray(detailedFeedback.weaknesses) ? detailedFeedback.weaknesses : []
    detailedFeedback.recommendations = Array.isArray(detailedFeedback.recommendations) ? detailedFeedback.recommendations : []

    // Validate and sanitize scoreBreakdown
    const scoreBreakdown = assessmentData.scoreBreakdown || {
      contentQuality: 0,
      completeness: 0,
      technicalAccuracy: 0,
      structure: 0
    }

    // Ensure scores are valid numbers between 0-100
    const sanitizeScore = (score: any) => {
      const num = typeof score === 'number' ? score : 0
      return Math.max(0, Math.min(100, num))
    }

    scoreBreakdown.contentQuality = sanitizeScore(scoreBreakdown.contentQuality)
    scoreBreakdown.completeness = sanitizeScore(scoreBreakdown.completeness)
    scoreBreakdown.technicalAccuracy = sanitizeScore(scoreBreakdown.technicalAccuracy)
    scoreBreakdown.structure = sanitizeScore(scoreBreakdown.structure)

    // Validate confidence score
    const confidence = typeof assessmentData.confidence === 'number'
      ? Math.max(0.5, Math.min(1.0, assessmentData.confidence))
      : 0.75 // Default confidence

    const processingTime = Date.now() - startTime

    const result = {
      remark: assessmentData.remark,
      feedback: sanitizeForDatabase(assessmentData.feedback),
      detailedFeedback: {
        summary: sanitizeForDatabase(detailedFeedback.summary || ''),
        strengths: detailedFeedback.strengths.map((item: string) => sanitizeForDatabase(item)),
        weaknesses: detailedFeedback.weaknesses.map((item: string) => sanitizeForDatabase(item)),
        recommendations: detailedFeedback.recommendations.map((item: string) => sanitizeForDatabase(item)),
        comparisonToExample: detailedFeedback.comparisonToExample ? sanitizeForDatabase(detailedFeedback.comparisonToExample) : undefined
      },
      scoreBreakdown,
      criteria_met: assessmentData.criteria_met.map((item: string) => sanitizeForDatabase(item)),
      areas_for_improvement: assessmentData.areas_for_improvement.map((item: string) => sanitizeForDatabase(item)),
      confidence,
      processing_time_ms: processingTime,
      model_used: selectedModel
    };

    // Final sanitization check - convert the whole object to JSON and back to clean any remaining issues
    const resultJson = JSON.stringify(result);
    const cleanedJson = sanitizeForDatabase(resultJson);
    console.log('📝 Final result contains null bytes:', resultJson.includes('\u0000'));
    console.log('📝 Final result contains escaped null bytes:', resultJson.includes('\\u0000'));

    return JSON.parse(cleanedJson);

  } catch (error) {
    console.error('Assessment error:', error)

    // Return a fallback assessment
    const processingTime = Date.now() - startTime
    return {
      remark: 'Can Improve',
      feedback: 'Assessment could not be completed due to a technical error. Please try submitting again or contact support.',
      detailedFeedback: {
        summary: 'We encountered a technical error while assessing your submission. This does not reflect the quality of your work. Please try resubmitting, and if the issue persists, contact support for assistance.',
        strengths: [],
        weaknesses: ['Technical error prevented assessment'],
        recommendations: ['Please resubmit your work', 'If error persists, contact support', 'Ensure your submission meets the format requirements']
      },
      scoreBreakdown: {
        contentQuality: 0,
        completeness: 0,
        technicalAccuracy: 0,
        structure: 0
      },
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