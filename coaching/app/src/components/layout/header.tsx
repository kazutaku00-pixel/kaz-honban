'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BookOpen, LogOut } from 'lucide-react'

export function Header() {
  const { user, loading } = useUser()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold">NihonGo</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {user?.role === 'student' && (
            <>
              <Link href="/teachers" className="text-sm text-gray-600 hover:text-gray-900">Find Teachers</Link>
              <Link href="/lessons" className="text-sm text-gray-600 hover:text-gray-900">My Lessons</Link>
              <Link href="/favorites" className="text-sm text-gray-600 hover:text-gray-900">Favorites</Link>
            </>
          )}
          {user?.role === 'teacher' && (
            <>
              <Link href="/schedule" className="text-sm text-gray-600 hover:text-gray-900">Schedule</Link>
              <Link href="/lessons" className="text-sm text-gray-600 hover:text-gray-900">Lessons</Link>
              <Link href="/earnings" className="text-sm text-gray-600 hover:text-gray-900">Earnings</Link>
            </>
          )}
          {user?.role === 'admin' && (
            <>
              <Link href="/admin/users" className="text-sm text-gray-600 hover:text-gray-900">Users</Link>
              <Link href="/admin/approvals" className="text-sm text-gray-600 hover:text-gray-900">Approvals</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link href="/settings" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm font-medium">{user.name}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-gray-600"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
