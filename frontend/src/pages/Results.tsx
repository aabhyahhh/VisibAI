import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ScoreGauge from '../components/ScoreGauge';
import BreakdownBars from '../components/BreakdownBars';
import EntityHighlighter from '../components/EntityHighlighter';
import ChatPanel from '../components/ChatPanel';
import ImpactSimulation from '../components/ImpactSimulation';
import EntityStrengthMap from '../components/EntityStrengthMap';
import AIThinking from '../components/AIThinking';
import AEOLeaderboard from '../components/AEOLeaderboard';
import { runDiagnostic, saveToHistory } from '../lib/api';
import type { AEOResult, RecommendationAction } from '../lib/types';

type TabKey = 'chatgpt' | 'gemini' | 'groq';

const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: 'chatgpt', label: 'ChatGPT', color: '#10B981' },
  { key: 'gemini',  label: 'Gemini',  color: '#3B82F6' },
  { key: 'groq',    label: 'Groq',    color: '#F59E0B' },
];

const LOADING_STEPS = [
  'Querying AI models...',
  'Extracting brand entities...',
  'Ranking competitors...',
  'Calculating AEO score...',
  'Generating insights...',
];

const visStyle = (v: string) => {
  switch (v) {
    case 'High':      return { color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' };
    case 'Medium':    return { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' };
    case 'Low':       return { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)' };
    case 'Not Found': return { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)' };
    default:          return { color: '#475569', bg: 'rgba(71,85,105,0.12)',   border: 'rgba(71,85,105,0.3)' };
  }
};

const confStyle = (c: string) => {
  switch (c) {
    case 'High':   return { color: '#10B981', bg: 'rgba(16,185,129,0.10)' };
    case 'Medium': return { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' };
    default:       return { color: '#EF4444', bg: 'rgba(239,68,68,0.10)'  };
  }
};

// Bold markdown → strong tags
const md = (text: string) =>
  text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#F1F5F9">$1</strong>');

// ---------------------------------------------------------------------------
// Inline re-run panel
// ---------------------------------------------------------------------------
function ReRunPanel({ defaultQuery, defaultBiz, onResult }: {
  defaultQuery: string;
  defaultBiz: string;
  onResult: (r: AEOResult) => void;
}) {
  const [query, setQuery] = useState(defaultQuery);
  const [biz, setBiz]     = useState(defaultBiz);
  const [loading, setLoading] = useState(false);
  const [step, setStep]   = useState(0);
  const [done, setDone]   = useState<number[]>([]);
  const [error, setError] = useState('');
  const iRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loading) {
      iRef.current = setInterval(() => {
        setStep(p => { const n = p + 1; setDone(d => [...d, p]); return n < LOADING_STEPS.length ? n : p; });
      }, 1800);
    }
    return () => { if (iRef.current) clearInterval(iRef.current); };
  }, [loading]);

  const run = async () => {
    if (!query.trim()) return;
    setError(''); setLoading(true); setStep(0); setDone([]);
    try {
      const result = await runDiagnostic(query.trim(), biz.trim());
      saveToHistory(result);
      localStorage.setItem('aeo_results', JSON.stringify(result));
      onResult(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error'); setLoading(false);
    }
  };

  return (
    <div style={{ background: '#0F1117', border: '1px solid #1E2028', borderRadius: '14px', padding: '18px 22px', marginBottom: '36px' }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#475569', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        Run New Analysis
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {[
          { val: query, set: setQuery, ph: 'Search query…', flex: '2 1 220px' },
          { val: biz,   set: setBiz,   ph: 'Business name…', flex: '1 1 150px' },
        ].map(({ val, set, ph, flex }) => (
          <input key={ph} value={val} onChange={e => set(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()}
            placeholder={ph} disabled={loading}
            style={{ flex, background: '#07080C', border: '1px solid #1E2028', borderRadius: '8px', padding: '10px 14px', color: '#F1F5F9', fontSize: '14px', fontFamily: "'Inter', sans-serif", outline: 'none', transition: 'border-color 0.2s', minWidth: 0 }}
            onFocus={e => { e.currentTarget.style.borderColor = '#3B82F6'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#1E2028'; }} />
        ))}
        <button onClick={run} disabled={loading || !query.trim()}
          style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#3B82F6', color: '#fff', fontSize: '14px', fontWeight: 600, fontFamily: "'Inter', sans-serif", cursor: 'pointer', flexShrink: 0, opacity: loading || !query.trim() ? 0.5 : 1 }}>
          {loading ? '...' : 'Analyze'}
        </button>
      </div>
      {loading && (
        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
          {LOADING_STEPS.map((s, i) => (
            <span key={i} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: done.includes(i) ? '#10B981' : step === i ? '#93C5FD' : '#2E3140' }}>
              {done.includes(i) ? '✓ ' : step === i ? '· ' : ''}{s}
            </span>
          ))}
        </div>
      )}
      {error && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '8px' }}>{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card wrapper
// ---------------------------------------------------------------------------
function Card({ children, accent, style }: { children: React.ReactNode; accent?: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#0F1117', borderRadius: '18px', padding: '28px',
      border: accent ? `1px solid ${accent}` : '1px solid #1E2028',
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardLabel({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: accent ?? '#475569', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {accent && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: accent, display: 'inline-block', boxShadow: `0 0 6px ${accent}55` }} />}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collapsible deep-insight fold
// ---------------------------------------------------------------------------
function DeepFold({ title, subtitle, defaultOpen = false, children }: {
  title: string; subtitle?: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: '10px' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', background: '#0F1117', border: '1px solid #1E2028', borderRadius: open ? '14px 14px 0 0' : '14px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 700, color: '#F1F5F9' }}>{title}</span>
          {subtitle && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#475569' }}>{subtitle}</span>}
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <path d="M4 6l4 4 4-4" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div style={{ border: '1px solid #1E2028', borderTop: 'none', borderRadius: '0 0 14px 14px', padding: '28px', background: '#0B0C10' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action card with what / why / outcome
// ---------------------------------------------------------------------------
function ActionCard({ action, index }: { action: RecommendationAction; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isHigh = action.priority === 'high';

  return (
    <div style={{ border: `1px solid ${isHigh && index === 0 ? 'rgba(59,130,246,0.3)' : '#1E2028'}`, borderRadius: '14px', overflow: 'hidden', background: isHigh && index === 0 ? 'rgba(59,130,246,0.04)' : 'transparent' }}>
      <button onClick={() => setExpanded(e => !e)}
        style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, background: index === 0 ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.04)', border: `1px solid ${index === 0 ? 'rgba(59,130,246,0.35)' : '#1E2028'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 700, color: index === 0 ? '#3B82F6' : '#475569', marginTop: '1px' }}>
          {index + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 700, color: '#F1F5F9' }}>
              {action.title}
            </span>
            {isHigh && (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', padding: '1px 7px', borderRadius: '9999px' }}>
                HIGH IMPACT
              </span>
            )}
          </div>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: '1.6' }}>{action.what}</p>
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, marginTop: '6px' }}>
          <path d="M3 5l4 4 4-4" stroke="#475569" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      {expanded && (
        <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Why it works */}
          <div style={{ padding: '12px 14px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '10px' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Why it works</div>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: '1.6' }}>{action.why}</p>
          </div>
          {/* Expected outcome */}
          <div style={{ padding: '12px 14px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Expected outcome</div>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: '1.6' }}>{action.outcome}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Results page
// ---------------------------------------------------------------------------
export default function Results() {
  const navigate  = useNavigate();
  const [result, setResult]     = useState<AEOResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('chatgpt');

  useEffect(() => {
    const raw = localStorage.getItem('aeo_results');
    if (!raw) { navigate('/'); return; }
    try { setResult(JSON.parse(raw)); } catch { navigate('/'); }
  }, [navigate]);

  if (!result) return null;

  const vis     = visStyle(result.visibility);
  const conf    = confStyle(result.confidence);
  const hasScore = result.score !== null;
  const topCompetitor = result.competitors[0] ?? null;
  const currentEntities = result.entities[activeTab] || [];

  const handleNewResult = (r: AEOResult) => {
    setResult(r); setActiveTab('chatgpt');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout onAnalyzeClick={() => navigate('/')}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 180px' }}>

        {/* ── Topbar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '9999px', border: '1px solid #1E2028', background: 'transparent', color: '#94A3B8', fontSize: '13px', fontFamily: "'Inter', sans-serif", cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F1F5F9'; e.currentTarget.style.borderColor = '#2E3140'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = '#1E2028'; }}>
            ← Home
          </button>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#475569' }}>Analysis for</span>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '16px', fontWeight: 700, color: '#F1F5F9', maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {result.query}
          </span>
          {result.business_name && (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#3B82F6', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', padding: '3px 10px', borderRadius: '9999px' }}>
              {result.business_name}
            </span>
          )}
        </div>

        {/* Re-run panel */}
        <ReRunPanel defaultQuery={result.query} defaultBiz={result.business_name} onResult={handleNewResult} />

        {/* ══════════════════════════════════════════
            FOLD 1 — ABOVE THE FOLD
            Score · Visibility · Why This Matters
            Top Competitor · 3 Key Actions · Confidence
            ══════════════════════════════════════════ */}

        {/* Empty state banner */}
        {!result.business_found && result.business_name && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '22px 26px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '18px', marginBottom: '24px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', fontWeight: 800, flexShrink: 0, fontSize: '18px' }}>✗</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#F1F5F9', fontSize: '16px', marginBottom: '8px' }}>
                {result.business_name} is not visible in AI-generated answers
              </div>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: '1.65' }}>
                When users ask AI assistants this question, your brand is never mentioned.
                {topCompetitor && <> <strong style={{ color: '#EF4444' }}>{topCompetitor}</strong> and other competitors are capturing every recommendation.</>}
                {' '}Follow the action plan below to fix this.
              </p>
            </div>
          </div>
        )}

        {/* Hero grid: Score | Why This Matters + Actions | Competitor snapshot */}
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 260px', gap: '16px', marginBottom: '24px', alignItems: 'stretch' }}>

          {/* Score card */}
          <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '28px 16px' }}>
            <ScoreGauge score={result.score} />
            {hasScore ? (
              <span style={{ display: 'inline-flex', padding: '5px 16px', borderRadius: '9999px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 600, color: vis.color, background: vis.bg, border: `1px solid ${vis.border}` }}>
                {result.visibility} Visibility
              </span>
            ) : (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#475569' }}>No business tracked</span>
            )}
            {hasScore && result.confidence !== 'N/A' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Confidence</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 700, color: conf.color, background: conf.bg, padding: '2px 9px', borderRadius: '9999px' }}>
                  {result.confidence}
                </span>
              </div>
            )}
            {result.business_name && (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: result.business_found ? '#10B981' : '#EF4444', textAlign: 'center' }}>
                {result.business_found ? `✓ ${result.business_name} found` : `✗ Not visible`}
              </span>
            )}
          </Card>

          {/* Why This Matters + Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Why This Matters */}
            <Card accent="rgba(59,130,246,0.2)" style={{ padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '16px' }}>💡</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#3B82F6' }}>Why This Matters</span>
              </div>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: '1.7' }}>
                AI assistants are becoming the <strong style={{ color: '#F1F5F9' }}>primary discovery layer</strong> for buyers.
                If your brand is not mentioned in these answers, you are{' '}
                <strong style={{ color: '#EF4444' }}>invisible at the exact moment a customer is deciding</strong>.
                {topCompetitor && <> Right now, <strong style={{ color: '#F1F5F9' }}>{topCompetitor}</strong> is getting those clicks instead of you.</>}
              </p>
            </Card>

            {/* Top 3 Key Actions */}
            <Card style={{ padding: '22px 24px', flex: 1 }}>
              <CardLabel accent="#10B981">⚡ Your Fastest Path to Visibility</CardLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {result.recommendations.slice(0, 3).map((action, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0, background: i === 0 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${i === 0 ? 'rgba(16,185,129,0.3)' : '#1E2028'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: i === 0 ? '#10B981' : '#475569', marginTop: '2px' }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#F1F5F9', marginBottom: '2px' }}>{action.title}</div>
                      <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>{action.what.length > 100 ? action.what.slice(0, 97) + '…' : action.what}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right column: Top competitor + score mini-bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Top competitor */}
            <Card accent={topCompetitor ? 'rgba(239,68,68,0.2)' : undefined} style={{ padding: '22px 20px' }}>
              <CardLabel>Who's Beating You</CardLabel>
              {topCompetitor ? (
                <>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 800, color: '#EF4444', marginBottom: '6px' }}>{topCompetitor}</div>
                  <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 12px', lineHeight: '1.5' }}>
                    Outranking you in AI answers for this query
                  </p>
                  {result.competitors.length > 1 && (
                    <div style={{ borderTop: '1px solid #1E2028', paddingTop: '10px' }}>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#475569', marginBottom: '6px' }}>Also outranking you</div>
                      {result.competitors.slice(1, 4).map(c => (
                        <div key={c} style={{ fontSize: '12px', color: '#94A3B8', padding: '3px 0' }}>· {c}</div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>No direct competitors detected for this query.</p>
              )}
            </Card>

            {/* Score mini-bars */}
            <Card style={{ padding: '20px', flex: 1 }}>
              <CardLabel>Score Breakdown</CardLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {(Object.entries(result.breakdown) as [string, { score: number; max: number }][]).map(([key, item]) => (
                  <div key={key} style={{ display: 'grid', gridTemplateColumns: '68px 1fr 28px', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{key}</span>
                    <div style={{ height: '4px', background: '#1E2028', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${hasScore ? (item.score / item.max) * 100 : 0}%`, background: 'linear-gradient(90deg,#3B82F6,#60A5FA)', borderRadius: '2px', transition: 'width 0.9s ease' }} />
                    </div>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#94A3B8', textAlign: 'right' }}>{item.score}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Category Dominance Insight — above fold if detected */}
        {result.category_dominance?.detected && (
          <Card accent="rgba(139,92,246,0.25)" style={{ marginBottom: '24px', padding: '22px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '18px' }}>📊</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8B5CF6' }}>Category Dominance Insight</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#475569', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', padding: '1px 8px', borderRadius: '9999px' }}>
                Opportunity
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 10px', lineHeight: '1.7' }}
              dangerouslySetInnerHTML={{ __html: md(result.category_dominance.insight) }} />
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '9999px' }}>
              <span style={{ fontSize: '12px' }}>🚀</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#10B981' }}>{result.category_dominance.opportunity}</span>
            </div>
          </Card>
        )}

        {/* ══════════════════════════════════════════
            FOLD 2 — SUPPORTING DATA
            Leaderboard · Score Detail · AI Responses
            ══════════════════════════════════════════ */}
        <div style={{ marginBottom: '12px' }}>
          <SectionDivider label="Supporting Data" />

          {/* AEO Leaderboard */}
          {result.leaderboard && result.leaderboard.length > 0 && (
            <Card style={{ marginBottom: '16px' }}>
              <AEOLeaderboard entries={result.leaderboard} businessName={result.business_name} />
            </Card>
          )}

          {/* Score breakdown detail + Entity strength */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <Card>
              <CardLabel accent="#3B82F6">Detailed Score Breakdown</CardLabel>
              <BreakdownBars breakdown={result.breakdown} hasScore={hasScore} />
            </Card>

            {result.entity_strength_map && result.business_name ? (
              <Card>
                <CardLabel accent="#8B5CF6">Entity Strength Map</CardLabel>
                <EntityStrengthMap data={result.entity_strength_map} businessName={result.business_name} />
              </Card>
            ) : (
              <Card>
                <CardLabel accent="#475569">Entity Map</CardLabel>
                <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>Enter a business name to see your entity signal strength.</p>
              </Card>
            )}
          </div>

          {/* Model response tabs */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #1E2028' }}>
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 22px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', borderBottom: `2px solid ${activeTab === tab.key ? tab.color : 'transparent'}`, color: activeTab === tab.key ? '#F1F5F9' : '#475569', marginBottom: '-1px', transition: 'color 0.2s' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: tab.color, flexShrink: 0, boxShadow: activeTab === tab.key ? `0 0 8px ${tab.color}` : 'none' }} />
                  {tab.label}
                </button>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px', paddingRight: '18px' }}>
                {result.business_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: 'rgba(59,130,246,0.5)', display: 'block' }} />
                    <span style={{ fontSize: '11px', color: '#475569' }}>{result.business_name}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: 'rgba(16,185,129,0.5)', display: 'block' }} />
                  <span style={{ fontSize: '11px', color: '#475569' }}>Competitors</span>
                </div>
              </div>
            </div>
            <div style={{ padding: '24px' }}>
              <EntityHighlighter text={result.responses[activeTab] || 'No response available.'} entities={currentEntities} businessName={result.business_name} />
              {currentEntities.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '18px' }}>
                  {currentEntities.slice(0, 14).map(e => (
                    <span key={e.name} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', padding: '3px 9px', borderRadius: '6px', border: '1px solid', ...(e.sentiment === 'positive' ? { borderColor: '#10B981', color: '#10B981', background: 'rgba(16,185,129,0.08)' } : e.sentiment === 'negative' ? { borderColor: '#EF4444', color: '#EF4444', background: 'rgba(239,68,68,0.08)' } : { borderColor: '#1E2028', color: '#475569', background: 'transparent' }) }}>
                      {e.name} ×{e.count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ══════════════════════════════════════════
            FOLD 3 — DEEP INSIGHTS (collapsible)
            Why You Lost · Full Action Plan
            Impact Simulation · AI Thinking
            ══════════════════════════════════════════ */}
        <div style={{ marginTop: '32px' }}>
          <SectionDivider label="Deep Insights" />

          {/* Why competitors are winning */}
          {result.why_lost && result.why_lost.length > 0 && (
            <DeepFold
              title="Why Your Competitors Are Winning"
              subtitle={`${result.why_lost.length} root causes identified`}
              defaultOpen={true}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {result.why_lost.map((reason, i) => (
                  <div key={i} style={{ display: 'flex', gap: '14px', padding: '16px 18px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
                      {['🔴', '⚠️', '📉', '🏆'][i] ?? '•'}
                    </div>
                    <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.75', margin: 0 }}
                      dangerouslySetInnerHTML={{ __html: md(reason) }} />
                  </div>
                ))}
              </div>
            </DeepFold>
          )}

          {/* Full action plan with expanded what/why/outcome */}
          {result.recommendations.length > 0 && (
            <DeepFold
              title="Full Action Plan"
              subtitle={`${result.recommendations.length} strategic actions`}
              defaultOpen={false}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {result.recommendations.map((action, i) => (
                  <ActionCard key={i} action={action} index={i} />
                ))}
              </div>
            </DeepFold>
          )}

          {/* Impact simulation */}
          {result.impact_simulation && (
            <DeepFold
              title="Expected Impact Simulation"
              subtitle={`Score ${result.impact_simulation.current_score} → ${result.impact_simulation.projected_score} · ${result.impact_simulation.time_estimate}`}
            >
              <ImpactSimulation data={result.impact_simulation} />
            </DeepFold>
          )}

          {/* AI thinking */}
          {result.ai_thinking && (
            <DeepFold
              title="How AI Is Ranking This Query"
              subtitle={`Category: ${result.ai_thinking.category_detected}`}
            >
              <AIThinking data={result.ai_thinking} query={result.query} />
            </DeepFold>
          )}
        </div>
      </div>

      <ChatPanel context={result} />
    </Layout>
  );
}

// ---------------------------------------------------------------------------
function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
      <div style={{ flex: 1, height: '1px', background: '#1E2028' }} />
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#2E3140', textTransform: 'uppercase', letterSpacing: '0.15em', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: '#1E2028' }} />
    </div>
  );
}
