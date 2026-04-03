'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'

export function DeleteProjectButton({ projectId, fileNumber }: { projectId: string; fileNumber: string }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete project ${fileNumber}? This will permanently remove the project and all its related data (notes, invoices, department comments, reports). This action cannot be undone.`
    )
    if (!confirmed) return

    setDeleting(true)
    const { error } = await supabase.from('projects').delete().eq('id', projectId)

    if (error) {
      alert('Failed to delete project: ' + error.message)
      setDeleting(false)
    } else {
      router.push('/projects')
      router.refresh()
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={deleting}
      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
    >
      {deleting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="mr-2 h-4 w-4" />
      )}
      {deleting ? 'Deleting…' : 'Delete'}
    </Button>
  )
}
