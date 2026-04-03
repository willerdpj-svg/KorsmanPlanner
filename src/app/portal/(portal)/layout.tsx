import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogOut, Building2 } from 'lucide-react'
import Image from 'next/image'
import { PortalSignOutButton } from '@/components/portal/sign-out-button'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  // Find client by user_id first, then fall back to email match (first login after invite)
  let { data: clientRecord } = await supabase
    .from('clients')
    .select('id, name, email')
    .eq('user_id', user.id)
    .single()

  if (!clientRecord && user.email) {
    // First login after invite: link by email and save user_id
    const { data: byEmail } = await supabase
      .from('clients')
      .select('id, name, email')
      .eq('email', user.email)
      .is('user_id', null)
      .single()

    if (byEmail) {
      await supabase
        .from('clients')
        .update({ user_id: user.id })
        .eq('id', byEmail.id)
      clientRecord = byEmail
    }
  }

  if (!clientRecord) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      {/* Portal header */}
      <header className="border-b border-border/50 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Image
              src="/images/korsman-logo.jpeg"
              alt="Korsman & Associates"
              width={120}
              height={61}
              className="object-contain"
            />
            <div className="h-5 w-px bg-border/60" />
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-[13px] font-medium text-muted-foreground">Client Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[13px] font-medium">{clientRecord.name}</p>
              <p className="text-[11px] text-muted-foreground">{clientRecord.email || user.email}</p>
            </div>
            <PortalSignOutButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20 py-6 mt-12">
        <div className="mx-auto max-w-5xl px-6 text-center text-[12px] text-muted-foreground/60">
          Korsman & Associates · Town & Regional Planners · 14 Bethal Street, Modelpark, Emalahleni, 1035 · 013 650 0408
        </div>
      </footer>
    </div>
  )
}
