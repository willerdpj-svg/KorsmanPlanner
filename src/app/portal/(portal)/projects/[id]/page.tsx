import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/projects/status-badge'
import { StepTracker } from '@/components/projects/step-tracker'
import { PortalQuotePanel } from '@/components/portal/quote-panel'
import { formatDate, formatCurrency } from '@/lib/utils/format'
import { getApplicationSteps } from '@/types'
import { ArrowLeft, MapPin, Calendar, FileText, Receipt } from 'lucide-react'
import Link from 'next/link'
import type { ProjectStatus } from '@/types'

export default async function PortalProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const { data: clientRecord } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!clientRecord) redirect('/portal/login')

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      application_type:application_types(name),
      municipality:municipalities(name, code),
      department_comments(department, status, received_date)
    `)
    .eq('id', id)
    .eq('client_id', clientRecord.id)
    .single()

  if (error || !project) notFound()

  const { data: quotations } = await supabase
    .from('quotations')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, payments(*)')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applicationType = (project.application_type as any)?.name || null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const municipality = project.municipality as { name: string; code: string } | null
  const steps = getApplicationSteps(applicationType)
  const currentStepLabel = steps.find(s => s.step === project.current_step)?.label

  const totalInvoiced = (invoices || []).reduce((sum, inv) => sum + Number(inv.amount), 0)
  const totalPaid = (invoices || []).reduce((sum, inv) => sum + Number(inv.amount_paid), 0)
  const outstanding = totalInvoiced - totalPaid

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link href="/portal/dashboard" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to my projects
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-bold">{project.file_number}</h1>
            <StatusBadge status={project.status as ProjectStatus} />
          </div>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {applicationType || 'Land-use Application'}
            {municipality && ` · ${municipality.name}`}
          </p>
        </div>
      </div>

      {/* Quotations — shown prominently if action needed */}
      <div>
        <h2 className="mb-3 text-[15px] font-semibold">Quotations</h2>
        <PortalQuotePanel
          projectId={id}
          quotations={quotations || []}
        />
      </div>

      {/* Application Progress */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold">Application Progress</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <StepTracker currentStep={project.current_step} steps={steps} />
          <div className="mt-6 rounded-xl bg-muted/30 px-4 py-3">
            <p className="text-[13px] text-muted-foreground">
              Current stage: <span className="font-semibold text-foreground">{currentStepLabel}</span>
              {project.application_submission_date && (
                <> · Submitted {formatDate(project.application_submission_date)}</>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Property details */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-[15px] font-semibold">Property</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-[13px]">
            {project.legal_description && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Legal description</span>
                <span className="text-right font-medium">{project.legal_description}</span>
              </div>
            )}
            {project.physical_address && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Address</span>
                <span className="text-right font-medium">{project.physical_address}</span>
              </div>
            )}
            {project.present_zoning && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Present zoning</span>
                <span className="text-right font-medium">{project.present_zoning}</span>
              </div>
            )}
            {project.zoning_applied_for && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Applying for</span>
                <span className="text-right font-medium">{project.zoning_applied_for}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key dates */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-[15px] font-semibold">Key Dates</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-[13px]">
            {project.application_submission_date && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Application submitted</span>
                <span className="font-medium">{formatDate(project.application_submission_date)}</span>
              </div>
            )}
            {project.hearing_date && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Hearing date</span>
                <span className="font-medium">{formatDate(project.hearing_date)}</span>
              </div>
            )}
            {project.approval_date && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Approval date</span>
                <span className="font-medium text-emerald-600">{formatDate(project.approval_date)}</span>
              </div>
            )}
            {project.proclamation_date && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Proclamation</span>
                <span className="font-medium">{formatDate(project.proclamation_date)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financials summary */}
      {invoices && invoices.length > 0 && (
        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-[15px] font-semibold">Invoice Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 rounded-xl bg-muted/30 p-4 text-center">
              <div>
                <p className="text-[11px] text-muted-foreground">Total Invoiced</p>
                <p className="mt-1 text-[16px] font-bold">{formatCurrency(totalInvoiced)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Total Paid</p>
                <p className="mt-1 text-[16px] font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Outstanding</p>
                <p className={`mt-1 text-[16px] font-bold ${outstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatCurrency(outstanding)}
                </p>
              </div>
            </div>

            <div className="divide-y divide-border/40">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-3 text-[13px]">
                  <div>
                    <span className="font-medium">{inv.invoice_number || 'Invoice'}</span>
                    {inv.date_issued && (
                      <span className="ml-2 text-muted-foreground">{formatDate(inv.date_issued)}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{formatCurrency(Number(inv.amount))}</span>
                    {Number(inv.amount_paid) > 0 && (
                      <span className="ml-2 text-[11px] text-emerald-600 font-medium">
                        {formatCurrency(Number(inv.amount_paid))} paid
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
