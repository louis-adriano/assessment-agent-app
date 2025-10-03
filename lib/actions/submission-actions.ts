// lib/actions/submission-actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { processAnonymousAssessment } from '@/lib/services/assessment-service'
import { githubService } from '@/lib/services/github-service'
import { getCourseByName } from './lookup-actions'
import { sanitizeObject, sanitizeTextContent } from '@/lib/utils/sanitization'
// import { SubmissionType, SubmissionStatus } from '@prisma/client'

// Enhanced validation schema with GitHub URL support
const submissionSchema = z.object({
  courseName: z.string().min(1, 'Course name is required'),
  questionNumber: z.number().min(1, 'Question number must be positive'),
  submissionType: z.enum(['TEXT', 'DOCUMENT', 'GITHUB_REPO', 'SCREENSHOT', 'WEBSITE']),
  content: z.string().min(1, 'Submission content is required'),
  additionalInfo: z.string().optional(),
}).refine((data) => {
  // Enhanced GitHub URL validation
  if (data.submissionType === 'GITHUB_REPO') {
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
  if (data.submissionType === 'WEBSITE') {
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
    if (question.submissionType === 'GITHUB_REPO') {
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
      
    // Sanitize content early to prevent null bytes and other problematic characters
    content = sanitizeTextContent(content);
    console.log('🧹 Content sanitized for database safety');
    }

    // Combine content and additional info, then sanitize everything
    const finalContent = additionalInfo 
      ? `${content}\n\nAdditional Notes:\n${additionalInfo}`
      : content;
    
    const sanitizedContent = sanitizeTextContent(finalContent);

    // Create submission record
    const submission = await prisma.submission.create({
      data: {
        questionId: question.id,
        userId: null, // Anonymous submission
        submissionContent: sanitizedContent,
        status: 'PROCESSING',
        assessmentResult: undefined, // Will be updated after assessment
      },
    });

    console.log('📝 Submission created:', submission.id);

    // Perform assessment
    let assessmentResult;
    
    try {
      if (question.submissionType === 'GITHUB_REPO') {
        console.log('🔍 Starting GitHub assessment...');
        // Use specialized GitHub assessment
        assessmentResult = await assessGitHubRepository(content, question, submission.id);
        console.log('✅ GitHub assessment completed');
      } else {
        console.log('🔍 Starting regular assessment...');
        // Use regular assessment service
        assessmentResult = await processAnonymousAssessment({
          submissionId: submission.id,
          questionId: question.id,
          submissionContent: finalContent,
          question: question,
        });
        console.log('✅ Regular assessment completed');
      }

      // Final sanitization pass before database storage using comprehensive utility
      const sanitizedAssessmentResult = sanitizeObject(assessmentResult);

      console.log('🛡️ Final assessment result sanitized');

      // Update submission with assessment results
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: 'COMPLETED',
          assessmentResult: sanitizedAssessmentResult as any,
          processedAt: new Date(),
        },
      });

      console.log('✅ Assessment saved to database');

    } catch (assessmentError) {
      console.error('❌ Assessment failed:', assessmentError);
      
      const errorMessage = assessmentError instanceof Error ? assessmentError.message : 'Unknown error';
      const sanitizedErrorMessage = sanitizeTextContent(errorMessage);
      
      // Update submission with error result
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: 'FAILED',
          assessmentResult: {
            remark: 'Needs Improvement',
            feedback: `Assessment failed: ${sanitizedErrorMessage}`,
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
 * Specialized GitHub repository assessment with comprehensive code analysis
 */
async function assessGitHubRepository(repoUrl: string, question: any, submissionId: string) {
  console.log('🔍 Assessing GitHub repository:', repoUrl);

  try {
    // Parse GitHub URL
    const parsed = githubService.parseGitHubUrl(repoUrl);
    if (!parsed) {
      throw new Error('Invalid GitHub URL');
    }

    // Fetch complete repository information
    const repoInfo = await githubService.getRepositoryInfo(parsed.owner, parsed.repo);
    console.log('📊 Repository fetched:', {
      fileCount: repoInfo.fileCount,
      filesAnalyzed: repoInfo.files.length,
      hasReadme: !!repoInfo.readme,
      hasTests: repoInfo.hasTests,
      totalSize: repoInfo.totalSize
    });

    // Extract keywords from question for adaptive file selection
    const assignmentKeywords = [
      ...question.title.toLowerCase().split(' '),
      ...question.description.toLowerCase().split(' '),
      ...(question.criteria || []).flatMap((c: string) => c.toLowerCase().split(' '))
    ].filter(word => word.length > 3) // Filter out short words

    // Generate comprehensive repository summary for LLM with adaptive file selection
    const repoSummary = githubService.generateRepoSummary(repoInfo, assignmentKeywords);

    // Create enhanced prompt for GitHub assessment
    const githubPrompt = `
You are assessing a GitHub repository submission for the following assignment:

${question.title}

${question.description}

${question.criteria && question.criteria.length > 0 ? `
GRADING CRITERIA:
${question.criteria.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}
` : ''}

${question.redFlags && question.redFlags.length > 0 ? `
RED FLAGS TO CHECK:
${question.redFlags.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}
` : ''}

---

STUDENT'S REPOSITORY SUBMISSION:

${repoSummary}

---

Please provide a comprehensive assessment of this GitHub repository focusing on:
1. Code quality and adherence to best practices
2. Project structure and organization
3. Documentation (README, comments, API docs)
4. Testing coverage and quality
5. Whether it meets the assignment requirements
6. Overall completeness and professionalism

Provide specific examples from the code when pointing out strengths or areas for improvement.
    `;

    // Get AI assessment with GitHub-specific prompt
    const assessment = await processAnonymousAssessment({
      submissionId: submissionId,
      questionId: question.id,
      submissionContent: githubPrompt,
      question: question,
    });

    // Enhance feedback with GitHub-specific insights
    const mainLanguage = Object.entries(repoInfo.languages).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'
    const enhancedFeedback = `${assessment.feedback}

---

**Repository Analysis Summary:**
- **Repository:** ${parsed.owner}/${parsed.repo}
- **Main Language:** ${mainLanguage}
- **Files Analyzed:** ${repoInfo.files.length} (out of ${repoInfo.fileCount} total)
- **README:** ${repoInfo.readme ? '✓ Present' : '✗ Missing'}
- **Tests:** ${repoInfo.hasTests ? '✓ Found' : '✗ Not detected'}
- **Documentation:** ${repoInfo.hasDocumentation ? '✓ Present' : '✗ Limited'}
- **Repository Size:** ${(repoInfo.totalSize / 1024).toFixed(2)} KB`;

    return {
      ...assessment,
      feedback: enhancedFeedback,
      metadata: {
        github: {
          owner: parsed.owner,
          repo: parsed.repo,
          fileCount: repoInfo.fileCount,
          filesAnalyzed: repoInfo.files.length,
          mainLanguage,
          hasReadme: !!repoInfo.readme,
          hasTests: repoInfo.hasTests,
          hasDocumentation: repoInfo.hasDocumentation,
          languages: repoInfo.languages
        },
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
 * Get assessment results for anonymous submissions
 */
export async function getAnonymousSubmissionResult(submissionId: string) {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        question: {
          include: {
            course: {
              select: {
                name: true,
                id: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!submission) {
      return null;
    }

    return submission;
  } catch (error) {
    console.error('Error getting anonymous submission result:', error);
    return null;
  }
}

/**
 * Alternative submission function for simple text/form submissions
 */
export async function submitAnonymousAssessment(formData: FormData): Promise<ActionResult> {
  const courseName = formData.get('courseName') as string;
  const assessmentNumber = parseInt(formData.get('assessmentNumber') as string);
  const submissionContent = formData.get('submissionContent') as string;

  console.log('📝 submitAnonymousAssessment called with:', { courseName, assessmentNumber, contentLength: submissionContent?.length });

  // First get the question to determine the correct submission type
  const courseResult = await getCourseByName(courseName);
  console.log('📊 Course lookup result:', { success: courseResult.success, hasData: !!courseResult.data, error: courseResult.error });

  if (!courseResult.success || !courseResult.data) {
    return { success: false, error: courseResult.error || `Course "${courseName}" not found` };
  }

  if (!courseResult.data.questions || !Array.isArray(courseResult.data.questions)) {
    console.error('❌ No questions found in course data:', courseResult.data);
    return { success: false, error: `No questions found in course "${courseName}"` };
  }

  const question = courseResult.data.questions.find(
    (q: any) => q.questionNumber === assessmentNumber
  );

  if (!question) {
    console.error('❌ Question not found:', { assessmentNumber, availableQuestions: courseResult.data.questions.map((q: any) => q.questionNumber) });
    return { success: false, error: `Assessment #${assessmentNumber} not found` };
  }

  console.log('✅ Found question:', { id: question.id, submissionType: question.submissionType });

  return await submitAssessment(
    courseName,
    assessmentNumber,
    question.submissionType, // Use the actual submission type from the question
    submissionContent
  );
}