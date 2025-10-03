import { NextRequest, NextResponse } from 'next/server'
import { githubService } from '@/lib/services/github-service'

export async function POST(request: NextRequest) {
  try {
    const { repoUrl } = await request.json()

    if (!repoUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required' },
        { status: 400 }
      )
    }

    // Parse GitHub URL
    const parsed = githubService.parseGitHubUrl(repoUrl)
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL' },
        { status: 400 }
      )
    }

    // Fetch repository information
    const repoInfo = await githubService.getRepositoryInfo(parsed.owner, parsed.repo)

    // Generate summary with adaptive file selection (using empty keywords for now)
    const summary = githubService.generateRepoSummary(repoInfo, [])

    return NextResponse.json({
      success: true,
      analysis: {
        ...repoInfo,
        summary,
        // Extract project type from summary for easier testing
        projectType: summary.match(/\*\*Project Type:\*\* (.+)/)?.[1] || 'unknown'
      }
    })
  } catch (error) {
    console.error('GitHub analysis API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze repository' },
      { status: 500 }
    )
  }
}
