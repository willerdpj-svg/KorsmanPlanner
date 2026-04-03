'use client'

import type { DepartmentComment } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Check, Clock, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils/format'

interface Department {
  key: string
  label: string
}

interface DepartmentChecklistProps {
  departments: Department[]
  comments: DepartmentComment[]
  onStatusChange?: (department: string, status: string) => void
}

const statusConfig = {
  pending: { icon: Circle, color: 'text-muted-foreground', badge: 'bg-slate-100 text-slate-600' },
  requested: { icon: Clock, color: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
  received: { icon: Check, color: 'text-green-500', badge: 'bg-green-100 text-green-700' },
}

export function DepartmentChecklist({ departments, comments, onStatusChange }: DepartmentChecklistProps) {
  return (
    <div className="space-y-2">
      {departments.map((dept) => {
        const comment = comments.find((c) => c.department === dept.key)
        const status = (comment?.status || 'pending') as keyof typeof statusConfig
        const config = statusConfig[status] ?? statusConfig.pending
        const Icon = config.icon

        return (
          <div
            key={dept.key}
            className="flex items-center justify-between rounded-xl border border-border/40 p-3"
          >
            <div className="flex items-center gap-3">
              <Icon className={cn('h-4 w-4', config.color)} />
              <span className="text-[13px] font-medium">{dept.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {comment?.received_date && (
                <span className="text-[12px] text-muted-foreground">
                  {formatDate(comment.received_date)}
                </span>
              )}
              <Badge
                variant="secondary"
                className={cn('cursor-default text-[11px] capitalize', config.badge, onStatusChange && 'cursor-pointer')}
                onClick={() => {
                  if (!onStatusChange) return
                  const next = status === 'pending' ? 'requested' : status === 'requested' ? 'received' : 'pending'
                  onStatusChange(dept.key, next)
                }}
              >
                {status}
              </Badge>
            </div>
          </div>
        )
      })}
    </div>
  )
}
