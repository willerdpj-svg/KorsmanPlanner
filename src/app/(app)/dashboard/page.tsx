import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderKanban, CheckCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react'
import { StepTracker } from '@/components/projects/step-tracker'
import { StatusBadge } from '@/components/projects/status-badge'
import { formatDateLong } from '@/lib/utils/format'
import Link from 'next/link'
import type { ProjectStatus } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getJoinedName(val: any): string | null {
  if (!val) return null
  if (Array.isArray(val)) return val[0]?.name || null
  return val.name || null
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { count: totalActive } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: totalApproved } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')

  const { count: totalOnHold } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'on_hold')

  const { count: totalAll } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })

  const { data: recentProjects } = await supabase
    .from('projects')
    .select(`
      id, file_number, physical_address, current_step, status, updated_at,
      client:clients(name),
      application_type:application_types(name)
    `)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(10)

  const { data: stepDistribution } = await supabase
    .from('projects')
    .select('current_step')
    .eq('status', 'active')

  const stepCounts = [0, 0, 0, 0, 0, 0, 0]
  stepDistribution?.forEach((p) => {
    if (p.current_step >= 1 && p.current_step <= 7) {
      stepCounts[p.current_step - 1]++
    }
  })

  const maxStep = Math.max(...stepCounts, 1)

  const stats = [
    {
      title: 'Total Projects',
      value: totalAll ?? 0,
      icon: FolderKanban,
      accent: 'bg-primary/10 text-primary',
    },
    {
      title: 'Active',
      value: totalActive ?? 0,
      icon: Clock,
      accent: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Approved',
      value: totalApproved ?? 0,
      icon: CheckCircle,
      accent: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'On Hold',
      value: totalOnHold ?? 0,
      icon: AlertTriangle,
      accent: 'bg-amber-50 text-amber-600',
    },
  ]

  const stepLabels = ['Filed', 'Public Part.', 'Dept Cmts', 'TP Review', 'Admin', 'Council', 'Resolution']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your project portfolio
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums">{stat.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.accent}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Application Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            {stepCounts.map((count, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-sm font-semibold tabular-nums">{count}</span>
                <div
                  className="w-full rounded-md bg-primary/80 transition-all"
                  style={{
                    height: `${Math.max(6, (count / maxStep) * 120)}px`,
                  }}
                />
                <span className="text-[10px] font-medium text-muted-foreground">
                  {stepLabels[i]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Active Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent Active Projects</CardTitle>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentProjects && recentProjects.length > 0 ? (
            <div className="space-y-2">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group flex items-center justify-between rounded-lg border border-transparent p-3 transition-all hover:border-border hover:bg-muted/40 hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">
                        {project.file_number}
                      </span>
                      <StatusBadge status={project.status as ProjectStatus} />
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {getJoinedName(project.client) || 'No client'} &middot;{' '}
                      {getJoinedName(project.application_type) || 'No type'}
                    </p>
                  </div>
                  <div className="ml-4 hidden w-48 sm:block">
                    <StepTracker currentStep={project.current_step} compact />
                  </div>
                  <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                    {formatDateLong(project.updated_at)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-center">
              <FolderKanban className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">No projects yet</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Create your first project to get started.</p>
              <Link href="/projects/new" className="mt-4 text-sm font-medium text-primary hover:text-primary/80">
                Create project
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
