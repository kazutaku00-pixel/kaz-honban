const DAILY_API_URL = "https://api.daily.co/v1";

function getDailyApiKey(): string {
  const key = process.env.DAILY_API_KEY;
  if (!key) {
    throw new Error("DAILY_API_KEY is not configured. Please set it in your environment variables.");
  }
  return key;
}

function roomNameFor(bookingId: string): string {
  return `nihongo-${bookingId.slice(0, 8)}`;
}

async function getDailyRoom(name: string): Promise<{ name: string; url: string } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${DAILY_API_URL}/rooms/${encodeURIComponent(name)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getDailyApiKey()}`,
      },
      signal: controller.signal,
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to fetch Daily room: ${error}`);
    }
    return (await res.json()) as { name: string; url: string };
  } finally {
    clearTimeout(timeout);
  }
}

// Pre-existing rooms were created with `enable_screenshare:false`. When we
// reuse one (idempotency path), patch its properties so the new feature
// applies without forcing teachers to recreate bookings.
async function patchDailyRoomScreenshare(name: string): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    await fetch(`${DAILY_API_URL}/rooms/${encodeURIComponent(name)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getDailyApiKey()}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        properties: {
          enable_screenshare: true,
        },
      }),
    });
    // Best-effort: even if PATCH fails, fall through and reuse the room.
  } catch {
    /* swallow — screenshare is enhancement, not a hard requirement */
  } finally {
    clearTimeout(timeout);
  }
}

export async function createDailyRoom(bookingId: string, expiresAt: Date) {
  const name = roomNameFor(bookingId);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${DAILY_API_URL}/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getDailyApiKey()}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        name,
        privacy: "private",
        properties: {
          exp: Math.floor(expiresAt.getTime() / 1000),
          enable_chat: true,
          enable_screenshare: true,
          max_participants: 2,
          enable_knocking: false,
          start_audio_off: false,
          start_video_off: false,
        },
      }),
    });

    if (res.ok) {
      return (await res.json()) as { name: string; url: string };
    }

    // Idempotency: if the room already exists on Daily's side (e.g. DB write
    // failed on a previous attempt), reuse it instead of erroring.
    const errorText = await res.text();
    if (res.status === 409 || /already.*(exist|taken)/i.test(errorText)) {
      const existing = await getDailyRoom(name);
      if (existing) {
        // Backfill new properties (e.g. screenshare) onto rooms created
        // before they were enabled.
        await patchDailyRoomScreenshare(name);
        return existing;
      }
    }
    throw new Error(`Failed to create Daily room: ${errorText}`);
  } finally {
    clearTimeout(timeout);
  }
}

export async function createMeetingToken(
  roomName: string,
  userId: string,
  userName: string,
  expiresAt: Date,
  isOwner: boolean = false
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getDailyApiKey()}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_id: userId,
          user_name: userName,
          exp: Math.floor(expiresAt.getTime() / 1000),
          is_owner: isOwner,
        },
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to create meeting token: ${error}`);
    }

    const data = (await res.json()) as { token: string };
    return data.token;
  } finally {
    clearTimeout(timeout);
  }
}
