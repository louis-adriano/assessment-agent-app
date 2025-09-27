'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { assessmentService } from '@/lib/services/assessment-service'
import { githubService } from '@/lib/services/github-service'

// Enhanced validation schema with GitHub URL support
const submissionSchema = z.object({
  courseName: z.string().min(1, 'Course name is required'),
  questionNumber: z.number().min(1, 'Question number must be positive'),
  submissionType: z.enum(['document', 'github_repo', 'screenshot', 'text', 'website']),
  content: z.string().min(1, 'Submission content is required'),
  additionalInfo: z.string().optional(),
}).refine((data) => {
  // Enhanced GitHub URL validation
  if (data.submissionType === 'github_repo') {
    if (!data.content.trim()) {
      return false;
    }
    
    // More flexible GitHub URL patterns
    const githubPatterns = [
      /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?.*$/,
      /^github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?.*$/
    ];
    
    const url = data.content.trim();
    const isValidPattern = githubPatterns.some(pattern => pattern.test(url));
    
    // Also check using GitHub service
    const hasGithubInUrl = url.toLowerCase().includes('github.com');
    
    return isValidPattern || hasGithubInUrl;
  }
  
  // URL validation for website submissions
  if (data.submissionType === 'website') {
    try {
      new URL(data.content.startsWith('http') ? data.content : `https://${data.content}`);
      return true;
    } catch {
      return false;
    }
  }
  
  return true;
}, {
  message: 'Invalid URL format for the selected submission type',
  path: ['content']
});

type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
  submissionId?: string
}

/**
 * Submit assessment with enhanced GitHub support
 */
export async function submitAssessment(
  courseName: string,
  questionNumber: number,
  submissionType: string,
  content: string,
  additionalInfo?: string
): Promise<ActionResult> {
  try {
    console.log('📝 Starting submission:', { courseName, questionNumber, submissionType, contentLength: content.length });

    // Validate input with enhanced schema
    const validation = submissionSchema.safeParse({
      courseName,
      questionNumber,
      submissionType,
      content,
      additionalInfo,
    });

    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || 'Validation failed';
      console.error('❌ Validation failed:', validation.error.errors);
      return { success: false, error: errorMessage };
    }

    // Find course by name
    const course = await prisma.course.findFirst({
      where: { 
        name: {
          equals: courseName,
          mode: 'insensitive'
        }
      }
    });

    if (!course) {
      return { success: false, error: `Course "${courseName}" not found` };
    }

    // Find question by course and number
    const question = await prisma.question.findFirst({
      where: {
        courseId: course.id,
        questionNumber: questionNumber,
      },
      include: {
        baseExamples: true,
        course: true,
      }
    });

    if (!question) {
      return { success: false, error: `Question ${questionNumber} not found in course "${courseName}"` };
    }

    // Validate submission type matches question
    if (question.submissionType !== submissionType) {
      return { 
        success: false, 
        error: `Question expects ${question.submissionType} submission, but received ${submissionType}` 
      };
    }

    // For GitHub repos, validate URL before creating submission
    if (submissionType === 'github_repo') {
      console.log('🔍 Validating GitHub URL:', content);
      
      // Clean up the URL
      let cleanUrl = content.trim();
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = `https://${cleanUrl}`;
      }
      
      // Enhanced GitHub URL validation
      if (!githubService.isValidGitHubUrl(cleanUrl)) {
        return { 
          success: false, 
          error: 'Invalid GitHub repository URL. Please provide a valid GitHub repository link.' 
        };
      }
      
      // Try to parse the URL to ensure it's accessible
      try {
        const parsed = githubService.parseGitHubUrl(cleanUrl);
        if (!parsed) {
          return { 
            success: false, 
            error: 'Could not parse GitHub repository URL. Please check the format.' 
          };
        }
        console.log('✅ GitHub URL parsed successfully:', parsed);
      } catch (error) {
        console.error('❌ GitHub URL parsing failed:', error);
        return { 
          success: false, 
          error: 'Failed to validate GitHub repository URL.' 
        };
      }
      
      // Update content with cleaned URL
      content = cleanUrl;
    }

    // Create submission record
    const submission = await prisma.submission.create({
      data: {
        questionId: question.id,
        userId: null, // Anonymous submission
        submissionType: submissionType as any,
        submissionContent: content,
        additionalInfo,
        assessmentResult: null, // Will be updated after assessment
      },
    });

    console.log('📝 Submission created:', submission.id);

    // Perform assessment
    let assessmentResult;
    
    try {
      if (submissionType === 'github_repo') {
        console.log('🔍 Starting GitHub assessment...');
        // Use specialized GitHub assessment
        assessmentResult = await assessGitHubRepository(content, question);
        console.log('✅ GitHub assessment completed');
      } else {
        console.log('🔍 Starting regular assessment...');
        // Use regular assessment service
        assessmentResult = await assessmentService.assessSubmission({
          questionId: question.id,
          content: content,
          submissionType: submissionType as any,
        });
        console.log('✅ Regular assessment completed');
      }

      // Update submission with assessment results
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          assessmentResult: assessmentResult,
        },
      });

      console.log('✅ Assessment saved to database');

    } catch (assessmentError) {
      console.error('❌ Assessment failed:', assessmentError);
      
      // Update submission with error result
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          assessmentResult: {
            remark: 'Needs Improvement',
            feedback: `Assessment failed: ${assessmentError instanceof Error ? assessmentError.message : 'Unknown error'}`,
            criteria_met: [],
            areas_for_improvement: ['Submission processing'],
            confidence: 0.1,
            processing_time_ms: 0,
            model_used: 'error-handler',
          },
        },
      });
    }

    revalidatePath(`/results/${submission.id}`);
    return { 
      success: true, 
      submissionId: submission.id,
      data: { submissionId: submission.id }
    };

  } catch (error) {
    console.error('❌ Submission error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit assessment',
    };
  }
}

