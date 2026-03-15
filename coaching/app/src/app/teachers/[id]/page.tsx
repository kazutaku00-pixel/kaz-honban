import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Star, MapPin, BookOpen } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: teacher } = await supabase
    .from('teacher_profiles')
    .select('*, user:coaching_users!user_id(id, name, email, country, avatar_url, created_at)')
    .eq('user_id', id)
    .eq('is_approved', true)
    .single()

  if (!teacher) notFound()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, student:coaching_users!student_id(name, avatar_url)')
    .eq('teacher_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: schedules } = await supabase
    .from('teacher_schedules')
    .select('*')
    .eq('teacher_id', id)
    .eq('is_available', true)
    .order('day_of_week')

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const teacherUser = teacher.user as { id: string; name: string; country: string; avatar_url: string | null; created_at: string }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={teacherUser.avatar_url || undefined} />
                <AvatarFallback className="text-3xl">
                  {teacherUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{teacherUser.name}</h1>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{teacherUser.country}</span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{Number(teacher.avg_rating).toFixed(1)}</span>
                    <span className="text-muted-foreground">({teacher.total_reviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{teacher.total_lessons} lessons</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {teacher.languages.map((lang: string) => (
                    <Badge key={lang} variant="secondary">{lang}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-lg font-semibold mb-3">About</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{teacher.bio}</p>
            </div>

            <Separator />

            <div>
              <h2 className="text-lg font-semibold mb-4">Reviews</h2>
              {!reviews?.length ? (
                <p className="text-muted-foreground">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const student = review.student as { name: string } | null
                    return (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{student?.name?.charAt(0) ?? '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{student?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(review.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className="ml-auto flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Book a Lesson</span>
                  <span className="text-2xl">${Number(teacher.hourly_rate)}/hr</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Available Times</h3>
                  {!schedules?.length ? (
                    <p className="text-sm text-muted-foreground">No schedule set</p>
                  ) : (
                    <div className="space-y-1 text-sm">
                      {schedules.map((s) => (
                        <div key={s.id} className="flex justify-between">
                          <span>{dayNames[s.day_of_week]}</span>
                          <span className="text-muted-foreground">
                            {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Separator />
                <Button className="w-full" size="lg">Book Now</Button>
                <p className="text-xs text-center text-muted-foreground">
                  30min: ${(Number(teacher.hourly_rate) / 2).toFixed(0)} | 60min: ${Number(teacher.hourly_rate)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
