import { NextRequest, NextResponse } from 'next/server';
import { githubService } from '@/lib/services/github-service';
import { validateGitHubUrl } from '@/lib/utils/github-validation';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'GitHub URL is required' },
        { status: 400 }
      );
    }

    // Validate GitHub URL first
    const validation = validateGitHubUrl(url);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    console.log('Testing GitHub URL:', url);

    // Analyze the repository
    const analysisResult = await githubService.assessRepository(url);
    const { repoInfo, codeQuality } = analysisResult;

    console.log('Analysis complete:', {
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      fileCount: repoInfo.files.length,
      hasReadme: !!repoInfo.readme
    });

    return NextResponse.json({
      success: true,
      repoInfo: {
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        languages: repoInfo.languages,
        structure: repoInfo.structure,
        readme: repoInfo.readme,
        files: repoInfo.files.map(file => ({
          path: file.path,
          content: file.content,
          size: file.size,
          type: file.type
        }))
      },
      codeQuality
    });

  } catch (error: any) {
    console.error('GitHub test error:', error);
    
    let errorMessage = 'Failed to analyze repository';
    
    if (error.message.includes('not found')) {
      errorMessage = 'Repository not found or is private';
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'GitHub API rate limit exceeded. Please try again later.';
    } else if (error.message.includes('forbidden')) {
      errorMessage = 'Access forbidden. Repository may be private.';
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}