'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus } from 'lucide-react'

interface Department {
  id: string
  key: string
  label: string
  sort_order: number
}

interface Props {
  initial: Department[]
}

function toKey(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

export function DepartmentsManager({ initial }: Props) {
  const [items, setItems] = useState(initial)
  const [label, setLabel] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setError(null)

    const key = toKey(label)
    const maxOrder = items.reduce((max, i) => Math.max(max, i.sort_order), 0)

    const { data, error } = await supabase
      .from('departments')
      .insert({ key, label: label.trim(), sort_order: maxOrder + 1 })
      .select()
      .single()

    if (error) {
      setError(error.message)
    } else {
      setItems((prev) => [...prev, data])
      setLabel('')
    }
    setAdding(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('departments').delete().eq('id', id)
    if (error) {
      setError(error.message)
    } else {
      setItems((prev) => prev.filter((d) => d.id !== id))
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div className="divide-y divide-border/40 rounded-xl border border-border/40">
        {items.length === 0 && (
          <p className="px-4 py-3 text-[13px] text-muted-foreground">No departments yet.</p>
        )}
        {items.map((d) => (
          <div key={d.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <span className="text-[13px] font-medium">{d.label}</span>
              <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {d.key}
              </span>
            </div>
            <button
              onClick={() => handleDelete(d.id)}
              className="rounded-lg p-1.5 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          placeholder="Department name (e.g. Fire & Rescue)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          className="h-9 flex-1 rounded-xl text-[13px]"
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
