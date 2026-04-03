'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { Loader2, MailCheck } from 'lucide-react'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setName('')
    setEmail('')
    setPassword('')
    setConfirm('')
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim() },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSignedUp(true)
      setLoading(false)
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

          {/* Check-email state after signup */}
          {signedUp ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <MailCheck className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="text-[24px] font-semibold tracking-tight">Check your email</h1>
                <p className="text-[14px] text-muted-foreground">
                  We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
                  Click it to activate your account, then sign in below.
                </p>
              </div>
              <Button
                className="h-11 w-full rounded-xl text-[14px] font-semibold"
                onClick={() => { setSignedUp(false); switchMode('signin') }}
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h1 className="text-[28px] font-semibold tracking-tight">
                  {mode === 'signin' ? 'Welcome back' : 'Create an account'}
                </h1>
                <p className="text-[15px] text-muted-foreground">
                  {mode === 'signin'
                    ? 'Sign in to your account to continue'
                    : 'Register to access the project management system'}
                </p>
              </div>

              <form
                onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}
                className="space-y-5"
              >
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[13px] font-medium">
                      Full name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Jane Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-11 rounded-xl border-border/60 text-[14px] placeholder:text-muted-foreground/50"
                    />
                  </div>
                )}

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
                    placeholder={mode === 'signup' ? 'At least 8 characters' : ''}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 rounded-xl border-border/60 text-[14px]"
                  />
                </div>

                {mode === 'signup' && (
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
                )}

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
                      {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                    </>
                  ) : (
                    mode === 'signin' ? 'Sign in' : 'Create account'
                  )}
                </Button>
              </form>

              <p className="text-center text-[13px] text-muted-foreground">
                {mode === 'signin' ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Create one
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
