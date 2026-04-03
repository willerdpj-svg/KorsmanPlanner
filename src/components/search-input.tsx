'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function SearchInput({ placeholder = 'Search…' }: { placeholder?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('search') ?? '')

  useEffect(() => {
    setValue(searchParams.get('search') ?? '')
  }, [searchParams])

  function submit(v: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (v.trim()) {
      params.set('search', v.trim())
    } else {
      params.delete('search')
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(value) }}
        placeholder={placeholder}
        className="h-10 rounded-xl border-border/60 pl-9 pr-9 text-[13px] placeholder:text-muted-foreground/50"
      />
      {value && (
        <button
          onClick={() => { setValue(''); submit('') }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
