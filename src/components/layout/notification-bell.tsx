'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell } from 'lucide-react'

interface NotificationBellProps {
  userId: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [count, setCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchCount() {
      const { count: issueCount } = await supabase
        .from('department_comments')
        .select('id', { count: 'exact', head: true })
        .eq('issue_assigned_to', userId)
        .eq('has_issue', true)

      setCount(issueCount ?? 0)
    }

    fetchCount()

    // Refresh count every 30 seconds
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <button
      onClick={() => router.push('/tasks')}
      className="relative inline-flex items-center justify-center rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      title="My Tasks"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
