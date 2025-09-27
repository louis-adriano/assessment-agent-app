'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { assessmentService } from '@/lib/services/assessment-service'
import { githubService, GitHubAssessmentData } from '@/lib/services/github-service'
import { AssessmentResult } from '@/lib/services/llm-service'
import { BaseExample } from '@prisma/client'
import { z } from 'zod'

// Assessment request schema
const assessmentRequestSchema = z.object({
  submissionId: z.string().uuid(),
})

type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Assess a submission and update the database
 */
export async function assessSubmission(submissionId: string): Promise<ActionResult<AssessmentResult>> {
  try {
    // Get submission with question and base examples
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        question: {
          include: {
            baseExamples: true,
            course: true,
          },
        },
      },
    })

    if (!submission) {
      return { success: false, error: 'Submission not found' }
    }

    let assessmentResult: AssessmentResult
    let githubData: GitHubAssessmentData | undefined

    // Handle GitHub repository submissions differently
    if (submission.question.submissionType === 'github_repo') {
      const githubResult = await assessGitHubSubmission(
        submission.submissionContent,
        submission.question.baseExamples,
        submission.question
      )
      assessmentResult = githubResult.assessment
      githubData = githubResult.githubData
    } else {
      // Use regular assessment service for other types
      assessmentResult = await assessmentService.assessSubmission({
        questionId: submission.questionId,
        content: submission.submissionContent,
        submissionType: submission.question.submissionType,
      })
    }

    // Update submission with assessment results
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        assessmentResult: {
          remark: assessmentResult.remark,
          feedback: assessmentResult.feedback,
          criteria_met: assessmentResult.criteria_met,
          areas_for_improvement: assessmentResult.areas_for_improvement,
          confidence: assessmentResult.confidence,
          processing_time_ms: assessmentResult.processing_time_ms,
          model_used: assessmentResult.model_used,
          // Store GitHub data in metadata if available
          ...(githubData && {
            metadata: {
              github: githubData,
            },
          }),
        },
      },
    })

    revalidatePath(`/results/${submissionId}`)
    return { success: true, data: assessmentResult }
  } catch (error) {
    console.error('Assessment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Assessment failed',
    }
  }
}

/**
 * Assess GitHub repository submission with specialized logic
 */
async function assessGitHubSubmission(
  repoUrl: string,
  baseExamples: BaseExample[],
  question: any
): Promise<{ assessment: AssessmentResult; githubData: GitHubAssessmentData }> {
  try {
    // Validate GitHub URL
    if (!githubService.isValidGitHubUrl(repoUrl)) {
      throw new Error('Invalid GitHub repository URL')
    }

    // Get repository analysis
    const githubData = await githubService.assessRepository(repoUrl)

    // Create specialized prompt for GitHub assessment
    const githubPrompt = createGitHubAssessmentPrompt(githubData, baseExamples, question)

    // Get assessment from LLM service with GitHub-specific prompt
    const assessment = await assessmentService.assessSubmission({
      questionId: question.id,
      content: githubPrompt,
      submissionType: 'github_repo',
    })

    // Enhance feedback with GitHub-specific insights
    const enhancedFeedback = enhanceGitHubFeedback(assessment.feedback, githubData)

    return {
      assessment: {
        ...assessment,
        feedback: enhancedFeedback,
      },
      githubData,
    }
  } catch (error) {
    console.error('GitHub assessment error:', error)
    
    // Return fallback assessment for GitHub errors
    return {
      assessment: {
        remark: 'Needs Improvement',
        feedback: `Unable to analyze repository: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure the repository is public and accessible.`,
        criteria_met: [],
        areas_for_improvement: ['Repository accessibility', 'URL validation'],
        confidence: 0.1,
        processing_time_ms: 0,
        model_used: 'github-service',
      },
      githubData: {
        repoInfo: {
          owner: '',
          repo: '',
          files: [],
          structure: '',
          languages: {},
          hasTests: false,
          hasDocumentation: false,
          fileCount: 0,
          totalSize: 0,
        },
        codeQuality: {
          hasReadme: false,
          hasTests: false,
          hasDocumentation: false,
          mainLanguage: 'Unknown',
          complexity: 'low',
        },
        structure: {
          organized: false,
          hasProperStructure: false,
          fileTypes: [],
        },
      },
    }
  }
}

