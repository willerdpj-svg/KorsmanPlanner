'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Import', href: '/import', icon: Upload },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-[260px] shrink-0 bg-sidebar lg:flex lg:flex-col">
      {/* Logo area */}
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
          <span className="text-sm font-bold text-white">K</span>
        </div>
        <Link href="/dashboard" className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">
          Korsman Planner
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-6">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-white shadow-sm'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2 : 1.5} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-[10px] leading-relaxed text-sidebar-foreground/30">
          Korsman & Associates<br />
          Town & Regional Planners
        </p>
      </div>
    </aside>
  )
}
