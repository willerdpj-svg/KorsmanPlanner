import { PROJECT_STATUSES, type ProjectStatus } from '@/types'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: ProjectStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = PROJECT_STATUSES.find((s) => s.value === status)
  if (!config) return null

  return (
    <span className={cn(
      'inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-semibold',
      config.color
    )}>
      {config.label}
    </span>
  )
}
