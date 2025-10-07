import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const submissions = await prisma.submission.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        question: {
          include: {
            course: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      submissions
    })
  } catch (error) {
    console.error('Failed to fetch submissions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
