import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin role
  const { data: adminUser } = await supabase
    .from('coaching_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminUser?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('teacher_profiles')
    .update({
      is_approved: true,
      approved_at: new Date().toISOString(),
    })
    .eq('user_id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify teacher
  await supabase
    .from('coaching_notifications')
    .insert({
      user_id: id,
      type: 'approval',
      title: 'Profile Approved!',
      message: 'Your teacher profile has been approved. Students can now find and book lessons with you.',
      link: '/dashboard',
    })

  return NextResponse.json({ message: 'Teacher approved' })
}
