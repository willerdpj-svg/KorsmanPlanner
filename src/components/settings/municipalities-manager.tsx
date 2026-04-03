'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus } from 'lucide-react'

interface Municipality {
  id: string
  name: string
  code: string
  province: string | null
}

interface Props {
  initial: Municipality[]
}

export function MunicipalitiesManager({ initial }: Props) {
  const [items, setItems] = useState(initial)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [province, setProvince] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setError(null)

    const { data, error } = await supabase
      .from('municipalities')
      .insert({ name: name.trim(), code: code.trim().toUpperCase(), province: province.trim() || null })
      .select()
      .single()

    if (error) {
      setError(error.message)
    } else {
      setItems((prev) => [...prev, data])
      setName('')
      setCode('')
      setProvince('')
    }
    setAdding(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('municipalities').delete().eq('id', id)
    if (error) {
      setError(error.message)
    } else {
      setItems((prev) => prev.filter((m) => m.id !== id))
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div className="divide-y divide-border/40 rounded-xl border border-border/40">
        {items.length === 0 && (
          <p className="px-4 py-3 text-[13px] text-muted-foreground">No municipalities yet.</p>
        )}
        {items.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <span className="text-[13px] font-medium">{m.name}</span>
              <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {m.code}
              </span>
              {m.province && (
                <span className="ml-2 text-[12px] text-muted-foreground">{m.province}</span>
              )}
            </div>
            <button
              onClick={() => handleDelete(m.id)}
              className="rounded-lg p-1.5 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap gap-2">
        <Input
          placeholder="Name (e.g. Emalahleni)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-9 flex-1 min-w-[160px] rounded-xl text-[13px]"
        />
        <Input
          placeholder="Code (e.g. ELMC)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          className="h-9 w-28 rounded-xl text-[13px] uppercase"
        />
        <Input
          placeholder="Province (optional)"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="h-9 w-36 rounded-xl text-[13px]"
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
