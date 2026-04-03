import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Only authenticated staff can send invites
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { clientId, email } = await request.json()
  if (!clientId || !email) {
    return NextResponse.json({ error: 'clientId and email are required' }, { status: 400 })
  }

  // Verify the client exists
  const { data: client } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', clientId)
    .single()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const admin = createAdminClient()

  // inviteUserByEmail creates the user (if not exists) and sends a
  // "Set up your account" email with a link to choose a password.
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${request.nextUrl.origin}/auth/callback?next=/portal/set-password`,
    data: { client_id: clientId },
  })

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 })
  }

  // If the user already existed (invite resent), their id is in inviteData.user.id
  // Link this auth user to the client record
  if (inviteData?.user?.id) {
    await supabase
      .from('clients')
      .update({ user_id: inviteData.user.id })
      .eq('id', clientId)
  }

  return NextResponse.json({ success: true })
}
