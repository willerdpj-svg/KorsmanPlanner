import { Badge } from '@/components/ui/badge'
import { PROJECT_STATUSES, type ProjectStatus } from '@/types'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: ProjectStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = PROJECT_STATUSES.find((s) => s.value === status)
  if (!config) return null

  return (
    <Badge variant="secondary" className={cn('font-medium', config.color)}>
      {config.label}
    </Badge>
  )
}
