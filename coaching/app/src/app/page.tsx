import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Video, Star, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">NihonGo</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up Free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Learn Japanese
          <br />
          <span className="text-blue-600">with Real Teachers</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Connect with qualified native Japanese teachers for personalized 1-on-1 online lessons.
          Flexible scheduling, affordable pricing.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/signup">Start Learning</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/signup?role=teacher">Become a Teacher</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-gray-50 py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold text-gray-900">How It Works</h2>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                <Globe className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Find Your Teacher</h3>
              <p className="mt-2 text-gray-600">
                Browse qualified teachers, read reviews, and find the perfect match for your level.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                <Video className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Book a Lesson</h3>
              <p className="mt-2 text-gray-600">
                Choose a time that works for you. 30 or 60 minute sessions available.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                <Star className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Learn & Improve</h3>
              <p className="mt-2 text-gray-600">
                Join video lessons, practice speaking, and track your progress over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Ready to start your Japanese journey?</h2>
          <p className="mt-4 text-lg text-gray-600">
            Join thousands of students learning Japanese the right way.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/signup">Get Started - It&apos;s Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} NihonGo. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
