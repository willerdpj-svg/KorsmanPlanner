import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderKanban, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
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

  // Fetch stats
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

  // Fetch recent projects
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

  // Fetch step distribution for active projects
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

  const stats = [
    {
      title: 'Total Projects',
      value: totalAll ?? 0,
      icon: FolderKanban,
      color: 'text-blue-600',
    },
    {
      title: 'Active',
      value: totalActive ?? 0,
      icon: Clock,
      color: 'text-blue-600',
    },
    {
      title: 'Approved',
      value: totalApproved ?? 0,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'On Hold',
      value: totalOnHold ?? 0,
      icon: AlertTriangle,
      color: 'text-amber-600',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Projects Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2">
            {stepCounts.map((count, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-lg font-bold">{count}</span>
                <div
                  className="w-full rounded-t bg-blue-500"
                  style={{
                    height: `${Math.max(4, (count / Math.max(...stepCounts, 1)) * 120)}px`,
                  }}
                />
                <span className="text-[10px] text-muted-foreground">
                  Step {i + 1}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Active Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Active Projects</CardTitle>
          <Link
            href="/projects"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {recentProjects && recentProjects.length > 0 ? (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/50"
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
            <p className="py-8 text-center text-sm text-muted-foreground">
              No projects yet. Create your first project to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
