import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, FolderKanban, AlertTriangle, ShieldAlert } from 'lucide-react'
import { StepTracker } from '@/components/projects/step-tracker'
import { StatusBadge } from '@/components/projects/status-badge'
import { formatDateLong } from '@/lib/utils/format'
import type { ProjectStatus } from '@/types'

const STALE_DAYS = 30

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getJoinedName(val: any): string | null {
  if (!val) return null
  if (Array.isArray(val)) return val[0]?.name || null
  return val.name || null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getJoinedCode(val: any): string | null {
  if (!val) return null
  if (Array.isArray(val)) return val[0]?.code || null
  return val.code || null
}

function isStale(updatedAt: string | null, status: string): boolean {
  if (!updatedAt) return false
  // Only flag active and on_hold projects — approved/cancelled/not_approved are done
  if (status !== 'active' && status !== 'on_hold') return false
  const daysSince = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince > STALE_DAYS
}

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'issues', label: 'Issues' },
  { key: 'stale', label: 'Stale' },
  { key: 'on_hold', label: 'On Hold' },
  { key: 'approved', label: 'Approved' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'not_approved', label: 'Not Approved' },
]

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const staleFilter = params.status === 'stale'
  const issuesFilter = params.status === 'issues'
  const staleThreshold = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000).toISOString()

  let query = supabase
    .from('projects')
    .select(`
      id, file_number, physical_address, current_step, status, updated_at,
      application_submission_date, present_zoning, zoning_applied_for,
      client:clients(name),
      application_type:application_types(name),
      municipality:municipalities(code),
      department_comments(has_issue)
    `)
    .order('updated_at', { ascending: true }) // oldest first for stale view

  if (staleFilter) {
    // Stale = active or on_hold projects not updated in 30+ days
    query = query
      .in('status', ['active', 'on_hold'])
      .lt('updated_at', staleThreshold)
  } else {
    if (params.status && params.status !== 'all' && !issuesFilter) {
      query = query.eq('status', params.status)
    }
    // Default: newest first
    query = query.order('updated_at', { ascending: false })
  }

  if (params.search) {
    query = query.or(
      `file_number.ilike.%${params.search}%,physical_address.ilike.%${params.search}%,legal_description.ilike.%${params.search}%`
    )
  }

  let { data: projects } = await query.limit(100)

  // Client-side filter for issues (PostgREST can't filter by nested boolean easily)
  if (issuesFilter && projects) {
    projects = projects.filter((p) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p.department_comments as any[])?.some((c) => c.has_issue)
    )
  }

  const activeFilter = params.status || 'all'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {projects?.length ?? 0} project{projects?.length !== 1 ? 's' : ''} found
            {issuesFilter && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                <ShieldAlert className="h-3 w-3" />
                Projects with open department issues
              </span>
            )}
            {staleFilter && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                No activity for {STALE_DAYS}+ days
              </span>
            )}
          </p>
        </div>
        <Link href="/projects/new">
          <Button size="sm" className="gap-1.5 rounded-xl px-4 text-[13px] font-semibold">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-muted/50 p-1">
        {STATUS_FILTERS.map((filter) => (
          <Link
            key={filter.key}
            href={`/projects${filter.key !== 'all' ? `?status=${filter.key}` : ''}`}
          >
            <button
              className={`rounded-lg px-3.5 py-2 text-[13px] font-medium transition-all ${
                activeFilter === filter.key
                  ? filter.key === 'issues'
                    ? 'bg-red-600 text-white shadow-sm'
                    : filter.key === 'stale'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white text-foreground shadow-sm'
                  : filter.key === 'issues'
                  ? 'text-red-600 hover:text-red-700'
                  : filter.key === 'stale'
                  ? 'text-amber-600 hover:text-amber-700'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {filter.key === 'issues' && (
                <ShieldAlert className="mr-1 inline h-3.5 w-3.5" />
              )}
              {filter.key === 'stale' && (
                <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
              )}
              {filter.label}
            </button>
          </Link>
        ))}
      </div>

      {/* Project List */}
      <Card className="border-border/40 shadow-sm">
        <CardContent className="p-0">
          {projects && projects.length > 0 ? (
            <div className="divide-y divide-border/40">
              {projects.map((project) => {
                const stale = isStale(project.updated_at, project.status)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const hasIssues = (project.department_comments as any[])?.some((c) => c.has_issue) ?? false
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className={`group flex items-center gap-4 px-5 py-4 transition-all hover:bg-muted/20 ${
                      hasIssues ? 'bg-red-50/40' : stale ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[13px] font-semibold">
                          {project.file_number}
                        </span>
                        <StatusBadge status={project.status as ProjectStatus} />
                        {getJoinedCode(project.municipality) && (
                          <span className="rounded-lg bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {getJoinedCode(project.municipality)}
                          </span>
                        )}
                        {hasIssues && (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                            <ShieldAlert className="h-3 w-3" />
                            Issue
                          </span>
                        )}
                        {stale && !hasIssues && (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                            <AlertTriangle className="h-3 w-3" />
                            Stale
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-[13px] text-muted-foreground">
                        {getJoinedName(project.client) || 'No client'} &middot;{' '}
                        {getJoinedName(project.application_type) || 'No type'}
                      </p>
                      {project.physical_address && (
                        <p className="mt-0.5 truncate text-[12px] text-muted-foreground/60">
                          {project.physical_address}
                        </p>
                      )}
                      <p className={`mt-1 text-[11px] tabular-nums ${hasIssues ? 'font-semibold text-red-600' : stale ? 'font-semibold text-amber-600' : 'text-muted-foreground/50'}`}>
                        {formatDateLong(project.updated_at)}
                      </p>
                    </div>
                    <div className="hidden w-44 shrink-0 lg:block">
                      <StepTracker currentStep={project.current_step} compact />
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                {issuesFilter
                  ? <ShieldAlert className="h-7 w-7 text-red-400" />
                  : staleFilter
                  ? <AlertTriangle className="h-7 w-7 text-amber-400" />
                  : <FolderKanban className="h-7 w-7 text-muted-foreground/30" />
                }
              </div>
              <p className="mt-4 text-[14px] font-medium text-muted-foreground">
                {issuesFilter ? 'No open issues' : staleFilter ? 'No stale projects' : 'No projects found'}
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground/60">
                {issuesFilter
                  ? 'No department issues have been flagged across any projects.'
                  : staleFilter
                  ? 'All active projects have been updated within the last 30 days.'
                  : 'Try adjusting your filters or create a new project.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
