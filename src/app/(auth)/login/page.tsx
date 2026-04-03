'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel - brand */}
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
            Town & Regional<br />Planners
          </h2>
          <p className="max-w-md text-[15px] leading-relaxed text-white/40">
            Manage land-use applications, track municipal approvals,
            and generate progress reports — all in one place.
          </p>
        </div>
        <p className="text-xs text-white/20">
          14 Bethal Street, Modelpark, Emalahleni, 1035
        </p>
      </div>

      {/* Right panel - form */}
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

          <div className="space-y-2">
            <h1 className="text-[28px] font-semibold tracking-tight">Welcome back</h1>
            <p className="text-[15px] text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@korsman.co.za"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl border-border/60 text-[14px] placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[13px] font-medium">
                Password
              </Label>
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
              <div className="rounded-xl bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" className="h-11 w-full rounded-xl text-[14px] font-semibold" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
