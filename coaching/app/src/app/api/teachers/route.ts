import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const language = searchParams.get('language')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const minRating = searchParams.get('minRating')
  const sort = searchParams.get('sort') || 'recommended'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20

  let query = supabase
    .from('teacher_profiles')
    .select('*, user:coaching_users!user_id(id, name, country, avatar_url)', { count: 'exact' })
    .eq('is_approved', true)

  if (language) {
    query = query.contains('languages', [language])
  }
  if (minPrice) {
    query = query.gte('hourly_rate', parseFloat(minPrice))
  }
  if (maxPrice) {
    query = query.lte('hourly_rate', parseFloat(maxPrice))
  }
  if (minRating) {
    query = query.gte('avg_rating', parseFloat(minRating))
  }

  switch (sort) {
    case 'price_asc':
      query = query.order('hourly_rate', { ascending: true })
      break
    case 'price_desc':
      query = query.order('hourly_rate', { ascending: false })
      break
    case 'rating':
      query = query.order('avg_rating', { ascending: false })
      break
    case 'reviews':
      query = query.order('total_reviews', { ascending: false })
      break
    default: // recommended
      query = query.order('total_reviews', { ascending: false }).order('avg_rating', { ascending: false })
  }

  query = query.range((page - 1) * limit, page * limit - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    teachers: data,
    total: count,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}
