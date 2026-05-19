'use client';
import Link from 'next/link';
import { MentorWorld } from '@/lib/worlds';

export function WorldCard({ world }: { world: MentorWorld }) {
  return (
    <Link href={`/chat/${world.id}`} className="block group">
      <div
        className="rounded-2xl p-4 border transition-all duration-200 hover:scale-[1.02] cursor-pointer"
        style={{
          background: 'rgba(20,20,20,0.8)',
          borderColor: world.color + '25',
        }}
      >
        <div className="flex items-start gap-3">
          {/* Emoji */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: world.color + '18' }}
          >
            {world.emoji}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="text-white font-bold text-[15px] leading-tight">{world.name}</h3>
              {world.category === 'brazilian' && (
                <span className="text-[10px] text-gray-500 flex-shrink-0">🇧🇷</span>
              )}
            </div>
            <p className="text-gray-500 text-xs mb-3 leading-snug">{world.tagline}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {world.helpsWith.slice(0, 4).map(tag => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ color: world.color, background: world.color + '15', border: `1px solid ${world.color}25` }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Inspired by */}
        <div className="mt-3 pt-3 border-t flex items-center gap-1.5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <span className="text-gray-600 text-[10px]">Inspired by</span>
          <span className="text-gray-400 text-[10px] font-medium truncate">
            {world.inspiredBy.join(', ')}
          </span>
        </div>
      </div>
    </Link>
  );
}
