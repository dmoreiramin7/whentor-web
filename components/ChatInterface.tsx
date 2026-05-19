'use client';
import { useState, useRef, useEffect } from 'react';
import { MentorWorld } from '@/lib/worlds';
import { WisdomCard } from './WisdomCard';
import { hasReachedLimit, incrementMessageCount, remainingMessages, FREE_LIMIT } from '@/lib/rateLimit';
import Link from 'next/link';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export function ChatInterface({ world }: { world: MentorWorld }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [wisdomQuote, setWisdomQuote] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [remaining, setRemaining] = useState(FREE_LIMIT);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLimitReached(hasReachedLimit(world.id));
    setRemaining(remainingMessages(world.id));
  }, [world.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading || limitReached) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    // Increment before sending — prevents double-tapping
    const newCount = incrementMessageCount(world.id);
    const newRemaining = Math.max(0, FREE_LIMIT - newCount);
    setRemaining(newRemaining);
    if (newCount >= FREE_LIMIT) setLimitReached(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldId: world.id,
          messages: updated.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json() as { text?: string; error?: string };
      const reply = data.text ?? 'Something went wrong. Please try again.';

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Connection error. Please check your network.',
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#0B0B0B' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#0F0F0F' }}
      >
        <Link href="/" className="text-gray-500 hover:text-white transition-colors text-lg mr-1">←</Link>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: world.color + '20' }}
        >
          {world.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-sm">{world.name}</div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: world.color }} />
            <span className="text-[11px] font-medium" style={{ color: world.color }}>
              Online · Ready to guide you
            </span>
          </div>
        </div>
        {remaining > 0 && (
          <div className="text-right flex-shrink-0">
            <div className="text-gray-600 text-[10px]">Free messages</div>
            <div className="text-white text-xs font-bold">{remaining} left</div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
              style={{ background: world.color + '18', border: `1px solid ${world.color}30` }}
            >
              {world.emoji}
            </div>
            <h2 className="text-white font-bold text-lg mb-2">{world.name}</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs leading-relaxed">{world.tagline}</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-xs">
              {world.helpsWith.map(tag => (
                <button
                  key={tag}
                  onClick={() => setInput(`I need help with ${tag}`)}
                  className="text-xs px-3 py-1.5 rounded-full transition-colors hover:opacity-80"
                  style={{
                    color: world.color,
                    background: world.color + '15',
                    border: `1px solid ${world.color}35`,
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
            {msg.role === 'assistant' && (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-1"
                style={{ background: world.color + '20' }}
              >
                {world.emoji}
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'rounded-tr-sm text-black font-medium text-sm'
                  : 'rounded-tl-sm text-white text-sm leading-relaxed'
              }`}
              style={{
                background: msg.role === 'user' ? world.color : '#1E1E1E',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.content}

              {/* Share button for assistant messages */}
              {msg.role === 'assistant' && (
                <button
                  onClick={() => setWisdomQuote(msg.content)}
                  className="flex items-center gap-1 mt-2 text-[10px] transition-opacity opacity-40 hover:opacity-80"
                  style={{ color: world.color }}
                >
                  ✦ Save as wisdom card
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 items-start">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
              style={{ background: world.color + '20' }}
            >
              {world.emoji}
            </div>
            <div className="bg-[#1E1E1E] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                {[0, 0.2, 0.4].map(d => (
                  <div
                    key={d}
                    className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"
                    style={{ animationDelay: `${d}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Paywall */}
      {limitReached && (
        <div
          className="mx-4 mb-3 p-4 rounded-2xl text-center"
          style={{ background: world.color + '12', border: `1px solid ${world.color}30` }}
        >
          <p className="text-white font-bold text-sm mb-1">You've used your 5 free messages today</p>
          <p className="text-gray-400 text-xs mb-3">Upgrade to continue your session with {world.name}</p>
          <a
            href="https://whentor-landing.vercel.app/#pricing"
            className="inline-block px-6 py-2.5 rounded-full text-black font-bold text-sm transition-opacity hover:opacity-90"
            style={{ background: world.color }}
          >
            Upgrade to Pro →
          </a>
        </div>
      )}

      {/* Input */}
      {!limitReached && (
        <div
          className="px-4 pb-6 pt-3 border-t flex gap-3 items-end flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#0B0B0B' }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${world.name}…`}
            rows={1}
            className="flex-1 resize-none rounded-2xl px-4 py-3 text-white text-[15px] outline-none transition-all"
            style={{
              background: '#1A1A1A',
              border: `1px solid ${input ? world.color + '50' : 'rgba(255,255,255,0.08)'}`,
              maxHeight: '120px',
              lineHeight: 1.5,
            }}
            onInput={e => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = t.scrollHeight + 'px';
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold transition-all active:scale-95 flex-shrink-0"
            style={{
              background: input.trim() && !loading ? world.color : '#1E1E1E',
              color: input.trim() && !loading ? '#000' : '#555',
            }}
          >
            ↑
          </button>
        </div>
      )}

      {/* Wisdom Card Modal */}
      {wisdomQuote && (
        <WisdomCard
          world={world}
          quote={wisdomQuote}
          onClose={() => setWisdomQuote(null)}
        />
      )}
    </div>
  );
}
