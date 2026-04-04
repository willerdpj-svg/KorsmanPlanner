'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils/format'
import { AlertTriangle, CheckCircle2, ArrowRight, User, Filter } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const DEPT_LABELS: Record<string, string> = {
  town_planning: 'Town Planning',
  electricity: 'Electricity',
  water_sewer: 'Water & Sewer',
  roads_stormwater: 'Roads & Storm Water',
  environmental: 'Environmental Affairs',
  building_control: 'Building Control',
}

interface TasksListProps {
  openIssues: unknown[]
  resolvedIssues: unknown[]
  currentUserId: string
  currentFilter: string
  dateFrom: string
  dateTo: string
}

export function TasksList({
  openIssues,
  resolvedIssues,
  currentUserId,
  currentFilter,
  dateFrom: initialFrom,
  dateTo: initialTo,
}: TasksListProps) {
  const router = useRouter()
  const [dateFrom, setDateFrom] = useState(initialFrom)
  const [dateTo, setDateTo] = useState(initialTo)

  const filters = [
    { key: 'open', label: 'Open', count: currentFilter === 'open' || currentFilter === 'all' ? openIssues.length : null },
    { key: 'resolved', label: 'Resolved', count: currentFilter === 'resolved' || currentFilter === 'all' ? resolvedIssues.length : null },
    { key: 'all', label: 'All' },
  ]

  function applyFilter(filter: string) {
    const params = new URLSearchParams()
    params.set('filter', filter)
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)
    router.push(`/tasks?${params.toString()}`)
  }

  function applyDateRange() {
    const params = new URLSearchParams()
    params.set('filter', currentFilter)
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)
    router.push(`/tasks?${params.toString()}`)
  }

  function clearDates() {
    setDateFrom('')
    setDateTo('')
    router.push(`/tasks?filter=${currentFilter}`)
  }

  // Split open issues into my tasks and others
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myOpenTasks = openIssues.filter((i: any) => i.issue_assigned_to === currentUserId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const otherOpenTasks = openIssues.filter((i: any) => i.issue_assigned_to !== currentUserId)

  const totalCount = openIssues.length + resolvedIssues.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Tasks</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Department issues across all projects.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-border/60 bg-muted/30 p-0.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => applyFilter(f.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                currentFilter === f.key
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.key === 'open' && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
              {f.key === 'resolved' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
              {f.label}
              {f.count != null && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                  {f.count}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 w-[140px] text-[12px]"
              placeholder="From"
            />
            <span className="text-[12px] text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 w-[140px] text-[12px]"
              placeholder="To"
            />
            <Button size="sm" variant="outline" onClick={applyDateRange} className="h-8 text-[12px]">
              Apply
            </Button>
            {(dateFrom || dateTo) && (
              <Button size="sm" variant="ghost" onClick={clearDates} className="h-8 text-[12px]">
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Open issues */}
      {(currentFilter === 'open' || currentFilter === 'all') && (
        <>
          {/* My tasks section */}
          {myOpenTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-[15px] font-semibold flex items-center gap-2">
                Assigned to me
                <Badge variant="secondary" className="bg-red-50 text-red-600 text-[11px]">
                  {myOpenTasks.length}
                </Badge>
              </h2>
              {myOpenTasks.map((issue: unknown) => (
                <TaskCard key={(issue as { id: string }).id} issue={issue} currentUserId={currentUserId} resolved={false} />
              ))}
            </div>
          )}

          {/* Other open tasks */}
          <div className="space-y-3">
            <h2 className="text-[15px] font-semibold flex items-center gap-2">
              {myOpenTasks.length > 0 ? 'Other open tasks' : 'Open tasks'}
              {otherOpenTasks.length > 0 && (
                <Badge variant="secondary" className="bg-amber-50 text-amber-600 text-[11px]">
                  {otherOpenTasks.length}
                </Badge>
              )}
            </h2>
            {otherOpenTasks.length > 0 ? (
              otherOpenTasks.map((issue: unknown) => (
                <TaskCard key={(issue as { id: string }).id} issue={issue} currentUserId={currentUserId} resolved={false} />
              ))
            ) : myOpenTasks.length === 0 ? (
              <Card className="border-border/40 shadow-sm">
                <CardContent className="flex flex-col items-center py-10 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  <p className="mt-3 text-[13px] text-muted-foreground">No open tasks.</p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </>
      )}

      {/* Resolved issues */}
      {(currentFilter === 'resolved' || currentFilter === 'all') && (
        <div className="space-y-3">
          <h2 className="text-[15px] font-semibold flex items-center gap-2">
            Resolved tasks
            {resolvedIssues.length > 0 && (
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 text-[11px]">
                {resolvedIssues.length}
              </Badge>
            )}
          </h2>
          {resolvedIssues.length > 0 ? (
            resolvedIssues.map((issue: unknown) => (
              <TaskCard key={(issue as { id: string }).id} issue={issue} currentUserId={currentUserId} resolved={true} />
            ))
          ) : (
            <Card className="border-border/40 shadow-sm">
              <CardContent className="py-6 text-center">
                <p className="text-[13px] text-muted-foreground">No resolved tasks found.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function TaskCard({
  issue,
  currentUserId,
  resolved,
}: {
  issue: unknown
  currentUserId: string
  resolved: boolean
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const i = issue as any
  const project = i.project as { id: string; file_number: string; status: string; client: { name: string } | null } | null
  if (!project) return null

  const isMyTask = i.issue_assigned_to === currentUserId
  const assigneeArr = i.assignee as { id: string; full_name: string; title: string | null }[] | null
  const assignee = assigneeArr?.[0] ?? null

  const statusColor = i.status === 'received'
    ? 'bg-emerald-50 text-emerald-700'
    : i.status === 'requested'
    ? 'bg-blue-50 text-blue-700'
    : 'bg-slate-100 text-slate-600'

  return (
    <Link href={`/projects/${project.id}?tab=departments`}>
      <Card className={`border-border/40 shadow-sm transition-all hover:shadow-md hover:border-border cursor-pointer border-l-4 ${
        resolved
          ? 'border-l-emerald-400 opacity-80'
          : isMyTask
          ? 'border-l-red-400'
          : 'border-l-amber-300'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                resolved ? 'bg-emerald-50' : isMyTask ? 'bg-red-50' : 'bg-amber-50'
              }`}>
                {resolved ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className={`h-4 w-4 ${isMyTask ? 'text-red-500' : 'text-amber-500'}`} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[14px] font-bold">{project.file_number}</span>
                  <Badge variant="secondary" className="bg-red-50 text-red-600 text-[11px]">
                    {DEPT_LABELS[i.department] || i.department}
                  </Badge>
                  <Badge variant="secondary" className={`text-[11px] ${statusColor}`}>
                    {i.status}
                  </Badge>
                  {resolved && (
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 text-[11px]">
                      Resolved
                    </Badge>
                  )}
                </div>
                {project.client && (
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Client: {project.client.name}
                  </p>
                )}
                {i.issue_notes && (
                  <p className="mt-1.5 text-[13px] text-foreground/80 line-clamp-2">
                    {i.issue_notes}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3 text-[12px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {assignee ? (
                      <>
                        {assignee.full_name}
                        {assignee.title && ` (${assignee.title})`}
                      </>
                    ) : (
                      <span className="italic">Unassigned</span>
                    )}
                  </span>
                  {resolved && i.issue_resolved_at && (
                    <span>Resolved {formatDate(i.issue_resolved_at)}</span>
                  )}
                  {!resolved && i.issue_created_at && (
                    <span>Created {formatDate(i.issue_created_at)}</span>
                  )}
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground mt-2" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
