import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, BookOpen, Star, DollarSign, Users, UserCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: user } = await supabase
    .from('coaching_users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (!user) redirect('/login')

  if (user.role === 'student') return <StudentDashboard userId={user.id} />
  if (user.role === 'teacher') return <TeacherDashboard userId={user.id} />
  if (user.role === 'admin') return <AdminDashboard />

  redirect('/login')
}

async function StudentDashboard({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: upcomingLessons } = await supabase
    .from('lessons')
    .select('*, teacher:coaching_users!teacher_id(name, avatar_url)')
    .eq('student_id', userId)
    .eq('status', 'scheduled')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(5)

  const { count: totalLessons } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', userId)
    .eq('status', 'completed')

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={BookOpen} color="blue" label="Total Lessons" value={totalLessons ?? 0} />
        <StatCard icon={Calendar} color="green" label="Upcoming" value={upcomingLessons?.length ?? 0} />
        <StatCard icon={Clock} color="purple" label="Hours Learned" value={Math.round((totalLessons ?? 0) * 0.75)} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upcoming Lessons</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/teachers">Find a Teacher</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!upcomingLessons?.length ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No upcoming lessons</p>
              <Button asChild>
                <Link href="/teachers">Book Your First Lesson</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingLessons.map((lesson) => {
                const teacher = lesson.teacher as { name: string; avatar_url: string | null } | null
                return (
                  <div key={lesson.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {teacher?.name?.charAt(0) ?? '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{teacher?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(lesson.start_time), 'MMM d, yyyy h:mm a')} - {lesson.duration_minutes}min
                        </p>
                      </div>
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/lessons/${lesson.id}`}>View</Link>
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

async function TeacherDashboard({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('teacher_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString()

  const { data: todayLessons } = await supabase
    .from('lessons')
    .select('*, student:coaching_users!student_id(name, avatar_url)')
    .eq('teacher_id', userId)
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .in('status', ['scheduled', 'in_progress'])
    .order('start_time')

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
  const { data: monthPayments } = await supabase
    .from('payments')
    .select('teacher_payout')
    .eq('teacher_id', userId)
    .eq('status', 'completed')
    .gte('created_at', startOfMonth)

  const monthlyEarnings = monthPayments?.reduce((sum, p) => sum + Number(p.teacher_payout), 0) ?? 0

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Teacher Dashboard</h1>

      {profile && !profile.is_approved && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Your profile is pending approval. You&apos;ll be notified once approved.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Calendar} color="blue" label="Today" value={todayLessons?.length ?? 0} />
        <StatCard icon={DollarSign} color="green" label="This Month" value={`$${monthlyEarnings.toFixed(0)}`} />
        <StatCard icon={BookOpen} color="purple" label="Total Lessons" value={profile?.total_lessons ?? 0} />
        <StatCard icon={Star} color="yellow" label="Rating" value={Number(profile?.avg_rating ?? 0).toFixed(1)} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today&apos;s Lessons</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/schedule">Manage Schedule</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!todayLessons?.length ? (
            <p className="text-center py-8 text-muted-foreground">No lessons today</p>
          ) : (
            <div className="space-y-4">
              {todayLessons.map((lesson) => {
                const student = lesson.student as { name: string; avatar_url: string | null } | null
                return (
                  <div key={lesson.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {student?.name?.charAt(0) ?? '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{student?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(lesson.start_time), 'h:mm a')} - {lesson.duration_minutes}min
                        </p>
                      </div>
                    </div>
                    {lesson.daily_room_url ? (
                      <Button size="sm" asChild>
                        <Link href={`/room/${lesson.id}`}>Join</Link>
                      </Button>
                    ) : (
                      <Badge variant="secondary">Upcoming</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

async function AdminDashboard() {
  const supabase = await createClient()

  const { count: totalUsers } = await supabase
    .from('coaching_users')
    .select('*', { count: 'exact', head: true })

  const { count: totalTeachers } = await supabase
    .from('teacher_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_approved', true)

  const { count: pendingApprovals } = await supabase
    .from('teacher_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_approved', false)

  const { count: totalLessons } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} color="blue" label="Total Users" value={totalUsers ?? 0} />
        <StatCard icon={UserCheck} color="green" label="Active Teachers" value={totalTeachers ?? 0} />
        <StatCard icon={UserCheck} color="yellow" label="Pending Approvals" value={pendingApprovals ?? 0} />
        <StatCard icon={BookOpen} color="purple" label="Completed Lessons" value={totalLessons ?? 0} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/admin/approvals">Review Pending Teachers ({pendingApprovals ?? 0})</Link>
          </Button>
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/admin/users">Manage Users</Link>
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      <Footer />
    </div>
  )
}

const colorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
}

function StatCard({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  color: string
  label: string
  value: string | number
}) {
  const colors = colorMap[color] ?? colorMap.blue
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`h-12 w-12 rounded-full ${colors.bg} flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${colors.text}`} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