/**
 * Specialized GitHub repository assessment
 */
async function assessGitHubRepository(repoUrl: string, question: any) {
  console.log('🔍 Assessing GitHub repository:', repoUrl);
  
  try {
    // Get repository analysis from GitHub service
    const repoAnalysis = await githubService.assessRepository(repoUrl);
    console.log('📊 Repository analysis completed:', {
      fileCount: repoAnalysis.repoInfo.fileCount,
      hasReadme: repoAnalysis.codeQuality.hasReadme,
      hasTests: repoAnalysis.codeQuality.hasTests,
      mainLanguage: repoAnalysis.codeQuality.mainLanguage
    });

    // Create enhanced prompt for GitHub assessment
    const githubPrompt = `
GITHUB REPOSITORY ASSESSMENT

Repository URL: ${repoUrl}
Owner/Repo: ${repoAnalysis.repoInfo.owner}/${repoAnalysis.repoInfo.repo}

CODE QUALITY ANALYSIS:
- Main Language: ${repoAnalysis.codeQuality.mainLanguage}
- File Count: ${repoAnalysis.repoInfo.fileCount}
- Has README: ${repoAnalysis.codeQuality.hasReadme ? 'Yes' : 'No'}
- Has Tests: ${repoAnalysis.codeQuality.hasTests ? 'Yes' : 'No'}
- Has Documentation: ${repoAnalysis.codeQuality.hasDocumentation ? 'Yes' : 'No'}
- Complexity: ${repoAnalysis.codeQuality.complexity}

REPOSITORY STRUCTURE:
${repoAnalysis.repoInfo.structure}

SAMPLE FILES:
${repoAnalysis.repoInfo.files.slice(0, 3).map(file => 
  `${file.path} (${file.type}):\n${file.content.slice(0, 300)}...\n`
).join('\n')}

${repoAnalysis.repoInfo.readme ? `README CONTENT:\n${repoAnalysis.repoInfo.readme.slice(0, 500)}...` : 'No README found'}

QUESTION REQUIREMENTS:
${question.description || 'Assess the code quality, structure, and documentation of this repository.'}

Please assess this GitHub repository and provide structured feedback focusing on code quality, organization, and best practices.
    `;

    // Get AI assessment with GitHub-specific prompt
    const assessment = await assessmentService.assessSubmission({
      questionId: question.id,
      content: githubPrompt,
      submissionType: 'github_repo',
    });

    // Enhance feedback with GitHub-specific insights
    const enhancedFeedback = `${assessment.feedback}

GitHub Analysis Summary:
• Repository has ${repoAnalysis.repoInfo.fileCount} files in ${repoAnalysis.codeQuality.mainLanguage}
• Code organization: ${repoAnalysis.structure.organized ? 'Well organized' : 'Could be improved'}
• Documentation: ${repoAnalysis.codeQuality.hasReadme ? 'README present' : 'Missing README'}
• Testing: ${repoAnalysis.codeQuality.hasTests ? 'Tests found' : 'No tests detected'}`;

    return {
      ...assessment,
      feedback: enhancedFeedback,
      metadata: {
        github: repoAnalysis,
        repoUrl: repoUrl,
      }
    };

  } catch (error) {
    console.error('❌ GitHub assessment failed:', error);
    
    // Return fallback assessment for GitHub errors
    return {
      remark: 'Needs Improvement',
      feedback: `GitHub repository assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure the repository is public and accessible.`,
      criteria_met: [],
      areas_for_improvement: ['Repository accessibility', 'URL validation'],
      confidence: 0.1,
      processing_time_ms: 0,
      model_used: 'github-fallback',
    };
  }
}

/**
 * Get assessment results for a submission
 */
export async function getSubmissionResults(submissionId: string): Promise<ActionResult> {
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
    });

    if (!submission) {
      return { success: false, error: 'Submission not found' };
    }

    return { success: true, data: submission };
  } catch (error) {
    console.error('Error getting submission results:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get results',
    };
  }
}