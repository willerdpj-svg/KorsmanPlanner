'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewClientPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    phone_landline: '',
    phone_cell: '',
    email: '',
    postal_address: '',
    physical_address: '',
    notes: '',
  })

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    if (!form.name.trim()) {
      setError('Client name is required')
      setSaving(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('clients')
      .insert({
        name: form.name,
        phone_landline: form.phone_landline || null,
        phone_cell: form.phone_cell || null,
        email: form.email || null,
        postal_address: form.postal_address || null,
        physical_address: form.physical_address || null,
        notes: form.notes || null,
      })
      .select('id')
      .single()

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    router.push(`/clients/${data.id}`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">New Client</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="Full name or company name"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Phone (Landline)</Label>
                <Input
                  value={form.phone_landline}
                  onChange={(e) => updateField('phone_landline', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone (Cell)</Label>
                <Input
                  value={form.phone_cell}
                  onChange={(e) => updateField('phone_cell', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Physical Address</Label>
              <Input
                value={form.physical_address}
                onChange={(e) => updateField('physical_address', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Postal Address</Label>
              <Input
                value={form.postal_address}
                onChange={(e) => updateField('postal_address', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create Client'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
