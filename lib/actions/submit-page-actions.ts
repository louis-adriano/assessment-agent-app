'use server'

import { redirect } from 'next/navigation'
import { submitAssessment } from './submission-actions'

/**
 * Handle form submission from the submit page
 */
export async function handleFormSubmission(formData: FormData) {
  const courseName = formData.get('courseName') as string
  const questionNumber = parseInt(formData.get('questionNumber') as string)
  const submissionType = formData.get('submissionType') as string
  const content = formData.get('content') as string
  const additionalInfo = formData.get('additionalInfo') as string

  console.log('🚀 Handling form submission:', { 
    courseName, 
    questionNumber, 
    submissionType, 
    contentLength: content.length 
  })

  const result = await submitAssessment(
    courseName,
    questionNumber, 
    submissionType,
    content,
    additionalInfo
  )
  
  if (result.success) {
    redirect(`/results/${result.submissionId}`)
  } else {
    throw new Error(result.error || 'Failed to submit assessment')
  }
}