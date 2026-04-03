'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Shield, ShieldCheck, ExternalLink } from 'lucide-react'

interface ClientPortalAccessProps {
  clientId: string
  hasPortalAccess: boolean
  clientEmail: string | null
}

export function ClientPortalAccess({ clientId, hasPortalAccess: initial, clientEmail }: ClientPortalAccessProps) {
  const [hasAccess, setHasAccess] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const supabase = createClient()

  async function handleInvite() {
    if (!clientEmail) return
    setLoading(true)
    setMessage(null)

    // Send magic link / invite via Supabase Admin — here we use signInWithOtp
    // In production you'd use the Admin API, but this creates a user if not exists
    const { error } = await supabase.auth.signInWithOtp({
      email: clientEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/portal/dashboard`,
        shouldCreateUser: true,
      },
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage(`Invite email sent to ${clientEmail}. The client will receive a magic link to set up their portal access.`)
    }
    setLoading(false)
  }

  async function handleLinkExistingUser() {
    // This would normally link an existing auth user to the client
    // For now, just show the portal URL to share manually
    setMessage(`Share this portal URL with the client: ${window.location.origin}/portal/login`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {hasAccess ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
            <Shield className="h-5 w-5 text-muted-foreground/50" />
          </div>
        )}
        <div>
          <p className="text-[13px] font-medium">
            {hasAccess ? 'Portal access enabled' : 'No portal access'}
          </p>
          <p className="text-[12px] text-muted-foreground">
            {hasAccess
              ? 'This client can log into the portal to view their projects and accept quotes.'
              : 'Send an invite so this client can access the portal.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {clientEmail && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleInvite}
            disabled={loading}
            className="gap-1.5 rounded-xl text-[13px]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {loading ? 'Sending...' : 'Send Portal Invite'}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleLinkExistingUser}
          className="gap-1.5 rounded-xl text-[13px] text-muted-foreground"
        >
          Copy Portal Link
        </Button>
      </div>

      {message && (
        <p className="rounded-xl bg-muted/50 px-3 py-2.5 text-[12px] text-muted-foreground">{message}</p>
      )}
    </div>
  )
}
