'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const PRO_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID!;
const PRO_ANNUAL  = process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID!;

const FEATURES = [
  { icon: '∞', label: 'Unlimited messages' },
  { icon: '🌍', label: 'All 14 mentor worlds' },
  { icon: '🧠', label: 'Session memory — your mentor remembers you' },
  { icon: '☀️', label: 'Daily wisdom email every morning' },
  { icon: '✦', label: 'Shareable wisdom cards' },
  { icon: '⚡', label: 'Priority AI responses' },
];

export default function UpgradePage() {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpgrade = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/signin?next=/upgrade`);
      return;
    }

    const priceId = annual ? PRO_ANNUAL : PRO_MONTHLY;
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });
    const { url, error } = await res.json() as { url?: string; error?: string };
    if (url) {
      window.location.href = url;
    } else {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: '#0B0B0B' }}>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-4"
            style={{ background: '#9BFF00', color: '#000' }}
          >
            W
          </div>
          <h1 className="text-white font-extrabold text-2xl mb-2">Upgrade to Pro</h1>
          <p className="text-gray-500 text-sm">Unlock your full mentorship experience</p>
        </div>

        {/* Toggle */}
        <div
          className="flex rounded-full p-1 mb-6 mx-auto"
          style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', width: 'fit-content' }}
        >
          {(['monthly', 'annual'] as const).map(t => (
            <button
              key={t}
              onClick={() => setAnnual(t === 'annual')}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2"
              style={{
                background: (t === 'annual') === annual ? '#9BFF00' : 'transparent',
                color: (t === 'annual') === annual ? '#000' : '#666',
              }}
            >
              {t === 'monthly' ? 'Monthly' : 'Annual'}
              {t === 'annual' && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: annual ? 'rgba(0,0,0,0.2)' : 'rgba(155,255,0,0.15)',
                    color: annual ? '#000' : '#9BFF00',
                  }}
                >
                  –20%
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Price card */}
        <div
          className="rounded-3xl p-6 mb-5"
          style={{
            background: '#141414',
            border: '1px solid rgba(155,255,0,0.3)',
            boxShadow: '0 0 40px rgba(155,255,0,0.06)',
          }}
        >
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-white font-extrabold text-4xl">
              {annual ? '$7.99' : '$9.99'}
            </span>
            <span className="text-gray-500 text-sm">/month</span>
          </div>
          {annual && <p className="text-xs mb-4" style={{ color: '#9BFF00' }}>Billed $95.88/year — save $24</p>}

          <div className="space-y-3 mt-5">
            {FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <span style={{ color: '#9BFF00', fontSize: 14, width: 20, textAlign: 'center' }}>{f.icon}</span>
                <span className="text-gray-300 text-sm">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full py-4 rounded-2xl text-black font-extrabold text-base transition-all hover:opacity-90 disabled:opacity-60 glow-green"
          style={{ background: '#9BFF00' }}
        >
          {loading ? 'Redirecting…' : `Get Pro ${annual ? '· $7.99/mo' : '· $9.99/mo'} →`}
        </button>

        <p className="text-gray-600 text-xs text-center mt-4">
          Cancel anytime · No commitments · 100% secure checkout
        </p>
      </div>
    </div>
  );
}
