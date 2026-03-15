import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'

const PLATFORM_FEE_PERCENT = 0.20 // 20%

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { lesson_id } = body

  // Get lesson details
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*, teacher_profile:teacher_profiles!teacher_id(hourly_rate)')
    .eq('id', lesson_id)
    .eq('student_id', user.id)
    .single()

  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  const hourlyRate = Number((lesson.teacher_profile as { hourly_rate: number })?.hourly_rate ?? 0)
  const amount = lesson.duration_minutes === 30
    ? hourlyRate / 2
    : hourlyRate
  const platformFee = amount * PLATFORM_FEE_PERCENT
  const totalAmount = amount + platformFee

  // Create Stripe checkout session
  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Japanese Lesson (${lesson.duration_minutes} min)`,
          },
          unit_amount: Math.round(totalAmount * 100), // cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/lessons/${lesson_id}?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/lessons/${lesson_id}?payment=cancelled`,
    metadata: {
      lesson_id,
      student_id: user.id,
      teacher_id: lesson.teacher_id,
      amount: amount.toString(),
      platform_fee: platformFee.toString(),
      teacher_payout: (amount).toString(),
    },
  })

  return NextResponse.json({ url: session.url })
}
