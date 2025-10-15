import { Octokit } from '@octokit/rest';
import { safeBase64ToUtf8, sanitizeTextContent } from '../utils/sanitization';
import { withCache, CacheKeys, CacheTTL } from '../utils/cache';

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

export type ProjectType =
  | 'nextjs'
  | 'react'
  | 'vue'
  | 'angular'
  | 'nodejs-backend'
  | 'express-api'
  | 'python-web'
  | 'django'
  | 'flask'
  | 'python-data-science'
  | 'machine-learning'
  | 'mobile-react-native'
  | 'mobile-flutter'
  | 'rust'
  | 'go'
  | 'java-spring'
  | 'dotnet'
  | 'static-site'
  | 'library'
  | 'cli-tool'
  | 'unknown'

export interface FileSelectionCriteria {
  projectType: ProjectType
  assignmentKeywords: string[]
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
   * Fetch repository information using Git Tree API for complete structure
   * Cached for 1 hour to reduce API calls and improve performance
   */
  async getRepositoryInfo(owner: string, repo: string): Promise<GitHubRepoInfo> {
    // Use cache to avoid refetching same repo multiple times
    const cacheKey = CacheKeys.github(owner, repo);

    return withCache(cacheKey, async () => {
      return this._fetchRepositoryInfo(owner, repo);
    }, CacheTTL.GITHUB_REPO);
  }

