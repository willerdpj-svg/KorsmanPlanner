'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus } from 'lucide-react'

interface ApplicationType {
  id: string
  name: string
  description: string | null
  sort_order: number
}

interface Props {
  initial: ApplicationType[]
}

export function ApplicationTypesManager({ initial }: Props) {
  const [items, setItems] = useState(initial)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setError(null)

    const maxOrder = items.reduce((max, i) => Math.max(max, i.sort_order), 0)

    const { data, error } = await supabase
      .from('application_types')
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        sort_order: maxOrder + 1,
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
    } else {
      setItems((prev) => [...prev, data])
      setName('')
      setDescription('')
    }
    setAdding(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('application_types').delete().eq('id', id)
    if (error) {
      setError(error.message)
    } else {
      setItems((prev) => prev.filter((t) => t.id !== id))
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div className="divide-y divide-border/40 rounded-xl border border-border/40">
        {items.length === 0 && (
          <p className="px-4 py-3 text-[13px] text-muted-foreground">No application types yet.</p>
        )}
        {items.map((t) => (
          <div key={t.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <span className="text-[13px] font-medium">{t.name}</span>
              {t.description && (
                <span className="ml-2 text-[12px] text-muted-foreground">{t.description}</span>
              )}
            </div>
            <button
              onClick={() => handleDelete(t.id)}
              className="rounded-lg p-1.5 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap gap-2">
        <Input
          placeholder="Name (e.g. Rezoning)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-9 flex-1 min-w-[160px] rounded-xl text-[13px]"
        />
        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="h-9 flex-1 min-w-[160px] rounded-xl text-[13px]"
        />
        <Button type="submit" size="sm" disabled={adding} className="h-9 rounded-xl gap-1.5 text-[13px]">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </form>

      {error && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{error}</p>
      )}
    </div>
  )
}