/**
 * Create specialized assessment prompt for GitHub repositories
 */
function createGitHubAssessmentPrompt(
  githubData: GitHubAssessmentData,
  baseExamples: BaseExample[],
  question: any
): string {
  const { repoInfo, codeQuality, structure } = githubData

  // Build comprehensive prompt with repository analysis
  let prompt = `
GITHUB REPOSITORY ASSESSMENT

Repository Analysis:
- Owner/Repo: ${repoInfo.owner}/${repoInfo.repo}
- Main Language: ${codeQuality.mainLanguage}
- File Count: ${repoInfo.fileCount}
- Total Size: ${repoInfo.totalSize} bytes
- Complexity: ${codeQuality.complexity}

Code Quality Indicators:
- Has README: ${codeQuality.hasReadme ? 'Yes' : 'No'}
- Has Tests: ${codeQuality.hasTests ? 'Yes' : 'No'}
- Has Documentation: ${codeQuality.hasDocumentation ? 'Yes' : 'No'}
- Organized Structure: ${structure.organized ? 'Yes' : 'No'}

Repository Structure:
${repoInfo.structure}

File Types Found: ${structure.fileTypes.join(', ')}

Main Files Content (first 5 files):
${repoInfo.files.slice(0, 5).map(file => 
  `${file.path} (${file.type}):\n${file.content.slice(0, 500)}...\n`
).join('\n')}

${repoInfo.readme ? `README Content:\n${repoInfo.readme.slice(0, 1000)}...` : 'No README found'}

Question Requirements:
${question.description}

Assessment Criteria:
${question.criteria || 'Standard code quality, functionality, and documentation assessment'}

${baseExamples.length > 0 ? `
Base Examples for Comparison:
${baseExamples.map((example: BaseExample) => `
Example: ${example.title}
Content: ${example.content.slice(0, 500)}...
`).join('\n')}
` : ''}

Please assess this GitHub repository against the question requirements and provide structured feedback.
  `

  return prompt
}

/**
 * Enhance feedback with GitHub-specific insights
 */
function enhanceGitHubFeedback(
  originalFeedback: string,
  githubData: GitHubAssessmentData
): string {
  const { codeQuality, structure, repoInfo } = githubData

  let enhancements: string[] = []

  // Add specific GitHub insights
  if (!codeQuality.hasReadme) {
    enhancements.push('Consider adding a comprehensive README.md file to explain the project.')
  }

  if (!codeQuality.hasTests) {
    enhancements.push('Adding unit tests would improve code reliability and maintainability.')
  }

  if (!structure.organized) {
    enhancements.push('Organizing code into logical directories would improve project structure.')
  }

  if (repoInfo.fileCount > 50 && codeQuality.complexity === 'high') {
    enhancements.push('For a project of this size, consider adding better documentation and code organization.')
  }

  // Combine original feedback with GitHub-specific insights
  const enhancedFeedback = [
    originalFeedback,
    ...(enhancements.length > 0 ? [
      '\nGitHub-specific recommendations:',
      ...enhancements.map(e => `• ${e}`)
    ] : [])
  ].join('\n')

  return enhancedFeedback
}

/**
 * Get assessment results for a submission
 */
export async function getAssessmentResults(submissionId: string): Promise<ActionResult> {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        question: {
          include: {
            course: true,
          },
        },
      },
    })

    if (!submission) {
      return { success: false, error: 'Submission not found' }
    }

    return { success: true, data: submission }
  } catch (error) {
    console.error('Error getting assessment results:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get results',
    }
  }
}