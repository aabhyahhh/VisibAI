import type { Entity } from '../lib/types';

interface EntityHighlighterProps {
  text: string;
  entities: Entity[];
  businessName?: string;
}

export default function EntityHighlighter({ text, entities, businessName }: EntityHighlighterProps) {
  const sanitize = (raw: string) => raw.replace(/<[^>]*>/g, '');
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const highlight = (raw: string): string => {
    let result = sanitize(raw);

    // Sort longest-first to avoid partial overwrites
    const sorted = [...entities].sort((a, b) => b.name.length - a.name.length);

    // Business name — blue
    if (businessName?.trim()) {
      const re = new RegExp(`\\b${esc(businessName)}\\b`, 'gi');
      result = result.replace(re, match =>
        `<mark style="background:rgba(59,130,246,0.18);border-bottom:1px solid #3B82F6;font-weight:600;padding:0 2px;border-radius:3px;color:#93C5FD">${match}</mark>`
      );
    }

    // Other entities
    for (const entity of sorted) {
      if (businessName && entity.name.toLowerCase() === businessName.toLowerCase()) continue;
      const sentimentStyle: Record<string, string> = {
        positive: 'background:rgba(16,185,129,0.1);border-bottom:1px solid #10B981;color:#6EE7B7',
        negative: 'background:rgba(239,68,68,0.1);border-bottom:1px solid #EF4444;color:#FCA5A5',
        neutral:  'background:rgba(255,255,255,0.04);border-bottom:1px solid #2E3140;color:#94A3B8',
      };
      const style = sentimentStyle[entity.sentiment] ?? sentimentStyle.neutral;
      const re = new RegExp(`\\b${esc(entity.name)}\\b`, 'gi');
      result = result.replace(re, match =>
        `<mark style="${style};padding:0 2px;border-radius:3px">${match}</mark>`
      );
    }

    return result;
  };

  return (
    <div
      style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.85', fontFamily: "'Inter', sans-serif", maxHeight: '320px', overflowY: 'auto' }}
      dangerouslySetInnerHTML={{ __html: highlight(text) }}
    />
  );
}
