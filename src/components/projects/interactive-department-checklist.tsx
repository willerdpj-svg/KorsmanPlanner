'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DepartmentChecklist } from './department-checklist'
import type { DepartmentComment } from '@/types'

interface InteractiveDepartmentChecklistProps {
  comments: DepartmentComment[]
}

export function InteractiveDepartmentChecklist({ comments: initialComments }: InteractiveDepartmentChecklistProps) {
  const router = useRouter()
  const supabase = createClient()
  const [comments, setComments] = useState(initialComments)

  async function handleStatusChange(department: string, newStatus: string) {
    const comment = comments.find((c) => c.department === department)
    if (!comment) return

    const updates: Record<string, string | null> = { status: newStatus }
    if (newStatus === 'requested') {
      updates.requested_date = new Date().toISOString().split('T')[0]
    }
    if (newStatus === 'received') {
      updates.received_date = new Date().toISOString().split('T')[0]
    }
    if (newStatus === 'pending') {
      updates.requested_date = null
      updates.received_date = null
    }

    setComments((prev) =>
      prev.map((c) =>
        c.department === department
          ? { ...c, ...updates }
          : c
      )
    )

    await supabase
      .from('department_comments')
      .update(updates)
      .eq('id', comment.id)

    router.refresh()
  }

  return <DepartmentChecklist comments={comments} onStatusChange={handleStatusChange} />
}
