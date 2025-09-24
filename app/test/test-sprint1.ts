// Simple test script for Sprint 1 LLM connectivity
// Run this with: npm run test:sprint1

import { testLLMConnection } from '../../lib/services/llm-service'

async function testSprint1() {
  console.log('Testing Sprint 1 LLM Implementation...\n')

  // Test LLM Connection
  console.log('1. Testing LLM Connection...')
  try {
    const llmTest = await testLLMConnection()
    
    if (llmTest.success) {
      console.log('✅ LLM Connection: SUCCESS')
      console.log('   Available models:', llmTest.models.join(', '))
    } else {
      console.log('❌ LLM Connection: FAILED')
      if (llmTest.error) {
        console.log('   Error:', llmTest.error)
      }
    }
  } catch (error) {
    console.log('❌ LLM Connection: FAILED')
    console.log('   Error:', error instanceof Error ? error.message : 'Unknown error')
  }

  console.log('\n2. Checking Environment Variables...')
  const requiredEnvVars = ['GROQ_API_KEY', 'DATABASE_URL', 'NEXTAUTH_SECRET']
  
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar]
    if (value) {
      console.log(`✅ ${envVar}: Set (${value.substring(0, 10)}...)`)
    } else {
      console.log(`❌ ${envVar}: Missing`)
    }
  })

  console.log('\n✅ Sprint 1 Basic Testing Complete!')
  console.log('\nNext steps:')
  console.log('1. Start dev server: npm run dev')
  console.log('2. Test health check: http://localhost:3001/health')
  console.log('3. Ready for Sprint 2 UI development')
}

// Run the test
testSprint1().catch(console.error)