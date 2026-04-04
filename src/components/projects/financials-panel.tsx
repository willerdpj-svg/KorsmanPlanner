'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Plus, ChevronDown, ChevronUp, Send, CheckCircle2, XCircle, Clock, FileText, Trash2 } from 'lucide-react'
import type { Quotation, QuoteStatus, Invoice, Payment } from '@/types'

const QUOTE_STATUS_CONFIG: Record<QuoteStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft:    { label: 'Draft',    color: 'bg-slate-100 text-slate-600',   icon: Clock },
  sent:     { label: 'Sent to client', color: 'bg-blue-50 text-blue-700', icon: Send },
  accepted: { label: 'Accepted', color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  declined: { label: 'Declined', color: 'bg-red-50 text-red-600',         icon: XCircle },
}

interface FinancialsPanelProps {
  projectId: string
  quotations: Quotation[]
  invoices: (Invoice & { payments: Payment[] })[]
}

export function FinancialsPanel({
  projectId,
  quotations: initialQuotations,
  invoices: initialInvoices,
}: FinancialsPanelProps) {
  const router = useRouter()
  const supabase = createClient()
  const [quotations, setQuotations] = useState(initialQuotations)
  const [invoices, setInvoices] = useState(initialInvoices)
  const [showNewQuote, setShowNewQuote] = useState(false)
  const [showNewInvoice, setShowNewInvoice] = useState(false)
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)
  const [showPaymentFor, setShowPaymentFor] = useState<string | null>(null)
  const [sendingQuote, setSendingQuote] = useState<string | null>(null)

  const [newQuote, setNewQuote] = useState({
    quotation_number: '',
    amount: '',
    date_issued: '',
    notes: '',
  })

  const [newInvoice, setNewInvoice] = useState({
    invoice_number: '',
    amount: '',
    date_issued: '',
  })

  const [newPayment, setNewPayment] = useState({
    amount: '',
    payment_date: '',
    reference: '',
  })

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.amount_paid), 0)

  async function handleCreateQuote(e: React.FormEvent) {
    e.preventDefault()
    if (!newQuote.amount) return

    const { data, error } = await supabase
      .from('quotations')
      .insert({
        project_id: projectId,
        quotation_number: newQuote.quotation_number || null,
        amount: parseFloat(newQuote.amount),
        date_issued: newQuote.date_issued || null,
        notes: newQuote.notes || null,
      })
      .select('*')
      .single()

    if (!error && data) {
      setQuotations((prev) => [data, ...prev])
      setNewQuote({ quotation_number: '', amount: '', date_issued: '', notes: '' })
      setShowNewQuote(false)
      router.refresh()
    }
  }

  async function handleSendQuote(quoteId: string) {
    setSendingQuote(quoteId)
    const { error } = await supabase
      .from('quotations')
      .update({ status: 'sent' })
      .eq('id', quoteId)
    if (!error) {
      setQuotations((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, status: 'sent' as QuoteStatus } : q))
      )
      router.refresh()
    }
    setSendingQuote(null)
  }

  async function handleDeleteQuote(quoteId: string) {
    if (!window.confirm('Delete this quotation?')) return
    const { error } = await supabase.from('quotations').delete().eq('id', quoteId)
    if (!error) {
      setQuotations((prev) => prev.filter((q) => q.id !== quoteId))
      router.refresh()
    }
  }

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault()
    if (!newInvoice.amount) return

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        project_id: projectId,
        invoice_number: newInvoice.invoice_number || null,
        amount: parseFloat(newInvoice.amount),
        date_issued: newInvoice.date_issued || null,
      })
      .select('*')
      .single()

    if (!error && data) {
      setInvoices((prev) => [{ ...data, payments: [] }, ...prev])
      setNewInvoice({ invoice_number: '', amount: '', date_issued: '' })
      setShowNewInvoice(false)
      router.refresh()
    }
  }

  async function handleRecordPayment(invoiceId: string, e: React.FormEvent) {
    e.preventDefault()
    if (!newPayment.amount) return

    const { data, error } = await supabase
      .from('payments')
      .insert({
        invoice_id: invoiceId,
        amount: parseFloat(newPayment.amount),
        payment_date: newPayment.payment_date || null,
        reference: newPayment.reference || null,
      })
      .select('*')
      .single()

    if (!error && data) {
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id !== invoiceId) return inv
          const updatedPayments = [...inv.payments, data]
          const newPaid = updatedPayments.reduce((sum, p) => sum + Number(p.amount), 0)
          return { ...inv, payments: updatedPayments, amount_paid: newPaid }
        })
      )
      setNewPayment({ amount: '', payment_date: '', reference: '' })
      setShowPaymentFor(null)
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {/* Quotations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Quotations ({quotations.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowNewQuote(!showNewQuote)}>
            <Plus className="mr-1 h-3 w-3" />
            New Quotation
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* New quotation form */}
          {showNewQuote && (
            <form onSubmit={handleCreateQuote} className="space-y-3 rounded-md border p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Quotation Number</Label>
                  <Input
                    placeholder="Q-001"
                    value={newQuote.quotation_number}
                    onChange={(e) => setNewQuote((p) => ({ ...p, quotation_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Amount (ZAR) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={newQuote.amount}
                    onChange={(e) => setNewQuote((p) => ({ ...p, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date Issued</Label>
                  <Input
                    type="date"
                    value={newQuote.date_issued}
                    onChange={(e) => setNewQuote((p) => ({ ...p, date_issued: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Notes</Label>
                  <Input
                    placeholder="Optional notes"
                    value={newQuote.notes}
                    onChange={(e) => setNewQuote((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm">Create Quotation</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewQuote(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {quotations.length === 0 && !showNewQuote && (
            <p className="py-4 text-center text-sm text-muted-foreground">No quotations yet.</p>
          )}

          {quotations.map((quote) => {
            const cfg = QUOTE_STATUS_CONFIG[quote.status]
            const Icon = cfg.icon
            const canSend = quote.status === 'draft' || quote.status === 'declined'
            const canDelete = quote.status === 'draft'

            return (
              <div key={quote.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">
                        {quote.quotation_number || 'No number'}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatDate(quote.date_issued)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{formatCurrency(Number(quote.amount))}</span>
                    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold ${cfg.color}`}>
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>
                </div>
                {quote.notes && (
                  <p className="mt-1 ml-7 text-xs text-muted-foreground">{quote.notes}</p>
                )}
                {quote.date_accepted && (
                  <p className="mt-1 ml-7 text-xs text-emerald-600">Accepted on {formatDate(quote.date_accepted)}</p>
                )}
                <div className="mt-2 ml-7 flex gap-2">
                  {canSend && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendQuote(quote.id)}
                      disabled={sendingQuote === quote.id}
                      className="gap-1.5 text-[12px]"
                    >
                      <Send className="h-3 w-3" />
                      {sendingQuote === quote.id ? 'Sending...' : 'Send to Client'}
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteQuote(quote.id)}
                      className="gap-1.5 text-[12px] text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Financial summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financial Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <InfoRow label="Total Invoiced" value={formatCurrency(totalInvoiced)} />
          <InfoRow label="Total Paid" value={formatCurrency(totalPaid)} />
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Outstanding</span>
            <span className={`text-right font-medium ${totalInvoiced - totalPaid > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(totalInvoiced - totalPaid)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Invoices ({invoices.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowNewInvoice(!showNewInvoice)}>
            <Plus className="mr-1 h-3 w-3" />
            Add Invoice
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {showNewInvoice && (
            <form onSubmit={handleCreateInvoice} className="space-y-3 rounded-md border p-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Invoice Number</Label>
                  <Input
                    placeholder="INV-001"
                    value={newInvoice.invoice_number}
                    onChange={(e) => setNewInvoice((p) => ({ ...p, invoice_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Amount (ZAR) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice((p) => ({ ...p, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date Issued</Label>
                  <Input
                    type="date"
                    value={newInvoice.date_issued}
                    onChange={(e) => setNewInvoice((p) => ({ ...p, date_issued: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm">Create Invoice</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewInvoice(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {invoices.length === 0 && !showNewInvoice && (
            <p className="py-4 text-center text-sm text-muted-foreground">No invoices yet.</p>
          )}

          {invoices.map((invoice) => {
            const outstanding = Number(invoice.amount) - Number(invoice.amount_paid)
            const isExpanded = expandedInvoice === invoice.id

            return (
              <div key={invoice.id} className="rounded-md border">
                <div
                  className="flex cursor-pointer items-center justify-between p-3"
                  onClick={() => setExpandedInvoice(isExpanded ? null : invoice.id)}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-sm font-medium">
                        {invoice.invoice_number || 'No number'}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatDate(invoice.date_issued)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatCurrency(Number(invoice.amount))}</span>
                    {outstanding <= 0 ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">Paid</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                        {formatCurrency(outstanding)} due
                      </Badge>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-3 pb-3 pt-2 space-y-2">
                    {invoice.payments.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Payments</p>
                        {invoice.payments.map((payment) => (
                          <div key={payment.id} className="flex justify-between text-sm">
                            <span>
                              {formatDate(payment.payment_date)}
                              {payment.reference && <span className="ml-2 text-muted-foreground">({payment.reference})</span>}
                            </span>
                            <span className="font-medium text-green-600">{formatCurrency(Number(payment.amount))}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {showPaymentFor === invoice.id ? (
                      <form onSubmit={(e) => handleRecordPayment(invoice.id, e)} className="space-y-2 rounded bg-muted/50 p-2">
                        <div className="grid gap-2 sm:grid-cols-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Amount (ZAR) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              required
                              value={newPayment.amount}
                              onChange={(e) => setNewPayment((p) => ({ ...p, amount: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Date</Label>
                            <Input
                              type="date"
                              value={newPayment.payment_date}
                              onChange={(e) => setNewPayment((p) => ({ ...p, payment_date: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Reference</Label>
                            <Input
                              value={newPayment.reference}
                              onChange={(e) => setNewPayment((p) => ({ ...p, reference: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm">Record Payment</Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => setShowPaymentFor(null)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowPaymentFor(invoice.id)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Record Payment
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
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
