'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ApplicationType, Municipality, Client } from '@/types'

export default function NewProjectPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [applicationTypes, setApplicationTypes] = useState<ApplicationType[]>([])
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [clients, setClients] = useState<Client[]>([])

  const [form, setForm] = useState({
    file_number: '',
    portal_reference: '',
    scheme_number: '',
    sp_number: '',
    application_type_id: '',
    municipality_id: '',
    client_id: '',
    legal_description: '',
    physical_address: '',
    present_zoning: '',
    zoning_applied_for: '',
    status: 'active',
    application_submission_date: '',
  })

  useEffect(() => {
    async function loadData() {
      const [typesRes, muniRes, clientsRes] = await Promise.all([
        supabase.from('application_types').select('*').order('sort_order'),
        supabase.from('municipalities').select('*').order('name'),
        supabase.from('clients').select('*').order('name'),
      ])
      setApplicationTypes(typesRes.data || [])
      setMunicipalities(muniRes.data || [])
      setClients(clientsRes.data || [])
    }
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function updateField(field: string, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    if (!form.file_number.trim()) {
      setError('File number is required')
      setSaving(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('projects')
      .insert({
        file_number: form.file_number,
        portal_reference: form.portal_reference || null,
        scheme_number: form.scheme_number || null,
        sp_number: form.sp_number || null,
        application_type_id: form.application_type_id || null,
        municipality_id: form.municipality_id || null,
        client_id: form.client_id || null,
        legal_description: form.legal_description || null,
        physical_address: form.physical_address || null,
        present_zoning: form.present_zoning || null,
        zoning_applied_for: form.zoning_applied_for || null,
        status: form.status,
        application_submission_date: form.application_submission_date || null,
      })
      .select('id')
      .single()

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    // Create department comment rows
    if (data) {
      const departments = [
        'electricity', 'water_sewer', 'roads_stormwater',
        'environmental', 'building_control', 'town_planning',
      ]
      await supabase.from('department_comments').insert(
        departments.map((dept) => ({
          project_id: data.id,
          department: dept,
          status: 'pending',
        }))
      )

      router.push(`/projects/${data.id}`)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">New Project</h1>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="property">Property</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="file_number">File Number *</Label>
                    <Input
                      id="file_number"
                      placeholder="e.g. R25434"
                      value={form.file_number}
                      onChange={(e) => updateField('file_number', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portal_reference">Portal Reference</Label>
                    <Input
                      id="portal_reference"
                      value={form.portal_reference}
                      onChange={(e) => updateField('portal_reference', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheme_number">Scheme Number (SA)</Label>
                    <Input
                      id="scheme_number"
                      value={form.scheme_number}
                      onChange={(e) => updateField('scheme_number', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sp_number">SP Number</Label>
                    <Input
                      id="sp_number"
                      value={form.sp_number}
                      onChange={(e) => updateField('sp_number', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Application Type</Label>
                    <Select
                      value={form.application_type_id}
                      onValueChange={(v) => updateField('application_type_id', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {applicationTypes.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Municipality</Label>
                    <Select
                      value={form.municipality_id}
                      onValueChange={(v) => updateField('municipality_id', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select municipality" />
                      </SelectTrigger>
                      <SelectContent>
                        {municipalities.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.code} - {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select
                    value={form.client_id}
                    onValueChange={(v) => updateField('client_id', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => updateField('status', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="not_approved">Not Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Application Submission Date</Label>
                  <Input
                    type="date"
                    value={form.application_submission_date}
                    onChange={(e) => updateField('application_submission_date', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="property">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Legal Description</Label>
                  <Textarea
                    placeholder="e.g. Ptn 47 Holding 30 Dixon Agricultural Holdings"
                    value={form.legal_description}
                    onChange={(e) => updateField('legal_description', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Physical Address</Label>
                  <Input
                    value={form.physical_address}
                    onChange={(e) => updateField('physical_address', e.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Present Zoning</Label>
                    <Input
                      placeholder="e.g. Agriculture"
                      value={form.present_zoning}
                      onChange={(e) => updateField('present_zoning', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Zoning Applied For</Label>
                    <Input
                      placeholder="e.g. Res 3"
                      value={form.zoning_applied_for}
                      onChange={(e) => updateField('zoning_applied_for', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Financial Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Quotations can be added from the Financials tab after creating the project.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {error && (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        )}

        <div className="mt-6 flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create Project'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
