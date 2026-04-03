'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DepartmentChecklist } from './department-checklist'
import type { DepartmentComment } from '@/types'

interface Department {
  id: string
  key: string
  label: string
}

interface InteractiveDepartmentChecklistProps {
  projectId: string
  departments: Department[]
  comments: DepartmentComment[]
}

export function InteractiveDepartmentChecklist({
  projectId,
  departments,
  comments: initialComments,
}: InteractiveDepartmentChecklistProps) {
  const router = useRouter()
  const supabase = createClient()
  const [comments, setComments] = useState(initialComments)

  async function handleStatusChange(department: string, newStatus: string) {
    const existing = comments.find((c) => c.department === department)

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

    if (existing) {
      setComments((prev) =>
        prev.map((c) => (c.department === department ? { ...c, ...updates } : c))
      )
      await supabase.from('department_comments').update(updates).eq('id', existing.id)
    } else {
      // Insert a new row if this department didn't have one yet
      const { data } = await supabase
        .from('department_comments')
        .insert({ project_id: projectId, department, ...updates })
        .select()
        .single()
      if (data) {
        setComments((prev) => [...prev, data as DepartmentComment])
      }
    }

    router.refresh()
  }

  return (
    <DepartmentChecklist
      departments={departments}
      comments={comments}
      onStatusChange={handleStatusChange}
    />
  )
}
