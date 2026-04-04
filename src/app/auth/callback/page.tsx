'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

function AuthCallbackContent() {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const next = searchParams.get('next') ?? '/portal/set-password'

    async function handleCallback() {
      // Case 1: PKCE flow — code in query params
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          router.push(next)
          return
        }
      }

      // Case 2: Hash fragment contains tokens (implicit/invite flow)
      // Parse hash manually since @supabase/ssr may not auto-detect
      const hash = window.location.hash
      if (hash) {
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (!error) {
            router.push(next)
            return
          }
        }
      }

      // Case 3: Session might already exist (e.g. from auto-detection)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push(next)
        return
      }

      // Case 4: Wait for auth state change
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && session) {
            subscription.unsubscribe()
            router.push(next)
          }
        }
      )

      // Timeout after 8 seconds
      setTimeout(() => {
        subscription.unsubscribe()
        setError('Unable to verify your invite link. It may have expired. Please request a new invite.')
      }, 8000)
    }

    handleCallback()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md space-y-4 text-center">
          <p className="text-destructive">{error}</p>
          <a href="/portal/login" className="text-sm text-primary underline">
            Go to login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Setting up your account…</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Setting up your account…</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
