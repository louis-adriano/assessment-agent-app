'use server'

import { prisma } from '@/lib/prisma'

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  submissionId: string,
  type: string,
  title: string,
  message: string
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        submissionId,
        type,
        title,
        message,
      },
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to create notification:', error)
    return { success: false, error: 'Failed to create notification' }
  }
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: string) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      include: {
        submission: {
          include: {
            question: {
              include: {
                course: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return { success: true, data: notifications }
  } catch (error) {
    console.error('Failed to get notifications:', error)
    return { success: false, error: 'Failed to get notifications', data: [] }
  }
}

/**
 * Get all notifications for a user (with pagination)
 */
export async function getAllNotifications(userId: string, limit = 20) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      include: {
        submission: {
          include: {
            question: {
              include: {
                course: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })
    return { success: true, data: notifications }
  } catch (error) {
    console.error('Failed to get all notifications:', error)
    return { success: false, error: 'Failed to get notifications', data: [] }
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
    return { success: false, error: 'Failed to mark notification as read' }
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
    return { success: false, error: 'Failed to mark all notifications as read' }
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string) {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    })
    return { success: true, count }
  } catch (error) {
    console.error('Failed to get unread count:', error)
    return { success: false, count: 0 }
  }
}

/**
 * Trigger notification when manual review is added
 */
export async function notifyManualReview(submissionId: string) {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        question: {
          include: {
            course: true,
          },
        },
        user: true,
      },
    })

    if (!submission || !submission.userId) {
      // No user to notify (anonymous submission)
      return { success: false, error: 'No user associated with submission' }
    }

    const courseName = submission.question.course.name
    const questionNumber = submission.question.questionNumber

    await createNotification(
      submission.userId,
      submissionId,
      'MANUAL_REVIEW',
      'Manual Review Received',
      `Your submission for ${courseName} - Question ${questionNumber} has been manually reviewed by an instructor.`
    )

    return { success: true }
  } catch (error) {
    console.error('Failed to notify manual review:', error)
    return { success: false, error: 'Failed to notify manual review' }
  }
}
