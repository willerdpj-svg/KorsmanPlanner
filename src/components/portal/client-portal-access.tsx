'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Shield, ShieldCheck, Send, Copy, Check } from 'lucide-react'

interface ClientPortalAccessProps {
  clientId: string
  hasPortalAccess: boolean
  clientEmail: string | null
}

export function ClientPortalAccess({ clientId, hasPortalAccess: initial, clientEmail }: ClientPortalAccessProps) {
  const [hasAccess, setHasAccess] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  async function handleInvite() {
    if (!clientEmail) return
    setLoading(true)
    setMessage(null)

    const res = await fetch('/api/portal/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, email: clientEmail }),
    })

    const json = await res.json()

    if (!res.ok) {
      setMessage({ text: `Error: ${json.error}`, type: 'error' })
    } else {
      setHasAccess(true)
      setMessage({
        text: `Invite sent to ${clientEmail}. They will receive an email with a link to set their password and access the portal.`,
        type: 'success',
      })
    }
    setLoading(false)
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/portal/login`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${hasAccess ? 'bg-emerald-50' : 'bg-muted/50'}`}>
          {hasAccess
            ? <ShieldCheck className="h-5 w-5 text-emerald-600" />
            : <Shield className="h-5 w-5 text-muted-foreground/50" />
          }
        </div>
        <div>
          <p className="text-[13px] font-medium">
            {hasAccess ? 'Portal access enabled' : 'No portal access yet'}
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {hasAccess
              ? 'This client can log in to view their projects and accept quotations.'
              : clientEmail
                ? 'Send an invite so this client can set up their password and access the portal.'
                : 'Add an email address to this client before sending a portal invite.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {clientEmail && (
          <Button
            size="sm"
            onClick={handleInvite}
            disabled={loading}
            className="gap-1.5 rounded-xl text-[13px]"
          >
            <Send className="h-3.5 w-3.5" />
            {loading ? 'Sending...' : hasAccess ? 'Resend Invite' : 'Send Portal Invite'}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyLink}
          className="gap-1.5 rounded-xl text-[13px]"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied!' : 'Copy Portal Link'}
        </Button>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-[12px] leading-relaxed ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-destructive/10 text-destructive'
        }`}>
          {message.text}
        </div>
      )}

      <div className="rounded-xl bg-muted/30 px-4 py-3 text-[12px] text-muted-foreground space-y-1">
        <p className="font-medium text-foreground/70">How it works</p>
        <p>1. Click <span className="font-medium">Send Portal Invite</span> — the client receives an email with a secure link.</p>
        <p>2. They click the link and are prompted to <span className="font-medium">set their own password</span>.</p>
        <p>3. After that, they log in at <span className="font-mono text-[11px]">/portal/login</span> with their email and password anytime.</p>
      </div>
    </div>
  )
}
