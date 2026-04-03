'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { Loader2, Building2 } from 'lucide-react'

export default function PortalLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
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
            width={200}
            height={102}
            className="brightness-110"
            priority
          />
        </div>
        <div className="space-y-5">
          <h2 className="text-4xl font-light tracking-tight text-white/90">
            Client Portal
          </h2>
          <p className="max-w-md text-[15px] leading-relaxed text-white/40">
            Track your land-use application progress, review quotations,
            and stay informed every step of the way.
          </p>
          <div className="mt-8 space-y-3">
            {[
              'View your project status in real time',
              'Review and accept quotations online',
              'See step-by-step application progress',
              'Access your invoice history',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                <span className="text-[14px] text-white/50">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/20">14 Bethal Street, Modelpark, Emalahleni, 1035</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:flex-none lg:w-[520px]">
        <div className="w-full max-w-[360px] space-y-8">
          <div className="lg:hidden">
            <Image src="/images/korsman-logo.jpeg" alt="Korsman & Associates" width={160} height={82} priority />
          </div>

          <div className="space-y-2">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-[28px] font-semibold tracking-tight">Client Portal</h1>
            <p className="text-[15px] text-muted-foreground">
              Sign in to view your projects and quotations
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] font-medium">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl border-border/60 text-[14px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[13px] font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-xl border-border/60 text-[14px]"
              />
            </div>
            {error && (
              <div className="rounded-xl bg-destructive/10 px-4 py-3 text-[13px] text-destructive">{error}</div>
            )}
            <Button type="submit" className="h-11 w-full rounded-xl text-[14px] font-semibold" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-[12px] text-muted-foreground/60">
            Need access? Contact Korsman & Associates at{' '}
            <span className="font-medium text-muted-foreground">admin@korsman.co.za</span>
          </p>
        </div>
      </div>
    </div>
  )
}
