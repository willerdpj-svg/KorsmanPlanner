'use client'

import { useState } from 'react'
import type { DepartmentComment } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Check, Clock, Circle, AlertTriangle, ChevronDown, ChevronUp, X, MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils/format'

interface Department {
  key: string
  label: string
}

interface Profile {
  id: string
  full_name: string
  title: string | null
}

interface DepartmentChecklistProps {
  departments: Department[]
  comments: DepartmentComment[]
  profiles?: Profile[]
  onStatusChange?: (department: string, status: string) => void
  onCommentSave?: (department: string, notes: string) => Promise<void>
  onIssueSave?: (department: string, hasIssue: boolean, notes: string, assignedTo: string | null) => Promise<void>
}

const statusConfig = {
  pending: { icon: Circle, color: 'text-muted-foreground/50', badge: 'bg-slate-100 text-slate-600' },
  requested: { icon: Clock, color: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
  received: { icon: Check, color: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
}

export function DepartmentChecklist({
  departments,
  comments,
  profiles = [],
  onStatusChange,
  onCommentSave,
  onIssueSave,
}: DepartmentChecklistProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<Record<string, 'notes' | 'issue'>>({})
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({})
  const [draftIssueNotes, setDraftIssueNotes] = useState<Record<string, string>>({})
  const [draftAssignee, setDraftAssignee] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  const isEditable = !!(onCommentSave || onIssueSave)

  function toggleExpand(key: string, comment: DepartmentComment | undefined, tab?: 'notes' | 'issue') {
    const isOpen = expanded[key]
    if (isOpen && activeTab[key] === tab) {
      setExpanded((prev) => ({ ...prev, [key]: false }))
    } else {
      setExpanded((prev) => ({ ...prev, [key]: true }))
      setActiveTab((prev) => ({ ...prev, [key]: tab ?? 'notes' }))
      setDraftNotes((prev) => ({ ...prev, [key]: comment?.comments ?? '' }))
      setDraftIssueNotes((prev) => ({ ...prev, [key]: comment?.issue_notes ?? '' }))
      setDraftAssignee((prev) => ({ ...prev, [key]: comment?.issue_assigned_to ?? '' }))
    }
  }

  async function handleSaveNotes(deptKey: string) {
    if (!onCommentSave) return
    setSaving((prev) => ({ ...prev, [deptKey]: true }))
    await onCommentSave(deptKey, draftNotes[deptKey] ?? '')
    setSaving((prev) => ({ ...prev, [deptKey]: false }))
    setExpanded((prev) => ({ ...prev, [deptKey]: false }))
  }

  async function handleSaveIssue(deptKey: string, hasIssue: boolean) {
    if (!onIssueSave) return
    setSaving((prev) => ({ ...prev, [deptKey]: true }))
    await onIssueSave(
      deptKey,
      hasIssue,
      hasIssue ? (draftIssueNotes[deptKey] ?? '') : '',
      hasIssue ? (draftAssignee[deptKey] || null) : null,
    )
    setSaving((prev) => ({ ...prev, [deptKey]: false }))
    setExpanded((prev) => ({ ...prev, [deptKey]: false }))
  }

  return (
    <div className="space-y-2">
      {departments.map((dept) => {
        const comment = comments.find((c) => c.department === dept.key)
        const status = (comment?.status || 'pending') as keyof typeof statusConfig
        const config = statusConfig[status] ?? statusConfig.pending
        const Icon = config.icon
        const hasIssue = comment?.has_issue ?? false
        const hasNotes = !!(comment?.comments)
        const isOpen = expanded[dept.key] ?? false
        const tab = activeTab[dept.key] ?? 'notes'
        const isReceived = status === 'received'

        return (
          <div
            key={dept.key}
            className={cn(
              'overflow-hidden rounded-xl border transition-colors',
              hasIssue ? 'border-red-300 bg-red-50/30' : 'border-border/50',
            )}
          >
            {/* ── Main row ── */}
            <div className="flex items-center gap-3 px-4 py-3">
              <Icon className={cn('h-4 w-4 shrink-0', config.color)} />

              <div className="min-w-0 flex-1">
                <span className="text-[13px] font-medium">{dept.label}</span>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  {hasIssue && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold text-red-700">
                      <AlertTriangle className="h-3 w-3" />
                      Issue
                      {comment?.issue_assignee && (
                        <span className="font-normal">— {comment.issue_assignee.full_name}</span>
                      )}
                    </span>
                  )}
                  {hasNotes && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted/80 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      Note
                    </span>
                  )}
                  {hasIssue && comment?.issue_notes && (
                    <span className="text-[11px] text-red-600/80 truncate max-w-xs">{comment.issue_notes}</span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {comment?.received_date && (
                  <span className="text-[12px] text-muted-foreground">
                    {formatDate(comment.received_date)}
                  </span>
                )}

                {/* Clickable status badge */}
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-[11px] capitalize',
                    config.badge,
                    onStatusChange && 'cursor-pointer select-none',
                  )}
                  onClick={() => {
                    if (!onStatusChange) return
                    const next =
                      status === 'pending' ? 'requested'
                      : status === 'requested' ? 'received'
                      : 'pending'
                    onStatusChange(dept.key, next)
                  }}
                  title={onStatusChange ? 'Click to advance status' : undefined}
                >
                  {status}
                </Badge>

                {/* Expand toggle — only shown when editable */}
                {isEditable && (
                  <button
                    onClick={() => toggleExpand(dept.key, comment)}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg border transition-colors',
                      isOpen
                        ? 'border-primary/30 bg-primary/8 text-primary'
                        : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted',
                    )}
                    title="Add notes / flag issue"
                  >
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* ── Expanded panel ── */}
            {isOpen && (
              <div className="border-t border-border/40 bg-muted/10">
                {/* Tab bar */}
                <div className="flex border-b border-border/40">
                  <button
                    onClick={() => setActiveTab((prev) => ({ ...prev, [dept.key]: 'notes' }))}
                    className={cn(
                      'px-4 py-2 text-[12px] font-medium transition-colors',
                      tab === 'notes'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Notes
                  </button>
                  {isReceived && onIssueSave && (
                    <button
                      onClick={() => setActiveTab((prev) => ({ ...prev, [dept.key]: 'issue' }))}
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

                {/* Notes tab */}
                {tab === 'notes' && (
                  <div className="space-y-3 p-4">
                    <Textarea
                      value={draftNotes[dept.key] ?? ''}
                      onChange={(e) =>
                        setDraftNotes((prev) => ({ ...prev, [dept.key]: e.target.value }))
                      }
                      placeholder="Record comments or response details from this department…"
                      className="min-h-[90px] resize-none rounded-xl text-[13px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveNotes(dept.key)}
                        disabled={saving[dept.key]}
                        className="rounded-xl text-[13px]"
                      >
                        {saving[dept.key] ? 'Saving…' : 'Save notes'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpanded((prev) => ({ ...prev, [dept.key]: false }))}
                        className="rounded-xl text-[13px] text-muted-foreground"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Issue tab */}
                {tab === 'issue' && isReceived && onIssueSave && (
                  <div className="space-y-3 p-4">
                    {hasIssue && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                        This department has an open issue. Update or resolve it below.
                      </div>
                    )}
                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium text-foreground/70">
                        Issue description <span className="text-destructive">*</span>
                      </label>
                      <Textarea
                        value={draftIssueNotes[dept.key] ?? ''}
                        onChange={(e) =>
                          setDraftIssueNotes((prev) => ({ ...prev, [dept.key]: e.target.value }))
                        }
                        placeholder="Describe the issue raised by this department's response…"
                        className="min-h-[90px] resize-none rounded-xl text-[13px]"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium text-foreground/70">
                        Assign to
                      </label>
                      <select
                        value={draftAssignee[dept.key] ?? ''}
                        onChange={(e) =>
                          setDraftAssignee((prev) => ({ ...prev, [dept.key]: e.target.value }))
                        }
                        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">— Unassigned —</option>
                        {profiles.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name}{p.title ? ` (${p.title})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveIssue(dept.key, true)}
                        disabled={saving[dept.key] || !draftIssueNotes[dept.key]?.trim()}
                        className="rounded-xl bg-red-600 text-[13px] text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {saving[dept.key] ? 'Saving…' : hasIssue ? 'Update issue' : 'Flag issue'}
                      </Button>
                      {hasIssue && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSaveIssue(dept.key, false)}
                          disabled={saving[dept.key]}
                          className="gap-1 rounded-xl text-[13px] text-muted-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                          Resolve issue
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpanded((prev) => ({ ...prev, [dept.key]: false }))}
                        className="rounded-xl text-[13px] text-muted-foreground"
                      >
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
