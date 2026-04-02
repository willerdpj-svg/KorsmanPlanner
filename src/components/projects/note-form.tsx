'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface NoteFormProps {
  projectId: string
}

export function NoteForm({ projectId }: NoteFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from('project_notes').insert({
      project_id: projectId,
      author_id: user?.id,
      content: content.trim(),
    })

    setContent('')
    setSaving(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="Add a note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />
      <Button type="submit" size="sm" disabled={saving || !content.trim()}>
        {saving ? 'Adding...' : 'Add Note'}
      </Button>
    </form>
  )
}
