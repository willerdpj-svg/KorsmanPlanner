import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/portal/set-password'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const url = request.nextUrl.clone()
      url.pathname = next
      url.searchParams.delete('code')
      url.searchParams.delete('next')
      return NextResponse.redirect(url)
    }
  }

  // If code exchange failed, redirect to portal login with error
  const url = request.nextUrl.clone()
  url.pathname = '/portal/login'
  url.searchParams.set('error', 'invalid_link')
  return NextResponse.redirect(url)
}
