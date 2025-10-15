// lib/actions/submission-actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { processAssessment } from '@/lib/services/assessment-service'
import { githubService } from '@/lib/services/github-service'
import { documentService } from '@/lib/services/document-service'
import { websiteService } from '@/lib/services/website-service'
import { screenshotService } from '@/lib/services/screenshot-service'
import { getCourseByName } from './lookup-actions'
import { sanitizeObject, sanitizeTextContent } from '@/lib/utils/sanitization'
import { auth } from '@/lib/auth/config'
import { retryWithBackoff, withTimeout, logError, createErrorResponse, categorizeError } from '@/lib/utils/error-handling'
// Rate limiting for file uploads only (not submissions - those are unlimited for learning)
import { checkRateLimit, RateLimits, getRateLimitKey } from '@/lib/utils/rate-limit'
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
    // Require authentication
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return { success: false, error: 'You must be logged in to submit an assessment' };
    }

    const userId = session.user.id;
    console.log('📝 Starting submission:', { courseName, questionNumber, submissionType, contentLength: content.length, userId });

    // NOTE: Submissions are UNLIMITED to support iterative learning
    // Rate limiting only applied to file uploads to prevent storage abuse

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

    // Check assessment mode
    const assessmentMode = question.assessmentMode || 'AI_ONLY';

    // Validate submission type matches question
    if (question.submissionType !== submissionType) {
      return {
        success: false,
        error: `Question expects ${question.submissionType} submission, but received ${submissionType}`
      };
    }

    // For GitHub repos, validate URL AND check if repo exists before creating submission
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

      // Try to parse the URL
      const parsed = githubService.parseGitHubUrl(cleanUrl);
      if (!parsed) {
        return {
          success: false,
          error: 'Could not parse GitHub repository URL. Please check the format.'
        };
      }
      console.log('✅ GitHub URL parsed:', parsed);

      // PRE-VALIDATION: Check if repository exists and is accessible (with retry and timeout)
      try {
        console.log('🔍 Checking if repository exists and is accessible...');

        // Wrap with retry logic and 30-second timeout
        await retryWithBackoff(
          () => withTimeout(
            githubService.getRepositoryInfo(parsed.owner, parsed.repo),
            30000, // 30 second timeout
            `GitHub repository check timed out for ${parsed.owner}/${parsed.repo}`
          ),
          {
            maxRetries: 2,
            initialDelayMs: 2000,
            shouldRetry: (error) => {
              // Only retry on network errors, not on 404
              return error.retryable && error.category !== 'EXTERNAL_API';
            },
          }
        );

        console.log('✅ Repository exists and is accessible');
      } catch (error) {
        const appError = logError('GitHub repo validation', error, {
          owner: parsed.owner,
          repo: parsed.repo,
        });

        return createErrorResponse(error);
      }

      // Update content with the cleaned URL
      content = cleanUrl;
    }

    // For Websites, validate URL AND check if site is accessible before creating submission
    if (question.submissionType === 'WEBSITE') {
      console.log('🔍 Validating website URL:', content);

      // Clean up the URL
      let cleanUrl = content.trim();
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = `https://${cleanUrl}`;
      }

      // Validate URL format
      if (!websiteService.isValidUrl(cleanUrl)) {
        return {
          success: false,
          error: 'Invalid website URL. Please provide a valid URL (e.g., https://example.com).'
        };
      }

      // PRE-VALIDATION: Check if website is accessible (with retry and timeout)
      try {
        console.log('🔍 Checking if website is accessible...');

        const websiteInfo = await retryWithBackoff(
          () => withTimeout(
            websiteService.testWebsite(cleanUrl),
            20000, // 20 second timeout
            `Website accessibility check timed out for ${cleanUrl}`
          ),
          {
            maxRetries: 2,
            initialDelayMs: 1000,
          }
        );

        if (!websiteInfo.isAccessible) {
          return {
            success: false,
            error: `Website is not accessible (Status: ${websiteInfo.statusCode || 'Unknown'}). Please check the URL or ensure the website is online.`,
          };
        }

        console.log('✅ Website is accessible');
      } catch (error) {
        const appError = logError('Website validation', error, { url: cleanUrl });
        return createErrorResponse(error);
      }

      // Update content with the cleaned URL
      content = cleanUrl;
    }

    // Sanitize content early to prevent null bytes and other problematic characters
    content = sanitizeTextContent(content);
    console.log('🧹 Content sanitized for database safety');

    // Combine content and additional info, then sanitize everything
    const finalContent = additionalInfo 
      ? `${content}\n\nAdditional Notes:\n${additionalInfo}`
      : content;
    
    const sanitizedContent = sanitizeTextContent(finalContent);

    // Create submission record with appropriate initial status based on assessment mode
    const initialStatus = assessmentMode === 'MANUAL_ONLY' ? 'PENDING' : 'PROCESSING';

    const submission = await prisma.submission.create({
      data: {
        questionId: question.id,
        userId: userId,
        submissionContent: sanitizedContent,
        status: initialStatus,
        assessmentResult: undefined, // Will be updated after assessment (for AI modes)
      },
    });

    console.log('📝 Submission created:', submission.id, 'Mode:', assessmentMode, 'Status:', initialStatus);

    // For MANUAL_ONLY mode, skip AI processing entirely
    if (assessmentMode === 'MANUAL_ONLY') {
      console.log('📋 Manual review mode - skipping AI assessment');
      revalidatePath(`/courses/${courseName}`);
      revalidatePath('/my-submissions');
      revalidatePath('/admin/submissions');
      
      return {
        success: true,
        submissionId: submission.id,
        data: {
          submissionId: submission.id,
          message: 'Submission received! Your work will be reviewed by an instructor.',
          mode: 'manual'
        }
      };
    }

    // Perform AI assessment for AI_ONLY and BOTH modes
    let assessmentResult;
    
    try {
      // All assessments wrapped with 120-second timeout
      if (question.submissionType === 'GITHUB_REPO') {
        console.log('🔍 Starting GitHub assessment...');
        assessmentResult = await withTimeout(
          assessGitHubRepository(content, question, submission.id),
          120000, // 2 minutes
          'GitHub assessment timed out'
        );
        console.log('✅ GitHub assessment completed');
      } else if (question.submissionType === 'DOCUMENT') {
        console.log('📄 Starting document assessment...');
        assessmentResult = await withTimeout(
          assessDocument(content, question, submission.id),
          120000,
          'Document assessment timed out'
        );
        console.log('✅ Document assessment completed');
      } else if (question.submissionType === 'WEBSITE') {
        console.log('🌐 Starting website assessment...');
        assessmentResult = await withTimeout(
          assessWebsite(content, question, submission.id),
          120000,
          'Website assessment timed out'
        );
        console.log('✅ Website assessment completed');
      } else if (question.submissionType === 'SCREENSHOT') {
        console.log('📸 Starting screenshot assessment...');
        assessmentResult = await withTimeout(
          assessScreenshot(content, question, submission.id),
          120000,
          'Screenshot assessment timed out'
        );
        console.log('✅ Screenshot assessment completed');
      } else {
        console.log('🔍 Starting regular assessment...');
        // Don't use processAssessment - it creates duplicate submissions
        // Instead, call the LLM service directly
        const { assessSubmission } = await import('@/lib/services/llm-service');

        assessmentResult = await withTimeout(
          assessSubmission({
            submissionContent: finalContent,
            submissionType: question.submissionType as any,
            questionTitle: question.title,
            questionDescription: question.description,
            assessmentPrompt: question.assessmentPrompt || undefined,
            criteria: question.criteria,
            redFlags: question.redFlags,
            conditionalChecks: question.conditionalChecks,
            baseExampleContent: question.baseExamples[0]?.content,
            baseExampleMetadata: question.baseExamples[0]?.metadata
          }),
          120000,
          'Assessment timed out'
        );
        console.log('✅ Regular assessment completed');
      }

      // Final sanitization pass before database storage using comprehensive utility
      const sanitizedAssessmentResult = sanitizeObject(assessmentResult);

      console.log('🛡️ Final assessment result sanitized');

      // Update submission with assessment results
      // For BOTH mode, keep as PENDING since manual review is still needed
      // For AI_ONLY mode, mark as COMPLETED
      const finalStatus = assessmentMode === 'BOTH' ? 'PENDING' : 'COMPLETED';

      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: finalStatus,
          assessmentResult: sanitizedAssessmentResult as any,
          processedAt: new Date(),
        },
      });

      console.log(`✅ Submission status set to ${finalStatus} (mode: ${assessmentMode})`);

      console.log('✅ Assessment saved to database');

    } catch (assessmentError) {
      const appError = logError('AI Assessment', assessmentError, {
        submissionId: submission.id,
        questionId: question.id,
        submissionType: question.submissionType,
      });

      const sanitizedErrorMessage = sanitizeTextContent(appError.userMessage);

      // Update submission with error result
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: 'FAILED',
          assessmentResult: {
            remark: 'Needs Improvement',
            feedback: `Assessment failed: ${sanitizedErrorMessage}. ${appError.retryable ? 'Please try again.' : 'Please contact support if the issue persists.'}`,
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
    revalidatePath(`/courses/${courseName}`);
    revalidatePath('/my-submissions');
    revalidatePath('/admin/submissions');

    // Return appropriate message based on assessment mode (don't include assessment result - it's in the database)
    const responseData: any = {
      submissionId: submission.id
    };

    if (assessmentMode === 'BOTH') {
      responseData.message = 'AI assessment complete! Your submission will also be reviewed by an instructor.';
      responseData.mode = 'both';
    } else {
      responseData.message = 'AI assessment complete!';
      responseData.mode = 'ai';
    }

    return {
      success: true,
      submissionId: submission.id,
      data: responseData
    };

  } catch (error) {
    logError('Submission', error, { courseName, questionNumber, submissionType });
    return createErrorResponse(error);
  }
}

