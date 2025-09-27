'use server'

import { githubService } from '@/lib/services/github-service'

type TestResult = {
  success: boolean
  data?: any
  error?: string
}

/**
 * Test GitHub URL validation (server action)
 */
export async function testGitHubUrl(url: string): Promise<TestResult> {
  try {
    console.log('🔍 Server: Testing GitHub URL:', url)

    if (!url.trim()) {
      return { success: false, error: 'URL is required' }
    }

    // Step 1: Validate URL format
    const isValid = githubService.isValidGitHubUrl(url)
    if (!isValid) {
      return { 
        success: false, 
        error: 'Invalid GitHub URL format. Expected: https://github.com/owner/repo' 
      }
    }

    // Step 2: Parse URL
    const parsed = githubService.parseGitHubUrl(url)
    if (!parsed) {
      return { 
        success: false, 
        error: 'Could not parse GitHub URL components' 
      }
    }

    console.log('✅ Server: URL parsed successfully:', parsed)

    return {
      success: true,
      data: {
        valid: true,
        parsed,
        message: 'GitHub URL validation successful'
      }
    }

  } catch (error) {
    console.error('❌ Server: GitHub URL test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Test full GitHub repository analysis (server action)
 */
export async function testGitHubRepository(url: string): Promise<TestResult> {
  try {
    console.log('🔍 Server: Testing GitHub repository analysis:', url)

    // First validate URL
    const urlTest = await testGitHubUrl(url)
    if (!urlTest.success) {
      return urlTest
    }

    // Try full repository analysis
    const analysis = await githubService.assessRepository(url)
    console.log('✅ Server: Repository analysis completed:', {
      fileCount: analysis.repoInfo.fileCount,
      hasReadme: analysis.codeQuality.hasReadme,
      hasTests: analysis.codeQuality.hasTests,
      mainLanguage: analysis.codeQuality.mainLanguage
    })

    return {
      success: true,
      data: {
        valid: true,
        parsed: urlTest.data?.parsed,
        analysis,
        message: 'Repository analysis completed successfully'
      }
    }

  } catch (error) {
    console.error('❌ Server: Repository analysis failed:', error)
    
    // Still return the URL validation as successful if that part worked
    const urlTest = await testGitHubUrl(url)
    
    return {
      success: urlTest.success, // URL might be valid even if analysis fails
      data: {
        ...urlTest.data,
        analysisError: error instanceof Error ? error.message : 'Unknown error'
      },
      error: urlTest.success 
        ? `Repository analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        : urlTest.error
    }
  }
}

/**
 * Test the complete GitHub submission flow (server action)
 */
export async function testGitHubSubmissionFlow(
  url: string,
  courseName: string = 'Data Structures & Algorithms',
  questionNumber: number = 1
): Promise<TestResult> {
  try {
    console.log('🔍 Server: Testing complete GitHub submission flow:', { url, courseName, questionNumber })

    // Import submission action
    const { submitAssessment } = await import('./submission-actions')

    // Test the complete submission flow
    const result = await submitAssessment(
      courseName,
      questionNumber,
      'github_repo',
      url
    )

    if (result.success) {
      console.log('✅ Server: GitHub submission flow completed successfully:', result.submissionId)
      return {
        success: true,
        data: {
          submissionId: result.submissionId,
          message: 'GitHub submission and assessment completed successfully',
          resultsUrl: `/results/${result.submissionId}`
        }
      }
    } else {
      console.error('❌ Server: GitHub submission flow failed:', result.error)
      return {
        success: false,
        error: result.error || 'GitHub submission failed'
      }
    }

  } catch (error) {
    console.error('❌ Server: GitHub submission flow error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in submission flow'
    }
  }
}