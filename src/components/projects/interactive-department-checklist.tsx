'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Check, Clock, Circle, AlertTriangle, ChevronDown, ChevronUp, X, MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils/format'
import type { DepartmentComment } from '@/types'

interface Department {
  id: string
  key: string
  label: string
}

interface Profile {
  id: string
  full_name: string
  title: string | null
}

interface Props {
  projectId: string
  departments: Department[]
  comments: DepartmentComment[]
  profiles?: Profile[]
}

const statusConfig = {
  pending:   { icon: Circle, color: 'text-muted-foreground/50', badge: 'bg-slate-100 text-slate-600' },
  requested: { icon: Clock,  color: 'text-amber-500',          badge: 'bg-amber-100 text-amber-700'  },
  received:  { icon: Check,  color: 'text-emerald-500',        badge: 'bg-emerald-100 text-emerald-700' },
}

export function InteractiveDepartmentChecklist({ projectId, departments, comments: init, profiles = [] }: Props) {
  const router  = useRouter()
  const supabase = createClient()

  const [comments,      setComments]      = useState(init)
  const [expanded,      setExpanded]      = useState<Record<string, boolean>>({})
  const [activeTab,     setActiveTab]     = useState<Record<string, 'notes' | 'issue'>>({})
  const [draftNotes,    setDraftNotes]    = useState<Record<string, string>>({})
  const [draftIssue,    setDraftIssue]    = useState<Record<string, string>>({})
  const [draftAssignee, setDraftAssignee] = useState<Record<string, string>>({})
  const [saving,        setSaving]        = useState<Record<string, boolean>>({})

  /* ── helpers ── */
  function open(key: string, tab: 'notes' | 'issue', comment?: DepartmentComment) {
    const alreadyOpen = expanded[key] && activeTab[key] === tab
    setExpanded(p    => ({ ...p, [key]: !alreadyOpen }))
    setActiveTab(p   => ({ ...p, [key]: tab }))
    setDraftNotes(p  => ({ ...p, [key]: comment?.comments     ?? '' }))
    setDraftIssue(p  => ({ ...p, [key]: comment?.issue_notes  ?? '' }))
    setDraftAssignee(p => ({ ...p, [key]: comment?.issue_assigned_to ?? '' }))
  }

  function close(key: string) {
    setExpanded(p => ({ ...p, [key]: false }))
  }

  /* ── status cycling ── */
  async function cycleStatus(dept: string) {
    const existing = comments.find(c => c.department === dept)
    const cur = existing?.status ?? 'pending'
    const next = cur === 'pending' ? 'requested' : cur === 'requested' ? 'received' : 'pending'

    const patch: Record<string, string | null> = { status: next }
    if (next === 'requested') patch.requested_date = new Date().toISOString().split('T')[0]
    if (next === 'received')  patch.received_date  = new Date().toISOString().split('T')[0]
    if (next === 'pending')   { patch.requested_date = null; patch.received_date = null }

    if (existing) {
      setComments(p => p.map(c => c.department === dept ? { ...c, ...patch } : c))
      await supabase.from('department_comments').update(patch).eq('id', existing.id)
    } else {
      const { data } = await supabase.from('department_comments')
        .insert({ project_id: projectId, department: dept, ...patch })
        .select().single()
      if (data) setComments(p => [...p, data as DepartmentComment])
    }
    router.refresh()
  }

  /* ── save notes ── */
  async function saveNotes(dept: string) {
    const existing = comments.find(c => c.department === dept)
    const notes = draftNotes[dept] ?? ''
    setSaving(p => ({ ...p, [dept]: true }))

    if (existing) {
      setComments(p => p.map(c => c.department === dept ? { ...c, comments: notes } : c))
      await supabase.from('department_comments').update({ comments: notes }).eq('id', existing.id)
    } else {
      const { data } = await supabase.from('department_comments')
        .insert({ project_id: projectId, department: dept, status: 'pending', comments: notes })
        .select().single()
      if (data) setComments(p => [...p, data as DepartmentComment])
    }

    setSaving(p => ({ ...p, [dept]: false }))
    close(dept)
    router.refresh()
  }

  /* ── save issue ── */
  async function saveIssue(dept: string, flagging: boolean) {
    const existing = comments.find(c => c.department === dept)
    const assignee = profiles.find(p => p.id === draftAssignee[dept]) ?? null
    const patch = {
      has_issue:          flagging,
      issue_notes:        flagging ? draftIssue[dept] ?? '' : null,
      issue_assigned_to:  flagging ? draftAssignee[dept] || null : null,
    }
    setSaving(p => ({ ...p, [dept]: true }))

    if (existing) {
      setComments(p => p.map(c => c.department === dept
        ? { ...c, ...patch, issue_assignee: assignee ? { full_name: assignee.full_name, title: assignee.title } : undefined }
        : c))
      await supabase.from('department_comments').update(patch).eq('id', existing.id)
    } else {
      const { data } = await supabase.from('department_comments')
        .insert({ project_id: projectId, department: dept, status: 'received', ...patch })
        .select().single()
      if (data) setComments(p => [...p, data as DepartmentComment])
    }

    setSaving(p => ({ ...p, [dept]: false }))
    close(dept)
    router.refresh()
  }

  /* ── render ── */
  return (
    <div className="space-y-2">
      {departments.map(dept => {
        const comment  = comments.find(c => c.department === dept.key)
        const status   = (comment?.status ?? 'pending') as keyof typeof statusConfig
        const cfg      = statusConfig[status] ?? statusConfig.pending
        const Icon     = cfg.icon
        const hasIssue = comment?.has_issue ?? false
        const hasNotes = !!(comment?.comments)
        const isOpen   = expanded[dept.key] ?? false
        const tab      = activeTab[dept.key] ?? 'notes'
        const isReceived = status === 'received'

        return (
          <div
            key={dept.key}
            className={cn(
              'overflow-hidden rounded-xl border transition-colors',
              hasIssue ? 'border-red-300 bg-red-50/30' : 'border-border/50',
            )}
          >
            {/* ── row ── */}
            <div className="flex items-center gap-3 px-4 py-3">
              <Icon className={cn('h-4 w-4 shrink-0', cfg.color)} />

              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">{dept.label}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  {hasIssue && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold text-red-700">
                      <AlertTriangle className="h-3 w-3" />
                      Issue{comment?.issue_assignee ? ` — ${comment.issue_assignee.full_name}` : ''}
                    </span>
                  )}
                  {hasNotes && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted/80 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />Note
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {comment?.received_date && (
                  <span className="text-[12px] text-muted-foreground">{formatDate(comment.received_date)}</span>
                )}

                <Badge
                  variant="secondary"
                  className={cn('cursor-pointer select-none text-[11px] capitalize', cfg.badge)}
                  onClick={() => cycleStatus(dept.key)}
                  title="Click to advance status"
                >
                  {status}
                </Badge>

                <button
                  onClick={() => open(dept.key, isOpen ? (tab as 'notes' | 'issue') : 'notes', comment)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg border transition-colors',
                    isOpen
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                  title="Add notes / flag issue"
                >
                  {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* ── expanded panel ── */}
            {isOpen && (
              <div className="border-t border-border/40 bg-muted/10">
                {/* tab bar */}
                <div className="flex border-b border-border/40 bg-muted/20">
                  <button
                    onClick={() => setActiveTab(p => ({ ...p, [dept.key]: 'notes' }))}
                    className={cn(
                      'px-4 py-2 text-[12px] font-medium transition-colors',
                      tab === 'notes'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Notes
                  </button>
                  {isReceived && (
                    <button
                      onClick={() => setActiveTab(p => ({ ...p, [dept.key]: 'issue' }))}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium transition-colors',
                        tab === 'issue'
                          ? 'border-b-2 border-red-500 text-red-600'
                          : hasIssue
                          ? 'text-red-500 hover:text-red-600'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {hasIssue ? 'Issue (open)' : 'Flag issue'}
                    </button>
                  )}
                </div>

                {/* notes */}
                {tab === 'notes' && (
                  <div className="space-y-3 p-4">
                    <Textarea
                      value={draftNotes[dept.key] ?? ''}
                      onChange={e => setDraftNotes(p => ({ ...p, [dept.key]: e.target.value }))}
                      placeholder="Record comments or response details from this department…"
                      className="min-h-[90px] resize-none rounded-xl text-[13px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveNotes(dept.key)} disabled={saving[dept.key]} className="rounded-xl text-[13px]">
                        {saving[dept.key] ? 'Saving…' : 'Save notes'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => close(dept.key)} className="rounded-xl text-[13px] text-muted-foreground">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* issue */}
                {tab === 'issue' && isReceived && (
                  <div className="space-y-3 p-4">
                    {hasIssue && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                        This department has an open issue — update or resolve below.
                      </div>
                    )}
                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium text-foreground/70">
                        Issue description <span className="text-destructive">*</span>
                      </label>
                      <Textarea
                        value={draftIssue[dept.key] ?? ''}
                        onChange={e => setDraftIssue(p => ({ ...p, [dept.key]: e.target.value }))}
                        placeholder="Describe the issue raised by this department's response…"
                        className="min-h-[90px] resize-none rounded-xl text-[13px]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium text-foreground/70">Assign to</label>
                      <select
                        value={draftAssignee[dept.key] ?? ''}
                        onChange={e => setDraftAssignee(p => ({ ...p, [dept.key]: e.target.value }))}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">— Unassigned —</option>
                        {profiles.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.full_name}{p.title ? ` (${p.title})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveIssue(dept.key, true)}
                        disabled={saving[dept.key] || !draftIssue[dept.key]?.trim()}
                        className="rounded-xl bg-red-600 text-[13px] text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {saving[dept.key] ? 'Saving…' : hasIssue ? 'Update issue' : 'Flag issue'}
                      </Button>
                      {hasIssue && (
                        <Button size="sm" variant="ghost" onClick={() => saveIssue(dept.key, false)} disabled={saving[dept.key]} className="gap-1 rounded-xl text-[13px] text-muted-foreground">
                          <X className="h-3.5 w-3.5" />Resolve
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => close(dept.key)} className="rounded-xl text-[13px] text-muted-foreground">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
