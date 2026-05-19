import { getWorldById, MENTOR_WORLDS } from '@/lib/worlds';
import { ChatInterface } from '@/components/ChatInterface';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return MENTOR_WORLDS.map(w => ({ id: w.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const world = getWorldById(id);
  if (!world) return { title: 'Whentor AI' };
  return {
    title: `${world.name} · Whentor AI`,
    description: world.tagline,
    openGraph: {
      title: `${world.emoji} ${world.name}`,
      description: `${world.tagline} — Talk to your AI mentor on Whentor AI`,
      siteName: 'Whentor AI',
    },
  };
}

export default async function ChatPage({ params }: Props) {
  const { id } = await params;
  const world = getWorldById(id);
  if (!world) notFound();

  return (
    <div className="h-screen flex flex-col" style={{ background: '#0B0B0B' }}>
      <ChatInterface world={world} />
    </div>
  );
}
