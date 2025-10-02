import { auth } from '@/lib/auth/config'

async function createUsers() {
  try {
    // Create users using Better Auth's built-in signup
    const users = [
      { email: 'superadmin@example.com', password: 'superadmin123', name: 'Super Admin' },
      { email: 'courseadmin@example.com', password: 'courseadmin123', name: 'Course Admin' },
      { email: 'student@example.com', password: 'student123', name: 'Student' }
    ]

    for (const user of users) {
      try {
        await auth.api.signUpEmail({
          body: {
            email: user.email,
            password: user.password,
            name: user.name,
          }
        })
        console.log(`✅ Created: ${user.email}`)
      } catch (error) {
        console.log(`⚠️ ${user.email}: ${error.message}`)
      }
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

createUsers()