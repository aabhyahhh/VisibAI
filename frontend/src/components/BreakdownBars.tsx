import { useState, useEffect } from 'react';
import type { BreakdownItem } from '../lib/types';

interface BreakdownBarsProps {
  breakdown: {
    presence:  BreakdownItem;
    ranking:   BreakdownItem;
    frequency: BreakdownItem;
    sentiment: BreakdownItem;
    authority: BreakdownItem;
  };
  hasScore: boolean;
}

const ITEMS = [
  { key: 'presence'  as const, label: 'Presence'  },
  { key: 'ranking'   as const, label: 'Ranking'   },
  { key: 'frequency' as const, label: 'Frequency' },
  { key: 'sentiment' as const, label: 'Sentiment' },
  { key: 'authority' as const, label: 'Authority' },
];

export default function BreakdownBars({ breakdown, hasScore }: BreakdownBarsProps) {
  const [widths, setWidths] = useState<Record<string, number>>(
    Object.fromEntries(ITEMS.map(i => [i.key, 0]))
  );
  const [tooltip, setTooltip] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasScore) return;
      setWidths(
        Object.fromEntries(
          ITEMS.map(({ key }) => [key, (breakdown[key].score / breakdown[key].max) * 100])
        )
      );
    }, 150);
    return () => clearTimeout(timer);
  }, [breakdown, hasScore]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
      {ITEMS.map(({ key, label }) => {
        const item = breakdown[key];
        const isActive = tooltip === key;
        return (
          <div key={key}>
            <div
              style={{ display: 'grid', gridTemplateColumns: '88px 1fr 46px', alignItems: 'center', gap: '12px', cursor: 'help' }}
              onMouseEnter={() => setTooltip(key)}
              onMouseLeave={() => setTooltip(null)}
            >
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: isActive ? '#F1F5F9' : '#475569', transition: 'color 0.2s' }}>
                {label}
              </span>
              <div style={{ height: '6px', background: '#1E2028', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '9999px',
                  width: `${hasScore ? widths[key] : 0}%`,
                  background: hasScore ? 'linear-gradient(90deg, #3B82F6, #60A5FA)' : '#1E2028',
                  transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: hasScore && widths[key] > 0 ? '0 0 8px rgba(59,130,246,0.35)' : 'none',
                }} />
              </div>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: hasScore ? '#94A3B8' : '#2E3140', textAlign: 'right' }}>
                {hasScore ? `${item.score}/${item.max}` : `—/${item.max}`}
              </span>
            </div>

            {/* Explanation tooltip */}
            {isActive && item.explanation && (
              <div style={{
                marginTop: '6px', padding: '9px 12px', background: '#161820',
                border: '1px solid #2E3140', borderRadius: '8px',
                fontSize: '12px', color: '#94A3B8', lineHeight: '1.6',
                fontFamily: "'Inter', sans-serif",
              }}>
                {item.explanation}
              </div>
            )}
          </div>
        );
      })}
      {!hasScore && (
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#2E3140', marginTop: '4px' }}>
          Enter a business name to see your score breakdown.
        </p>
      )}
    </div>
  );
}
