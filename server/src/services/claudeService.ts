import Anthropic from '@anthropic-ai/sdk';

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
- confidence: "high" = all key fields present, "medium" = date/time present, "low" = very little info
- For title: use the meeting subject/title if stated, otherwise infer a concise title from context
- Return ONLY the JSON object, nothing else`;

export async function extractMeetingFromImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<MeetingExtraction> {
  const base64 = imageBuffer.toString('base64');

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
            text: 'Extract the meeting information from this screenshot.',
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
