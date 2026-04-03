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
  const redirectTo = `${request.nextUrl.origin}/auth/callback?next=/portal/set-password`

  // Try inviteUserByEmail first (creates user + sends invite email)
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { client_id: clientId },
  })

  if (inviteError) {
    // If user already exists, send a magic link / recovery email instead
    const alreadyRegistered = inviteError.message.toLowerCase().includes('already been registered')
      || inviteError.message.toLowerCase().includes('already exists')

    if (!alreadyRegistered) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 })
    }

    // Look up existing user by email
    const { data: { users } } = await admin.auth.admin.listUsers()
    const existingUser = users?.find(u => u.email === email)

    if (existingUser) {
      // Link the existing auth user to the client record
      await supabase
        .from('clients')
        .update({ user_id: existingUser.id })
        .eq('id', clientId)

      // Generate a recovery link so they can set their password
      const { error: linkError } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo },
      })

      if (linkError) {
        return NextResponse.json({ error: linkError.message }, { status: 400 })
      }

      // Also send the recovery email via the standard API
      await admin.auth.resetPasswordForEmail(email, { redirectTo })

      return NextResponse.json({ success: true, resent: true })
    }

    return NextResponse.json({ error: inviteError.message }, { status: 400 })
  }

  // Link this auth user to the client record
  if (inviteData?.user?.id) {
    await supabase
      .from('clients')
      .update({ user_id: inviteData.user.id })
      .eq('id', clientId)
  }

  return NextResponse.json({ success: true })
}
