import { NextRequest, NextResponse } from 'next/server';
import { getWorldById } from '@/lib/worlds';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';

export async function POST(req: NextRequest) {
  try {
    const { worldId, messages } = await req.json() as {
      worldId: string;
      messages: { role: 'user' | 'assistant'; content: string }[];
    };

    if (!worldId || !messages?.length) {
      return NextResponse.json({ error: 'Missing worldId or messages' }, { status: 400 });
    }

    const world = getWorldById(worldId);
    if (!world) {
      return NextResponse.json({ error: 'Mentor world not found' }, { status: 404 });
    }

    if (!ANTHROPIC_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const response = await fetch(CLAUDE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        system: world.systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Claude API error:', err);
      return NextResponse.json({ error: 'AI service error' }, { status: 502 });
    }

    const data = await response.json() as { content: { text: string }[] };
    const text = data?.content?.[0]?.text ?? 'Unable to respond right now.';
    return NextResponse.json({ text });

  } catch (e) {
    console.error('Chat route error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
