import Anthropic from '@anthropic-ai/sdk';
import type { FreeSlot } from './availabilityService';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface MeetingExtraction {
  title: string;
  date: string | null;        // YYYY-MM-DD
  startTime: string | null;   // HH:MM
  endTime: string | null;     // HH:MM
  timezone: string | null;    // IANA timezone
  location: string | null;
  description: string | null;
  attendees: Array<{ name: string; email: string | null }>;
  organizer: string | null;
  confidence: 'high' | 'medium' | 'low';
}

const SYSTEM_PROMPT = `You are a meeting information extractor.
Given a screenshot of any message, chat, or email, extract all meeting details
and return ONLY valid JSON with this exact shape (no markdown, no explanation):
{
  "title": string,
  "date": "YYYY-MM-DD" | null,
  "startTime": "HH:MM" | null,
  "endTime": "HH:MM" | null,
  "timezone": "IANA timezone string" | null,
  "location": string | null,
  "description": string | null,
  "attendees": [{ "name": string, "email": string | null }],
  "organizer": string | null,
  "confidence": "high" | "medium" | "low"
}
Rules:
- If information is missing or unclear, use null — never invent data
- Resolve relative dates using today's date provided in the message: "tomorrow", "next Tuesday", "in 3 days", "this Friday", "next week", etc. must be converted to YYYY-MM-DD
- confidence: "high" = all key fields present, "medium" = date/time present, "low" = very little info
- For title: use the meeting subject/title if stated, otherwise infer a concise title from context
- Return ONLY the JSON object, nothing else`;

export async function extractMeetingFromText(text: string): Promise<MeetingExtraction> {
  const today = new Date().toISOString().split('T')[0];
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Today's date is ${today}. Extract the meeting information from this text:\n\n${text}`,
      },
    ],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';
  const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Claude returned malformed JSON — could not parse extraction');
  }
}

export async function extractMeetingFromImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<MeetingExtraction> {
  const base64 = imageBuffer.toString('base64');
  const today = new Date().toISOString().split('T')[0];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: base64,
            },
          },
          {
            type: 'text',
            text: `Today's date is ${today}. Extract the meeting information from this screenshot.`,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // Strip any accidental markdown code fences
  const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();

  let parsed: MeetingExtraction;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Claude returned malformed JSON — could not parse extraction');
  }

  return parsed;
}

// ─── Availability reply ────────────────────────────────────────────────────────

const AVAILABILITY_SYSTEM_PROMPT = `You are a scheduling assistant that writes short, natural availability replies.
Match the tone of the context — casual if informal, professional if formal.
Return only the body of the reply: no subject line, no standalone greeting on its own line, no sign-off.
Keep it under 4 sentences.`;

function formatSlotDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00Z');
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export async function draftAvailabilityReply(
  meeting: MeetingExtraction,
  slots: FreeSlot[]
): Promise<string> {
  const today = new Date().toISOString().split('T')[0];

  const senderName =
    meeting.organizer ??
    meeting.attendees.find((a) => a.name)?.name ??
    'them';

  const slotLines = slots
    .map((s) => `- ${formatSlotDate(s.date)} from ${formatTime(s.startTime)} to ${formatTime(s.endTime)} (${s.timezone})`)
    .join('\n');

  const contextBlock = meeting.description
    ? `Here is the original message:\n---\n${meeting.description}\n---\n`
    : `Meeting topic: ${meeting.title}\n`;

  const userMessage = `Today is ${today}.
${contextBlock}
The person's name is: ${senderName}
Meeting topic: ${meeting.title}

I am available at:
${slotLines}

Draft a reply suggesting these times and ask them to pick one that works.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: AVAILABILITY_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  return response.content[0].type === 'text' ? response.content[0].text.trim() : '';
}
