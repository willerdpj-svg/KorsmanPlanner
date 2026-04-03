'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export function PortalSignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/portal/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  )
}
