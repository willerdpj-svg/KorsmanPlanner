import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TasksList } from '@/components/tasks/tasks-list'

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const filter = params.filter || 'open'
  const showOpen = filter === 'open' || filter === 'all'
  const showResolved = filter === 'resolved' || filter === 'all'

  // Fetch open issues
  let openIssues: unknown[] = []
  if (showOpen) {
    const q = supabase
      .from('department_comments')
      .select(`
        id, department, comments, issue_notes, has_issue, status,
        requested_date, received_date, issue_created_at,
        issue_assigned_to,
        assignee:profiles!department_comments_issue_assigned_to_fkey(id, full_name, title),
        project:projects(id, file_number, status, client:clients(name))
      `)
      .eq('has_issue', true)
      .order('issue_created_at', { ascending: false, nullsFirst: false })

    if (params.from) q.gte('issue_created_at', params.from)
    if (params.to) q.lte('issue_created_at', params.to + 'T23:59:59')

    const { data } = await q
    openIssues = data || []
  }

  // Fetch resolved issues (has_issue = false but issue_resolved_at is not null)
  let resolvedIssues: unknown[] = []
  if (showResolved) {
    const q = supabase
      .from('department_comments')
      .select(`
        id, department, comments, issue_notes, has_issue, status,
        requested_date, received_date, issue_created_at, issue_resolved_at,
        issue_assigned_to,
        assignee:profiles!department_comments_issue_assigned_to_fkey(id, full_name, title),
        project:projects(id, file_number, status, client:clients(name))
      `)
      .eq('has_issue', false)
      .not('issue_resolved_at', 'is', null)
      .order('issue_resolved_at', { ascending: false })

    if (params.from) q.gte('issue_resolved_at', params.from)
    if (params.to) q.lte('issue_resolved_at', params.to + 'T23:59:59')

    const { data } = await q
    resolvedIssues = data || []
  }

  return (
    <TasksList
      openIssues={openIssues}
      resolvedIssues={resolvedIssues}
      currentUserId={user.id}
      currentFilter={filter}
      dateFrom={params.from || ''}
      dateTo={params.to || ''}
    />
  )
}
