import { createNotification } from '@/lib/notifications'

export async function logAdminAction(
  adminUserId: string,
  adminEmail: string,
  action: string,
  entityType: string,
  entityData: Record<string, any>
) {
  try {
    // Get all admin users to notify
    const response = await fetch('/api/admin/users?role=admin')
    const usersData = await response.json()
    const adminUsers = usersData.users || []

    // Create notification for all admins
    for (const admin of adminUsers) {
      await createNotification({
        userId: admin.id,
        type: 'ADMIN_LOG',
        data: {
          performedBy: adminEmail || 'Unknown',
          action,
          entityType,
          details: entityData,
          timestamp: new Date().toISOString(),
        },
      })
    }
  } catch (error) {
    console.error('Failed to log admin action:', error)
    // Don't fail the operation if logging fails
  }
}
