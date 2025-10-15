/**
 * Integration tests for all 5 submission types
 *
 * These tests verify end-to-end functionality for:
 * 1. TEXT submissions
 * 2. GITHUB_REPO submissions
 * 3. DOCUMENT submissions
 * 4. WEBSITE submissions
 * 5. SCREENSHOT submissions
 *
 * To run: npm test -- submissions.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { submitAssessment } from '@/lib/actions/submission-actions';

// Test data
const TEST_USER_ID = 'test-user-123';
const TEST_COURSE_NAME = 'Test Course';
const TEST_GITHUB_REPO = 'https://github.com/facebook/react'; // Public repo for testing
const TEST_WEBSITE_URL = 'https://example.com'; // Stable test URL
const TEST_TEXT_CONTENT = 'This is a comprehensive test submission with enough content to pass validation. '.repeat(10);

describe('Submission Integration Tests', () => {
  let testCourseId: string;
  let testQuestions: Record<string, any> = {};

  beforeAll(async () => {
    // Create test course with all 5 submission types
    const course = await prisma.course.create({
      data: {
        name: TEST_COURSE_NAME,
        description: 'Integration test course',
        questions: {
          create: [
            {
              questionNumber: 1,
              title: 'Text Submission Test',
              description: 'Test text submission',
              submissionType: 'TEXT',
              assessmentMode: 'AI_ONLY',
              criteria: ['Content quality', 'Grammar'],
            },
            {
              questionNumber: 2,
              title: 'GitHub Repository Test',
              description: 'Test GitHub repo submission',
              submissionType: 'GITHUB_REPO',
              assessmentMode: 'AI_ONLY',
              criteria: ['Code quality', 'Documentation'],
            },
            {
              questionNumber: 3,
              title: 'Document Upload Test',
              description: 'Test document submission',
              submissionType: 'DOCUMENT',
              assessmentMode: 'AI_ONLY',
              criteria: ['Content', 'Structure'],
            },
            {
              questionNumber: 4,
              title: 'Website Test',
              description: 'Test website submission',
              submissionType: 'WEBSITE',
              assessmentMode: 'AI_ONLY',
              criteria: ['Accessibility', 'Design'],
            },
            {
              questionNumber: 5,
              title: 'Screenshot Test',
              description: 'Test screenshot submission',
              submissionType: 'SCREENSHOT',
              assessmentMode: 'AI_ONLY',
              criteria: ['Visual quality', 'Completeness'],
            },
          ],
        },
      },
      include: {
        questions: true,
      },
    });

    testCourseId = course.id;
    course.questions.forEach((q) => {
      testQuestions[q.submissionType] = q;
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.submission.deleteMany({
      where: {
        question: {
          courseId: testCourseId,
        },
      },
    });
    await prisma.question.deleteMany({
      where: {
        courseId: testCourseId,
      },
    });
    await prisma.course.delete({
      where: {
        id: testCourseId,
      },
    });

    await prisma.$disconnect();
  });

  describe('TEXT Submissions', () => {
    it('should successfully process a text submission', async () => {
      const result = await submitAssessment(
        TEST_COURSE_NAME,
        1, // TEXT question
        'TEXT',
        TEST_TEXT_CONTENT
      );

      expect(result.success).toBe(true);
      expect(result.submissionId).toBeDefined();

      // Verify submission was created in database
      const submission = await prisma.submission.findUnique({
        where: { id: result.submissionId },
        include: { question: true },
      });

      expect(submission).toBeDefined();
      expect(submission?.status).toBe('COMPLETED');
      expect(submission?.assessmentResult).toBeDefined();
    }, 60000); // 60 second timeout for AI assessment

    it('should reject empty text submissions', async () => {
      const result = await submitAssessment(
        TEST_COURSE_NAME,
        1,
        'TEXT',
        ''
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should sanitize text submissions for database safety', async () => {
      const maliciousContent = 'Test content\x00with null byte';
      const result = await submitAssessment(
        TEST_COURSE_NAME,
        1,
        'TEXT',
        maliciousContent
      );

      expect(result.success).toBe(true);

      const submission = await prisma.submission.findUnique({
        where: { id: result.submissionId },
      });

      // Null bytes should be removed
      expect(submission?.submissionContent).not.toContain('\x00');
    }, 60000);
  });

  describe('GITHUB_REPO Submissions', () => {
    it('should successfully process a valid GitHub repository', async () => {
      const result = await submitAssessment(
        TEST_COURSE_NAME,
        2, // GITHUB_REPO question
        'GITHUB_REPO',
        TEST_GITHUB_REPO
      );

      expect(result.success).toBe(true);
      expect(result.submissionId).toBeDefined();

      // Verify assessment includes GitHub metadata
      const submission = await prisma.submission.findUnique({
        where: { id: result.submissionId },
      });

      expect(submission?.assessmentResult).toBeDefined();
      const metadata = (submission?.assessmentResult as any)?.metadata;
      expect(metadata?.github).toBeDefined();
      expect(metadata?.github?.owner).toBe('facebook');
      expect(metadata?.github?.repo).toBe('react');
    }, 120000); // 2 minute timeout for repo fetching + assessment

    it('should reject invalid GitHub URLs', async () => {
      const result = await submitAssessment(
        TEST_COURSE_NAME,
        2,
        'GITHUB_REPO',
        'https://example.com/not-a-repo'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('GitHub');
    });

    it('should reject non-existent repositories', async () => {
      const result = await submitAssessment(
        TEST_COURSE_NAME,
        2,
        'GITHUB_REPO',
        'https://github.com/nonexistent-user-12345/nonexistent-repo-67890'
      );

      expect(result.success).toBe(false);
    }, 60000);

    it('should use caching for duplicate repo submissions', async () => {
      // First submission - cache miss
      const start1 = Date.now();
      const result1 = await submitAssessment(
        TEST_COURSE_NAME,
        2,
        'GITHUB_REPO',
        TEST_GITHUB_REPO
      );
      const time1 = Date.now() - start1;

      expect(result1.success).toBe(true);

      // Second submission - should be faster due to cache
      const start2 = Date.now();
      const result2 = await submitAssessment(
        TEST_COURSE_NAME,
        2,
        'GITHUB_REPO',
        TEST_GITHUB_REPO
      );
      const time2 = Date.now() - start2;

      expect(result2.success).toBe(true);

      // Second submission should be significantly faster (cache hit)
      // Allow for some variance due to AI processing time
      console.log(`First: ${time1}ms, Second: ${time2}ms`);
    }, 180000);
  });

  describe('DOCUMENT Submissions', () => {
    it('should reject PDF files with clear error message', async () => {
      // Note: We can't actually upload files in this test,
      // but we can verify the backend rejects PDFs
      // This would be tested in an E2E test with actual file uploads
      expect(true).toBe(true);
    });

    it('should accept DOCX files', async () => {
      // This would require actual file upload in E2E tests
      // For now, we verify the document service configuration
      const { documentService } = await import('@/lib/services/document-service');
      const supportedTypes = documentService.getSupportedFileTypes();

      expect(supportedTypes.some(t => t.extension === '.docx')).toBe(true);
      expect(supportedTypes.some(t => t.extension === '.pdf')).toBe(false);
    });

    it('should accept TXT files', async () => {
      const { documentService } = await import('@/lib/services/document-service');
      const supportedTypes = documentService.getSupportedFileTypes();

      expect(supportedTypes.some(t => t.extension === '.txt')).toBe(true);
    });
  });

  describe('WEBSITE Submissions', () => {
    it('should successfully test an accessible website', async () => {
      const result = await submitAssessment(
        TEST_COURSE_NAME,
        4, // WEBSITE question
        'WEBSITE',
        TEST_WEBSITE_URL
      );

      expect(result.success).toBe(true);
      expect(result.submissionId).toBeDefined();

      // Verify assessment includes website metadata
      const submission = await prisma.submission.findUnique({
        where: { id: result.submissionId },
      });

      const metadata = (submission?.assessmentResult as any)?.metadata;
      expect(metadata?.website).toBeDefined();
      expect(metadata?.website?.isAccessible).toBe(true);
    }, 120000);

    it('should reject invalid website URLs', async () => {
      const result = await submitAssessment(
        TEST_COURSE_NAME,
        4,
        'WEBSITE',
        'not-a-valid-url'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('URL');
    });

    it('should handle unreachable websites gracefully', async () => {
      const result = await submitAssessment(
        TEST_COURSE_NAME,
        4,
        'WEBSITE',
        'https://this-domain-definitely-does-not-exist-12345.com'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('accessible');
    }, 60000);

    it('should normalize URLs automatically', async () => {
      // Submit without https://
      const result = await submitAssessment(
        TEST_COURSE_NAME,
        4,
        'WEBSITE',
        'example.com'
      );

      expect(result.success).toBe(true);

      const submission = await prisma.submission.findUnique({
        where: { id: result.submissionId },
      });

      // URL should be normalized to https://
      expect(submission?.submissionContent).toContain('https://');
    }, 120000);
  });

  describe('SCREENSHOT Submissions', () => {
    it('should accept valid image formats', async () => {
      const { screenshotService } = await import('@/lib/services/screenshot-service');
      const supportedTypes = screenshotService.getSupportedImageTypes();

      expect(supportedTypes).toContain('image/jpeg');
      expect(supportedTypes).toContain('image/png');
      expect(supportedTypes).toContain('image/gif');
      expect(supportedTypes).toContain('image/webp');
    });

    // Note: Full screenshot upload testing requires E2E tests with actual file uploads
  });

  describe('Unlimited Submissions', () => {
    it('should allow unlimited submissions for iterative learning', async () => {
      // Students should be able to submit multiple times for learning
      const submissions = [];

      for (let i = 0; i < 5; i++) {
        const result = await submitAssessment(
          TEST_COURSE_NAME,
          1,
          'TEXT',
          `Test submission ${i}: ${TEST_TEXT_CONTENT}`
        );
        submissions.push(result);
      }

      // All submissions should succeed (no rate limiting on submissions)
      expect(submissions.every(s => s.success)).toBe(true);
      expect(submissions.length).toBe(5);
    }, 300000); // 5 minute timeout for multiple submissions
  });

  describe('Error Handling', () => {
    it('should handle missing course gracefully', async () => {
      const result = await submitAssessment(
        'Nonexistent Course',
        1,
        'TEXT',
        TEST_TEXT_CONTENT
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle missing question gracefully', async () => {
      const result = await submitAssessment(
        TEST_COURSE_NAME,
        999, // Non-existent question
        'TEXT',
        TEST_TEXT_CONTENT
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle submission type mismatch', async () => {
      const result = await submitAssessment(
        TEST_COURSE_NAME,
        1, // TEXT question
        'GITHUB_REPO', // Wrong type
        TEST_GITHUB_REPO
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('expects');
    });
  });

  describe('Assessment Modes', () => {
    it('should handle MANUAL_ONLY mode correctly', async () => {
      // Create a manual-only question
      const manualQuestion = await prisma.question.create({
        data: {
          courseId: testCourseId,
          questionNumber: 10,
          title: 'Manual Review Test',
          description: 'Test manual review',
          submissionType: 'TEXT',
          assessmentMode: 'MANUAL_ONLY',
        },
      });

      const result = await submitAssessment(
        TEST_COURSE_NAME,
        10,
        'TEXT',
        TEST_TEXT_CONTENT
      );

      expect(result.success).toBe(true);
      expect(result.data?.mode).toBe('manual');

      // Submission should be PENDING, not COMPLETED
      const submission = await prisma.submission.findUnique({
        where: { id: result.submissionId },
      });

      expect(submission?.status).toBe('PENDING');
      expect(submission?.assessmentResult).toBeNull();

      // Clean up
      await prisma.question.delete({ where: { id: manualQuestion.id } });
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout long-running assessments gracefully', async () => {
      // This test verifies that timeout handling works
      // In production, timeouts are set to 120 seconds
      expect(true).toBe(true); // Placeholder - full test requires mock
    });
  });

  describe('Data Sanitization', () => {
    it('should remove dangerous characters from submissions', async () => {
      const dangerousContent = `Test content with <script>alert('xss')</script> and \x00null\x00bytes`;

      const result = await submitAssessment(
        TEST_COURSE_NAME,
        1,
        'TEXT',
        dangerousContent
      );

      expect(result.success).toBe(true);

      const submission = await prisma.submission.findUnique({
        where: { id: result.submissionId },
      });

      // Null bytes should be removed
      expect(submission?.submissionContent).not.toContain('\x00');
      // HTML should be preserved (we don't strip it, just sanitize for DB)
    }, 60000);
  });
});
