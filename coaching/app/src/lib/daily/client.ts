const DAILY_API_URL = 'https://api.daily.co/v1'

interface DailyRoom {
  id: string
  name: string
  url: string
  created_at: string
  config: Record<string, unknown>
}

export async function createDailyRoom(lessonId: string): Promise<DailyRoom> {
  const response = await fetch(`${DAILY_API_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: `lesson-${lessonId}`,
      properties: {
        exp: Math.floor(Date.now() / 1000) + 3600 * 2, // 2 hours
        max_participants: 2,
        enable_chat: true,
        enable_screenshare: true,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to create Daily room: ${response.statusText}`)
  }

  return response.json()
}

export async function deleteDailyRoom(roomName: string): Promise<void> {
  await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    },
  })
}
