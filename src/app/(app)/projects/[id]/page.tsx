import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { InteractiveStepTracker } from '@/components/projects/interactive-step-tracker'
import { StatusBadge } from '@/components/projects/status-badge'
import { InteractiveDepartmentChecklist } from '@/components/projects/interactive-department-checklist'
import { NoteForm } from '@/components/projects/note-form'
import { FinancialsPanel } from '@/components/projects/financials-panel'
import { ReportGenerator } from '@/components/projects/report-generator'
import { formatDate, formatCurrency } from '@/lib/utils/format'
import { Pencil } from 'lucide-react'
import Link from 'next/link'
import type { ProjectStatus, DepartmentComment, Payment } from '@/types'
import { getApplicationSteps } from '@/types'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(*),
      application_type:application_types(*),
      municipality:municipalities(*),
      assigned_planner:profiles!projects_assigned_planner_id_fkey(full_name, title),
      department_comments(*)
    `)
    .eq('id', id)
    .single()

  if (error || !project) {
    notFound()
  }

  const { data: notes } = await supabase
    .from('project_notes')
    .select('*, author:profiles(full_name)')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, payments(*)')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  const { data: reports } = await supabase
    .from('progress_reports')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  const { data: departments } = await supabase
    .from('departments')
    .select('id, key, label')
    .order('sort_order')

  const client = project.client as { name: string; phone_cell: string | null; email: string | null } | null
  const applicationType = project.application_type as { name: string } | null
  const municipality = project.municipality as { name: string; code: string } | null
  const planner = project.assigned_planner as { full_name: string; title: string | null } | null
  const deptComments = (project.department_comments || []) as DepartmentComment[]
  const applicationSteps = getApplicationSteps(applicationType?.name)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-bold">{project.file_number}</h1>
            <StatusBadge status={project.status as ProjectStatus} />
          </div>
          <p className="mt-1 text-muted-foreground">
            {applicationType?.name || 'No application type'}
            {municipality && ` - ${municipality.code}`}
          </p>
        </div>
        <Link href={`/projects/${id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Step Tracker */}
      <Card>
        <CardContent className="pt-6">
          <InteractiveStepTracker projectId={id} currentStep={project.current_step} steps={applicationSteps} />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="reports">Reports ({reports?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow label="File Number" value={project.file_number} />
                <InfoRow label="Portal Reference" value={project.portal_reference} />
                <InfoRow label="Scheme Number" value={project.scheme_number} />
                <InfoRow label="SP Number" value={project.sp_number} />
                <Separator />
                <InfoRow label="Legal Description" value={project.legal_description} />
                <InfoRow label="Physical Address" value={project.physical_address} />
                <InfoRow label="Present Zoning" value={project.present_zoning} />
                <InfoRow label="Zoning Applied For" value={project.zoning_applied_for} />
              </CardContent>
            </Card>

            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client & Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow label="Client" value={client?.name} />
                <InfoRow label="Phone" value={client?.phone_cell} />
                <InfoRow label="Email" value={client?.email} />
                <Separator />
                <InfoRow label="Assigned Planner" value={planner ? `${planner.full_name}${planner.title ? ` (${planner.title})` : ''}` : null} />
                <InfoRow label="Municipality" value={municipality?.name} />
              </CardContent>
            </Card>

            {/* Key Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Key Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow label="Quotation Date" value={formatDate(project.quotation_date)} />
                <InfoRow label="Date Accepted" value={formatDate(project.date_accepting)} />
                <InfoRow label="Submission Date" value={formatDate(project.application_submission_date)} />
                <InfoRow label="Proof of Ads" value={formatDate(project.proof_of_ads_date)} />
                <InfoRow label="Hearing Date" value={formatDate(project.hearing_date)} />
                <InfoRow label="Approval Date" value={formatDate(project.approval_date)} />
                <InfoRow label="Proclamation" value={formatDate(project.proclamation_date)} />
              </CardContent>
            </Card>

            {/* Bondholder & Consent */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bondholder Consent & SANRAL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow label="Consent Requested" value={formatDate(project.bondholder_consent_requested)} />
                <InfoRow label="Consent Received" value={formatDate(project.bondholder_consent_received)} />
                <InfoRow label="Consent Submitted" value={formatDate(project.bondholder_consent_submitted)} />
                <Separator />
                <InfoRow label="Objections" value={project.objections ? 'Yes' : 'No'} />
                {project.objections_comment && (
                  <InfoRow label="Objections Comment" value={project.objections_comment} />
                )}
                <Separator />
                <InfoRow label="SANRAL Comments" value={project.sanral_comments} />
                <InfoRow label="70/70 or 21/40 Consent" value={formatDate(project.consent_70_70_received)} />
                {project.consent_type && (
                  <InfoRow label="Consent Type" value={project.consent_type} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Department Comments (Step 3)</CardTitle>
            </CardHeader>
            <CardContent>
              <InteractiveDepartmentChecklist
                projectId={id}
                departments={departments ?? []}
                comments={deptComments}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <NoteForm projectId={id} />
              {notes && notes.length > 0 ? (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {(note.author as { full_name: string } | null)?.full_name || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(note.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No notes yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials">
          <FinancialsPanel
            projectId={id}
            quotationNumber={project.quotation_number}
            quotationAmount={project.quotation_amount}
            quotationDate={project.quotation_date}
            dateAccepting={project.date_accepting}
            bulkServicesAmount={project.bulk_services_amount}
            bulkServicesPaymentDate={project.bulk_services_payment_date}
            invoices={(invoices || []).map((inv) => ({
              ...inv,
              payments: (inv as Record<string, unknown>).payments as Payment[] || [],
            }))}
          />
        </TabsContent>

        <TabsContent value="reports">
          <ReportGenerator
            projectId={id}
            fileNumber={project.file_number}
            reports={reports || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || '-'}</span>
    </div>
  )
}
