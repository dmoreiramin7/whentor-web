import { NextRequest, NextResponse } from 'next/server';
import { getWorldById } from '@/lib/worlds';
import { createClient, createServiceClient } from '@/lib/supabase/server';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';
const FREE_DAILY_LIMIT = 5;
const FREE_WORLDS = ['mindset-master', 'discipline-warrior', 'purpose-navigator'];

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function POST(req: NextRequest) {
  try {
    const { worldId, messages } = await req.json() as {
      worldId: string;
      messages: ChatMessage[];
    };

    if (!worldId || !messages?.length) {
      return NextResponse.json({ error: 'Missing worldId or messages' }, { status: 400 });
    }

    const world = getWorldById(worldId);
    if (!world) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    // ── Auth check ────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // ── Tier check ────────────────────────────────────────────
    let tier = 'anon';
    let profile: { tier: string } | null = null;

    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', user.id)
        .single();
      profile = data;
      tier = data?.tier ?? 'free';
    }

    // Anonymous users: check localStorage limit (done client-side) + world restriction
    if (!user && !FREE_WORLDS.includes(worldId)) {
      return NextResponse.json({
        error: 'upgrade_required',
        reason: 'This mentor world requires a free account. Sign up to unlock 3 worlds for free.',
      }, { status: 403 });
    }

    // Free tier users: rate limit by day
    if (user && tier === 'free') {
      if (!FREE_WORLDS.includes(worldId)) {
        return NextResponse.json({
          error: 'upgrade_required',
          reason: 'This mentor world requires Pro. Upgrade to unlock all 14 worlds.',
        }, { status: 403 });
      }

      const today = new Date().toISOString().slice(0, 10);
      const serviceClient = await createServiceClient();
      const { data: usage } = await serviceClient
        .from('usage_logs')
        .select('message_count')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      const count = usage?.message_count ?? 0;
      if (count >= FREE_DAILY_LIMIT) {
        return NextResponse.json({
          error: 'limit_reached',
          reason: `You've used all ${FREE_DAILY_LIMIT} free messages today. Upgrade to Pro for unlimited access.`,
        }, { status: 429 });
      }

      // Increment usage
      await serviceClient.from('usage_logs').upsert({
        user_id: user.id,
        date: today,
        message_count: count + 1,
      }, { onConflict: 'user_id,date' });
    }

    // ── Call Claude ───────────────────────────────────────────
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
      console.error('Claude error:', await response.text());
      return NextResponse.json({ error: 'AI service error' }, { status: 502 });
    }

    const data = await response.json() as { content: { text: string }[] };
    const text = data?.content?.[0]?.text ?? 'Unable to respond right now.';

    // ── Save session to Supabase (for authenticated users) ────
    if (user) {
      const serviceClient = await createServiceClient();
      const allMessages = [...messages, { role: 'assistant' as const, content: text }];
      await serviceClient.from('chat_sessions').upsert({
        user_id: user.id,
        world_id: worldId,
        messages: allMessages,
        message_count: allMessages.length,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,world_id' });
    }

    return NextResponse.json({ text, tier });

  } catch (e) {
    console.error('Chat route error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