/**
 * Helper to get userId from submissionId
 */
async function getUserIdFromSubmission(submissionId: string): Promise<string> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { userId: true }
  });
  if (!submission?.userId) {
    throw new Error('Submission not found or has no user');
  }
  return submission.userId;
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
    // Don't use processAssessment - it creates duplicate submissions
    const { assessSubmission } = await import('@/lib/services/llm-service');

    const assessment = await assessSubmission({
      submissionContent: githubPrompt,
      submissionType: 'TEXT', // Process as text since we've extracted repo info
      questionTitle: question.title,
      questionDescription: question.description,
      assessmentPrompt: question.assessmentPrompt || undefined,
      criteria: question.criteria,
      redFlags: question.redFlags,
      conditionalChecks: question.conditionalChecks,
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
 * Specialized document assessment with text extraction and comparison
 */
async function assessDocument(fileUrlOrContent: string, question: any, submissionId: string) {
  console.log('📄 Assessing document submission...');

  try {
    let documentContent: string;
    let documentMetadata: any;

    // Check if it's a Vercel Blob URL or direct content
    if (fileUrlOrContent.startsWith('http')) {
      // It's a file URL - fetch and process it
      console.log('📥 Fetching document from URL:', fileUrlOrContent);

      try {
        const documentInfo = await documentService.processDocumentFromUrl(fileUrlOrContent);
        documentContent = documentInfo.content;
        documentMetadata = documentInfo.metadata;

        console.log('📊 Document processed:', {
          wordCount: documentMetadata.wordCount,
          pageCount: documentMetadata.pageCount,
          fileType: documentMetadata.fileType
        });
      } catch (error) {
        console.warn('⚠️ Could not fetch document from URL, treating as text content');
        documentContent = fileUrlOrContent;
        documentMetadata = null;
      }
    } else {
      // It's direct text content
      documentContent = fileUrlOrContent;
      documentMetadata = {
        wordCount: documentService['countWords'](documentContent),
        pageCount: documentService['estimatePageCount'](documentContent),
        fileType: 'text/plain'
      };
    }

    // Create enhanced prompt for document assessment
    const documentPrompt = `
You are assessing a document submission for the following assignment:

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

STUDENT'S DOCUMENT SUBMISSION:

${documentMetadata ? `
Document Metadata:
- Word Count: ${documentMetadata.wordCount} words
- Estimated Pages: ${documentMetadata.pageCount || 'N/A'}
- File Type: ${documentMetadata.fileType}

` : ''}

Document Content:
${documentContent.substring(0, 8000)}${documentContent.length > 8000 ? '\n\n[Content truncated for length...]' : ''}

---

Please provide a comprehensive assessment of this document focusing on:
1. Content quality and depth
2. Structure and organization
3. Writing clarity and professionalism
4. Whether it meets the assignment requirements
5. Adherence to any word count or formatting requirements

${question.baseExamples && question.baseExamples.length > 0 ? `
Compare this submission with the following base example characteristics:
${question.baseExamples[0].description || 'Reference standard provided'}
` : ''}

Provide specific feedback on strengths and areas for improvement.
    `;

    // Get AI assessment with document-specific prompt
    // Don't use processAssessment - it creates duplicate submissions
    const { assessSubmission } = await import('@/lib/services/llm-service');

    const assessment = await assessSubmission({
      submissionContent: documentPrompt,
      submissionType: 'TEXT', // Process as text since we've extracted content
      questionTitle: question.title,
      questionDescription: question.description,
      assessmentPrompt: question.assessmentPrompt || undefined,
      criteria: question.criteria,
      redFlags: question.redFlags,
      conditionalChecks: question.conditionalChecks,
    });

    // Enhance feedback with document-specific insights
    const enhancedFeedback = documentMetadata ? `${assessment.feedback}

---

**Document Analysis Summary:**
- **Word Count:** ${documentMetadata.wordCount} words
- **Estimated Pages:** ${documentMetadata.pageCount || 'N/A'}
- **File Type:** ${documentMetadata.fileType}
- **Content Length:** ${documentContent.length > 5000 ? 'Comprehensive' : documentContent.length > 2000 ? 'Moderate' : 'Brief'}` : assessment.feedback;

    return {
      ...assessment,
      feedback: enhancedFeedback,
      metadata: {
        document: documentMetadata,
        contentLength: documentContent.length,
        processingMethod: fileUrlOrContent.startsWith('http') ? 'url-fetch' : 'direct-content'
      }
    };

  } catch (error) {
    console.error('❌ Document assessment failed:', error);

    // Return fallback assessment for document errors
    return {
      remark: 'Needs Improvement',
      feedback: `Document assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure the document is accessible and in a supported format (PDF, DOCX, TXT).`,
      criteria_met: [],
      areas_for_improvement: ['Document accessibility', 'Format validation'],
      confidence: 0.1,
      processing_time_ms: 0,
      model_used: 'document-fallback',
    };
  }
}

/**
 * Specialized website assessment with accessibility and functionality testing
 */
async function assessWebsite(websiteUrl: string, question: any, submissionId: string) {
  console.log('🌐 Assessing website submission...');

  try {
    // Test website accessibility and functionality
    const assessmentData = await websiteService.assessWebsite(websiteUrl);
    const websiteSummary = websiteService.generateWebsiteSummary(assessmentData);

    console.log('📊 Website tested:', {
      url: assessmentData.websiteInfo.url,
      accessible: assessmentData.websiteInfo.isAccessible,
      issues: assessmentData.issues.length,
      strengths: assessmentData.strengths.length
    });

    // Create enhanced prompt for website assessment
    const websitePrompt = `
You are assessing a website submission for the following assignment:

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

STUDENT'S WEBSITE SUBMISSION:

${websiteSummary}

---

Please provide a comprehensive assessment of this website focusing on:
1. Accessibility and functionality
2. Design and user experience
3. Technical implementation (HTTPS, performance, metadata)
4. Whether it meets the assignment requirements
5. Overall professionalism and completeness

Provide specific feedback based on the technical analysis above.
    `;

    // Get AI assessment
    // Don't use processAssessment - it creates duplicate submissions
    const { assessSubmission } = await import('@/lib/services/llm-service');

    const assessment = await assessSubmission({
      submissionContent: websitePrompt,
      submissionType: 'TEXT',
      questionTitle: question.title,
      questionDescription: question.description,
      assessmentPrompt: question.assessmentPrompt || undefined,
      criteria: question.criteria,
      redFlags: question.redFlags,
      conditionalChecks: question.conditionalChecks,
    });

    // Enhance feedback with website-specific insights
    const enhancedFeedback = `${assessment.feedback}

---

**Website Assessment Summary:**
- **URL:** ${assessmentData.websiteInfo.url}
- **Accessibility:** ${assessmentData.websiteInfo.isAccessible ? '✓ Accessible' : '✗ Not Accessible'}
- **Protocol:** ${assessmentData.websiteInfo.metadata?.hasHttps ? 'HTTPS ✓' : 'HTTP'}
- **Response Time:** ${assessmentData.websiteInfo.responseTime ? `${assessmentData.websiteInfo.responseTime}ms` : 'N/A'}
- **Issues Found:** ${assessmentData.issues.length}
- **Strengths:** ${assessmentData.strengths.length}`;

    return {
      ...assessment,
      feedback: enhancedFeedback,
      metadata: {
        website: assessmentData.websiteInfo,
        issues: assessmentData.issues,
        strengths: assessmentData.strengths,
        recommendations: assessmentData.recommendations,
      }
    };

  } catch (error) {
    console.error('❌ Website assessment failed:', error);

    return {
      remark: 'Needs Improvement',
      feedback: `Website assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure the website URL is valid and publicly accessible.`,
      criteria_met: [],
      areas_for_improvement: ['Website accessibility', 'URL validation'],
      confidence: 0.1,
      processing_time_ms: 0,
      model_used: 'website-fallback',
    };
  }
}

/**
 * Specialized screenshot assessment with visual analysis
 */
async function assessScreenshot(screenshotUrlOrDescription: string, question: any, submissionId: string) {
  console.log('📸 Assessing screenshot submission...');

  try {
    let screenshotInfo = null;
    let isImageUrl = false;

    // Check if it's an image URL
    if (screenshotUrlOrDescription.startsWith('http')) {
      isImageUrl = screenshotService.isImageUrl(screenshotUrlOrDescription);

      if (isImageUrl) {
        try {
          // Try to process as screenshot URL
          screenshotInfo = await screenshotService.processScreenshotFromUrl(
            screenshotUrlOrDescription,
            { submissionId }
          );
          console.log('📊 Screenshot processed:', {
            url: screenshotInfo.imageUrl,
            size: screenshotInfo.metadata.fileSize,
            dimensions: `${screenshotInfo.metadata.width}x${screenshotInfo.metadata.height}`
          });
        } catch (error) {
          console.warn('⚠️ Could not process image URL, treating as description');
        }
      }
    }

    // Create assessment prompt
    const screenshotPrompt = `
You are assessing a screenshot/visual submission for the following assignment:

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

STUDENT'S SCREENSHOT SUBMISSION:

${screenshotInfo ? `
Screenshot Details:
- Image URL: ${screenshotInfo.imageUrl}
- Dimensions: ${screenshotInfo.metadata.width}x${screenshotInfo.metadata.height}
- File Size: ${(screenshotInfo.metadata.fileSize / 1024).toFixed(2)} KB
- Format: ${screenshotInfo.metadata.fileType}
` : `
Screenshot Description/URL:
${screenshotUrlOrDescription}
`}

---

Please provide a comprehensive assessment of this visual submission focusing on:
1. Visual design and aesthetics
2. Layout and composition
3. Whether it demonstrates the required functionality
4. Adherence to design principles
5. Overall quality and professionalism

${!screenshotInfo ? 'Note: The submission is a URL or description. Assess based on the provided information.' : 'Note: Analyze based on the screenshot metadata and description provided.'}
    `;

    // Get AI assessment
    // Don't use processAssessment - it creates duplicate submissions
    const { assessSubmission } = await import('@/lib/services/llm-service');

    const assessment = await assessSubmission({
      submissionContent: screenshotPrompt,
      submissionType: 'TEXT',
      questionTitle: question.title,
      questionDescription: question.description,
      assessmentPrompt: question.assessmentPrompt || undefined,
      criteria: question.criteria,
      redFlags: question.redFlags,
      conditionalChecks: question.conditionalChecks,
    });

    // Enhance feedback
    const enhancedFeedback = screenshotInfo ? `${assessment.feedback}

---

**Screenshot Analysis:**
- **Image URL:** [View Screenshot](${screenshotInfo.imageUrl})
- **Dimensions:** ${screenshotInfo.metadata.width}x${screenshotInfo.metadata.height}
- **File Size:** ${(screenshotInfo.metadata.fileSize / 1024).toFixed(2)} KB
- **Format:** ${screenshotInfo.metadata.fileType}` : assessment.feedback;

    return {
      ...assessment,
      feedback: enhancedFeedback,
      metadata: {
        screenshot: screenshotInfo,
        isImageUrl,
      }
    };

  } catch (error) {
    console.error('❌ Screenshot assessment failed:', error);

    return {
      remark: 'Needs Improvement',
      feedback: `Screenshot assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure you provide a valid image URL or detailed description.`,
      criteria_met: [],
      areas_for_improvement: ['Screenshot accessibility', 'Format validation'],
      confidence: 0.1,
      processing_time_ms: 0,
      model_used: 'screenshot-fallback',
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