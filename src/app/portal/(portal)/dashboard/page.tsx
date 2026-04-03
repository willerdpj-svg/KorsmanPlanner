import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { StepTracker } from '@/components/projects/step-tracker'
import { StatusBadge } from '@/components/projects/status-badge'
import { formatDate } from '@/lib/utils/format'
import { getApplicationSteps } from '@/types'
import { FileText, AlertCircle, Clock, CheckCircle2, ArrowRight } from 'lucide-react'
import type { ProjectStatus } from '@/types'

export default async function PortalDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const { data: clientRecord } = await supabase
    .from('clients')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!clientRecord) redirect('/portal/login')

  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id, file_number, status, current_step, quote_status,
      quotation_amount, quotation_date, updated_at,
      application_type:application_types(name),
      municipality:municipalities(name, code)
    `)
    .eq('client_id', clientRecord.id)
    .order('updated_at', { ascending: false })

  const pendingQuotes = projects?.filter(
    (p) => p.quote_status === 'sent'
  ) ?? []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getTypeName = (p: any) => p.application_type?.name || null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">
          Welcome back, {clientRecord.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Here&apos;s the current status of your land-use applications.
        </p>
      </div>

      {/* Pending quote alert */}
      {pendingQuotes.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-amber-800">
                {pendingQuotes.length === 1
                  ? 'You have a quotation awaiting your review'
                  : `You have ${pendingQuotes.length} quotations awaiting your review`}
              </p>
              <p className="mt-1 text-[13px] text-amber-700/80">
                Please review and accept or decline to allow us to proceed with your application.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {pendingQuotes.map((p) => (
                  <Link
                    key={p.id}
                    href={`/portal/projects/${p.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-amber-700 transition-colors"
                  >
                    Review {p.file_number}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Projects', value: projects?.length ?? 0, icon: FileText, color: 'text-primary bg-primary/8' },
          { label: 'Active', value: projects?.filter(p => p.status === 'active').length ?? 0, icon: Clock, color: 'text-blue-600 bg-blue-50' },
          { label: 'Approved', value: projects?.filter(p => p.status === 'approved').length ?? 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Quotes Pending', value: pendingQuotes.length, icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
        ].map((s) => (
          <Card key={s.label} className="border-border/40 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
                  <s.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Projects list */}
      <div className="space-y-4">
        <h2 className="text-[16px] font-semibold">Your Applications</h2>
        {projects && projects.length > 0 ? (
          <div className="space-y-3">
            {projects.map((project) => {
              const steps = getApplicationSteps(getTypeName(project))
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const currentStepLabel = steps.find(s => s.step === project.current_step)?.label ?? `Step ${project.current_step}`
              const quoteAwaitingAction = project.quote_status === 'sent'

              return (
                <Link key={project.id} href={`/portal/projects/${project.id}`}>
                  <Card className={`border-border/40 shadow-sm transition-all hover:shadow-md hover:border-border cursor-pointer ${quoteAwaitingAction ? 'border-amber-200 bg-amber-50/30' : ''}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[14px] font-bold">{project.file_number}</span>
                            <StatusBadge status={project.status as ProjectStatus} />
                            {quoteAwaitingAction && (
                              <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                <AlertCircle className="h-3 w-3" />
                                Quote awaiting review
                              </span>
                            )}
                            {project.quote_status === 'accepted' && (
                              <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                Quote accepted
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[13px] text-muted-foreground">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(project.application_type as any)?.name || 'Application'} &middot;{' '}
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(project.municipality as any)?.name || 'Municipality'}
                          </p>
                          <p className="mt-2 text-[12px] text-muted-foreground/60">
                            Current stage: <span className="font-medium text-foreground/70">{currentStepLabel}</span>
                            &nbsp;&middot;&nbsp;Last updated {formatDate(project.updated_at)}
                          </p>
                        </div>
                        <div className="hidden w-48 shrink-0 sm:block">
                          <StepTracker currentStep={project.current_step} steps={steps} compact />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          <Card className="border-border/40 shadow-sm">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/20" />
              <p className="mt-4 text-[14px] font-medium text-muted-foreground">No projects yet</p>
              <p className="mt-1 text-[13px] text-muted-foreground/60">
                Your applications will appear here once they are created.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
