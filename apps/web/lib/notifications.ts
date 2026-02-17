import { prisma } from '@gladiator/database/src/client'
import { NotificationType } from '@prisma/client'

/**
 * Create a notification for a user
 */
export async function createNotification({
  userId,
  type,
  data,
  expiresAt,
}: {
  userId: string
  type: NotificationType
  data: Record<string, any>
  expiresAt?: Date
}) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        data,
        expiresAt,
      },
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
    // Don't throw - notification creation should not block main operations
  }
}

/**
 * Create notifications for multiple users (batch)
 */
export async function createNotificationsForUsers({
  userIds,
  type,
  data,
}: {
  userIds: string[]
  type: NotificationType
  data: Record<string, any>
}) {
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        data,
      })),
    })
    return userIds.length
  } catch (error) {
    console.error('Failed to create batch notifications:', error)
    return 0
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const now = new Date()
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  })
}
