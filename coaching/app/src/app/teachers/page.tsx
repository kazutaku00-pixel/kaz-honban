import { createClient } from '@/lib/supabase/server'
import { TeacherCard } from '@/components/teachers/teacher-card'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default async function TeachersPage() {
  const supabase = await createClient()

  const { data: teachers } = await supabase
    .from('teacher_profiles')
    .select('*, user:coaching_users!user_id(id, name, country, avatar_url)')
    .eq('is_approved', true)
    .order('avg_rating', { ascending: false })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Find a Teacher</h1>
          <p className="text-muted-foreground mt-1">
            Browse our qualified Japanese teachers
          </p>
        </div>

        {!teachers?.length ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No teachers available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map((teacher) => (
              <TeacherCard key={teacher.id} teacher={teacher} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
