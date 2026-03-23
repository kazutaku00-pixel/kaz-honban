const DAILY_API_URL = "https://api.daily.co/v1";

function getDailyApiKey(): string {
  const key = process.env.DAILY_API_KEY;
  if (!key) {
    throw new Error("DAILY_API_KEY is not configured. Please set it in your environment variables.");
  }
  return key;
}

export async function createDailyRoom(bookingId: string, expiresAt: Date) {
  const res = await fetch(`${DAILY_API_URL}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getDailyApiKey()}`,
    },
    body: JSON.stringify({
      name: `nihongo-${bookingId.slice(0, 8)}`,
      privacy: "private",
      properties: {
        exp: Math.floor(expiresAt.getTime() / 1000),
        enable_chat: true,
        enable_screenshare: false,
        max_participants: 2,
        enable_knocking: false,
        start_audio_off: false,
        start_video_off: false,
      },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to create Daily room: ${error}`);
  }

  return res.json() as Promise<{ name: string; url: string }>;
}

export async function createMeetingToken(
  roomName: string,
  userId: string,
  userName: string,
  expiresAt: Date
) {
  const res = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getDailyApiKey()}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_id: userId,
        user_name: userName,
        exp: Math.floor(expiresAt.getTime() / 1000),
        is_owner: true,
      },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to create meeting token: ${error}`);
  }

  const data = (await res.json()) as { token: string };
  return data.token;
}
