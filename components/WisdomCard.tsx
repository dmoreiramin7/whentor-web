'use client';
import { useRef, useState } from 'react';
import { MentorWorld } from '@/lib/worlds';

interface WisdomCardProps {
  world: MentorWorld;
  quote: string;
  onClose: () => void;
}

export function WisdomCard({ world, quote, onClose }: WisdomCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Trim quote to a shareable length
  const displayQuote = quote.length > 280 ? quote.slice(0, 277) + '…' : quote;

  const handleShare = async () => {
    setSharing(true);
    try {
      // Try html2canvas for image generation
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current!, {
        backgroundColor: '#0B0B0B',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'whentor-wisdom.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${world.name} · Whentor AI`,
            text: `"${displayQuote}" — ${world.name} on Whentor AI`,
            files: [file],
          });
        } else {
          // Fallback: download the image
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'whentor-wisdom.png';
          a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch {
      // Final fallback: copy text
      handleCopy();
    } finally {
      setSharing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `"${displayQuote}"\n\n— ${world.name} · Whentor AI\nwhentor.ai`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareText = async () => {
    const text = `"${displayQuote}"\n\n— ${world.name} · Whentor AI\n\nGet your own AI mentor at whentor.ai`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // fall through
      }
    }
    handleCopy();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
        {/* The wisdom card — this is what gets captured */}
        <div
          ref={cardRef}
          className="wisdom-card rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0F0F0F 0%, #141414 60%, #0B0B0B 100%)',
            border: `1px solid ${world.color}35`,
            boxShadow: `0 0 60px ${world.color}20, 0 30px 60px rgba(0,0,0,0.7)`,
            padding: '32px 28px',
          }}
        >
          {/* Top bar */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: world.color + '20' }}
            >
              {world.emoji}
            </div>
            <div>
              <div className="text-white font-bold text-sm">{world.name}</div>
              <div className="text-xs font-medium" style={{ color: world.color }}>Whentor AI</div>
            </div>
            <div className="ml-auto">
              <div
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: world.color + '20', color: world.color, border: `1px solid ${world.color}40` }}
              >
                wisdom
              </div>
            </div>
          </div>

          {/* Quote */}
          <div className="mb-6">
            <div
              className="text-4xl mb-3 font-serif leading-none"
              style={{ color: world.color, opacity: 0.6 }}
            >"</div>
            <p
              className="text-white leading-relaxed text-[15px]"
              style={{ fontWeight: 500, lineHeight: 1.7 }}
            >
              {displayQuote}
            </p>
          </div>

          {/* Bottom */}
          <div
            className="flex items-center justify-between pt-4"
            style={{ borderTop: `1px solid rgba(255,255,255,0.07)` }}
          >
            <div className="flex flex-wrap gap-1.5">
              {world.helpsWith.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="text-[9px] px-2 py-0.5 rounded-full"
                  style={{ color: world.color + 'cc', background: world.color + '12' }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <span className="text-gray-600 text-[10px] font-medium">whentor.ai</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-black transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ background: world.color }}
          >
            {sharing ? 'Generating…' : '↑ Share Image'}
          </button>
          <button
            onClick={handleShareText}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:opacity-80 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            {copied ? '✓ Copied!' : '✉ Share Text'}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-3 py-2.5 text-gray-500 text-sm hover:text-white transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
