'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { CheckCircle2, XCircle, AlertCircle, Clock, FileText } from 'lucide-react'

type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined'

interface QuotePanelProps {
  projectId: string
  quotationNumber: string | null
  quotationAmount: number | null
  quotationDate: string | null
  quoteStatus: QuoteStatus
  dateAccepting: string | null
}

export function PortalQuotePanel({
  projectId,
  quotationNumber,
  quotationAmount,
  quotationDate,
  quoteStatus: initialStatus,
  dateAccepting,
}: QuotePanelProps) {
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleAccept() {
    setLoading('accept')
    setError(null)
    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('projects')
      .update({ quote_status: 'accepted', date_accepting: today })
      .eq('id', projectId)

    if (error) {
      setError(error.message)
    } else {
      setStatus('accepted')
      router.refresh()
    }
    setLoading(null)
  }

  async function handleDecline() {
    setLoading('decline')
    setError(null)

    const { error } = await supabase
      .from('projects')
      .update({ quote_status: 'declined' })
      .eq('id', projectId)

    if (error) {
      setError(error.message)
    } else {
      setStatus('declined')
      router.refresh()
    }
    setLoading(null)
  }

  if (status === 'draft' || !quotationAmount) {
    return (
      <div className="rounded-2xl border border-border/40 bg-muted/20 p-6 text-center">
        <Clock className="mx-auto h-8 w-8 text-muted-foreground/30" />
        <p className="mt-3 text-[14px] font-medium text-muted-foreground">Quotation not yet issued</p>
        <p className="mt-1 text-[13px] text-muted-foreground/60">
          Your planner will send a quotation for your review shortly.
        </p>
      </div>
    )
  }

  if (status === 'accepted') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-emerald-800">Quotation Accepted</p>
            <p className="mt-1 text-[13px] text-emerald-700/80">
              You accepted this quotation{dateAccepting ? ` on ${formatDate(dateAccepting)}` : ''}.
              Our team will be in touch to proceed with your application.
            </p>
            <div className="mt-4 rounded-xl bg-white/60 px-4 py-3">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Amount accepted</span>
                <span className="font-bold text-emerald-700">{formatCurrency(quotationAmount)}</span>
              </div>
              {quotationNumber && (
                <div className="mt-1 flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Quote reference</span>
                  <span className="font-medium">{quotationNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'declined') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-red-800">Quotation Declined</p>
            <p className="mt-1 text-[13px] text-red-700/80">
              You declined this quotation. Please contact us if you would like to discuss further.
            </p>
            <p className="mt-3 text-[12px] text-red-600">admin@korsman.co.za · 013 650 0408</p>
          </div>
        </div>
      </div>
    )
  }

  // status === 'sent' — awaiting client action
  return (
    <div className="space-y-4">
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
              Please review the quotation below and accept or decline to allow us to proceed with your application.
            </p>

            {/* Quote details */}
            <div className="mt-4 rounded-xl border border-amber-200/60 bg-white/70 p-4 space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Quotation amount</span>
                <span className="text-[18px] font-bold text-amber-900">{formatCurrency(quotationAmount)}</span>
              </div>
              {quotationNumber && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-medium">{quotationNumber}</span>
                </div>
              )}
              {quotationDate && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Date issued</span>
                  <span className="font-medium">{formatDate(quotationDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 px-4 py-3 text-[13px] text-destructive">{error}</div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleAccept}
          disabled={!!loading}
          className="flex-1 h-12 rounded-xl gap-2 bg-emerald-600 text-[14px] font-semibold hover:bg-emerald-700"
        >
          <CheckCircle2 className="h-5 w-5" />
          {loading === 'accept' ? 'Accepting...' : 'Accept Quotation'}
        </Button>
        <Button
          onClick={handleDecline}
          disabled={!!loading}
          variant="outline"
          className="flex-1 h-12 rounded-xl gap-2 border-red-200 text-red-600 text-[14px] font-semibold hover:bg-red-50 hover:border-red-300"
        >
          <XCircle className="h-5 w-5" />
          {loading === 'decline' ? 'Declining...' : 'Decline'}
        </Button>
      </div>

      <p className="text-center text-[12px] text-muted-foreground/60">
        Questions? Contact us at admin@korsman.co.za or 013 650 0408
      </p>
    </div>
  )
}
