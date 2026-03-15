'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor } from 'lucide-react'
import DailyIframe from '@daily-co/daily-js'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params.id as string

  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  const [callFrame, setCallFrame] = useState<ReturnType<typeof DailyIframe.createFrame> | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Join the lesson room
  useEffect(() => {
    async function joinRoom() {
      try {
        const res = await fetch(`/api/lessons/${lessonId}`, { method: 'POST' })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to join room')
          setLoading(false)
          return
        }

        setRoomUrl(data.room_url)
      } catch {
        setError('Failed to connect')
      }
      setLoading(false)
    }

    joinRoom()
  }, [lessonId])

  // Initialize Daily call
  useEffect(() => {
    if (!roomUrl) return

    const container = document.getElementById('daily-container')
    if (!container) return

    const frame = DailyIframe.createFrame(container, {
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
        borderRadius: '12px',
      },
      showLeaveButton: false,
      showFullscreenButton: true,
    })

    frame.join({ url: roomUrl })
    setCallFrame(frame)

    return () => {
      frame.destroy()
    }
  }, [roomUrl])

  const toggleMute = useCallback(() => {
    if (callFrame) {
      callFrame.setLocalAudio(!isMuted ? false : true)
      setIsMuted(!isMuted)
    }
  }, [callFrame, isMuted])

  const toggleVideo = useCallback(() => {
    if (callFrame) {
      callFrame.setLocalVideo(!isVideoOff ? false : true)
      setIsVideoOff(!isVideoOff)
    }
  }, [callFrame, isVideoOff])

  const shareScreen = useCallback(() => {
    if (callFrame) {
      callFrame.startScreenShare()
    }
  }, [callFrame])

  const leaveCall = useCallback(async () => {
    if (callFrame) {
      await callFrame.leave()
      callFrame.destroy()
    }
    // Mark lesson as completed
    await fetch(`/api/lessons/${lessonId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete' }),
    })
    router.push('/lessons')
  }, [callFrame, lessonId, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Connecting to lesson room...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/lessons')}>Back to Lessons</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Video area */}
      <div className="flex-1 p-4">
        <div id="daily-container" className="w-full h-full min-h-[60vh] rounded-xl overflow-hidden" />
      </div>

      {/* Controls */}
      <div className="p-4 flex justify-center gap-4">
        <Button
          variant={isMuted ? 'destructive' : 'secondary'}
          size="lg"
          className="rounded-full h-14 w-14"
          onClick={toggleMute}
        >
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>

        <Button
          variant={isVideoOff ? 'destructive' : 'secondary'}
          size="lg"
          className="rounded-full h-14 w-14"
          onClick={toggleVideo}
        >
          {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
        </Button>

        <Button
          variant="secondary"
          size="lg"
          className="rounded-full h-14 w-14"
          onClick={shareScreen}
        >
          <Monitor className="h-6 w-6" />
        </Button>

        <Button
          variant="destructive"
          size="lg"
          className="rounded-full h-14 w-14"
          onClick={leaveCall}
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}
