'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, GitBranch, Globe, FileText, Image } from 'lucide-react';
import { submitAssessment } from '@/lib/actions/submission-actions';
import { validateGitHubUrl } from '@/lib/utils/github-validation';

interface Question {
  id: string;
  questionNumber: number;
  title: string;
  description: string;
  submissionType: string;
  assessmentPrompt: string;
  course: {
    id: string;
    name: string;
    description: string;
  };
}

interface SubmissionPageProps {
  params: Promise<{
    courseName: string;
    assessmentNumber: string;
  }>;
}

export default function SubmissionPage({ params }: SubmissionPageProps) {
  const { courseName, assessmentNumber } = use(params);
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [githubValidation, setGithubValidation] = useState<{
    isValid: boolean;
    error?: string;
    owner?: string;
    repo?: string;
  } | null>(null);

  useEffect(() => {
    fetchQuestion();
  }, [courseName, assessmentNumber]);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      // In a real app, you'd have a server action to fetch the question
      // For now, we'll simulate it
      const response = await fetch(`/api/questions?courseName=${courseName}&assessmentNumber=${assessmentNumber}`);
      
      if (!response.ok) {
        throw new Error('Question not found');
      }
      
      const data = await response.json();
      setQuestion(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubUrlChange = (url: string) => {
    setSubmissionContent(url);
    
    if (url.trim()) {
      const validation = validateGitHubUrl(url);
      setGithubValidation(validation);
    } else {
      setGithubValidation(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question || !submissionContent.trim()) {
      setError('Please provide your submission content');
      return;
    }

    // Additional validation for GitHub repos
    if (question.submissionType === 'github_repo' && (!githubValidation?.isValid)) {
      setError('Please provide a valid GitHub repository URL');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await submitAssessment(
        courseName,
        parseInt(assessmentNumber),
        submissionContent,
        question.submissionType
      );

      if (result.success && result.submissionId) {
        // Redirect to results page
        router.push(`/results/${result.submissionId}`);
      } else {
        setError(result.error || 'Submission failed');
      }
    } catch (err: any) {
      setError('An error occurred while submitting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSubmissionTypeIcon = (type: string) => {
    switch (type) {
      case 'github_repo':
        return <GitBranch className="w-5 h-5" />;
      case 'website':
        return <Globe className="w-5 h-5" />;
      case 'document':
        return <FileText className="w-5 h-5" />;
      case 'screenshot':
        return <Image className="w-5 h-5" />;
      case 'text':
        return <FileText className="w-5 h-5" />;
      default:
        return <Upload className="w-5 h-5" />;
    }
  };

  const renderSubmissionForm = () => {
    if (!question) return null;

    switch (question.submissionType) {
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text-content">Your Response</Label>
              <Textarea
                id="text-content"
                placeholder="Enter your text response here..."
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                rows={8}
                className="min-h-[200px]"
              />
            </div>
          </div>
        );

      case 'github_repo':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="github-url">GitHub Repository URL</Label>
              <Input
                id="github-url"
                type="url"
                placeholder="https://github.com/username/repository-name"
                value={submissionContent}
onChange={(e) => handleGitHubUrlChange(e.target.value)}
                className={githubValidation?.isValid === false ? 'border-red-500' : ''}
              />
              {githubValidation?.isValid === false && (
                <p className="text-sm text-red-600 mt-1">
                  {githubValidation.error}
                </p>
              )}
              {githubValidation?.isValid && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ Valid repository: {githubValidation.owner}/{githubValidation.repo}
                </p>
              )}
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">GitHub Repository Requirements:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Repository must be public and accessible</li>
                <li>• Include a README.md with project description</li>
                <li>• Code should be well-organized and documented</li>
                <li>• Follow the assignment requirements specified above</li>
              </ul>
            </div>
          </div>
        );

      case 'website':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="website-url">Website URL</Label>
              <Input
                id="website-url"
                type="url"
                placeholder="https://your-website.com"
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
              />
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Website Requirements:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Website must be publicly accessible</li>
                <li>• Should be fully functional and responsive</li>
                <li>• Follow web accessibility guidelines</li>
                <li>• Meet the specific requirements outlined above</li>
              </ul>
            </div>
          </div>
        );

      case 'document':
        return (
          <div className="space-y-4">
            <div>
              <Label>Submit Your Document</Label>
              <div className="mt-2 space-y-3">
                {/* File Upload Option */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Input
                    id="document-file"
                    type="file"
                    accept=".docx,.txt"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSubmitting(true);
                        try {
                          const formData = new FormData();
                          formData.append('file', file);

                          const response = await fetch('/api/documents/upload', {
                            method: 'POST',
                            body: formData,
                          });

                          const result = await response.json();
                          if (result.success) {
                            // Set the file URL as submission content
                            setSubmissionContent(result.data.fileUrl);
                            alert(`Document uploaded successfully! ${result.data.metadata.wordCount} words extracted.`);
                          } else {
                            setError(result.error || 'Upload failed');
                          }
                        } catch (err) {
                          setError('Failed to upload document');
                        } finally {
                          setSubmitting(false);
                        }
                      }
                    }}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Upload DOCX or TXT (Max 10MB)
                  </p>
                </div>

                {/* OR Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>

                {/* Text/URL Option */}
                <div>
                  <Label htmlFor="document-content">Paste Document Content or URL</Label>
                  <Textarea
                    id="document-content"
                    placeholder="Paste your document content here or provide a URL to your document..."
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    rows={6}
                    className="min-h-[150px]"
                  />
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Document Requirements:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Supported formats: DOCX, TXT</li>
                <li>• Maximum file size: 10MB</li>
                <li>• Document should be well-structured and formatted</li>
                <li>• Include all required sections as specified</li>
                <li>• Use proper grammar and professional language</li>
              </ul>
            </div>
          </div>
        );

      case 'screenshot':
        return (
          <div className="space-y-4">
            <div>
              <Label>Submit Your Screenshot</Label>
              <div className="mt-2 space-y-3">
                {/* File Upload Option */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Input
                    id="screenshot-file"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSubmitting(true);
                        try {
                          const formData = new FormData();
                          formData.append('file', file);

                          const response = await fetch('/api/screenshots/upload', {
                            method: 'POST',
                            body: formData,
                          });

                          const result = await response.json();
                          if (result.success) {
                            setSubmissionContent(result.data.imageUrl);
                            alert(`Screenshot uploaded successfully! ${result.data.metadata.width}x${result.data.metadata.height}`);
                          } else {
                            setError(result.error || 'Upload failed');
                          }
                        } catch (err) {
                          setError('Failed to upload screenshot');
                        } finally {
                          setSubmitting(false);
                        }
                      }
                    }}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Upload PNG, JPEG, GIF, or WebP (Max 5MB)
                  </p>
                </div>

                {/* OR Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>

                {/* URL/Description Option */}
                <div>
                  <Label htmlFor="screenshot-url">Image URL or Description</Label>
                  <Textarea
                    id="screenshot-url"
                    placeholder="Provide URL to your screenshot or describe your visual submission..."
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Screenshot/Visual Requirements:</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Supported formats: PNG, JPEG, GIF, WebP</li>
                <li>• Maximum file size: 5MB</li>
                <li>• Image should be clear and high quality</li>
                <li>• Include all required visual elements</li>
                <li>• Annotate or explain key features if needed</li>
              </ul>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="generic-content">Submission Content</Label>
              <Textarea
                id="generic-content"
                placeholder="Enter your submission content..."
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                rows={6}
              />
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Assessment not found. Please check the course name and assessment number.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Course and Question Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span>{question.course.name}</span>
          <span>•</span>
          <span>Assessment {question.questionNumber}</span>
        </div>
        <h1 className="text-3xl font-bold mb-4">{question.title}</h1>
        <p className="text-lg text-muted-foreground">{question.course.description}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Question Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Assessment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p>{question.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getSubmissionTypeIcon(question.submissionType)}
                Submission Type
              </CardTitle>
              <CardDescription>
                {question.submissionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p>{question.assessmentPrompt}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submission Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Submit Your Work</CardTitle>
              <CardDescription>
                Complete your submission below to receive instant feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {renderSubmissionForm()}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  disabled={submitting || !submissionContent.trim() || (question.submissionType === 'github_repo' && !githubValidation?.isValid)}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Submission...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit for Assessment
                    </>
                  )}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Your submission will be assessed automatically and you'll receive instant feedback.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}