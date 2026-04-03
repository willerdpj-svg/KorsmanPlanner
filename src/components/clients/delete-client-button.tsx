'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'

export function DeleteClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    // Check for linked projects first
    const { count } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)

    if (count && count > 0) {
      alert(
        `Cannot delete ${clientName} — they have ${count} linked project${count > 1 ? 's' : ''}. Remove or reassign the projects first.`
      )
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete client "${clientName}"? This action cannot be undone.`
    )
    if (!confirmed) return

    setDeleting(true)
    const { error } = await supabase.from('clients').delete().eq('id', clientId)

    if (error) {
      alert('Failed to delete client: ' + error.message)
      setDeleting(false)
    } else {
      router.push('/clients')
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
