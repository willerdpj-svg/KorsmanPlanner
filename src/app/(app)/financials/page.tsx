import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import {
  DollarSign, TrendingUp, TrendingDown, Receipt,
  FileText, CheckCircle2, Send, Clock, XCircle,
  ArrowRight, AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'

export default async function FinancialsPage() {
  const supabase = await createClient()

  // Fetch all invoices with payments and project info
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      id, invoice_number, amount, date_issued, amount_paid, created_at,
      project:projects(id, file_number, client:clients(name))
    `)
    .order('created_at', { ascending: false })

  // Fetch all quotations with project info
  const { data: quotations } = await supabase
    .from('quotations')
    .select(`
      id, quotation_number, amount, date_issued, status, date_accepted, created_at,
      project:projects(id, file_number, client:clients(name))
    `)
    .order('created_at', { ascending: false })

  // Fetch recent payments
  const { data: recentPayments } = await supabase
    .from('payments')
    .select(`
      id, amount, payment_date, reference, created_at,
      invoice:invoices(id, invoice_number, project:projects(id, file_number, client:clients(name)))
    `)
    .order('created_at', { ascending: false })
    .limit(15)

  // ── Calculate totals ──
  const allInvoices = invoices || []
  const allQuotations = quotations || []
  const allPayments = recentPayments || []

  const totalInvoiced = allInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
  const totalPaid = allInvoices.reduce((sum, inv) => sum + Number(inv.amount_paid), 0)
  const totalOutstanding = totalInvoiced - totalPaid

  // Quotation stats
  const quoteDraft = allQuotations.filter(q => q.status === 'draft')
  const quoteSent = allQuotations.filter(q => q.status === 'sent')
  const quoteAccepted = allQuotations.filter(q => q.status === 'accepted')
  const quoteDeclined = allQuotations.filter(q => q.status === 'declined')

  const totalQuoted = allQuotations.reduce((sum, q) => sum + Number(q.amount), 0)
  const totalAccepted = quoteAccepted.reduce((sum, q) => sum + Number(q.amount), 0)
  const totalPending = quoteSent.reduce((sum, q) => sum + Number(q.amount), 0)

  // Overdue invoices (issued > 30 days ago, not fully paid)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const overdueInvoices = allInvoices.filter(
    inv => inv.date_issued && inv.date_issued < thirtyDaysAgo && Number(inv.amount_paid) < Number(inv.amount)
  )
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (Number(inv.amount) - Number(inv.amount_paid)), 0)

  // Projects with outstanding balances
  const projectBalances = new Map<string, { fileNumber: string; clientName: string; projectId: string; invoiced: number; paid: number }>()
  allInvoices.forEach(inv => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project = inv.project as any
    if (!project) return
    const key = project.id
    const existing = projectBalances.get(key) || {
      fileNumber: project.file_number,
      clientName: project.client?.name || 'No client',
      projectId: project.id,
      invoiced: 0,
      paid: 0,
    }
    existing.invoiced += Number(inv.amount)
    existing.paid += Number(inv.amount_paid)
    projectBalances.set(key, existing)
  })

  const projectsWithOutstanding = [...projectBalances.values()]
    .filter(p => p.invoiced - p.paid > 0)
    .sort((a, b) => (b.invoiced - b.paid) - (a.invoiced - a.paid))

  // Monthly revenue (last 6 months from payments)
  const { data: allPaymentsForChart } = await supabase
    .from('payments')
    .select('amount, payment_date')
    .not('payment_date', 'is', null)
    .order('payment_date', { ascending: true })

  const monthlyRevenue = new Map<string, number>()
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyRevenue.set(key, 0)
  }
  allPaymentsForChart?.forEach(p => {
    if (!p.payment_date) return
    const key = p.payment_date.substring(0, 7)
    if (monthlyRevenue.has(key)) {
      monthlyRevenue.set(key, (monthlyRevenue.get(key) || 0) + Number(p.amount))
    }
  })

  const monthLabels = [...monthlyRevenue.keys()].map(k => {
    const [y, m] = k.split('-')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[parseInt(m) - 1]
  })
  const monthValues = [...monthlyRevenue.values()]
  const maxMonthly = Math.max(...monthValues, 1)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Financials</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Complete financial overview across all projects.
        </p>
      </div>

      {/* Top-level stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-muted-foreground">Total Invoiced</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{formatCurrency(totalInvoiced)}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Receipt className="h-5 w-5" strokeWidth={1.5} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-muted-foreground">Total Received</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-emerald-600">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="h-5 w-5" strokeWidth={1.5} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-muted-foreground">Outstanding</p>
                <p className={`mt-2 text-2xl font-semibold tabular-nums tracking-tight ${totalOutstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatCurrency(totalOutstanding)}
                </p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${totalOutstanding > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <TrendingDown className="h-5 w-5" strokeWidth={1.5} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-muted-foreground">Overdue (30d+)</p>
                <p className={`mt-2 text-2xl font-semibold tabular-nums tracking-tight ${totalOverdue > 0 ? 'text-orange-600' : ''}`}>
                  {formatCurrency(totalOverdue)}
                </p>
                {overdueInvoices.length > 0 && (
                  <p className="mt-0.5 text-[11px] text-orange-500">{overdueInvoices.length} invoice{overdueInvoices.length !== 1 ? 's' : ''}</p>
                )}
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <AlertTriangle className="h-5 w-5" strokeWidth={1.5} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotation stats */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-[15px] font-semibold">Quotation Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border/40 p-4">
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Draft
              </div>
              <p className="mt-1.5 text-lg font-semibold tabular-nums">{quoteDraft.length}</p>
              <p className="text-[12px] text-muted-foreground">{formatCurrency(quoteDraft.reduce((s, q) => s + Number(q.amount), 0))}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4">
              <div className="flex items-center gap-2 text-[12px] text-blue-600">
                <Send className="h-3.5 w-3.5" />
                Sent / Pending
              </div>
              <p className="mt-1.5 text-lg font-semibold tabular-nums text-blue-700">{quoteSent.length}</p>
              <p className="text-[12px] text-blue-600">{formatCurrency(totalPending)}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
              <div className="flex items-center gap-2 text-[12px] text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Accepted
              </div>
              <p className="mt-1.5 text-lg font-semibold tabular-nums text-emerald-700">{quoteAccepted.length}</p>
              <p className="text-[12px] text-emerald-600">{formatCurrency(totalAccepted)}</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50/30 p-4">
              <div className="flex items-center gap-2 text-[12px] text-red-500">
                <XCircle className="h-3.5 w-3.5" />
                Declined
              </div>
              <p className="mt-1.5 text-lg font-semibold tabular-nums text-red-600">{quoteDeclined.length}</p>
              <p className="text-[12px] text-red-500">{formatCurrency(quoteDeclined.reduce((s, q) => s + Number(q.amount), 0))}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue chart + Outstanding by project */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Revenue */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-[15px] font-semibold">Monthly Revenue (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3" style={{ height: 160 }}>
              {monthValues.map((value, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[11px] font-semibold tabular-nums text-foreground/70">
                    {value > 0 ? formatCurrency(value) : '-'}
                  </span>
                  <div
                    className="w-full rounded-lg bg-emerald-500/70 transition-all"
                    style={{
                      height: `${Math.max(4, (value / maxMonthly) * 110)}px`,
                    }}
                  />
                  <span className="text-[10px] font-medium text-muted-foreground/70">
                    {monthLabels[i]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Outstanding by project */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-[15px] font-semibold">Outstanding by Project</CardTitle>
          </CardHeader>
          <CardContent>
            {projectsWithOutstanding.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {projectsWithOutstanding.slice(0, 10).map((p) => {
                  const outstanding = p.invoiced - p.paid
                  const pctPaid = p.invoiced > 0 ? (p.paid / p.invoiced) * 100 : 0
                  return (
                    <Link key={p.projectId} href={`/projects/${p.projectId}?tab=financials`}>
                      <div className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 transition-colors hover:bg-muted/30 hover:border-border/40">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[13px] font-semibold">{p.fileNumber}</span>
                            <span className="truncate text-[12px] text-muted-foreground">{p.clientName}</span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1.5 w-24 rounded-full bg-muted">
                              <div
                                className="h-1.5 rounded-full bg-emerald-500"
                                style={{ width: `${Math.min(pctPaid, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground">{Math.round(pctPaid)}% paid</span>
                          </div>
                        </div>
                        <span className="text-[13px] font-bold text-red-600 tabular-nums">{formatCurrency(outstanding)}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                <p className="mt-3 text-[13px] text-muted-foreground">All invoices fully paid.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-[15px] font-semibold">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {allPayments.length > 0 ? (
            <div className="space-y-1">
              {allPayments.map((payment) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const invoice = payment.invoice as any
                const project = invoice?.project
                return (
                  <div key={payment.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {project && (
                            <Link href={`/projects/${project.id}?tab=financials`} className="font-mono text-[13px] font-semibold hover:underline">
                              {project.file_number}
                            </Link>
                          )}
                          {invoice?.invoice_number && (
                            <span className="text-[12px] text-muted-foreground">{invoice.invoice_number}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          {project?.client?.name && <span>{project.client.name}</span>}
                          {payment.reference && <span>· Ref: {payment.reference}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-bold text-emerald-600 tabular-nums">{formatCurrency(Number(payment.amount))}</p>
                      <p className="text-[11px] text-muted-foreground">{formatDate(payment.payment_date)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-[13px] text-muted-foreground">No payments recorded yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Overdue Invoices */}
      {overdueInvoices.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/20 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-[15px] font-semibold text-orange-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Overdue Invoices (30+ days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {overdueInvoices.map((inv) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const project = inv.project as any
                const outstanding = Number(inv.amount) - Number(inv.amount_paid)
                return (
                  <Link key={inv.id} href={`/projects/${project?.id}?tab=financials`}>
                    <div className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-orange-100/50">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[13px] font-semibold">{project?.file_number || '-'}</span>
                          <span className="text-[12px] text-muted-foreground">{inv.invoice_number || 'No number'}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {project?.client?.name || 'No client'} · Issued {formatDate(inv.date_issued)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-bold text-orange-700 tabular-nums">{formatCurrency(outstanding)}</p>
                        <p className="text-[11px] text-muted-foreground">of {formatCurrency(Number(inv.amount))}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
