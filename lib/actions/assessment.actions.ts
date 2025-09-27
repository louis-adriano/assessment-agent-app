import { Course, Question, BaseExample, Submission } from '@prisma/client';
import { assessSubmission as llmAssessSubmission } from '@/lib/services/llm-service';
import { githubService, GitHubRepoInfo } from '@/lib/services/github-service';

export interface AssessmentResult {
  remark: 'Excellent' | 'Good' | 'Can Improve' | 'Needs Improvement';
  feedback: string;
  detailedAssessment?: any;
}

export interface CriteriaAnalysis {
  criterion: string;
  status: 'Met' | 'Partially Met' | 'Not Met';
  details: string;
}

export interface GitHubAssessmentData {
  repoInfo: GitHubRepoInfo;
  codeQuality: any;
  submission: {
    submissionType: string;
    submissionUrl: string;
    questionId: string;
  };
}

// Simple LLM Service wrapper
class LLMService {
  async assessSubmission(prompt: string) {
    return await llmAssessSubmission({ prompt } as any);
  }
}

export class AssessmentService {
  constructor(private llmService: LLMService) {}

  async assessSubmission(
    submissionContent: string,
    submissionType: string,
    question: Question & { baseExamples: BaseExample[], course: Course | null }
  ): Promise<AssessmentResult> {
    try {
      switch (submissionType) {
        case 'text':
          return this.assessTextSubmission(submissionContent, question);
        
        case 'document':
          return this.assessDocumentSubmission(submissionContent, question);
        
        case 'github_repo':
          return this.assessGitHubRepository(submissionContent, question, question.course!);
        
        case 'website':
          return this.assessWebsiteSubmission(submissionContent, question);
        
        case 'screenshot':
          return this.assessScreenshotSubmission(submissionContent, question);
        
        default:
          throw new Error(`Unsupported submission type: ${submissionType}`);
      }
    } catch (error: any) {
      console.error('Assessment error:', error);
      return {
        remark: 'Needs Improvement',
        feedback: `Assessment failed: ${error.message}`,
      };
    }
  }

  async assessGitHubRepository(
    submissionUrl: string,
    question: Question & { baseExamples: BaseExample[] },
    course: Course
  ): Promise<AssessmentResult> {
    try {
      // Analyze the repository
      const repoInfo = await githubService.analyzeRepository(submissionUrl);
      const codeQuality = githubService.analyzeCodeQuality(repoInfo.files);

      // Find base example for comparison
      const baseExample = question.baseExamples.find(
        example => example.title.toLowerCase().includes('github') || example.content.toLowerCase().includes('github')
      );

      // Create assessment prompt
      const prompt = this.createGitHubAssessmentPrompt(
        repoInfo,
        codeQuality,
        question,
        baseExample
      );

      // Get AI assessment
      const aiResponse = await this.llmService.assessSubmission(prompt);

      // Store detailed assessment data
      const assessmentData: GitHubAssessmentData = {
        repoInfo,
        codeQuality,
        submission: {
          submissionType: 'github_repo',
          submissionUrl,
          questionId: question.id,
        },
      };

      return {
        remark: this.parseRemark(aiResponse.remark),
        feedback: aiResponse.feedback,
        detailedAssessment: assessmentData,
      };
    } catch (error: any) {
      console.error('GitHub assessment error:', error);
      return {
        remark: 'Needs Improvement',
        feedback: `Unable to assess repository: ${error.message}. Please check that the repository is public and accessible.`,
        detailedAssessment: null,
      };
    }
  }

