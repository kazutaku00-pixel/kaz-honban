import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span className="font-bold">NihonGo</span>
            </div>
            <p className="text-sm text-gray-500">
              Learn Japanese with qualified native teachers online.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">For Students</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/teachers" className="hover:text-gray-900">Find Teachers</Link></li>
              <li><Link href="/signup" className="hover:text-gray-900">Sign Up</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">For Teachers</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/signup?role=teacher" className="hover:text-gray-900">Become a Teacher</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Support</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="#" className="hover:text-gray-900">Help Center</Link></li>
              <li><Link href="#" className="hover:text-gray-900">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} NihonGo. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
