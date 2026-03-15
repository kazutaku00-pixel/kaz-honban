import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold">NihonGo</span>
        </Link>
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
