import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star } from 'lucide-react'
import type { TeacherProfile, User } from '@/types/database'

interface TeacherCardProps {
  teacher: TeacherProfile & {
    user: Pick<User, 'id' | 'name' | 'country' | 'avatar_url'>
  }
}

export function TeacherCard({ teacher }: TeacherCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={teacher.user.avatar_url || undefined} alt={teacher.user.name} />
            <AvatarFallback className="text-lg">
              {teacher.user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{teacher.user.name}</h3>
            <p className="text-sm text-muted-foreground">{teacher.user.country}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{Number(teacher.avg_rating).toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({teacher.total_reviews})</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">${Number(teacher.hourly_rate)}</p>
            <p className="text-xs text-muted-foreground">/hour</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-600 line-clamp-2">{teacher.bio}</p>

        <div className="mt-4 flex flex-wrap gap-1">
          {teacher.languages.map((lang) => (
            <Badge key={lang} variant="secondary" className="text-xs">
              {lang}
            </Badge>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <Button className="flex-1" asChild>
            <Link href={`/teachers/${teacher.user.id}`}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
