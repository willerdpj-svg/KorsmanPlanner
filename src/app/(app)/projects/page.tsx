import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, FolderKanban } from 'lucide-react'
import { StepTracker } from '@/components/projects/step-tracker'
import { StatusBadge } from '@/components/projects/status-badge'
import { formatDateLong } from '@/lib/utils/format'
import type { ProjectStatus } from '@/types'

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

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
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

  let query = supabase
    .from('projects')
    .select(`
      id, file_number, physical_address, current_step, status, updated_at,
      application_submission_date, present_zoning, zoning_applied_for,
      client:clients(name),
      application_type:application_types(name),
      municipality:municipalities(code)
    `)
    .order('updated_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.search) {
    query = query.or(
      `file_number.ilike.%${params.search}%,physical_address.ilike.%${params.search}%,legal_description.ilike.%${params.search}%`
    )
  }

  const { data: projects } = await query.limit(100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {projects?.length ?? 0} projects found
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
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
        {STATUS_FILTERS.map((filter) => (
          <Link
            key={filter.key}
            href={`/projects${filter.key !== 'all' ? `?status=${filter.key}` : ''}`}
          >
            <button
              className={`rounded-lg px-3.5 py-2 text-[13px] font-medium transition-all ${
                (params.status || 'all') === filter.key
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
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
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group flex items-center gap-4 px-5 py-4 transition-all hover:bg-muted/20"
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
                  </div>
                  <div className="hidden w-48 lg:block">
                    <StepTracker currentStep={project.current_step} compact />
                  </div>
                  <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground/70">
                    {formatDateLong(project.updated_at)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                <FolderKanban className="h-7 w-7 text-muted-foreground/30" />
              </div>
              <p className="mt-4 text-[14px] font-medium text-muted-foreground">No projects found</p>
              <p className="mt-1 text-[13px] text-muted-foreground/60">
                Try adjusting your filters or create a new project.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
