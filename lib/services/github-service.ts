import { Octokit } from '@octokit/rest';
import { safeBase64ToUtf8, sanitizeTextContent } from '../utils/sanitization';

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  files: GitHubFile[];
  readme?: string;
  structure: string;
  languages: Record<string, number>;
  hasTests: boolean;
  hasDocumentation: boolean;
  fileCount: number;
  totalSize: number;
}

export interface GitHubFile {
  path: string;
  content: string;
  size: number;
  type: string;
  language?: string;
}

export interface GitHubAssessmentData {
  repoInfo: GitHubRepoInfo;
  codeQuality: {
    hasReadme: boolean;
    hasTests: boolean;
    hasDocumentation: boolean;
    mainLanguage: string;
    complexity: 'low' | 'medium' | 'high';
  };
  structure: {
    organized: boolean;
    hasProperStructure: boolean;
    fileTypes: string[];
  };
}

export class GitHubService {
  private octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN, // Optional for public repos
    });
  }

  /**
   * Parse GitHub URL and extract owner/repo
   */
  parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/,
      /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace(/\.git$/, ''),
        };
      }
    }

    return null;
  }

  /**
   * Validate if URL is a proper GitHub repository
   */
  isValidGitHubUrl(url: string): boolean {
    return this.parseGitHubUrl(url) !== null;
  }

  /**
   * Fetch repository information
   */
  async getRepositoryInfo(owner: string, repo: string): Promise<GitHubRepoInfo> {
    try {
      // Get repository basic info
      const { data: repoData } = await this.octokit.rest.repos.get({
        owner,
        repo,
      });

      // Get repository languages
      const { data: languages } = await this.octokit.rest.repos.listLanguages({
        owner,
        repo,
      });

      // Get repository contents
      const { data: contents } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path: '',
      });

      // Process files
      const files = await this.processRepositoryContents(owner, repo, contents);
      
      // Check for README
      const readme = await this.getReadmeContent(owner, repo);

      // Analyze repository structure
      const structure = this.analyzeStructure(files);
      
      // Check for tests and documentation
      const hasTests = this.hasTestFiles(files);
      const hasDocumentation = this.hasDocumentation(files) || !!readme;

      return {
        owner,
        repo,
        files: files.slice(0, 20), // Limit to first 20 files for performance
        readme,
        structure,
        languages,
        hasTests,
        hasDocumentation,
        fileCount: files.length,
        totalSize: files.reduce((sum, file) => sum + file.size, 0),
      };
    } catch (error) {
      console.error('Error fetching repository info:', error);
      throw new Error(`Failed to fetch repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process repository contents recursively (with depth limit)
   */
  private async processRepositoryContents(
    owner: string,
    repo: string,
    contents: any,
    depth = 0,
    maxDepth = 3
  ): Promise<GitHubFile[]> {
    const files: GitHubFile[] = [];

    if (depth > maxDepth || !Array.isArray(contents)) {
      return files;
    }

    for (const item of contents) {
      if (item.type === 'file' && item.size < 100000) { // Skip files larger than 100KB
        try {
          const { data: fileData } = await this.octokit.rest.repos.getContent({
            owner,
            repo,
            path: item.path,
          });

          if ('content' in fileData && fileData.content) {
            const content = safeBase64ToUtf8(fileData.content);
            files.push({
              path: item.path,
              content,
              size: item.size,
              type: this.getFileType(item.path),
              language: this.detectLanguage(item.path),
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch file ${item.path}:`, error);
        }
      } else if (item.type === 'dir' && depth < maxDepth) {
        try {
          const { data: dirContents } = await this.octokit.rest.repos.getContent({
            owner,
            repo,
            path: item.path,
          });
          const subFiles = await this.processRepositoryContents(
            owner,
            repo,
            dirContents,
            depth + 1,
            maxDepth
          );
          files.push(...subFiles);
        } catch (error) {
          console.warn(`Failed to fetch directory ${item.path}:`, error);
        }
      }
    }

    return files;
  }

  /**
   * Get README content
   */
  private async getReadmeContent(owner: string, repo: string): Promise<string | undefined> {
    const readmeFiles = ['README.md', 'README.txt', 'README.rst', 'README'];
    
    for (const filename of readmeFiles) {
      try {
        const { data } = await this.octokit.rest.repos.getContent({
          owner,
          repo,
          path: filename,
        });

        if ('content' in data && data.content) {
          return safeBase64ToUtf8(data.content);
        }
      } catch (error) {
        // File doesn't exist, try next
        continue;
      }
    }

    return undefined;
  }

  /**
   * Analyze repository structure
   */
  private analyzeStructure(files: GitHubFile[]): string {
    const paths = files.map(f => f.path);
    const directories = new Set<string>();
    
    paths.forEach(path => {
      const parts = path.split('/');
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join('/'));
      }
    });

    const structure = Array.from(directories)
      .sort()
      .slice(0, 10) // Limit structure output
      .join('\n');

    return structure || 'Flat structure (no subdirectories)';
  }

  /**
   * Check for test files
   */
  private hasTestFiles(files: GitHubFile[]): boolean {
    const testPatterns = [
      /test/i,
      /spec/i,
      /__tests__/i,
      /\.test\./i,
      /\.spec\./i,
    ];

    return files.some(file => 
      testPatterns.some(pattern => pattern.test(file.path))
    );
  }

  /**
   * Check for documentation
   */
  private hasDocumentation(files: GitHubFile[]): boolean {
    const docPatterns = [
      /docs?\//i,
      /documentation/i,
      /\.md$/i,
      /\.rst$/i,
      /\.txt$/i,
    ];

    return files.some(file => 
      docPatterns.some(pattern => pattern.test(file.path)) &&
      !file.path.toLowerCase().includes('readme')
    );
  }

  /**
   * Get file type based on extension
   */
  private getFileType(path: string): string {
    const extension = path.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      rb: 'ruby',
      php: 'php',
      go: 'go',
      rs: 'rust',
      md: 'markdown',
      txt: 'text',
      json: 'json',
      xml: 'xml',
      yml: 'yaml',
      yaml: 'yaml',
    };

    return typeMap[extension || ''] || 'unknown';
  }

  /**
   * Detect programming language from file extension
   */
  private detectLanguage(path: string): string | undefined {
    const extension = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: 'JavaScript',
      ts: 'TypeScript',
      py: 'Python',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      cs: 'C#',
      rb: 'Ruby',
      php: 'PHP',
      go: 'Go',
      rs: 'Rust',
    };

    return languageMap[extension || ''];
  }

  /**
   * Assess repository and return detailed analysis
   */
  async assessRepository(url: string): Promise<GitHubAssessmentData> {
    const parsed = this.parseGitHubUrl(url);
    if (!parsed) {
      throw new Error('Invalid GitHub URL');
    }

    const repoInfo = await this.getRepositoryInfo(parsed.owner, parsed.repo);
    
    // Determine main language
    const languages = Object.entries(repoInfo.languages);
    const mainLanguage = languages.length > 0 
      ? languages.reduce((a, b) => a[1] > b[1] ? a : b)[0]
      : 'Unknown';

    // Assess complexity based on file count and structure
    const complexity = repoInfo.fileCount > 50 ? 'high' : 
                      repoInfo.fileCount > 10 ? 'medium' : 'low';

    // Check if structure is organized
    const hasProperStructure = repoInfo.structure.includes('/') && 
                               (repoInfo.hasTests || repoInfo.hasDocumentation);

    return {
      repoInfo,
      codeQuality: {
        hasReadme: !!repoInfo.readme,
        hasTests: repoInfo.hasTests,
        hasDocumentation: repoInfo.hasDocumentation,
        mainLanguage,
        complexity,
      },
      structure: {
        organized: hasProperStructure,
        hasProperStructure,
        fileTypes: [...new Set(repoInfo.files.map(f => f.type))],
      },
    };
  }
}

// Export singleton instance
export const githubService = new GitHubService();