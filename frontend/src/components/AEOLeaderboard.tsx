import type { LeaderboardEntry } from '../lib/types';

interface Props {
  entries: LeaderboardEntry[];
  businessName: string;
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const MODEL_ABBR: Record<string, { short: string; color: string }> = {
  chatgpt: { short: 'GPT', color: '#10B981' },
  gemini:  { short: 'GEM', color: '#3B82F6' },
  groq:    { short: 'GRQ', color: '#F59E0B' },
};

const sentimentColor = (s: string) =>
  s === 'positive' ? '#10B981' : s === 'negative' ? '#EF4444' : '#475569';

const VISIBLE_ROWS = 6; // how many rows to show in the main list

export default function AEOLeaderboard({ entries, businessName }: Props) {
  if (!entries || entries.length === 0) {
    return <p style={{ fontSize: '13px', color: '#475569' }}>No brand data available.</p>;
  }

  // Full ranked list, capped at VISIBLE_ROWS
  const visibleEntries = entries.slice(0, VISIBLE_ROWS);

  // Is the user's brand inside the visible window?
  const userEntry      = entries.find(e => e.is_user);
  const userInVisible  = visibleEntries.some(e => e.is_user);

  // Show the bottom panel only when: brand searched but not in visible rows
  const showBottomPanel = !!businessName && !userInVisible;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <span style={{ fontSize: '18px' }}>🏆</span>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 700, color: '#F1F5F9' }}>
            AEO Leaderboard
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#475569' }}>
            Ranked by AI mention frequency · position · model coverage
          </div>
        </div>
      </div>

      {/* Main ranked list — user appears inline at their correct rank */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {visibleEntries.map((entry) => (
          <LeaderboardRow key={entry.name} entry={entry} isUser={entry.is_user} />
        ))}
      </div>

      {/* Bottom panel — only when brand is outside the visible rows */}
      {showBottomPanel && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0 12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(59,130,246,0.2)' }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#3B82F6', letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0 }}>
              Your Position
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(59,130,246,0.2)' }} />
          </div>

          {userEntry ? (
            // Found but ranked below the visible window — show with real rank
            <LeaderboardRow entry={userEntry} isUser={true} />
          ) : (
            // Not found in any model response
            <div style={{ padding: '16px 18px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>🔴</span>
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 700, color: '#EF4444' }}>
                  {businessName} — Not Ranked
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>
                  Not mentioned in any AI response for this query
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LeaderboardRow({ entry, isUser }: { entry: LeaderboardEntry; isUser: boolean }) {
  const medal = MEDAL[entry.rank];
  const isTop3 = entry.rank <= 3;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '14px',
      padding: '16px 18px', borderRadius: '13px',
      background: isUser
        ? 'rgba(59,130,246,0.07)'
        : isTop3 ? 'rgba(255,255,255,0.025)' : 'transparent',
      border: isUser
        ? '1px solid rgba(59,130,246,0.25)'
        : isTop3 ? '1px solid #1E2028' : '1px solid transparent',
      transition: 'border-color 0.15s',
    }}>
      {/* Rank badge */}
      <div style={{ flexShrink: 0, width: '36px', textAlign: 'center', paddingTop: '2px' }}>
        {medal ? (
          <span style={{ fontSize: '20px', lineHeight: 1 }}>{medal}</span>
        ) : (
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 700, color: isUser ? '#3B82F6' : '#475569' }}>
            #{entry.rank}
          </span>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '5px' }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '15px', fontWeight: 700, color: isUser ? '#93C5FD' : '#F1F5F9' }}>
            {entry.name}
          </span>
          {isUser && (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#3B82F6', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', padding: '1px 7px', borderRadius: '9999px' }}>
              YOU
            </span>
          )}
          {/* Sentiment dot */}
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sentimentColor(entry.sentiment), display: 'inline-block', flexShrink: 0 }} title={entry.sentiment} />
        </div>
        <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: '1.5' }}>
          {entry.description}
        </p>
      </div>

      {/* Stats column */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
        {/* Mentions badge */}
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 700, color: '#94A3B8' }}>
          {entry.total_mentions}× cited
        </span>
        {/* Position */}
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#475569' }}>
          {entry.avg_position === 999 ? 'pos: —' : `pos: #${entry.avg_position}`}
        </span>
        {/* Model coverage dots */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {entry.models.map(m => {
            const abbr = MODEL_ABBR[m];
            return abbr ? (
              <span key={m} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: abbr.color, background: `${abbr.color}18`, border: `1px solid ${abbr.color}35`, padding: '1px 5px', borderRadius: '3px' }}>
                {abbr.short}
              </span>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}
