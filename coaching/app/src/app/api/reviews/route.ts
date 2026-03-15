import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { lesson_id, rating, comment } = body

  if (!lesson_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
  }

  // Verify the lesson belongs to the student and is completed
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lesson_id)
    .eq('student_id', user.id)
    .eq('status', 'completed')
    .single()

  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found or not completed' }, { status: 404 })
  }

  // Check if review already exists
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('lesson_id', lesson_id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Review already exists' }, { status: 409 })
  }

  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      lesson_id,
      student_id: user.id,
      teacher_id: lesson.teacher_id,
      rating,
      comment: comment || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ review }, { status: 201 })
}
