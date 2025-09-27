import { Octokit } from '@octokit/rest';

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  files: GitHubFile[];
  readme?: string;
  structure: string;
  languages: Record<string, number>;
}

export interface GitHubFile {
  path: string;
  content: string;
  size: number;
  type: string;
}

export class GitHubService {
  private octokit: Octokit;

  constructor() {
    // GitHub token is optional for public repos but recommended for rate limits
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  /**
   * Parse GitHub URL and extract owner/repo
   */
  parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/,
      /github\.com\/([^\/]+)\/([^\/]+)$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace(/\.git$/, '')
        };
      }
    }

    return null;
  }

  /**
   * Fetch repository information including files and structure
   */
  async analyzeRepository(url: string): Promise<GitHubRepoInfo> {
    const parsed = this.parseGitHubUrl(url);
    if (!parsed) {
      throw new Error('Invalid GitHub URL format');
    }

    const { owner, repo } = parsed;

    try {
      // Get repository info
      const repoInfo = await this.octokit.rest.repos.get({
        owner,
        repo,
      });

      // Get repository contents (tree)
      const tree = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: repoInfo.data.default_branch || 'main',
        recursive: 'true',
      });

      // Get languages
      const languages = await this.octokit.rest.repos.listLanguages({
        owner,
        repo,
      });

      // Get important files
      const files = await this.getImportantFiles(owner, repo, tree.data.tree);
      
      // Get README
      const readme = await this.getReadme(owner, repo);

      // Generate structure overview
      const structure = this.generateStructureOverview(tree.data.tree);

      return {
        owner,
        repo,
        files,
        readme,
        structure,
        languages: languages.data,
      };
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error('Repository not found or is private');
      }
      if (error.status === 403) {
        throw new Error('Repository access forbidden or rate limit exceeded');
      }
      throw new Error(`Failed to analyze repository: ${error.message}`);
    }
  }

  /**
   * Get important files from the repository
   */
  private async getImportantFiles(
    owner: string,
    repo: string,
    tree: any[]
  ): Promise<GitHubFile[]> {
    const importantExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go'];
    const importantFiles = ['package.json', 'requirements.txt', 'Dockerfile', '.gitignore', 'README.md'];
    
    const filesToFetch = tree
      .filter(item => item.type === 'blob')
      .filter(item => {
        const extension = item.path.split('.').pop();
        return importantExtensions.some(ext => item.path.endsWith(ext)) || 
               importantFiles.some(file => item.path.endsWith(file));
      })
      .slice(0, 20); // Limit to first 20 important files

    const files: GitHubFile[] = [];

    for (const file of filesToFetch) {
      try {
        const content = await this.octokit.rest.repos.getContent({
          owner,
          repo,
          path: file.path,
        });

        if ('content' in content.data && content.data.content) {
          const decodedContent = Buffer.from(content.data.content, 'base64').toString('utf-8');
          files.push({
            path: file.path,
            content: decodedContent,
            size: file.size || 0,
            type: file.path.split('.').pop() || 'unknown',
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch file ${file.path}:`, error);
      }
    }

    return files;
  }

  /**
   * Get README content
   */
  private async getReadme(owner: string, repo: string): Promise<string | undefined> {
    const readmeFiles = ['README.md', 'readme.md', 'README.txt', 'README'];
    
    for (const filename of readmeFiles) {
      try {
        const content = await this.octokit.rest.repos.getContent({
          owner,
          repo,
          path: filename,
        });

        if ('content' in content.data && content.data.content) {
          return Buffer.from(content.data.content, 'base64').toString('utf-8');
        }
      } catch (error) {
        // Continue to next README variation
      }
    }

    return undefined;
  }

  /**
   * Generate a structure overview of the repository
   */
  private generateStructureOverview(tree: any[]): string {
    const structure = tree
      .filter(item => item.type === 'tree' || item.path.includes('.'))
      .map(item => `${item.type === 'tree' ? '📁' : '📄'} ${item.path}`)
      .slice(0, 50) // Limit for readability
      .join('\n');

    return structure;
  }

  /**
   * Analyze code quality metrics
   */
  analyzeCodeQuality(files: GitHubFile[]): {
    hasReadme: boolean;
    hasTests: boolean;
    hasDocumentation: boolean;
    codeLineCount: number;
    fileCount: number;
    languageDistribution: Record<string, number>;
  } {
    const hasReadme = files.some(f => f.path.toLowerCase().includes('readme'));
    const hasTests = files.some(f => 
      f.path.includes('test') || 
      f.path.includes('spec') || 
      f.content.includes('test(') ||
      f.content.includes('describe(')
    );
    const hasDocumentation = files.some(f => 
      f.path.includes('.md') || 
      f.content.includes('/**') ||
      f.content.includes('"""')
    );

    const codeLineCount = files.reduce((total, file) => {
      return total + file.content.split('\n').filter(line => line.trim().length > 0).length;
    }, 0);

    const languageDistribution: Record<string, number> = {};
    files.forEach(file => {
      const extension = file.type;
      languageDistribution[extension] = (languageDistribution[extension] || 0) + 1;
    });

    return {
      hasReadme,
      hasTests,
      hasDocumentation,
      codeLineCount,
      fileCount: files.length,
      languageDistribution,
    };
  }
}

export const githubService = new GitHubService();