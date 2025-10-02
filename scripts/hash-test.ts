import { hash } from 'better-auth/crypto'

async function testHash() {
  const hashedPassword = await hash('superadmin123')
  console.log('Better Auth hash:', hashedPassword)
}

testHash().catch(console.error)