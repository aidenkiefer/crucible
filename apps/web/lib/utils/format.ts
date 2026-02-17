/**
 * Format gold with k/M suffixes
 * 1250 → "1.2k"
 * 1250000 → "1.2M"
 */
export function formatGold(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}k`
  }
  return amount.toString()
}

/**
 * Format relative time
 * "2m ago", "1h ago", "3d ago"
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - then.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  return `${diffDay}d ago`
}

/**
 * Get notification icon emoji by type
 */
export function getNotificationIcon(type: string): string {
  switch (type) {
    case 'FRIEND_REQUEST':
      return '👥'
    case 'CHALLENGE':
      return '⚔️'
    case 'ANNOUNCEMENT':
      return '📢'
    case 'ADMIN_LOG':
      return '🔧'
    default:
      return '🔔'
  }
}

/**
 * Get notification title by type and data
 */
export function getNotificationTitle(
  type: string,
  data: Record<string, any>
): string {
  switch (type) {
    case 'FRIEND_REQUEST':
      return `Friend request from ${data.fromUsername}`
    case 'CHALLENGE':
      return `Arena challenge from ${data.fromUsername}!`
    case 'ANNOUNCEMENT':
      return data.title || 'New announcement'
    case 'ADMIN_LOG':
      return `${data.performedBy} ${data.action} ${data.entityType}`
    default:
      return 'Notification'
  }
}
