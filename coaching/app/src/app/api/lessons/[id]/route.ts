import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createDailyRoom } from '@/lib/daily/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('*, student:coaching_users!student_id(name, avatar_url), teacher:coaching_users!teacher_id(name, avatar_url)')
    .eq('id', id)
    .single()

  if (error || !lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  // Only allow participants to view
  if (lesson.student_id !== user.id && lesson.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ lesson })
}

// Join lesson - creates Daily room if needed
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .single()

  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  if (lesson.student_id !== user.id && lesson.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Create Daily room if not exists
  let roomUrl = lesson.daily_room_url
  if (!roomUrl) {
    const room = await createDailyRoom(id)
    roomUrl = room.url

    await supabase
      .from('lessons')
      .update({
        daily_room_url: room.url,
        daily_room_name: room.name,
        status: 'in_progress',
      })
      .eq('id', id)
  }

  return NextResponse.json({ room_url: roomUrl })
}

// Cancel lesson
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { action, reason } = body

  if (action === 'cancel') {
    const { error } = await supabase
      .from('lessons')
      .update({
        status: 'cancelled',
        cancelled_by: user.id,
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason,
      })
      .eq('id', id)
      .in('status', ['scheduled'])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Lesson cancelled' })
  }

  if (action === 'complete') {
    const { error } = await supabase
      .from('lessons')
      .update({ status: 'completed' })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Lesson completed' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
