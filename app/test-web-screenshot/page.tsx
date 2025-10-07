'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Globe, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';

interface TestResult {
  type: 'website' | 'screenshot';
  status: 'idle' | 'testing' | 'success' | 'error';
  result?: any;
  error?: string;
}

export default function TestWebScreenshotPage() {
  const [websiteTest, setWebsiteTest] = useState<TestResult>({ type: 'website', status: 'idle' });
  const [screenshotTest, setScreenshotTest] = useState<TestResult>({ type: 'screenshot', status: 'idle' });

  const [websiteUrl, setWebsiteUrl] = useState('https://www.example.com');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  const testWebsite = async () => {
    setWebsiteTest({ type: 'website', status: 'testing' });

    try {
      const response = await fetch('/api/test/website-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl }),
      });

      const result = await response.json();

      if (result.success) {
        setWebsiteTest({ type: 'website', status: 'success', result: result.data });
      } else {
        setWebsiteTest({ type: 'website', status: 'error', error: result.error });
      }
    } catch (error) {
      setWebsiteTest({
        type: 'website',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const testScreenshot = async () => {
    if (!screenshotFile) {
      setScreenshotTest({ type: 'screenshot', status: 'error', error: 'No file selected' });
      return;
    }

    setScreenshotTest({ type: 'screenshot', status: 'testing' });

    try {
      const formData = new FormData();
      formData.append('file', screenshotFile);

      const response = await fetch('/api/screenshots/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setScreenshotTest({ type: 'screenshot', status: 'success', result: result.data });
      } else {
        setScreenshotTest({ type: 'screenshot', status: 'error', error: result.error });
      }
    } catch (error) {
      setScreenshotTest({
        type: 'screenshot',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const resetTests = () => {
    setWebsiteTest({ type: 'website', status: 'idle' });
    setScreenshotTest({ type: 'screenshot', status: 'idle' });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Website & Screenshot Testing</h1>
        <p className="text-muted-foreground">
          Test website accessibility checking and screenshot upload functionality
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex gap-4">
        <Button onClick={resetTests} variant="outline">
          Reset All Tests
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Website Test */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Globe className={`w-5 h-5 ${
                websiteTest.status === 'success' ? 'text-green-600' :
                websiteTest.status === 'error' ? 'text-red-600' :
                websiteTest.status === 'testing' ? 'text-blue-600' : 'text-gray-600'
              }`} />
              <div>
                <CardTitle>Website Assessment Test</CardTitle>
                <CardDescription>Test URL accessibility and metadata extraction</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Website URL</label>
              <Input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://www.example.com"
              />
            </div>

            <Button
              onClick={testWebsite}
              disabled={websiteTest.status === 'testing'}
              className="w-full"
            >
              {websiteTest.status === 'testing' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Website...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 mr-2" />
                  Test Website
                </>
              )}
            </Button>

            {websiteTest.status === 'success' && websiteTest.result && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">✅ Website Test Successful!</p>

                    <div className="space-y-1">
                      <p><strong>URL:</strong> {websiteTest.result.websiteInfo.url}</p>
                      <p><strong>Status:</strong> {websiteTest.result.websiteInfo.isAccessible ?
                        <span className="text-green-700">✓ Accessible</span> :
                        <span className="text-red-700">✗ Not Accessible</span>}
                      </p>
                      <p><strong>Status Code:</strong> {websiteTest.result.websiteInfo.statusCode || 'N/A'}</p>
                      <p><strong>Response Time:</strong> {websiteTest.result.websiteInfo.responseTime}ms</p>
                      <p><strong>HTTPS:</strong> {websiteTest.result.websiteInfo.metadata?.hasHttps ? '✓ Yes' : '✗ No'}</p>
                    </div>

                    {websiteTest.result.websiteInfo.metadata?.title && (
                      <div className="mt-3">
                        <p className="font-medium">Metadata:</p>
                        <p><strong>Title:</strong> {websiteTest.result.websiteInfo.metadata.title}</p>
                        {websiteTest.result.websiteInfo.metadata.description && (
                          <p><strong>Description:</strong> {websiteTest.result.websiteInfo.metadata.description}</p>
                        )}
                        {websiteTest.result.websiteInfo.metadata.viewport && (
                          <p><strong>Viewport:</strong> {websiteTest.result.websiteInfo.metadata.viewport}</p>
                        )}
                      </div>
                    )}

                    {websiteTest.result.strengths?.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium">Strengths ({websiteTest.result.strengths.length}):</p>
                        <ul className="list-disc list-inside ml-2">
                          {websiteTest.result.strengths.slice(0, 3).map((s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {websiteTest.result.issues?.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium">Issues ({websiteTest.result.issues.length}):</p>
                        <ul className="list-disc list-inside ml-2">
                          {websiteTest.result.issues.slice(0, 3).map((i: string, idx: number) => (
                            <li key={idx}>{i}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {websiteTest.status === 'error' && websiteTest.error && (
              <Alert variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">Test Failed</p>
                  <p className="text-sm">{websiteTest.error}</p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Screenshot Test */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ImageIcon className={`w-5 h-5 ${
                screenshotTest.status === 'success' ? 'text-green-600' :
                screenshotTest.status === 'error' ? 'text-red-600' :
                screenshotTest.status === 'testing' ? 'text-blue-600' : 'text-gray-600'
              }`} />
              <div>
                <CardTitle>Screenshot Upload Test</CardTitle>
                <CardDescription>Test image upload and processing</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Screenshot File</label>
              <Input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
              />
              {screenshotFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {screenshotFile.name} ({(screenshotFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <Button
              onClick={testScreenshot}
              disabled={screenshotTest.status === 'testing' || !screenshotFile}
              className="w-full"
            >
              {screenshotTest.status === 'testing' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading Screenshot...
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Test Screenshot Upload
                </>
              )}
            </Button>

            {screenshotTest.status === 'success' && screenshotTest.result && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">✅ Screenshot Upload Successful!</p>

                    <div className="space-y-1">
                      <p><strong>Filename:</strong> {screenshotTest.result.filename}</p>
                      <p><strong>File Type:</strong> {screenshotTest.result.metadata.fileType}</p>
                      <p><strong>File Size:</strong> {(screenshotTest.result.metadata.fileSize / 1024).toFixed(2)} KB</p>
                      <p><strong>Dimensions:</strong> {screenshotTest.result.metadata.width}x{screenshotTest.result.metadata.height}</p>
                      <p><strong>Uploaded:</strong> {new Date(screenshotTest.result.metadata.uploadedAt).toLocaleString()}</p>
                    </div>

                    <div className="mt-3">
                      <p className="font-medium mb-1">Uploaded Image:</p>
                      <a
                        href={screenshotTest.result.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        View Full Image →
                      </a>
                      <div className="mt-2 border rounded overflow-hidden">
                        <img
                          src={screenshotTest.result.imageUrl}
                          alt="Uploaded screenshot"
                          className="max-w-full h-auto max-h-64 object-contain"
                        />
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-green-700">
                      ✓ Uploaded to Vercel Blob storage<br/>
                      ✓ Dimensions extracted<br/>
                      ✓ Ready for AI assessment
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {screenshotTest.status === 'error' && screenshotTest.error && (
              <Alert variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">Test Failed</p>
                  <p className="text-sm">{screenshotTest.error}</p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features Summary */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Features Tested</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-4">
          <div>
            <h3 className="font-bold mb-2">🌐 Website Assessment:</h3>
            <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
              <li>URL accessibility testing</li>
              <li>HTTP status code checking</li>
              <li>Response time measurement</li>
              <li>HTTPS validation</li>
              <li>Metadata extraction (title, description, viewport)</li>
              <li>HTML preview capture</li>
              <li>Accessibility recommendations</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-2">📸 Screenshot Processing:</h3>
            <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
              <li>Image upload to Vercel Blob</li>
              <li>File type validation (PNG, JPEG, GIF, WebP)</li>
              <li>Size validation (5MB limit)</li>
              <li>Dimension extraction</li>
              <li>Secure filename generation</li>
              <li>Public URL generation</li>
            </ul>
          </div>

          <div className="bg-blue-100 p-3 rounded">
            <h3 className="font-bold mb-2">✅ What This Proves:</h3>
            <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
              <li>Website service can fetch and analyze live websites</li>
              <li>Screenshot service can upload and process images</li>
              <li>Both services extract metadata for AI assessment</li>
              <li>Secure file storage with Vercel Blob works</li>
              <li>Error handling is robust</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
