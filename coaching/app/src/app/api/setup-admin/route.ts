import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Try creating user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'nittonotakumi@gmail.com',
      password: 'Takumi1030',
      email_confirm: true,
      user_metadata: {
        name: 'Takumi',
        role: 'admin',
        timezone: 'Asia/Tokyo',
      },
    })

    let finalUserId = authData?.user?.id

    // If already exists
    if (authError) {
      // Try to find existing user
      const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      if (listError) {
        return NextResponse.json({ error: 'listUsers failed: ' + listError.message }, { status: 500 })
      }
      const existing = listData?.users?.find((u) => u.email === 'nittonotakumi@gmail.com')
      if (existing) {
        finalUserId = existing.id
        // Update password and confirm
        await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          password: 'Takumi1030',
          email_confirm: true,
          user_metadata: { name: 'Takumi', role: 'admin', timezone: 'Asia/Tokyo' },
        })
      } else {
        return NextResponse.json({
          error: 'Create failed: ' + authError.message,
          details: 'User not found in list either',
        }, { status: 500 })
      }
    }

    if (!finalUserId) {
      return NextResponse.json({ error: 'No user ID' }, { status: 500 })
    }

    // Upsert coaching_users as admin
    const { error: upsertError } = await supabaseAdmin
      .from('coaching_users')
      .upsert({
        id: finalUserId,
        email: 'nittonotakumi@gmail.com',
        name: 'Takumi',
        role: 'admin',
        country: 'JP',
        timezone: 'Asia/Tokyo',
        is_active: true,
      }, { onConflict: 'id' })

    if (upsertError) {
      return NextResponse.json({ error: 'DB upsert failed: ' + upsertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      userId: finalUserId,
      message: 'Admin account ready. Login: nittonotakumi@gmail.com / Takumi1030',
    })
  } catch (err) {
    return NextResponse.json({ error: 'Exception: ' + String(err) }, { status: 500 })
  }
}
