'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { Loader2, ShieldCheck } from 'lucide-react'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
    } else {
      router.push('/portal/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden flex-1 flex-col justify-between bg-[#0d1b3e] p-12 lg:flex">
        <div>
          <Image
            src="/images/korsman-logo.jpeg"
            alt="Korsman & Associates"
            width={220}
            height={112}
            className="brightness-110"
            priority
          />
        </div>
        <div className="space-y-5">
          <h2 className="text-4xl font-light tracking-tight text-white/90">
            Client Portal
          </h2>
          <p className="max-w-md text-[15px] leading-relaxed text-white/40">
            Set your password to access your projects,
            track application progress, and review quotations.
          </p>
        </div>
        <p className="text-xs text-white/20">
          14 Bethal Street, Modelpark, Emalahleni, 1035
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:flex-none lg:w-[520px]">
        <div className="w-full max-w-[360px] space-y-8">
          <div className="lg:hidden">
            <Image
              src="/images/korsman-logo.jpeg"
              alt="Korsman & Associates"
              width={180}
              height={92}
              priority
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-[24px] font-semibold tracking-tight">Set your password</h1>
              <p className="text-[14px] text-muted-foreground">
                Choose a password to secure your account
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[13px] font-medium">
                New password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-xl border-border/60 text-[14px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-[13px] font-medium">
                Confirm password
              </Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="h-11 rounded-xl border-border/60 text-[14px]"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full rounded-xl text-[14px] font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting password…
                </>
              ) : (
                'Set password & continue'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
