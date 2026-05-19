'use client';
import { useState } from 'react';
import { MENTOR_WORLDS, GLOBAL_WORLDS, BRAZILIAN_WORLDS, searchWorlds } from '@/lib/worlds';
import { WorldCard } from '@/components/WorldCard';

const FEATURED_SESSIONS = [
  { label: 'Build unshakeable confidence', worldId: 'mindset-master' },
  { label: 'Stop overthinking everything', worldId: 'emotional-guide' },
  { label: 'Create discipline that sticks', worldId: 'discipline-warrior' },
  { label: 'Find your life purpose', worldId: 'purpose-navigator' },
  { label: 'Grow a real business', worldId: 'startup-builder' },
  { label: 'Optimize sleep & energy', worldId: 'performance-coach' },
  { label: 'Master your finances', worldId: 'wealth-architect' },
];

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'global' | 'brazil'>('all');

  const isSearching = query.trim().length > 1;
  const searchResults = isSearching ? searchWorlds(query) : [];
  const displayWorlds = tab === 'global' ? GLOBAL_WORLDS : tab === 'brazil' ? BRAZILIAN_WORLDS : MENTOR_WORLDS;

  return (
    <div className="min-h-screen" style={{ background: '#0B0B0B' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm"
                style={{ background: '#9BFF00', color: '#000' }}
              >
                W
              </div>
              <span className="text-white font-bold text-lg tracking-wide">WHENTOR AI</span>
            </div>
            <p className="text-gray-600 text-xs">Your Mentor. Anytime. Anywhere.</p>
          </div>
          <a
            href="https://whentor-landing.vercel.app/#pricing"
            className="text-xs font-bold px-4 py-2 rounded-full transition-all hover:opacity-90"
            style={{ background: '#9BFF00', color: '#000' }}
          >
            Go Pro ↗
          </a>
        </div>

        <div className="mb-6">
          <h1 className="text-white font-extrabold text-3xl mb-2 leading-tight">Welcome back 👋</h1>
          <p className="text-gray-500 text-base">What do you need today?</p>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3.5 mb-2"
          style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className="text-gray-500">🔍</span>
          <input
            type="text"
            placeholder="Career, anxiety, money, purpose, fitness…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white text-[15px] outline-none placeholder-gray-600"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-600 hover:text-white transition-colors text-sm">✕</button>
          )}
        </div>
      </div>

      <div className="px-4 max-w-2xl mx-auto pb-20">
        {isSearching ? (
          <div>
            <p className="text-gray-500 text-sm mb-4">
              {searchResults.length > 0
                ? `${searchResults.length} mentor world${searchResults.length !== 1 ? 's' : ''} for "${query}"`
                : `No results for "${query}"`}
            </p>
            {searchResults.length === 0 && (
              <p className="text-gray-600 text-sm">Try: mindset, money, anxiety, discipline, startup, fitness…</p>
            )}
            <div className="grid grid-cols-1 gap-3">
              {searchResults.map(w => <WorldCard key={w.id} world={w} />)}
            </div>
          </div>
        ) : (
          <>
            {/* Featured */}
            <div className="mb-8">
              <h2 className="text-white font-bold text-base mb-3">🔥 Featured Sessions</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
                {FEATURED_SESSIONS.map((s, i) => {
                  const world = MENTOR_WORLDS.find(w => w.id === s.worldId);
                  return (
                    <a
                      key={i}
                      href={`/chat/${s.worldId}`}
                      className="flex-shrink-0 w-36 rounded-2xl p-3.5 transition-all hover:opacity-80"
                      style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <div className="text-xl mb-2">{world?.emoji}</div>
                      <p className="text-white text-xs font-semibold leading-snug">{s.label}</p>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
              {(['all', 'global', 'brazil'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                  style={{
                    background: tab === t ? '#9BFF00' : 'rgba(255,255,255,0.06)',
                    color: tab === t ? '#000' : '#888',
                  }}
                >
                  {t === 'all' ? 'All 14' : t === 'global' ? '🌍 Global' : '🇧🇷 Brazilian'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {displayWorlds.map(w => <WorldCard key={w.id} world={w} />)}
            </div>

            {/* Upgrade nudge */}
            <div
              className="mt-10 rounded-2xl p-5 text-center"
              style={{ background: 'rgba(155,255,0,0.07)', border: '1px solid rgba(155,255,0,0.15)' }}
            >
              <p className="text-white font-bold mb-1">5 free messages per mentor · per day</p>
              <p className="text-gray-500 text-sm mb-4">Upgrade to Pro for unlimited access to all 14 worlds</p>
              <a
                href="https://whentor-landing.vercel.app/#pricing"
                className="inline-block px-6 py-2.5 rounded-full font-bold text-sm transition-opacity hover:opacity-90"
                style={{ background: '#9BFF00', color: '#000' }}
              >
                See Plans →
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
