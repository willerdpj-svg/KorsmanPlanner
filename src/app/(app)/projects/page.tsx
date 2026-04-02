import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { StepTracker } from '@/components/projects/step-tracker'
import { StatusBadge } from '@/components/projects/status-badge'
import { formatDateLong, formatCurrency } from '@/lib/utils/format'
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
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'active', 'on_hold', 'approved', 'cancelled', 'not_approved'].map(
          (status) => (
            <Link
              key={status}
              href={`/projects${status !== 'all' ? `?status=${status}` : ''}`}
            >
              <Button
                variant={
                  (params.status || 'all') === status ? 'default' : 'outline'
                }
                size="sm"
              >
                {status === 'all'
                  ? 'All'
                  : status === 'not_approved'
                    ? 'Not Approved'
                    : status === 'on_hold'
                      ? 'On Hold'
                      : status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            </Link>
          )
        )}
      </div>

      {/* Project List */}
      <Card>
        <CardContent className="p-0">
          {projects && projects.length > 0 ? (
            <div className="divide-y">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">
                        {project.file_number}
                      </span>
                      <StatusBadge status={project.status as ProjectStatus} />
                      {getJoinedCode(project.municipality) && (
                        <span className="text-xs text-muted-foreground">
                          {getJoinedCode(project.municipality)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {getJoinedName(project.client) || 'No client'} &middot;{' '}
                      {getJoinedName(project.application_type) || 'No type'}
                    </p>
                    {project.physical_address && (
                      <p className="truncate text-xs text-muted-foreground">
                        {project.physical_address}
                      </p>
                    )}
                  </div>
                  <div className="hidden w-48 lg:block">
                    <StepTracker currentStep={project.current_step} compact />
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDateLong(project.updated_at)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No projects found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
