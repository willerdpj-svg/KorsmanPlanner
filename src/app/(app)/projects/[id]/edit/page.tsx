'use client'

import { useState, useEffect, use } from 'react'
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

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
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
    current_step: 1,
    application_submission_date: '',
    proof_of_ads_date: '',
    bondholder_consent_requested: '',
    bondholder_consent_received: '',
    bondholder_consent_submitted: '',
    objections: false,
    objections_comment: '',
    hearing_date: '',
    approval_date: '',
    bulk_services_amount: '',
    bulk_services_payment_date: '',
    final_maps_submitted: '',
    final_maps_approved: '',
    rrc_date: '',
    proclamation_date: '',
    sanral_comments: '',
  })

  useEffect(() => {
    async function loadData() {
      const [projectRes, typesRes, muniRes, clientsRes] = await Promise.all([
        supabase.from('projects').select('*').eq('id', id).single(),
        supabase.from('application_types').select('*').order('sort_order'),
        supabase.from('municipalities').select('*').order('name'),
        supabase.from('clients').select('*').order('name'),
      ])

      setApplicationTypes(typesRes.data || [])
      setMunicipalities(muniRes.data || [])
      setClients(clientsRes.data || [])

      if (projectRes.data) {
        const p = projectRes.data
        setForm({
          file_number: p.file_number || '',
          portal_reference: p.portal_reference || '',
          scheme_number: p.scheme_number || '',
          sp_number: p.sp_number || '',
          application_type_id: p.application_type_id || '',
          municipality_id: p.municipality_id || '',
          client_id: p.client_id || '',
          legal_description: p.legal_description || '',
          physical_address: p.physical_address || '',
          present_zoning: p.present_zoning || '',
          zoning_applied_for: p.zoning_applied_for || '',
          status: p.status || 'active',
          current_step: p.current_step || 1,
          application_submission_date: p.application_submission_date || '',
          proof_of_ads_date: p.proof_of_ads_date || '',
          bondholder_consent_requested: p.bondholder_consent_requested || '',
          bondholder_consent_received: p.bondholder_consent_received || '',
          bondholder_consent_submitted: p.bondholder_consent_submitted || '',
          objections: p.objections || false,
          objections_comment: p.objections_comment || '',
          hearing_date: p.hearing_date || '',
          approval_date: p.approval_date || '',
          bulk_services_amount: p.bulk_services_amount?.toString() || '',
          bulk_services_payment_date: p.bulk_services_payment_date || '',
          final_maps_submitted: p.final_maps_submitted || '',
          final_maps_approved: p.final_maps_approved || '',
          rrc_date: p.rrc_date || '',
          proclamation_date: p.proclamation_date || '',
          sanral_comments: p.sanral_comments || '',
        })
      }
      setLoading(false)
    }
    loadData()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateField(field: string, value: string | boolean | number | null) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('projects')
      .update({
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
        current_step: form.current_step,
        application_submission_date: form.application_submission_date || null,
        proof_of_ads_date: form.proof_of_ads_date || null,
        bondholder_consent_requested: form.bondholder_consent_requested || null,
        bondholder_consent_received: form.bondholder_consent_received || null,
        bondholder_consent_submitted: form.bondholder_consent_submitted || null,
        objections: form.objections,
        objections_comment: form.objections_comment || null,
        hearing_date: form.hearing_date || null,
        approval_date: form.approval_date || null,
        bulk_services_amount: form.bulk_services_amount ? parseFloat(form.bulk_services_amount) : null,
        bulk_services_payment_date: form.bulk_services_payment_date || null,
        final_maps_submitted: form.final_maps_submitted || null,
        final_maps_approved: form.final_maps_approved || null,
        rrc_date: form.rrc_date || null,
        proclamation_date: form.proclamation_date || null,
        sanral_comments: form.sanral_comments || null,
      })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.push(`/projects/${id}`)
  }

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading...</div>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Edit Project - {form.file_number}</h1>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="property">Property</TabsTrigger>
            <TabsTrigger value="process">Process Dates</TabsTrigger>
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
                    <Label>File Number *</Label>
                    <Input
                      value={form.file_number}
                      onChange={(e) => updateField('file_number', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Portal Reference</Label>
                    <Input
                      value={form.portal_reference}
                      onChange={(e) => updateField('portal_reference', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Scheme Number (SA)</Label>
                    <Input
                      value={form.scheme_number}
                      onChange={(e) => updateField('scheme_number', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SP Number</Label>
                    <Input
                      value={form.sp_number}
                      onChange={(e) => updateField('sp_number', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Application Type</Label>
                    <Select value={form.application_type_id} onValueChange={(v) => updateField('application_type_id', v)}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {applicationTypes.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Municipality</Label>
                    <Select value={form.municipality_id} onValueChange={(v) => updateField('municipality_id', v)}>
                      <SelectTrigger><SelectValue placeholder="Select municipality" /></SelectTrigger>
                      <SelectContent>
                        {municipalities.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.code} - {m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select value={form.client_id} onValueChange={(v) => updateField('client_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => updateField('status', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <Label>Current Step (1-7)</Label>
                    <Select value={form.current_step.toString()} onValueChange={(v) => updateField('current_step', parseInt(v || '1'))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                          <SelectItem key={s} value={s.toString()}>Step {s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="property">
            <Card>
              <CardHeader><CardTitle className="text-base">Property Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Legal Description</Label>
                  <Textarea value={form.legal_description} onChange={(e) => updateField('legal_description', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Physical Address</Label>
                  <Input value={form.physical_address} onChange={(e) => updateField('physical_address', e.target.value)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Present Zoning</Label>
                    <Input value={form.present_zoning} onChange={(e) => updateField('present_zoning', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Zoning Applied For</Label>
                    <Input value={form.zoning_applied_for} onChange={(e) => updateField('zoning_applied_for', e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="process">
            <Card>
              <CardHeader><CardTitle className="text-base">Process Dates</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Application Submission</Label>
                    <Input type="date" value={form.application_submission_date} onChange={(e) => updateField('application_submission_date', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Proof of Ads & Affidavit</Label>
                    <Input type="date" value={form.proof_of_ads_date} onChange={(e) => updateField('proof_of_ads_date', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bondholder Consent Requested</Label>
                    <Input type="date" value={form.bondholder_consent_requested} onChange={(e) => updateField('bondholder_consent_requested', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bondholder Consent Received</Label>
                    <Input type="date" value={form.bondholder_consent_received} onChange={(e) => updateField('bondholder_consent_received', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bondholder Consent Submitted</Label>
                    <Input type="date" value={form.bondholder_consent_submitted} onChange={(e) => updateField('bondholder_consent_submitted', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hearing Date</Label>
                    <Input type="date" value={form.hearing_date} onChange={(e) => updateField('hearing_date', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Approval Date</Label>
                    <Input type="date" value={form.approval_date} onChange={(e) => updateField('approval_date', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>RRC Date</Label>
                    <Input type="date" value={form.rrc_date} onChange={(e) => updateField('rrc_date', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Final Maps Submitted</Label>
                    <Input type="date" value={form.final_maps_submitted} onChange={(e) => updateField('final_maps_submitted', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Final Maps Approved</Label>
                    <Input type="date" value={form.final_maps_approved} onChange={(e) => updateField('final_maps_approved', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Proclamation Date</Label>
                    <Input type="date" value={form.proclamation_date} onChange={(e) => updateField('proclamation_date', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>External Comments</Label>
                  <Textarea value={form.sanral_comments} onChange={(e) => updateField('sanral_comments', e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <Card>
              <CardHeader><CardTitle className="text-base">Financial Details</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Quotations, invoices, and payments are managed from the{' '}
                  <a href={`/projects/${id}`} className="text-primary underline">Financials tab</a>{' '}
                  on the project detail page.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
