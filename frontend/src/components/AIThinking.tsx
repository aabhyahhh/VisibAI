import type { AIThinking as AIThinkingData } from '../lib/types';

interface Props {
  data: AIThinkingData;
  query: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  supplement: 'Health & Nutrition',
  software:   'Software / SaaS',
  finance:    'Finance',
  food:       'Food & Beverage',
  default:    'General',
};

const PRIORITY_ICONS = ['🏗', '🔗', '⚖️', '🎓'];

export default function AIThinking({ data, query }: Props) {
  return (
    <div>
      {/* Category badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#3B82F6', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', padding: '3px 10px', borderRadius: '9999px' }}>
          {CATEGORY_LABELS[data.category_detected] ?? 'General'}
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#475569' }}>
          query category detected
        </span>
      </div>

      {/* Explanation */}
      <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.75', marginBottom: '20px', fontFamily: "'Inter', sans-serif" }}>
        {data.explanation}
      </p>

      {/* Priorities */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
        What AI models prioritize for "{query}"
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {data.priorities.map((priority, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: '#161820', border: '1px solid #1E2028', borderRadius: '10px' }}>
            <span style={{ fontSize: '16px', flexShrink: 0, lineHeight: 1 }}>{PRIORITY_ICONS[i] ?? '•'}</span>
            <span style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.5' }}>{priority}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
