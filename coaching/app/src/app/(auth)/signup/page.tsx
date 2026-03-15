'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import type { UserRole, JapaneseLevel } from '@/types/database'

const COUNTRIES = [
  'US', 'GB', 'AU', 'CA', 'JP', 'PH', 'TW', 'KR', 'TH', 'VN',
  'DE', 'FR', 'BR', 'MX', 'IN', 'SG', 'MY', 'ID', 'NZ', 'Other',
]

const LANGUAGES = [
  'Japanese', 'English', 'Chinese', 'Korean', 'Spanish', 'French',
  'German', 'Portuguese', 'Vietnamese', 'Thai',
]

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}

function SignupForm() {
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role') === 'teacher' ? 'teacher' : 'student'

  const [role, setRole] = useState<UserRole>(defaultRole)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [country, setCountry] = useState('')
  const [japaneseLevel, setJapaneseLevel] = useState<JapaneseLevel>('none')
  // Teacher-specific fields
  const [bio, setBio] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [languages, setLanguages] = useState<string[]>(['Japanese'])
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          timezone,
        },
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Update user profile with additional info
      await supabase
        .from('coaching_users')
        .update({
          country,
          japanese_level: role === 'student' ? japaneseLevel : null,
        })
        .eq('id', data.user.id)

      // Create teacher profile if teacher
      if (role === 'teacher') {
        await supabase
          .from('teacher_profiles')
          .insert({
            user_id: data.user.id,
            bio,
            languages,
            hourly_rate: parseFloat(hourlyRate),
            is_approved: false,
          })
      }

      toast.success('Account created! Please check your email to verify.')
      router.push('/login')
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Start your Japanese learning journey</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={role} onValueChange={(v) => setRole(v as UserRole)} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student">I want to learn</TabsTrigger>
            <TabsTrigger value="teacher">I want to teach</TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select value={country} onValueChange={(v) => v && setCountry(v)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {role === 'student' && (
            <div className="space-y-2">
              <Label htmlFor="level">Japanese Level</Label>
              <Select value={japaneseLevel} onValueChange={(v) => v && setJapaneseLevel(v as JapaneseLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Complete Beginner</SelectItem>
                  <SelectItem value="n5">JLPT N5</SelectItem>
                  <SelectItem value="n4">JLPT N4</SelectItem>
                  <SelectItem value="n3">JLPT N3</SelectItem>
                  <SelectItem value="n2">JLPT N2</SelectItem>
                  <SelectItem value="n1">JLPT N1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {role === 'teacher' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="bio">About You</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell students about your teaching experience and style..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  required
                />
                <p className="text-xs text-muted-foreground">{bio.length}/500</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Hourly Rate (USD)</Label>
                <Input
                  id="rate"
                  type="number"
                  min="5"
                  max="100"
                  step="1"
                  placeholder="15"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
