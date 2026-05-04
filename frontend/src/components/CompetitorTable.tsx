import type { Entity } from '../lib/types';

interface CompetitorTableProps {
  competitors: string[];
  entities: Record<string, Entity[]>;
  businessName: string;
}

export default function CompetitorTable({ competitors, entities, businessName }: CompetitorTableProps) {
  const allModels = Object.keys(entities);

  const getStats = (name: string) => {
    let totalMentions = 0;
    const firstPositions: number[] = [];

    allModels.forEach(model => {
      const found = entities[model]?.find(e => e.name.toLowerCase() === name.toLowerCase());
      if (found) {
        totalMentions += found.count;
        if (found.first_position !== undefined && found.first_position !== 999) {
          firstPositions.push(found.first_position);
        }
      }
    });

    return {
      mentions: totalMentions,
      avgPosition: firstPositions.length > 0
        ? Math.round(firstPositions.reduce((a, b) => a + b, 0) / firstPositions.length)
        : 999,
      models: allModels.filter(m => entities[m]?.some(e => e.name.toLowerCase() === name.toLowerCase() && e.count > 0)),
    };
  };

  const bizStats = businessName ? getStats(businessName) : null;

  const rows = [
    ...(businessName ? [{ name: businessName, ...getStats(businessName), isUser: true }] : []),
    ...competitors.map(c => ({ name: c, ...getStats(c), isUser: false })),
  ].sort((a, b) => {
    if (a.isUser) return -1;
    if (b.isUser) return 1;
    return b.mentions - a.mentions;
  });

  const getStatus = (row: typeof rows[0]) => {
    if (row.isUser) return { label: 'You', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' };
    const bizPos = bizStats?.avgPosition ?? 9999;
    if (row.avgPosition < bizPos)
      return { label: 'Outranking', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' };
    if (row.avgPosition === bizPos)
      return { label: 'Tied', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' };
    return { label: 'Below You', color: '#10B981', bg: 'rgba(16,185,129,0.12)' };
  };

  if (rows.length === 0) return (
    <p style={{ fontSize: '13px', color: '#475569' }}>No brands detected yet.</p>
  );

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Brand', 'Mentions', 'First Pos', 'Models', 'Status'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '0 8px 10px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', borderBottom: '1px solid #1E2028' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const status = getStatus(row);
            return (
              <tr key={row.name} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)' }}>
                <td style={{ padding: '11px 8px', fontSize: '13px', color: row.isUser ? '#93C5FD' : '#94A3B8', fontWeight: row.isUser ? 600 : 400 }}>
                  {row.name || '—'}
                </td>
                <td style={{ padding: '11px 8px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#94A3B8' }}>
                  {row.mentions}
                </td>
                <td style={{ padding: '11px 8px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#94A3B8' }}>
                  {row.avgPosition === 999 ? '—' : `#${row.avgPosition}`}
                </td>
                <td style={{ padding: '11px 8px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {row.models.map(m => (
                      <span key={m} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#475569', background: '#161820', border: '1px solid #1E2028', padding: '1px 6px', borderRadius: '4px' }}>
                        {m[0].toUpperCase()}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '11px 8px' }}>
                  <span style={{ display: 'inline-flex', padding: '2px 9px', borderRadius: '9999px', fontSize: '10px', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", color: status.color, background: status.bg, border: `1px solid ${status.color}30` }}>
                    {status.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
