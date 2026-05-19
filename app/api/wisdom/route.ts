import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase/server';
import { getWorldById } from '@/lib/worlds';

const resend = new Resend(process.env.RESEND_API_KEY!);
const CRON_SECRET = process.env.CRON_SECRET ?? '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? '';

// Called by a daily cron job (Vercel Cron or external)
export async function POST(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceClient = await createServiceClient();

  // Get all Pro users with daily wisdom enabled
  const { data: proUsers } = await serviceClient
    .from('profiles')
    .select('id, email, full_name')
    .eq('tier', 'pro')
    .eq('daily_wisdom_enabled', true)
    .not('email', 'is', null);

  if (!proUsers?.length) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  for (const user of proUsers) {
    try {
      // Get their most recent chat session
      const { data: session } = await serviceClient
        .from('chat_sessions')
        .select('world_id, messages')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (!session) continue;

      const world = getWorldById(session.world_id);
      if (!world) continue;

      // Get last few messages for context
      const recentMessages = (session.messages as { role: string; content: string }[])
        .slice(-4)
        .map(m => `${m.role === 'user' ? 'User' : world.name}: ${m.content.slice(0, 200)}`)
        .join('\n\n');

      // Generate wisdom from Claude
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 300,
          system: world.systemPrompt,
          messages: [{
            role: 'user',
            content: `Based on our recent conversation:\n\n${recentMessages}\n\nGive ${user.full_name?.split(' ')[0] ?? 'them'} a short, powerful morning message (2-3 sentences max). Reference something specific from our conversation. Make it feel personal and motivating.`,
          }],
        }),
      });

      if (!claudeRes.ok) continue;
      const claudeData = await claudeRes.json() as { content: { text: string }[] };
      const wisdom = claudeData?.content?.[0]?.text ?? '';
      if (!wisdom) continue;

      // Send email via Resend
      await resend.emails.send({
        from: 'Whentor AI <wisdom@whentor.ai>',
        to: user.email!,
        subject: `${world.emoji} Morning wisdom from ${world.name}`,
        html: buildWisdomEmail({
          name: user.full_name?.split(' ')[0] ?? 'there',
          worldName: world.name,
          worldEmoji: world.emoji,
          worldColor: world.color,
          wisdom,
          worldId: world.id,
        }),
      });

      // Log the send
      await serviceClient.from('wisdom_sends').insert({
        user_id: user.id,
        world_id: session.world_id,
        wisdom_text: wisdom,
      });

      sent++;
    } catch (e) {
      console.error(`Wisdom send error for user ${user.id}:`, e);
    }
  }

  return NextResponse.json({ sent, total: proUsers.length });
}

function buildWisdomEmail({
  name, worldName, worldEmoji, worldColor, wisdom, worldId,
}: {
  name: string;
  worldName: string;
  worldEmoji: string;
  worldColor: string;
  wisdom: string;
  worldId: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://whentor-web.vercel.app';
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0B0B0B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px;">

    <!-- Header -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;">
      <div style="width:32px;height:32px;background:#9BFF00;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#000;font-size:16px;">W</div>
      <span style="color:#fff;font-weight:700;font-size:15px;letter-spacing:0.5px;">WHENTOR AI</span>
    </div>

    <!-- Greeting -->
    <p style="color:#888;font-size:13px;margin:0 0 8px;">Good morning, ${name} ☀️</p>

    <!-- Card -->
    <div style="background:#141414;border:1px solid ${worldColor}30;border-radius:20px;padding:24px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <div style="width:36px;height:36px;background:${worldColor}20;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;">${worldEmoji}</div>
        <div>
          <div style="color:#fff;font-weight:700;font-size:13px;">${worldName}</div>
          <div style="color:${worldColor};font-size:11px;">Daily Wisdom</div>
        </div>
      </div>
      <p style="color:#e0e0e0;font-size:15px;line-height:1.7;margin:0;">${wisdom}</p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${appUrl}/chat/${worldId}" style="display:inline-block;background:${worldColor};color:#000;font-weight:700;font-size:14px;padding:14px 28px;border-radius:50px;text-decoration:none;">
        Continue Your Session →
      </a>
    </div>

    <!-- Footer -->
    <p style="color:#444;font-size:11px;text-align:center;margin:0;">
      You're receiving this because you're a Whentor AI Pro member.<br>
      <a href="${appUrl}/profile" style="color:#666;text-decoration:underline;">Manage preferences</a>
    </p>
  </div>
</body>
</html>`;
}
