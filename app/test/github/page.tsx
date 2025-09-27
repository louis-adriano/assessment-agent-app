'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Github, CheckCircle, XCircle, Code, FileText, GitBranch, ExternalLink } from 'lucide-react'
import { testGitHubUrl, testGitHubRepository, testGitHubSubmissionFlow } from '@/lib/actions/github-test-actions'
import Link from 'next/link'

interface TestResult {
  valid: boolean
  parsed?: {
    owner: string
    repo: string
  }
  analysis?: any
  error?: string
  submissionId?: string
  resultsUrl?: string
}

export default function GitHubTestPage() {
  const [url, setUrl] = useState('https://github.com/linkedin/school-of-sre')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [testType, setTestType] = useState<'validation' | 'analysis' | 'submission'>('validation')

  const runTest = async () => {
    if (!url.trim()) return

    setTesting(true)
    setResult(null)

    try {
      console.log(`🔍 Running ${testType} test for:`, url)
      
      let testResult: any

      switch (testType) {
        case 'validation':
          testResult = await testGitHubUrl(url)
          break
        case 'analysis':
          testResult = await testGitHubRepository(url)
          break
        case 'submission':
          testResult = await testGitHubSubmissionFlow(url)
          break
      }

      if (testResult.success) {
        setResult({
          valid: true,
          parsed: testResult.data?.parsed,
          analysis: testResult.data?.analysis,
          submissionId: testResult.data?.submissionId,
          resultsUrl: testResult.data?.resultsUrl,
        })
      } else {
        setResult({
          valid: false,
          error: testResult.error
        })
      }

    } catch (error) {
      console.error('❌ Test failed:', error)
      setResult({
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setTesting(false)
    }
  }

  const setTestUrl = (newUrl: string) => {
    setUrl(newUrl)
    setResult(null)
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Github className="w-8 h-8" />
            GitHub Feature Test
          </h1>
          <p className="text-muted-foreground">
            Test the GitHub repository analysis feature with server actions
          </p>
        </div>

        {/* Quick Test URLs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Test URLs</CardTitle>
            <CardDescription>
              Try these popular repositories to see the feature in action
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={() => setTestUrl('https://github.com/linkedin/school-of-sre')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Code className="w-4 h-4" />
                LinkedIn School of SRE
              </Button>
              <Button 
                onClick={() => setTestUrl('https://github.com/vercel/next.js')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <GitBranch className="w-4 h-4" />
                Vercel Next.js
              </Button>
              <Button 
                onClick={() => setTestUrl('https://github.com/microsoft/vscode')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                VS Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Configuration</CardTitle>
            <CardDescription>
              Choose what type of test to run on the GitHub repository
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Test Type Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Test Type</label>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={() => setTestType('validation')}
                  variant={testType === 'validation' ? 'default' : 'outline'}
                  size="sm"
                >
                  URL Validation
                </Button>
                <Button 
                  onClick={() => setTestType('analysis')}
                  variant={testType === 'analysis' ? 'default' : 'outline'}
                  size="sm"
                >
                  Repository Analysis
                </Button>
                <Button 
                  onClick={() => setTestType('submission')}
                  variant={testType === 'submission' ? 'default' : 'outline'}
                  size="sm"
                >
                  Full Submission Flow
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {testType === 'validation' && 'Tests URL format validation and parsing'}
                {testType === 'analysis' && 'Tests repository file analysis and structure detection'}
                {testType === 'submission' && 'Tests the complete submission and assessment flow'}
              </p>
            </div>

            {/* URL Input */}
            <div className="flex gap-2">
              <Input
                placeholder="https://github.com/owner/repository"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={runTest}
                disabled={testing || !url.trim()}
                className="min-w-[120px]"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Github className="mr-2 h-4 w-4" />
                    Run Test
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {result.valid ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Success Message */}
              {result.valid && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>✅ Test Passed!</strong> GitHub {testType} is working correctly.
                  </p>
                </div>
              )}

              {/* Basic Info */}
              {result.parsed && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Repository Information</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">
                      {result.parsed.owner}/{result.parsed.repo}
                    </Badge>
                    <Link 
                      href={url} 
                      target="_blank" 
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View on GitHub <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Submission Results */}
              {result.submissionId && result.resultsUrl && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Submission Completed</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Submission ID: {result.submissionId}</Badge>
                    <Link 
                      href={result.resultsUrl}
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View Assessment Results <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {result.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>❌ Test Failed:</strong> {result.error}
                  </p>
                </div>
              )}

              {/* Repository Analysis Results */}
              {result.analysis && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Repository Analysis</h4>
                  
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium">Files</div>
                      <div className="text-lg font-bold text-blue-600">
                        {result.analysis.repoInfo.fileCount}
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium">Language</div>
                      <div className="text-lg font-bold text-green-600">
                        {result.analysis.codeQuality.mainLanguage}
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-sm font-medium">Complexity</div>
                      <div className="text-lg font-bold text-purple-600 capitalize">
                        {result.analysis.codeQuality.complexity}
                      </div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-sm font-medium">Size</div>
                      <div className="text-lg font-bold text-orange-600">
                        {Math.round(result.analysis.repoInfo.totalSize / 1024)}KB
                      </div>
                    </div>
                  </div>

                  {/* Quality Indicators */}
                  <div>
                    <h5 className="font-medium mb-2">Quality Indicators</h5>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant={result.analysis.codeQuality.hasReadme ? "default" : "secondary"}>
                        {result.analysis.codeQuality.hasReadme ? "✓" : "✗"} README
                      </Badge>
                      <Badge variant={result.analysis.codeQuality.hasTests ? "default" : "secondary"}>
                        {result.analysis.codeQuality.hasTests ? "✓" : "✗"} Tests
                      </Badge>
                      <Badge variant={result.analysis.codeQuality.hasDocumentation ? "default" : "secondary"}>
                        {result.analysis.codeQuality.hasDocumentation ? "✓" : "✗"} Documentation
                      </Badge>
                      <Badge variant={result.analysis.structure.organized ? "default" : "secondary"}>
                        {result.analysis.structure.organized ? "✓" : "✗"} Organized
                      </Badge>
                    </div>
                  </div>

                  {/* Sample Files Preview */}
                  {result.analysis.repoInfo.files.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2">Sample Files ({result.analysis.repoInfo.files.length} analyzed)</h5>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {result.analysis.repoInfo.files.slice(0, 3).map((file: any, index: number) => (
                          <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                            <div className="font-medium">{file.path}</div>
                            <div className="text-xs text-muted-foreground">
                              {file.type} • {file.size} bytes
                              {file.language && ` • ${file.language}`}
                            </div>
                            {file.content && (
                              <div className="mt-1 p-2 bg-white rounded text-xs font-mono">
                                {file.content.slice(0, 150)}
                                {file.content.length > 150 && '...'}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-sm space-y-2">
              <p><strong>What each test proves:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>URL Validation:</strong> GitHub URL parsing and format validation</li>
                <li><strong>Repository Analysis:</strong> File fetching, structure analysis, and code quality detection</li>
                <li><strong>Full Submission Flow:</strong> Complete end-to-end assessment with AI feedback</li>
              </ul>
              <p className="mt-3 text-xs text-blue-600">
                <strong>Note:</strong> Some tests may fail due to GitHub API rate limits or private repositories, 
                but this demonstrates the error handling works correctly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}