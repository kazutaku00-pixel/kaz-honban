import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('coaching_users')
    .select('role')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('lessons')
    .select('*, student:coaching_users!student_id(name, avatar_url), teacher:coaching_users!teacher_id(name, avatar_url)')

  if (profile?.role === 'student') {
    query = query.eq('student_id', user.id)
  } else if (profile?.role === 'teacher') {
    query = query.eq('teacher_id', user.id)
  }

  const { data, error } = await query.order('start_time', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ lessons: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { teacher_id, start_time, duration_minutes } = body

  if (!teacher_id || !start_time || !duration_minutes) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (![30, 60].includes(duration_minutes)) {
    return NextResponse.json({ error: 'Duration must be 30 or 60 minutes' }, { status: 400 })
  }

  // Calculate end time
  const startDate = new Date(start_time)
  const endDate = new Date(startDate.getTime() + duration_minutes * 60 * 1000)

  // Check for conflicts
  const { data: conflicts } = await supabase
    .from('lessons')
    .select('id')
    .eq('teacher_id', teacher_id)
    .in('status', ['scheduled', 'in_progress'])
    .lt('start_time', endDate.toISOString())
    .gt('end_time', startDate.toISOString())

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json({ error: 'Time slot is not available' }, { status: 409 })
  }

  const { data: lesson, error } = await supabase
    .from('lessons')
    .insert({
      student_id: user.id,
      teacher_id,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      duration_minutes,
      status: 'scheduled',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ lesson }, { status: 201 })
}
