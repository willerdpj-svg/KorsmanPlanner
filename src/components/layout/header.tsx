'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User, Menu, ChevronDown } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { MobileSidebar } from './mobile-sidebar'

interface HeaderProps {
  userName: string
}

export function Header({ userName }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/50 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger className="inline-flex items-center justify-center rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] p-0">
            <MobileSidebar />
          </SheetContent>
        </Sheet>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-sm transition-colors hover:bg-muted">
          <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
            <AvatarFallback className="bg-primary text-[11px] font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-[13px] font-medium sm:inline-block">{userName}</span>
          <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl">
          <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-lg">
            <User className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut} className="rounded-lg">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
