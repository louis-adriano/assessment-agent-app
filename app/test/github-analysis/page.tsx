'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, GitBranch, CheckCircle2, XCircle, FileCode, FolderTree } from 'lucide-react'

interface RepoAnalysis {
  owner: string
  repo: string
  fileCount: number
  filesAnalyzed: number
  structure: string
  files: Array<{
    path: string
    content: string
    size: number
    type: string
    language?: string
  }>
  readme?: string
  languages: Record<string, number>
  hasTests: boolean
  hasDocumentation: boolean
  totalSize: number
}

export default function GitHubAnalysisTestPage() {
  const [repoUrl, setRepoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null)

  const analyzeRepo = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a GitHub repository URL')
      return
    }

    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const response = await fetch('/api/test/github-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze repository')
      }

      setAnalysis(data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const mainLanguage = analysis
    ? Object.entries(analysis.languages).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'
    : null

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">GitHub Repository Analyzer</h1>
        <p className="text-muted-foreground">
          Test the GitHub repository analysis feature by entering a public repository URL
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Analyze Repository
          </CardTitle>
          <CardDescription>
            Enter a public GitHub repository URL to see comprehensive code analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="https://github.com/username/repository"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && analyzeRepo()}
              disabled={loading}
            />
            <Button onClick={analyzeRepo} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze'
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-6">
          {/* Repository Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Repository Overview</CardTitle>
              <CardDescription>
                {analysis.owner}/{analysis.repo}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Main Language</span>
                  <span className="text-2xl font-bold">{mainLanguage}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Total Files</span>
                  <span className="text-2xl font-bold">{analysis.fileCount}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Files Analyzed</span>
                  <span className="text-2xl font-bold">{analysis.filesAnalyzed}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Repository Size</span>
                  <span className="text-2xl font-bold">{(analysis.totalSize / 1024).toFixed(1)} KB</span>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <div className="flex items-center gap-2">
                  {analysis.readme ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span>README</span>
                </div>
                <div className="flex items-center gap-2">
                  {analysis.hasTests ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span>Tests</span>
                </div>
                <div className="flex items-center gap-2">
                  {analysis.hasDocumentation ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span>Documentation</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Languages */}
          <Card>
            <CardHeader>
              <CardTitle>Languages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analysis.languages)
                  .sort((a, b) => b[1] - a[1])
                  .map(([lang, bytes]) => {
                    const percentage = ((bytes / analysis.totalSize) * 100).toFixed(1)
                    return (
                      <div key={lang} className="flex items-center gap-2">
                        <span className="w-32 font-medium">{lang}</span>
                        <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-sm text-muted-foreground">
                          {percentage}%
                        </span>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>

          {/* File Structure */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="w-5 h-5" />
                File Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                {analysis.structure}
              </pre>
            </CardContent>
          </Card>

          {/* README */}
          {analysis.readme && (
            <Card>
              <CardHeader>
                <CardTitle>README.md</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">{analysis.readme.slice(0, 2000)}</pre>
                  {analysis.readme.length > 2000 && (
                    <p className="text-muted-foreground mt-2">... (truncated)</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Code Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="w-5 h-5" />
                Code Files ({analysis.files.length} files analyzed)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.files.slice(0, 10).map((file, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
                      <span className="font-mono text-sm">{file.path}</span>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{file.language}</span>
                        <span>•</span>
                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 overflow-x-auto max-h-64 overflow-y-auto">
                      <pre className="text-xs">
                        {file.content.slice(0, 1500)}
                        {file.content.length > 1500 && '\n... (truncated)'}
                      </pre>
                    </div>
                  </div>
                ))}
                {analysis.files.length > 10 && (
                  <p className="text-center text-muted-foreground">
                    ... and {analysis.files.length - 10} more files
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
