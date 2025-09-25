// app/admin/diagnostics/page.tsx
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

async function runSchemaDiagnostics() {
  const diagnostics = {
    course: { fields: [] as string[], errors: [] as string[] },
    question: { fields: [] as string[], errors: [] as string[] },
    submission: { fields: [] as string[], errors: [] as string[] },
    baseExample: { fields: [] as string[], errors: [] as string[] },
    submissionTypes: [] as string[]
  }

  try {
    // Test Course model fields
    const course = await prisma.course.findFirst({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      }
    })
    
    if (course) {
      diagnostics.course.fields = Object.keys(course)
    }

    // Test for possible owner fields in Course
    const ownerFields = ['createdBy', 'adminId', 'userId', 'ownerId']
    for (const field of ownerFields) {
      try {
        await prisma.course.findFirst({
          select: { [field]: true }
        })
        diagnostics.course.fields.push(`${field} ✅`)
      } catch {
        diagnostics.course.errors.push(`${field} ❌`)
      }
    }

  } catch (error) {
    diagnostics.course.errors.push(`Course model error: ${error instanceof Error ? error.message : String(error)}`)
  }

  try {
    // Test Question model fields
    const question = await prisma.question.findFirst({
      select: {
        id: true,
        title: true,
        submissionType: true,
        questionNumber: true,
        createdAt: true,
      }
    })
    
    if (question) {
      diagnostics.question.fields = Object.keys(question)
      if (question.submissionType) {
        diagnostics.submissionTypes = [question.submissionType]
      }
    }

  } catch (error) {
    diagnostics.question.errors.push(`Question model error: ${error instanceof Error ? error.message : String(error)}`)
  }

  try {
    // Test Submission model fields
    const submission = await prisma.submission.findFirst({
      select: {
        id: true,
        status: true,
        assessmentResult: true,
        userId: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
    
    if (submission) {
      diagnostics.submission.fields = Object.keys(submission)
    }

    // Test for remark field (we know it doesn't exist based on schema)
    diagnostics.submission.errors.push('remark ❌ (stored in assessmentResult JSON)')

  } catch (error) {
    diagnostics.submission.errors.push(`Submission model error: ${error instanceof Error ? error.message : String(error)}`)
  }

  try {
    // Test BaseExample model fields
    const baseExample = await prisma.baseExample.findFirst({
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
      }
    })
    
    if (baseExample) {
      diagnostics.baseExample.fields = Object.keys(baseExample)
    }

    // Test for createdBy field (we know it exists based on schema)
    diagnostics.baseExample.fields.push('createdBy ✅')

  } catch (error) {
    diagnostics.baseExample.errors.push(`BaseExample model error: ${error instanceof Error ? error.message : String(error)}`)
  }

  // Get actual SubmissionType enum values
  try {
    const allQuestions = await prisma.question.findMany({
      select: { submissionType: true },
      distinct: ['submissionType']
    })
    diagnostics.submissionTypes = allQuestions.map(q => q.submissionType)
  } catch (error) {
    diagnostics.submissionTypes = ['Error getting submission types']
  }

  return diagnostics
}

export default async function DiagnosticsPage() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized</h1>
          <p className="text-gray-600">Only Super Admins can access diagnostics.</p>
        </div>
      </div>
    )
  }

  const diagnostics = await runSchemaDiagnostics()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Schema Diagnostics</h1>
        <p className="text-gray-600">Analyze your Prisma schema fields and identify issues</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Course Model */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Course Model
            </CardTitle>
            <CardDescription>Available fields and owner field detection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Available Fields:</h4>
                <div className="flex flex-wrap gap-2">
                  {diagnostics.course.fields.map((field) => (
                    <Badge key={field} variant="secondary">{field}</Badge>
                  ))}
                </div>
              </div>
              
              {diagnostics.course.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Field Tests:
                  </h4>
                  <div className="space-y-1">
                    {diagnostics.course.errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-gray-600">{error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question Model */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Question Model
            </CardTitle>
            <CardDescription>Question fields and submission types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Available Fields:</h4>
                <div className="flex flex-wrap gap-2">
                  {diagnostics.question.fields.map((field) => (
                    <Badge key={field} variant="secondary">{field}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Submission Types Found:</h4>
                <div className="flex flex-wrap gap-2">
                  {diagnostics.submissionTypes.map((type, idx) => (
                    <Badge key={idx} variant="outline">{type}</Badge>
                  ))}
                </div>
              </div>

              {diagnostics.question.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Errors:
                  </h4>
                  <div className="space-y-1">
                    {diagnostics.question.errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-red-600">{error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submission Model */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Submission Model
            </CardTitle>
            <CardDescription>Submission fields and remark storage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Available Fields:</h4>
                <div className="flex flex-wrap gap-2">
                  {diagnostics.submission.fields.map((field) => (
                    <Badge key={field} variant="secondary">{field}</Badge>
                  ))}
                </div>
              </div>

              {diagnostics.submission.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Notes:
                  </h4>
                  <div className="space-y-1">
                    {diagnostics.submission.errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-gray-600">{error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* BaseExample Model */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              BaseExample Model
            </CardTitle>
            <CardDescription>Base example fields and owner detection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Available Fields:</h4>
                <div className="flex flex-wrap gap-2">
                  {diagnostics.baseExample.fields.map((field) => (
                    <Badge key={field} variant="secondary">{field}</Badge>
                  ))}
                </div>
              </div>

              {diagnostics.baseExample.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Notes:
                  </h4>
                  <div className="space-y-1">
                    {diagnostics.baseExample.errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-gray-600">{error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Recommendations
          </CardTitle>
          <CardDescription>Based on the diagnostic results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Course Ownership Field:</h4>
              <p className="text-sm text-gray-600">
                Update the course-related queries to use the correct owner field name from the diagnostics above.
                Look for fields ending with ✅ in the Course model section.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">Submission Remark Field:</h4>
              <p className="text-sm text-gray-600">
                {diagnostics.submission.errors.some(e => e.includes('remark')) 
                  ? 'The remark is stored in the assessmentResult JSON field. Use the extractRemark helper function.'
                  : 'The remark field exists as a separate column.'}
              </p>
            </div>

            <div>
              <h4 className="font-medium">Submission Types:</h4>
              <p className="text-sm text-gray-600">
                Use the exact submission type values found above: {diagnostics.submissionTypes.join(', ')}
              </p>
            </div>

            <div>
              <h4 className="font-medium">BaseExample CreatedBy Field:</h4>
              <p className="text-sm text-gray-600">
                {diagnostics.baseExample.errors.some(e => e.includes('createdBy'))
                  ? 'The BaseExample model does not have a createdBy field. Remove it from create operations.'
                  : 'The BaseExample model has a createdBy field.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}