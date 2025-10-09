import { sanitizeTextContent } from '../utils/sanitization';

export interface WebsiteInfo {
  url: string;
  isAccessible: boolean;
  statusCode?: number;
  responseTime?: number;
  headers?: Record<string, string>;
  metadata?: {
    title?: string;
    description?: string;
    hasHttps: boolean;
    hasFavicon?: boolean;
    viewport?: string;
  };
  accessibility?: {
    hasValidHTML?: boolean;
    hasAltTags?: boolean;
    hasAriaLabels?: boolean;
    colorContrast?: string;
  };
  performance?: {
    loadTime?: number;
    resourceCount?: number;
  };
  screenshot?: {
    url?: string;
    width?: number;
    height?: number;
  };
  htmlPreview?: string;
}

export interface WebsiteAssessmentData {
  websiteInfo: WebsiteInfo;
  issues: string[];
  strengths: string[];
  recommendations: string[];
}

export class WebsiteService {
  /**
   * Test website accessibility and functionality
   */
  async testWebsite(url: string): Promise<WebsiteInfo> {
    try {
      // Validate and normalize URL
      const normalizedUrl = this.normalizeUrl(url);
      const startTime = Date.now();

      // Fetch website
      const response = await fetch(normalizedUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Assessment Agent Bot)',
        },
        redirect: 'follow',
      });

      const responseTime = Date.now() - startTime;

      // Basic accessibility check
      const isAccessible = response.ok;
      const statusCode = response.status;

      // Extract headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // Check HTTPS
      const hasHttps = normalizedUrl.startsWith('https://');

      // If accessible, fetch full content for more details
      let metadata: WebsiteInfo['metadata'] = { hasHttps };
      let htmlPreview = undefined;

      if (isAccessible) {
        try {
          const fullResponse = await fetch(normalizedUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Assessment Agent Bot)',
            },
          });

          const html = await fullResponse.text();
          htmlPreview = html.substring(0, 2000); // First 2000 chars

          // Extract basic metadata from HTML
          metadata = {
            ...metadata,
            ...this.extractMetadata(html),
          };
        } catch (error) {
          console.warn('Could not fetch full HTML:', error);
        }
      }

      return {
        url: normalizedUrl,
        isAccessible,
        statusCode,
        responseTime,
        headers,
        metadata,
        htmlPreview,
      };
    } catch (error) {
      console.error('Website test error:', error);
      return {
        url,
        isAccessible: false,
        metadata: {
          hasHttps: url.startsWith('https://'),
        },
      };
    }
  }

  /**
   * Assess website against criteria
   */
  async assessWebsite(url: string, criteria?: string[]): Promise<WebsiteAssessmentData> {
    const websiteInfo = await this.testWebsite(url);
    const issues: string[] = [];
    const strengths: string[] = [];
    const recommendations: string[] = [];

    // Check accessibility
    if (!websiteInfo.isAccessible) {
      issues.push(`Website is not accessible (Status: ${websiteInfo.statusCode || 'Unknown'})`);
      recommendations.push('Ensure the website is publicly accessible');
    } else {
      strengths.push('Website is accessible and responding');
    }

    // Check HTTPS
    if (!websiteInfo.metadata?.hasHttps) {
      issues.push('Website does not use HTTPS');
      recommendations.push('Implement SSL/TLS certificate for secure connections');
    } else {
      strengths.push('Uses HTTPS for secure connections');
    }

    // Check response time
    if (websiteInfo.responseTime) {
      if (websiteInfo.responseTime > 3000) {
        issues.push(`Slow response time: ${websiteInfo.responseTime}ms`);
        recommendations.push('Optimize server response time (target < 1000ms)');
      } else if (websiteInfo.responseTime < 1000) {
        strengths.push('Fast response time');
      }
    }

    // Check metadata
    if (websiteInfo.metadata?.title) {
      strengths.push('Has page title');
    } else if (websiteInfo.isAccessible) {
      issues.push('Missing page title');
      recommendations.push('Add descriptive page title');
    }

    if (websiteInfo.metadata?.description) {
      strengths.push('Has meta description');
    } else if (websiteInfo.isAccessible) {
      recommendations.push('Add meta description for SEO');
    }

    if (websiteInfo.metadata?.viewport) {
      strengths.push('Has viewport meta tag (mobile-friendly)');
    } else if (websiteInfo.isAccessible) {
      recommendations.push('Add viewport meta tag for responsive design');
    }

    return {
      websiteInfo,
      issues,
      strengths,
      recommendations,
    };
  }

  /**
   * Extract metadata from HTML
   */
  private extractMetadata(html: string): Partial<WebsiteInfo['metadata']> {
    const metadata: Partial<WebsiteInfo['metadata']> = {};

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      metadata.title = sanitizeTextContent(titleMatch[1]);
    }

    // Extract meta description
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    if (descMatch) {
      metadata.description = sanitizeTextContent(descMatch[1]);
    }

    // Check viewport
    const viewportMatch = html.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i);
    if (viewportMatch) {
      metadata.viewport = viewportMatch[1];
    }

    // Check favicon
    const faviconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["']/i);
    metadata.hasFavicon = !!faviconMatch;

    return metadata;
  }

  /**
   * Normalize URL format
   */
  private normalizeUrl(url: string): string {
    let normalized = url.trim();

    // Add https:// if no protocol
    if (!normalized.match(/^https?:\/\//i)) {
      normalized = `https://${normalized}`;
    }

    // Validate URL
    try {
      const urlObj = new URL(normalized);
      return urlObj.href;
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  /**
   * Validate URL format
   */
  isValidUrl(url: string): boolean {
    try {
      this.normalizeUrl(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate assessment summary for LLM
   */
  generateWebsiteSummary(assessmentData: WebsiteAssessmentData): string {
    const { websiteInfo, issues, strengths, recommendations } = assessmentData;

    let summary = `# Website Assessment: ${websiteInfo.url}\n\n`;

    summary += `## Accessibility Status\n`;
    summary += `- **Status:** ${websiteInfo.isAccessible ? '✓ Accessible' : '✗ Not Accessible'}\n`;
    summary += `- **Status Code:** ${websiteInfo.statusCode || 'N/A'}\n`;
    summary += `- **Response Time:** ${websiteInfo.responseTime ? `${websiteInfo.responseTime}ms` : 'N/A'}\n`;
    summary += `- **Protocol:** ${websiteInfo.metadata?.hasHttps ? 'HTTPS ✓' : 'HTTP (insecure)'}\n\n`;

    if (websiteInfo.metadata?.title) {
      summary += `## Page Metadata\n`;
      summary += `- **Title:** ${websiteInfo.metadata.title}\n`;
      if (websiteInfo.metadata.description) {
        summary += `- **Description:** ${websiteInfo.metadata.description}\n`;
      }
      if (websiteInfo.metadata.viewport) {
        summary += `- **Viewport:** ${websiteInfo.metadata.viewport} (Mobile-friendly ✓)\n`;
      }
      summary += `- **Favicon:** ${websiteInfo.metadata.hasFavicon ? 'Yes ✓' : 'No'}\n\n`;
    }

    if (strengths.length > 0) {
      summary += `## Strengths\n`;
      strengths.forEach(s => summary += `- ✓ ${s}\n`);
      summary += '\n';
    }

    if (issues.length > 0) {
      summary += `## Issues Found\n`;
      issues.forEach(i => summary += `- ✗ ${i}\n`);
      summary += '\n';
    }

    if (recommendations.length > 0) {
      summary += `## Recommendations\n`;
      recommendations.forEach(r => summary += `- → ${r}\n`);
      summary += '\n';
    }

    if (websiteInfo.htmlPreview) {
      summary += `## HTML Preview (First 500 characters)\n`;
      summary += `\`\`\`html\n${websiteInfo.htmlPreview.substring(0, 500)}\n\`\`\`\n`;
    }

    return summary;
  }
}

export const websiteService = new WebsiteService();
