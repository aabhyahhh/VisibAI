import type { EntityStrengthMap as EntityStrengthMapData } from '../lib/types';

interface Props {
  data: EntityStrengthMapData;
  businessName: string;
}

const SIGNAL_LABELS: Record<string, string> = {
  brand_mentions:       'Brand Mentions',
  product_mentions:     'Product Mentions',
  category_association: 'Category Association',
  authority_signals:    'Authority Signals',
  review_signals:       'Review Signals',
};

const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  strong:  { color: '#10B981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)' },
  weak:    { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  missing: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)' },
};

export default function EntityStrengthMap({ data, businessName }: Props) {
  const entries = Object.entries(data) as [keyof EntityStrengthMapData, EntityStrengthMapData[keyof EntityStrengthMapData]][];

  const strongCount = entries.filter(([, v]) => v.status === 'strong').length;
  const totalCount  = entries.length;

  return (
    <div>
      {/* Summary bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div style={{ flex: 1, height: '4px', background: '#1E2028', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${(strongCount / totalCount) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #3B82F6, #10B981)', borderRadius: '2px', transition: 'width 0.8s ease' }} />
        </div>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#94A3B8', flexShrink: 0 }}>
          {strongCount}/{totalCount} signals strong
        </span>
      </div>

      {/* Signal rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {entries.map(([key, signal]) => {
          const colors = STATUS_COLORS[signal.status];
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '10px' }}>
              <span style={{ fontSize: '16px', flexShrink: 0, lineHeight: 1 }}>{signal.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 600, color: colors.color, marginBottom: '2px' }}>
                  {SIGNAL_LABELS[key]}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {signal.detail}
                </div>
              </div>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: colors.color, background: `${colors.color}15`, padding: '2px 8px', borderRadius: '9999px', flexShrink: 0 }}>
                {signal.label}
              </span>
            </div>
          );
        })}
      </div>

      {strongCount === 0 && (
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#2E3140', marginTop: '14px', textAlign: 'center' }}>
          {businessName ? `No strong signals found for "${businessName}"` : 'Enter a business name to see signal strength'}
        </p>
      )}
    </div>
  );
}