  /**
   * Internal method to fetch repository information (uncached)
   */
  private async _fetchRepositoryInfo(owner: string, repo: string): Promise<GitHubRepoInfo> {
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

      // Get complete repository tree (recursive)
      const { data: tree } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: repoData.default_branch,
        recursive: 'true'
      });

      // Process files from tree
      const files = await this.processRepositoryTree(owner, repo, tree.tree);

      // Check for README
      const readme = await this.getReadmeContent(owner, repo);

      // Analyze repository structure
      const structure = this.buildTreeStructure(tree.tree);

      // Check for tests and documentation
      const hasTests = this.hasTestFiles(files);
      const hasDocumentation = this.hasDocumentation(files) || !!readme;

      return {
        owner,
        repo,
        files,
        readme,
        structure,
        languages,
        hasTests,
        hasDocumentation,
        fileCount: tree.tree.filter(item => item.type === 'blob').length,
        totalSize: tree.tree.reduce((sum, item) => sum + (item.size || 0), 0),
      };
    } catch (error) {
      console.error('Error fetching repository info:', error);
      throw new Error(`Failed to fetch repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process repository tree and fetch important files
   */
  private async processRepositoryTree(
    owner: string,
    repo: string,
    tree: any[]
  ): Promise<GitHubFile[]> {
    const files: GitHubFile[] = [];

    // Filter for important files only
    const importantFiles = tree
      .filter(item => item.type === 'blob')
      .filter(item => {
        const path = item.path || ''
        const size = item.size || 0

        // Skip large files
        if (size > 100000) return false

        // Prioritize important files
        return (
          path === 'README.md' ||
          path === 'package.json' ||
          path === 'requirements.txt' ||
          path === 'setup.py' ||
          path === 'Cargo.toml' ||
          path === 'go.mod' ||
          path === 'pom.xml' ||
          path.endsWith('.md') ||
          path.endsWith('.js') ||
          path.endsWith('.ts') ||
          path.endsWith('.jsx') ||
          path.endsWith('.tsx') ||
          path.endsWith('.py') ||
          path.endsWith('.java') ||
          path.endsWith('.go') ||
          path.endsWith('.rs') ||
          path.endsWith('.c') ||
          path.endsWith('.cpp') ||
          path.endsWith('.h') ||
          path.endsWith('.cs') ||
          path.includes('test') ||
          path.includes('spec')
        )
      })
      .slice(0, 50) // Limit to 50 most important files

    // Fetch file contents in batches
    for (let i = 0; i < importantFiles.length; i += 10) {
      const batch = importantFiles.slice(i, i + 10)
      const promises = batch.map(async (item): Promise<GitHubFile | null> => {
        try {
          const { data: fileData } = await this.octokit.rest.repos.getContent({
            owner,
            repo,
            path: item.path!
          })

          if ('content' in fileData && fileData.content) {
            const content = safeBase64ToUtf8(fileData.content)
            const file: GitHubFile = {
              path: item.path!,
              content,
              size: item.size || 0,
              type: this.getFileType(item.path!),
              language: this.detectLanguage(item.path!)
            }
            return file
          }
        } catch (error) {
          console.warn(`Failed to fetch ${item.path}:`, error)
        }
        return null
      })

      const results = await Promise.all(promises)
      files.push(...results.filter((f): f is GitHubFile => f !== null))
    }

    return files
  }

  /**
   * Build tree structure visualization from GitHub tree
   */
  private buildTreeStructure(tree: any[]): string {
    const paths = tree
      .filter(item => item.path && item.type === 'blob')
      .map(item => item.path)
      .sort()
      .slice(0, 100) // Limit to first 100 files

    const root: any = {}

    paths.forEach(path => {
      const parts = path.split('/')
      let current = root

      parts.forEach((part: string, index: number) => {
        if (!current[part]) {
          current[part] = index === parts.length - 1 ? null : {}
        }
        if (current[part] !== null) {
          current = current[part]
        }
      })
    })

    return this.renderTree(root)
  }

  /**
   * Render tree structure as ASCII art
   */
  private renderTree(node: any, prefix: string = '', isRoot: boolean = true): string {
    if (node === null) return ''

    const entries = Object.entries(node)
    let result = ''

    entries.forEach(([key, value], index) => {
      const isLast = index === entries.length - 1
      const connector = isRoot ? '' : (isLast ? '└── ' : '├── ')
      const extension = isRoot ? '' : (isLast ? '    ' : '│   ')

      result += prefix + connector + key + '\n'

      if (value !== null) {
        result += this.renderTree(value, prefix + extension, false)
      }
    })

    return result
  }

  /**
   * Process repository contents recursively (with depth limit) - DEPRECATED
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
   * Detect project type based on files and languages
   */
  private detectProjectType(repoInfo: GitHubRepoInfo): ProjectType {
    const files = repoInfo.files.map(f => f.path)
    const mainLanguage = Object.entries(repoInfo.languages).sort((a, b) => b[1] - a[1])[0]?.[0]

    // Next.js
    if (files.some(f => f === 'next.config.js' || f === 'next.config.ts' || f === 'next.config.mjs')) {
      return 'nextjs'
    }

    // React
    if (files.some(f => f === 'package.json') &&
        repoInfo.files.some(f => f.path === 'package.json' && f.content.includes('"react"'))) {
      if (files.some(f => f.includes('App.tsx') || f.includes('App.jsx'))) {
        return 'react'
      }
    }

    // Vue
    if (files.some(f => f.includes('vue.config') || f.includes('.vue'))) {
      return 'vue'
    }

    // Angular
    if (files.some(f => f === 'angular.json')) {
      return 'angular'
    }

    // React Native
    if (files.some(f => f === 'app.json') && files.some(f => f.includes('react-native'))) {
      return 'mobile-react-native'
    }

    // Flutter
    if (files.some(f => f === 'pubspec.yaml') && mainLanguage === 'Dart') {
      return 'mobile-flutter'
    }

    // Python frameworks
    if (mainLanguage === 'Python') {
      if (files.some(f => f.includes('manage.py') || f.includes('django'))) {
        return 'django'
      }
      if (files.some(f => f.includes('app.py') && repoInfo.files.some(f => f.content.includes('Flask')))) {
        return 'flask'
      }
      if (files.some(f => f.endsWith('.ipynb') || f.includes('notebook'))) {
        return 'python-data-science'
      }
      if (files.some(f => f.includes('model') || f.includes('train') || f.includes('dataset'))) {
        return 'machine-learning'
      }
      return 'python-web'
    }

    // Node.js backend
    if (mainLanguage === 'JavaScript' || mainLanguage === 'TypeScript') {
      const hasServer = files.some(f => f.includes('server') || f.includes('app.js') || f.includes('index.js'))
      const hasApi = files.some(f => f.includes('routes') || f.includes('api') || f.includes('controllers'))

      if (hasServer && hasApi) {
        if (repoInfo.files.some(f => f.content.includes('express'))) {
          return 'express-api'
        }
        return 'nodejs-backend'
      }

      // Library or CLI
      if (files.some(f => f === 'package.json')) {
        const pkgJson = repoInfo.files.find(f => f.path === 'package.json')
        if (pkgJson?.content.includes('"bin"')) {
          return 'cli-tool'
        }
        if (pkgJson?.content.includes('"main"') && !hasServer) {
          return 'library'
        }
      }
    }

    // Java Spring
    if (mainLanguage === 'Java' && files.some(f => f.includes('pom.xml') || f.includes('build.gradle'))) {
      if (repoInfo.files.some(f => f.content.includes('springframework'))) {
        return 'java-spring'
      }
    }

    // .NET
    if (mainLanguage === 'C#' && files.some(f => f.endsWith('.csproj') || f.endsWith('.sln'))) {
      return 'dotnet'
    }

    // Go
    if (mainLanguage === 'Go' && files.some(f => f === 'go.mod')) {
      return 'go'
    }

    // Rust
    if (mainLanguage === 'Rust' && files.some(f => f === 'Cargo.toml')) {
      return 'rust'
    }

    // Static site
    if (files.some(f => f === 'index.html') && !files.some(f => f.includes('server'))) {
      return 'static-site'
    }

    return 'unknown'
  }

  /**
   * Select priority files based on project type and assignment criteria
   */
  private selectPriorityFiles(
    allFiles: GitHubFile[],
    projectType: ProjectType,
    assignmentKeywords: string[] = []
  ): GitHubFile[] {
    const priorityPatterns: string[] = []
    const secondaryPatterns: string[] = []

    // Base patterns (always include)
    priorityPatterns.push('README.md', 'package.json', 'requirements.txt', 'Cargo.toml', 'go.mod', 'pom.xml')

    // Project-specific patterns
    switch (projectType) {
      case 'nextjs':
        priorityPatterns.push('next.config', 'app/layout', 'app/page', 'pages/_app', 'pages/index')
        secondaryPatterns.push('app/', 'pages/', 'components/', 'lib/', 'api/')
        break

      case 'react':
        priorityPatterns.push('App.tsx', 'App.jsx', 'index.tsx', 'index.jsx', 'main.tsx', 'main.jsx')
        secondaryPatterns.push('src/components/', 'src/pages/', 'src/hooks/', 'src/utils/')
        break

      case 'vue':
        priorityPatterns.push('vue.config', 'App.vue', 'main.js', 'main.ts')
        secondaryPatterns.push('src/components/', 'src/views/', 'src/router/')
        break

      case 'angular':
        priorityPatterns.push('angular.json', 'app.module', 'app.component')
        secondaryPatterns.push('src/app/', 'src/services/')
        break

      case 'nodejs-backend':
      case 'express-api':
        priorityPatterns.push('server.js', 'server.ts', 'app.js', 'app.ts', 'index.js', 'index.ts')
        secondaryPatterns.push('routes/', 'controllers/', 'middleware/', 'models/', 'api/')
        break

      case 'python-web':
      case 'django':
        priorityPatterns.push('manage.py', 'settings.py', 'urls.py', 'wsgi.py', 'asgi.py')
        secondaryPatterns.push('views.py', 'models.py', 'serializers.py', 'admin.py')
        break

      case 'flask':
        priorityPatterns.push('app.py', 'main.py', 'run.py', 'wsgi.py')
        secondaryPatterns.push('routes/', 'models/', 'views/')
        break

      case 'python-data-science':
      case 'machine-learning':
        priorityPatterns.push('.ipynb', 'train.py', 'model.py', 'main.py')
        secondaryPatterns.push('data/', 'models/', 'notebooks/', 'src/')
        break

      case 'mobile-react-native':
        priorityPatterns.push('App.tsx', 'App.js', 'app.json', 'index.js')
        secondaryPatterns.push('src/screens/', 'src/components/', 'src/navigation/')
        break

      case 'mobile-flutter':
        priorityPatterns.push('pubspec.yaml', 'main.dart', 'lib/main.dart')
        secondaryPatterns.push('lib/screens/', 'lib/widgets/', 'lib/models/')
        break

      case 'java-spring':
        priorityPatterns.push('Application.java', 'pom.xml', 'build.gradle', 'application.properties')
        secondaryPatterns.push('controller/', 'service/', 'repository/', 'entity/', 'model/')
        break

      case 'dotnet':
        priorityPatterns.push('Program.cs', 'Startup.cs', '.csproj', 'appsettings.json')
        secondaryPatterns.push('Controllers/', 'Models/', 'Services/')
        break

      case 'go':
        priorityPatterns.push('main.go', 'go.mod', 'go.sum')
        secondaryPatterns.push('cmd/', 'pkg/', 'internal/', 'api/')
        break

      case 'rust':
        priorityPatterns.push('Cargo.toml', 'main.rs', 'lib.rs')
        secondaryPatterns.push('src/')
        break

      case 'cli-tool':
        priorityPatterns.push('cli.js', 'cli.ts', 'bin/', 'index.js', 'index.ts')
        secondaryPatterns.push('commands/', 'lib/')
        break

      case 'library':
        priorityPatterns.push('index.js', 'index.ts', 'lib/', 'src/index')
        secondaryPatterns.push('src/', 'lib/')
        break

      case 'static-site':
        priorityPatterns.push('index.html', 'main.css', 'style.css', 'script.js')
        secondaryPatterns.push('css/', 'js/', 'assets/')
        break
    }

    // Add test files if assignment mentions testing
    if (assignmentKeywords.some(k => ['test', 'testing', 'unit', 'integration'].includes(k.toLowerCase()))) {
      secondaryPatterns.push('test/', 'tests/', '__tests__/', '.test.', '.spec.')
    }

    // Add database files if assignment mentions database
    if (assignmentKeywords.some(k => ['database', 'db', 'sql', 'model', 'schema'].includes(k.toLowerCase()))) {
      secondaryPatterns.push('models/', 'entities/', 'schema/', 'migrations/', 'database/')
    }

    // Add API files if assignment mentions API
    if (assignmentKeywords.some(k => ['api', 'endpoint', 'rest', 'graphql'].includes(k.toLowerCase()))) {
      secondaryPatterns.push('api/', 'routes/', 'controllers/', 'endpoints/')
    }

    // Score and rank files
    const scoredFiles = allFiles.map(file => {
      let score = 0

      // Priority pattern match = 100 points
      if (priorityPatterns.some(pattern => file.path.includes(pattern))) {
        score += 100
      }

      // Secondary pattern match = 50 points
      if (secondaryPatterns.some(pattern => file.path.toLowerCase().includes(pattern.toLowerCase()))) {
        score += 50
      }

      // Config files = 30 points
      if (file.path.includes('config') || file.path.includes('.env.example')) {
        score += 30
      }

      // Test files = 20 points (unless testing is priority)
      if (file.path.includes('test') || file.path.includes('spec')) {
        score += assignmentKeywords.some(k => k.toLowerCase().includes('test')) ? 60 : 20
      }

      // Documentation = 15 points
      if (file.path.endsWith('.md') && file.path !== 'README.md') {
        score += 15
      }

      return { file, score }
    })

    // Sort by score and return top files
    return scoredFiles
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // Limit to top 10 files
      .map(item => item.file)
  }

  /**
   * Generate comprehensive repository summary for LLM analysis
   * Optimized to stay within token limits (~4000 tokens max)
   * Now with adaptive file selection based on project type
   */
  generateRepoSummary(repoInfo: GitHubRepoInfo, assignmentKeywords: string[] = []): string {
    // Detect project type
    const projectType = this.detectProjectType(repoInfo)

    let summary = `# Repository: ${repoInfo.owner}/${repoInfo.repo}\n\n`

    // Project type detection
    summary += `## Project Type: ${projectType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}\n\n`

    // Quality indicators first (most important)
    summary += `## Quality Overview\n`
    summary += `- Total Files: ${repoInfo.fileCount}\n`
    summary += `- Files Analyzed: ${repoInfo.files.length}\n`
    summary += `- Has README: ${repoInfo.readme ? 'Yes' : 'No'}\n`
    summary += `- Has Tests: ${repoInfo.hasTests ? 'Yes' : 'No'}\n`
    summary += `- Has Documentation: ${repoInfo.hasDocumentation ? 'Yes' : 'No'}\n`
    summary += `- Repository Size: ${(repoInfo.totalSize / 1024).toFixed(2)} KB\n\n`

    // Languages
    const languageEntries = Object.entries(repoInfo.languages).sort((a, b) => b[1] - a[1]).slice(0, 5)
    if (languageEntries.length > 0) {
      summary += `## Languages\n`
      languageEntries.forEach(([lang, bytes]) => {
        const percentage = ((bytes / (repoInfo.totalSize || 1)) * 100).toFixed(1)
        summary += `- ${lang}: ${percentage}%\n`
      })
      summary += '\n'
    }

    // README (truncated to 800 chars)
    if (repoInfo.readme) {
      summary += `## README\n${repoInfo.readme.slice(0, 800)}${repoInfo.readme.length > 800 ? '\n...[truncated]' : ''}\n\n`
    }

    // File structure (truncated)
    const structureLines = repoInfo.structure.split('\n').slice(0, 30)
    summary += `## File Structure (sample)\n\`\`\`\n${structureLines.join('\n')}\n${structureLines.length < repoInfo.structure.split('\n').length ? '...[truncated]\n' : ''}\`\`\`\n\n`

    // Use adaptive file selection based on project type and assignment keywords
    const priorityFiles = this.selectPriorityFiles(repoInfo.files, projectType, assignmentKeywords)

    if (priorityFiles.length > 0) {
      summary += `## Priority Files (${priorityFiles.length} shown - selected based on project type)\n\n`
      priorityFiles.forEach(file => {
        if (file.content && file.language) {
          summary += `### ${file.path}\n`
          summary += `\`\`\`${file.type}\n`
          const content = file.content.slice(0, 400)
          summary += content
          if (file.content.length > 400) {
            summary += '\n...[truncated]'
          }
          summary += '\n\`\`\`\n\n'
        }
      })
    }

    // Additional file list (just names)
    const otherFiles = repoInfo.files.filter(f => !priorityFiles.includes(f)).slice(0, 15)
    if (otherFiles.length > 0) {
      summary += `## Other Files Analyzed\n`
      otherFiles.forEach(f => summary += `- ${f.path} (${f.language || f.type})\n`)
      if (repoInfo.files.length > priorityFiles.length + otherFiles.length) {
        summary += `... and ${repoInfo.files.length - priorityFiles.length - otherFiles.length} more files\n`
      }
      summary += '\n'
    }

    return summary
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