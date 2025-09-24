import { findCourseByName, findQuestionByNumber, getCourseQuestions } from '@/lib/actions/lookup-actions'
import { submitAnonymousAssessment, getAnonymousSubmissionResult } from '@/lib/actions/submission-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

async function testLookupFunctions() {
  console.log('Testing Sprint 1 lookup functions...')
  
  // Test 1: Find course by name
  const courseResult = await findCourseByName('Business Analyst')
  console.log('Course lookup result:', courseResult)
  
  // Test 2: Find question by course name and number
  const questionResult = await findQuestionByNumber('Business Analyst', 1)
  console.log('Question lookup result:', questionResult)
  
  // Test 3: Get course questions
  const questionsResult = await getCourseQuestions('Business Analyst')
  console.log('Course questions result:', questionsResult)
  
  return { courseResult, questionResult, questionsResult }
}

async function TestSubmissionForm({ courseName, questionNumber }: { courseName: string, questionNumber: number }) {
  async function handleSubmit(formData: FormData): Promise<void> {
    'use server'
    console.log('Submitting test assessment...')
    const result = await submitAnonymousAssessment(formData)
    console.log('Submission result:', result)
    // Do not return result, just handle it here
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Anonymous Submission</CardTitle>
        <CardDescription>Test the core Sprint 1 functionality</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="courseName" value={courseName} />
          <input type="hidden" name="questionNumber" value={questionNumber} />
          
          <div>
            <label htmlFor="submissionContent" className="block text-sm font-medium mb-2">
              Test Response
            </label>
            <textarea
              id="submissionContent"
              name="submissionContent"
              required
              rows={6}
              className="w-full px-3 py-2 border border-input rounded-md"
              defaultValue="I will compare Claude, ChatGPT, and Gemini. Claude costs $20/month and is good for document analysis. ChatGPT also costs $20/month and has plugins. Gemini integrates with Google services. For business analysis, Claude is good for requirements, ChatGPT for process mapping."
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground rounded-md py-2 px-4 hover:bg-primary/90"
          >
            Test Submit
          </button>
        </form>
      </CardContent>
    </Card>
  )
}

export default async function TestPage() {
  const testResults = await testLookupFunctions()

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Sprint 1 Testing</h1>
      
      <div className="space-y-6">
        {/* Display test results */}
        <Card>
          <CardHeader>
            <CardTitle>Lookup Functions Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <strong>Course Lookup:</strong> 
                <span className={testResults.courseResult.success ? 'text-green-600' : 'text-red-600'}>
                  {testResults.courseResult.success ? ' ✅ Success' : ' ❌ Failed'}
                </span>
                {testResults.courseResult.data && (
                  <div className="ml-4 text-muted-foreground">
                    Found: {testResults.courseResult.data.name}
                  </div>
                )}
              </div>
              
              <div>
                <strong>Question Lookup:</strong>
                <span className={testResults.questionResult.success ? 'text-green-600' : 'text-red-600'}>
                  {testResults.questionResult.success ? ' ✅ Success' : ' ❌ Failed'}
                </span>
                {testResults.questionResult.data && (
                  <div className="ml-4 text-muted-foreground">
                    Found: {testResults.questionResult.data.title}
                  </div>
                )}
              </div>
              
              <div>
                <strong>Course Questions:</strong>
                <span className={testResults.questionsResult.success ? 'text-green-600' : 'text-red-600'}>
                  {testResults.questionsResult.success ? ' ✅ Success' : ' ❌ Failed'}
                </span>
                {testResults.questionsResult.data && (
                  <div className="ml-4 text-muted-foreground">
                    Found {testResults.questionsResult.data.length} questions
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test submission form */}
        {testResults.questionResult.success && (
          <TestSubmissionForm courseName="Business Analyst" questionNumber={1} />
        )}
      </div>
    </div>
  )
}