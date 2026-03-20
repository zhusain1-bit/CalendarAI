export interface ZoomMeetingResult {
  joinUrl: string;
  meetingId: string;
  password?: string;
}

export async function createZoomMeeting(
  accessToken: string,
  topic: string,
  startTime?: string | null,   // ISO-ish: "2026-03-24T14:00:00"
  durationMinutes?: number,
  timezone?: string | null
): Promise<ZoomMeetingResult> {
  const body: Record<string, unknown> = {
    topic,
    type: startTime ? 2 : 1,
    duration: durationMinutes ?? 60,
    timezone: timezone ?? 'UTC',
    settings: { join_before_host: true, waiting_room: false },
  };

  if (startTime) {
    body.start_time = startTime;
  }

  const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json() as {
    join_url?: string;
    id?: number;
    password?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? 'Failed to create Zoom meeting');
  }

  return {
    joinUrl: data.join_url!,
    meetingId: String(data.id!),
    password: data.password,
  };
}