  private createGitHubAssessmentPrompt(
    repoInfo: GitHubRepoInfo,
    codeQuality: any,
    question: Question,
    baseExample?: BaseExample
  ): string {
    const baseExampleSection = baseExample ? `
BASE EXAMPLE FOR COMPARISON:
Perfect Answer: ${baseExample.description}
Expected Code Structure: ${baseExample.content}
Key Requirements: Example requirements
` : '';

    return `
ASSESSMENT TASK: Evaluate GitHub Repository Submission

COURSE: Course Information
QUESTION: ${question.title}
REQUIREMENTS: ${question.description}
ASSESSMENT CRITERIA: ${question.assessmentPrompt}

${baseExampleSection}

REPOSITORY ANALYSIS:
Repository: ${repoInfo.owner}/${repoInfo.repo}
Languages: ${JSON.stringify(repoInfo.languages, null, 2)}

CODE QUALITY METRICS:
- Has README: ${codeQuality.hasReadme ? 'Yes' : 'No'}
- Has Tests: ${codeQuality.hasTests ? 'Yes' : 'No'}
- Has Documentation: ${codeQuality.hasDocumentation ? 'Yes' : 'No'}
- Total Lines of Code: ${codeQuality.codeLineCount}
- Number of Files: ${codeQuality.fileCount}
- Language Distribution: ${JSON.stringify(codeQuality.languageDistribution)}

REPOSITORY STRUCTURE:
${repoInfo.structure}

README CONTENT:
${repoInfo.readme || 'No README found'}

KEY CODE FILES:
${repoInfo.files.slice(0, 5).map((file: any) => `
File: ${file.path}
Content Preview (first 500 chars):
${file.content.substring(0, 500)}
${file.content.length > 500 ? '...' : ''}
`).join('\n')}

ASSESSMENT REQUIREMENTS:
1. Code functionality and correctness
2. Code quality and best practices
3. Repository organization and structure
4. Documentation quality (README, comments)
5. Following the specific requirements in the question
${baseExample ? '6. Comparison with the provided base example' : ''}

Please provide assessment in this JSON format:
{
  "remark": "Excellent|Good|Can Improve|Needs Improvement",
  "feedback": "Short, actionable, course-specific feedback focusing on code quality, functionality, and documentation",
  "criteriaAnalysis": [
    {
      "criterion": "Code Functionality",
      "status": "Met|Partially Met|Not Met",
      "details": "Specific details about this criterion"
    },
    {
      "criterion": "Code Quality",
      "status": "Met|Partially Met|Not Met", 
      "details": "Specific details about code structure, best practices"
    },
    {
      "criterion": "Documentation",
      "status": "Met|Partially Met|Not Met",
      "details": "Quality of README and code comments"
    },
    {
      "criterion": "Repository Organization",
      "status": "Met|Partially Met|Not Met",
      "details": "File structure and project organization"
    }
  ]
}

Focus on practical, actionable feedback that helps the student improve their code and development practices.
`;
  }

  private async assessTextSubmission(
    submissionContent: string,
    question: Question & { baseExamples: BaseExample[] }
  ): Promise<AssessmentResult> {
    const baseExample = question.baseExamples.find(
      example => example.title.toLowerCase().includes('text') || example.content.toLowerCase().includes('text')
    );

    const prompt = this.createTextAssessmentPrompt(submissionContent, question, baseExample);
    const aiResponse = await this.llmService.assessSubmission(prompt);

    return {
      remark: this.parseRemark(aiResponse.remark),
      feedback: aiResponse.feedback,
      criteriaAnalysis: aiResponse.criteriaAnalysis || [],
    };
  }

  private async assessDocumentSubmission(
    submissionContent: string,
    question: Question & { baseExamples: BaseExample[] }
  ): Promise<AssessmentResult> {
    // For now, treat document as text - will enhance in AS-3.2
    return this.assessTextSubmission(submissionContent, question);
  }

  private async assessWebsiteSubmission(
    submissionContent: string,
    question: Question & { baseExamples: BaseExample[] }
  ): Promise<AssessmentResult> {
    // Placeholder for website assessment - will implement in AS-3.3
    return {
      remark: 'Needs Improvement',
      feedback: 'Website assessment not yet implemented',
      criteriaAnalysis: [],
    };
  }

  private async assessScreenshotSubmission(
    submissionContent: string,
    question: Question & { baseExamples: BaseExample[] }
  ): Promise<AssessmentResult> {
    // Placeholder for screenshot assessment - will implement in AS-3.3
    return {
      remark: 'Needs Improvement',
      feedback: 'Screenshot assessment not yet implemented',
      criteriaAnalysis: [],
    };
  }

  private createTextAssessmentPrompt(
    submissionContent: string,
    question: Question,
    baseExample?: BaseExample
  ): string {
    const baseExampleSection = baseExample ? `
BASE EXAMPLE FOR COMPARISON:
Perfect Answer: ${baseExample.description}
Example Content: ${baseExample.content}
Key Points: Example key points
` : '';

    return `
ASSESSMENT TASK: Evaluate Text Submission

COURSE: Course Information
QUESTION: ${question.title}
REQUIREMENTS: ${question.description}
ASSESSMENT CRITERIA: ${question.assessmentPrompt}

${baseExampleSection}

STUDENT SUBMISSION:
${submissionContent}

Please provide assessment in this JSON format:
{
  "remark": "Excellent|Good|Can Improve|Needs Improvement",
  "feedback": "Short, actionable, course-specific feedback",
  "criteriaAnalysis": [
    {
      "criterion": "Content Quality",
      "status": "Met|Partially Met|Not Met",
      "details": "Specific details about this criterion"
    }
  ]
}
`;
  }

  private parseRemark(aiRemark: string): 'Excellent' | 'Good' | 'Can Improve' | 'Needs Improvement' {
    const cleaned = aiRemark.toLowerCase().trim();
    
    if (cleaned.includes('excellent')) return 'Excellent';
    if (cleaned.includes('good')) return 'Good';
    if (cleaned.includes('can improve') || cleaned.includes('could improve')) return 'Can Improve';
    
    return 'Needs Improvement';
  }
}

const llmService = new LLMService();
export const assessmentService = new AssessmentService(llmService);

// Question management functions
export async function createQuestion(data: any) {
  // TODO: Implement question creation
  return { success: false, error: 'Not implemented yet' };
}