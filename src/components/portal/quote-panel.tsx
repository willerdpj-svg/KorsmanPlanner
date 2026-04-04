'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { CheckCircle2, XCircle, AlertCircle, Clock, FileText } from 'lucide-react'
import type { Quotation, QuoteStatus } from '@/types'

interface QuotePanelProps {
  projectId: string
  quotations: Quotation[]
}

export function PortalQuotePanel({ projectId, quotations: initialQuotations }: QuotePanelProps) {
  const [quotations, setQuotations] = useState(initialQuotations)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleAccept(quoteId: string) {
    setLoading(`accept-${quoteId}`)
    setError(null)
    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('quotations')
      .update({ status: 'accepted', date_accepted: today })
      .eq('id', quoteId)

    if (error) {
      setError(error.message)
    } else {
      setQuotations((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, status: 'accepted' as QuoteStatus, date_accepted: today } : q))
      )
      router.refresh()
    }
    setLoading(null)
  }

  async function handleDecline(quoteId: string) {
    setLoading(`decline-${quoteId}`)
    setError(null)

    const { error } = await supabase
      .from('quotations')
      .update({ status: 'declined' })
      .eq('id', quoteId)

    if (error) {
      setError(error.message)
    } else {
      setQuotations((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, status: 'declined' as QuoteStatus } : q))
      )
      router.refresh()
    }
    setLoading(null)
  }

  if (quotations.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-muted/20 p-6 text-center">
        <Clock className="mx-auto h-8 w-8 text-muted-foreground/30" />
        <p className="mt-3 text-[14px] font-medium text-muted-foreground">No quotations yet</p>
        <p className="mt-1 text-[13px] text-muted-foreground/60">
          Your planner will send a quotation for your review shortly.
        </p>
      </div>
    )
  }

  // Sort: sent first (action needed), then draft, then accepted, then declined
  const statusOrder: Record<QuoteStatus, number> = { sent: 0, draft: 1, accepted: 2, declined: 3 }
  const sorted = [...quotations].sort((a, b) => statusOrder[a.status] - statusOrder[b.status])

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl bg-destructive/10 px-4 py-3 text-[13px] text-destructive">{error}</div>
      )}

      {sorted.map((quote) => {
        if (quote.status === 'draft') {
          return (
            <div key={quote.id} className="rounded-2xl border border-border/40 bg-muted/20 p-5">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-muted-foreground/40" />
                <div>
                  <p className="text-[13px] font-medium text-muted-foreground">Quotation being prepared</p>
                  {quote.quotation_number && (
                    <p className="text-[12px] text-muted-foreground/60">Ref: {quote.quotation_number}</p>
                  )}
                </div>
              </div>
            </div>
          )
        }

        if (quote.status === 'accepted') {
          return (
            <div key={quote.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-emerald-800">Quotation Accepted</p>
                  <p className="mt-1 text-[12px] text-emerald-700/80">
                    Accepted{quote.date_accepted ? ` on ${formatDate(quote.date_accepted)}` : ''}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-[13px]">
                    <span className="font-bold text-emerald-700">{formatCurrency(Number(quote.amount))}</span>
                    {quote.quotation_number && (
                      <span className="text-muted-foreground">Ref: {quote.quotation_number}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        }

        if (quote.status === 'declined') {
          return (
            <div key={quote.id} className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-red-800">Quotation Declined</p>
                  <div className="mt-2 flex items-center gap-4 text-[13px]">
                    <span className="font-medium">{formatCurrency(Number(quote.amount))}</span>
                    {quote.quotation_number && (
                      <span className="text-muted-foreground">Ref: {quote.quotation_number}</span>
                    )}
                  </div>
                  <p className="mt-2 text-[12px] text-red-600">Contact us to discuss: admin@korsman.co.za</p>
                </div>
              </div>
            </div>
          )
        }

        // status === 'sent' — action required
        return (
          <div key={quote.id} className="space-y-3">
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                  <FileText className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-semibold text-amber-900">Quotation Ready for Review</p>
                    <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                      Action Required
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-amber-800/70">
                    Please review and accept or decline to proceed.
                  </p>
                  <div className="mt-4 rounded-xl border border-amber-200/60 bg-white/70 p-4 space-y-2">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="text-[18px] font-bold text-amber-900">{formatCurrency(Number(quote.amount))}</span>
                    </div>
                    {quote.quotation_number && (
                      <div className="flex justify-between text-[13px]">
                        <span className="text-muted-foreground">Reference</span>
                        <span className="font-medium">{quote.quotation_number}</span>
                      </div>
                    )}
                    {quote.date_issued && (
                      <div className="flex justify-between text-[13px]">
                        <span className="text-muted-foreground">Date issued</span>
                        <span className="font-medium">{formatDate(quote.date_issued)}</span>
                      </div>
                    )}
                    {quote.notes && (
                      <div className="flex justify-between text-[13px]">
                        <span className="text-muted-foreground">Notes</span>
                        <span className="font-medium text-right">{quote.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleAccept(quote.id)}
                disabled={!!loading}
                className="flex-1 h-12 rounded-xl gap-2 bg-emerald-600 text-[14px] font-semibold hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-5 w-5" />
                {loading === `accept-${quote.id}` ? 'Accepting...' : 'Accept Quotation'}
              </Button>
              <Button
                onClick={() => handleDecline(quote.id)}
                disabled={!!loading}
                variant="outline"
                className="flex-1 h-12 rounded-xl gap-2 border-red-200 text-red-600 text-[14px] font-semibold hover:bg-red-50 hover:border-red-300"
              >
                <XCircle className="h-5 w-5" />
                {loading === `decline-${quote.id}` ? 'Declining...' : 'Decline'}
              </Button>
            </div>
          </div>
        )
      })}

      <p className="text-center text-[12px] text-muted-foreground/60">
        Questions? Contact us at admin@korsman.co.za or 013 650 0408
      </p>
    </div>
  )
}
