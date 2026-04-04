import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/format'
import { AlertTriangle, CheckCircle2, ArrowRight, User } from 'lucide-react'
import Link from 'next/link'

const DEPT_LABELS: Record<string, string> = {
  town_planning: 'Town Planning',
  electricity: 'Electricity',
  water_sewer: 'Water & Sewer',
  roads_stormwater: 'Roads & Storm Water',
  environmental: 'Environmental Affairs',
  building_control: 'Building Control',
}

export default async function TasksPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get ALL department issues (across all users)
  const { data: allIssues } = await supabase
    .from('department_comments')
    .select(`
      id, department, comments, issue_notes, has_issue, status,
      requested_date, received_date,
      issue_assigned_to,
      assignee:profiles!department_comments_issue_assigned_to_fkey(id, full_name, title),
      project:projects(id, file_number, status, client:clients(name))
    `)
    .eq('has_issue', true)
    .order('requested_date', { ascending: false })

  // Split into assigned to me vs others
  const myTasks = allIssues?.filter((i) => i.issue_assigned_to === user.id) ?? []
  const otherTasks = allIssues?.filter((i) => i.issue_assigned_to !== user.id) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Tasks</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {allIssues?.length ?? 0} open department issue{allIssues?.length !== 1 ? 's' : ''} across all projects.
        </p>
      </div>

      {/* My tasks */}
      <div className="space-y-3">
        <h2 className="text-[15px] font-semibold flex items-center gap-2">
          Assigned to me
          {myTasks.length > 0 && (
            <Badge variant="secondary" className="bg-red-50 text-red-600 text-[11px]">
              {myTasks.length}
            </Badge>
          )}
        </h2>
        {myTasks.length > 0 ? (
          myTasks.map((issue) => <TaskCard key={issue.id} issue={issue} currentUserId={user.id} />)
        ) : (
          <Card className="border-border/40 shadow-sm">
            <CardContent className="flex flex-col items-center py-10 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <p className="mt-3 text-[13px] text-muted-foreground">No tasks assigned to you.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* All other tasks */}
      <div className="space-y-3">
        <h2 className="text-[15px] font-semibold flex items-center gap-2">
          All other tasks
          {otherTasks.length > 0 && (
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[11px]">
              {otherTasks.length}
            </Badge>
          )}
        </h2>
        {otherTasks.length > 0 ? (
          otherTasks.map((issue) => <TaskCard key={issue.id} issue={issue} currentUserId={user.id} />)
        ) : (
          <Card className="border-border/40 shadow-sm">
            <CardContent className="py-6 text-center">
              <p className="text-[13px] text-muted-foreground">No other open tasks.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TaskCard({ issue, currentUserId }: { issue: any; currentUserId: string }) {
  const project = issue.project as { id: string; file_number: string; status: string; client: { name: string } | null } | null
  if (!project) return null

  const isMyTask = issue.issue_assigned_to === currentUserId
  const assigneeArr = issue.assignee as { id: string; full_name: string; title: string | null }[] | null
  const assignee = assigneeArr?.[0] ?? null

  // Department comment status badge
  const statusColor = issue.status === 'received'
    ? 'bg-emerald-50 text-emerald-700'
    : issue.status === 'requested'
    ? 'bg-blue-50 text-blue-700'
    : 'bg-slate-100 text-slate-600'

  return (
    <Link href={`/projects/${project.id}?tab=departments`}>
      <Card className={`border-border/40 shadow-sm transition-all hover:shadow-md hover:border-border cursor-pointer border-l-4 ${isMyTask ? 'border-l-red-400' : 'border-l-amber-300'}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isMyTask ? 'bg-red-50' : 'bg-amber-50'}`}>
                <AlertTriangle className={`h-4 w-4 ${isMyTask ? 'text-red-500' : 'text-amber-500'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[14px] font-bold">{project.file_number}</span>
                  <Badge variant="secondary" className="bg-red-50 text-red-600 text-[11px]">
                    {DEPT_LABELS[issue.department] || issue.department}
                  </Badge>
                  <Badge variant="secondary" className={`text-[11px] ${statusColor}`}>
                    {issue.status}
                  </Badge>
                </div>
                {project.client && (
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Client: {project.client.name}
                  </p>
                )}
                {issue.issue_notes && (
                  <p className="mt-1.5 text-[13px] text-foreground/80 line-clamp-2">
                    {issue.issue_notes}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <User className="h-3 w-3" />
                  {assignee ? (
                    <span>
                      {assignee.full_name}
                      {assignee.title && ` (${assignee.title})`}
                    </span>
                  ) : (
                    <span className="italic">Unassigned</span>
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
