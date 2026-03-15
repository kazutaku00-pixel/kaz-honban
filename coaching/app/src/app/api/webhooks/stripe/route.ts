import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const metadata = session.metadata!

    // Record payment
    await getSupabaseAdmin()
      .from('payments')
      .insert({
        lesson_id: metadata.lesson_id,
        student_id: metadata.student_id,
        teacher_id: metadata.teacher_id,
        amount: parseFloat(metadata.amount) + parseFloat(metadata.platform_fee),
        platform_fee: parseFloat(metadata.platform_fee),
        teacher_payout: parseFloat(metadata.teacher_payout),
        stripe_payment_id: session.payment_intent as string,
        status: 'completed',
      })

    // Create notification for teacher
    await getSupabaseAdmin()
      .from('coaching_notifications')
      .insert({
        user_id: metadata.teacher_id,
        type: 'booking',
        title: 'New Lesson Booked',
        message: 'A student has booked a lesson with you.',
        link: `/lessons`,
      })
  }

  return NextResponse.json({ received: true })
}
