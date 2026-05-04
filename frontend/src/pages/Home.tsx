import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { runDiagnostic, getHistory, saveToHistory } from '../lib/api';
import type { HistoryEntry } from '../lib/types';

const LOADING_STEPS = [
  'Querying AI models...',
  'Extracting brand entities...',
  'Ranking competitors...',
  'Calculating AEO score...',
  'Generating insights...',
];

export default function Home() {
  const navigate = useNavigate();
  const scannerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    if (isLoading) {
      intervalRef.current = setInterval(() => {
        setLoadingStep(prev => {
          const next = prev + 1;
          setCompletedSteps(c => [...c, prev]);
          return next < LOADING_STEPS.length ? next : prev;
        });
      }, 1800);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isLoading]);

  const scrollToScanner = () => {
    scannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => scannerRef.current?.querySelector('input')?.focus(), 400);
  };

  const handleSubmit = async (q = query, biz = businessName) => {
    if (!q.trim()) { setError('Please enter a search query.'); return; }
    setError('');
    setIsLoading(true);
    setLoadingStep(0);
    setCompletedSteps([]);
    try {
      const result = await runDiagnostic(q.trim(), biz.trim());
      saveToHistory(result);
      localStorage.setItem('aeo_results', JSON.stringify(result));
      navigate('/results');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const loadFromHistory = (entry: HistoryEntry) => {
    setQuery(entry.query);
    setBusinessName(entry.business_name);
    setShowHistory(false);
    scrollToScanner();
  };

  const visColor = (v: string) => {
    switch (v) {
      case 'High': return '#10B981';
      case 'Medium': return '#F59E0B';
      case 'Low': return '#EF4444';
      default: return '#475569';
    }
  };

  const S = styles;

  return (
    <Layout onAnalyzeClick={scrollToScanner}>
      {/* Background glow */}
      <div style={S.heroBg} />

      {/* ── HERO ── */}
      <section style={S.heroSection}>
        <div style={S.heroPill}>
          <span style={S.heroPillDot} />
          <span style={S.heroPillText}>AEO Diagnostic Platform</span>
        </div>

        <h1 style={S.heroH1}>
          Are You Visible in{' '}
          <span style={S.heroGradient}>AI Answers?</span>
        </h1>

        <p style={S.heroSub}>
          When users ask ChatGPT, Gemini, or Groq for recommendations,
          does your brand appear — or are competitors capturing every click?
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '64px' }}>
          <button onClick={scrollToScanner} style={S.heroCta}>
            Run Free Diagnostic
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <a href="#how-it-works" style={S.heroCtaSecondary}>See How It Works</a>
        </div>

        {/* Floating stats cards */}
        <div style={S.floatRow}>
          <div style={{ ...S.floatCard, animation: 'floatLeft 4s ease-in-out infinite' }}>
            <div style={S.floatLabel}>Models Queried</div>
            <div style={S.floatValue}>3 AI</div>
            <div style={{ fontSize: '12px', color: '#10B981' }}>ChatGPT · Gemini · Groq</div>
          </div>

          <div style={{ ...S.floatCard, ...S.floatCardCenter }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={S.floatLabel}>AEO Score</span>
              <span style={S.liveBadge}>LIVE</span>
            </div>
            <div style={{ ...S.floatValue, color: '#F59E0B', fontSize: '48px' }}>63</div>
            <div style={{ fontSize: '11px', color: '#475569', marginBottom: '12px' }}>/&nbsp;100</div>
            <span style={{ ...S.visBadge, color: '#F59E0B', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
              Medium Visibility
            </span>
            <div style={S.miniBarRow}>
              {[55, 40, 75, 35, 50].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '3px', background: i === 2 ? '#3B82F6' : `rgba(59,130,246,${0.15 + i * 0.1})` }} />
              ))}
            </div>
          </div>

          <div style={{ ...S.floatCard, animation: 'floatRight 4s ease-in-out infinite' }}>
            <div style={S.floatLabel}>Top Competitor</div>
            <div style={{ ...S.floatValue, fontSize: '20px', color: '#EF4444' }}>Outranking</div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>in 2 of 3 models</div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <div style={S.trustStrip}>
        <div style={S.trustInner}>
          <span style={S.trustLabel}>Tracks visibility across</span>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { name: 'ChatGPT', color: '#10B981', model: 'llama-3.3-70b' },
              { name: 'Gemini',  color: '#3B82F6', model: 'mixtral-8x7b' },
              { name: 'Groq',    color: '#F59E0B', model: 'llama-3.3-70b' },
            ].map(({ name, color, model }) => (
              <div key={name} style={S.trustPill}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#F1F5F9' }}>{name}</span>
                <span style={{ fontSize: '11px', color: '#475569' }}>· {model}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={S.section}>
        <div style={S.sectionInner}>
          <div style={S.sectionHeader}>
            <div style={S.pill}>Our Workflow</div>
            <h2 style={S.sectionH2}>From query to competitive intelligence in seconds</h2>
          </div>
          <div style={S.stepsGrid}>
            {[
              { num: '01', title: 'Enter your query', desc: 'Type the question your customers ask an AI assistant.' },
              { num: '02', title: 'AI models respond', desc: 'We query ChatGPT (OpenAI), Gemini (Google), and Groq (LLaMA) in parallel with distinct system prompts.' },
              { num: '03', title: 'Intelligent extraction', desc: 'Our 3-layer pipeline extracts real brand entities — no generic words.' },
              { num: '04', title: 'Score + insights', desc: 'Get your AEO score, confidence level, competitor analysis, and action plan.' },
            ].map(step => (
              <div key={step.num} style={S.stepCard}>
                <span style={S.stepNum}>{step.num}</span>
                <h3 style={S.stepTitle}>{step.title}</h3>
                <p style={S.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ ...S.section, background: '#0A0B0E' }}>
        <div style={S.sectionInner}>
          <div style={S.sectionHeader}>
            <div style={S.pill}>Features</div>
            <h2 style={S.sectionH2}>Everything you need to win AI search</h2>
          </div>
          <div style={S.featGrid}>
            {[
              { color: '#3B82F6', title: 'Multi-Model Analysis', desc: 'Real API calls to ChatGPT (OpenAI), Gemini (Google), and Groq (LLaMA) — three independent responses.' },
              { color: '#10B981', title: 'Intelligent Entity Extraction', desc: '3-layer pipeline: regex candidates → rule filtering → LLM validation. Only real brands pass.' },
              { color: '#F59E0B', title: 'Score + Confidence', desc: '100-point AEO score with a confidence indicator (Low/Medium/High) based on model agreement.' },
              { color: '#EF4444', title: '"Why You Lost" Analysis', desc: 'Specific reasons why competitors rank above you, with actionable fixes per cause.' },
              { color: '#8B5CF6', title: 'Competitor Intelligence', desc: 'See exactly which brands appear in AI answers, their frequency, position, and sentiment.' },
              { color: '#06B6D4', title: 'Query History', desc: 'Re-run past queries instantly from the nav or home page dropdown.' },
            ].map(f => (
              <div key={f.title} style={S.featCard}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2E3140'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E2028'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ ...S.featIcon, boxShadow: `0 0 20px ${f.color}22` }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: f.color }} />
                </div>
                <div style={S.featTitle}>{f.title}</div>
                <div style={S.featDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCANNER ── */}
      <section id="scanner" style={S.section} ref={scannerRef}>
        <div style={{ maxWidth: '620px', margin: '0 auto', padding: '0 24px' }}>
          <div style={S.sectionHeader}>
            <div style={S.pill}>Run Your Diagnostic</div>
            <h2 style={S.sectionH2}>Start your free AI audit</h2>
            <p style={S.sectionSub}>No signup needed. Results in under 60 seconds.</p>
          </div>

          {/* History dropdown */}
          {history.length > 0 && (
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <button
                onClick={() => setShowHistory(h => !h)}
                style={S.historyBtn}
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="#475569" strokeWidth="1.3" />
                  <path d="M7 4v3.5l2 1.5" stroke="#475569" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                Recent queries ({history.length})
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 'auto', transform: showHistory ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M2 3.5l3 3 3-3" stroke="#475569" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </button>
              {showHistory && (
                <div style={S.historyDropdown}>
                  {history.map(entry => (
                    <button key={entry.id} onClick={() => loadFromHistory(entry)} style={S.historyItem}>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontSize: '13px', color: '#F1F5F9', fontWeight: 500, marginBottom: '2px' }}>
                          {entry.query}
                        </div>
                        {entry.business_name && (
                          <div style={{ fontSize: '11px', color: '#475569' }}>{entry.business_name}</div>
                        )}
                      </div>
                      {entry.score !== null && (
                        <span style={{ fontSize: '12px', fontWeight: 700, color: visColor(entry.visibility), flexShrink: 0 }}>
                          {entry.score}/100
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Input card */}
          <div style={S.inputCard}>
            <label style={S.inputLabel}>Search Query</label>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g. best magnesium supplement for seniors"
              disabled={isLoading}
              style={S.input}
              onFocus={e => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#1E2028'; e.currentTarget.style.boxShadow = 'none'; }}
            />

            <label style={{ ...S.inputLabel, marginTop: '20px' }}>
              Your Business Name{' '}
              <span style={{ color: '#2E3140', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <input
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g. MuscleBlaze"
              disabled={isLoading}
              style={S.input}
              onFocus={e => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#1E2028'; e.currentTarget.style.boxShadow = 'none'; }}
            />

            {isLoading ? (
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {LOADING_STEPS.map((step, i) => {
                  const isDone = completedSteps.includes(i);
                  const isActive = loadingStep === i;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                        background: isDone ? '#10B981' : isActive ? '#3B82F6' : '#1E2028',
                        boxShadow: isActive ? '0 0 10px #3B82F6' : 'none',
                        transition: 'all 0.3s',
                      }} />
                      <span style={{
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px',
                        color: isDone ? '#10B981' : isActive ? '#93C5FD' : '#2E3140',
                        transition: 'color 0.3s',
                      }}>
                        {isDone ? '✓ ' : ''}{step}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <button onClick={() => handleSubmit()} style={S.submitBtn}
                onMouseEnter={e => { e.currentTarget.style.background = '#2563EB'; e.currentTarget.style.boxShadow = '0 0 40px rgba(59,130,246,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#3B82F6'; e.currentTarget.style.boxShadow = '0 0 24px rgba(59,130,246,0.25)'; }}
              >
                Analyze AI Visibility
              </button>
            )}

            {error && <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#EF4444', marginTop: '12px' }}>{error}</p>}
          </div>
        </div>
      </section>

      {/* ── WHAT IS AEO ── */}
      <section style={{ ...S.section, background: '#0A0B0E' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px' }}>
          <div style={S.sectionHeader}>
            <div style={S.pill}>Education</div>
            <h2 style={S.sectionH2}>What is AEO?</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {[
              {
                q: 'What is AEO?',
                a: 'Answer Engine Optimization is the practice of ensuring your brand appears in AI-generated responses — the new front page of the internet.',
              },
              {
                q: 'Why does it matter?',
                a: 'Over 30% of searches now end with an AI answer. If your brand isn\'t cited, you\'re invisible to an entire generation of buyers.',
              },
              {
                q: 'How is it different from SEO?',
                a: 'SEO targets search result pages. AEO targets the AI answer itself — the zero-click response that most users now trust first.',
              },
            ].map(item => (
              <div key={item.q} style={S.stepCard}>
                <div style={{ fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", color: '#3B82F6', marginBottom: '10px', fontWeight: 600 }}>
                  {item.q}
                </div>
                <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.7', margin: 0 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={S.footer}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#475569' }}>
          © 2025 AEO Diagnostic. Built for the AI-first era.
        </span>
      </footer>

      <style>{`
        @keyframes floatLeft  { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-10px)} }
        @keyframes floatRight { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-14px)} }
      `}</style>
    </Layout>
  );
}

// ---------------------------------------------------------------------------
// Styles object — keeps JSX clean
// ---------------------------------------------------------------------------
const styles: Record<string, React.CSSProperties> = {
  heroBg: {
    position: 'fixed', top: '-200px', left: '50%', transform: 'translateX(-50%)',
    width: '900px', height: '700px', pointerEvents: 'none', zIndex: 0,
    background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)',
  },
  heroSection: {
    minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    padding: '80px 24px 48px', position: 'relative', zIndex: 1,
  },
  heroPill: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    border: '1px solid #1E2028', background: '#0F1117',
    padding: '6px 16px', borderRadius: '9999px', marginBottom: '28px',
  },
  heroPillDot: {
    width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6',
    display: 'block', boxShadow: '0 0 8px #3B82F6',
  },
  heroPillText: {
    fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px',
    color: '#94A3B8', letterSpacing: '0.15em', textTransform: 'uppercase',
  },
  heroH1: {
    fontFamily: "'Syne', sans-serif", fontWeight: 800,
    fontSize: 'clamp(2.5rem, 6vw, 5rem)', lineHeight: 1.05,
    letterSpacing: '-0.03em', marginBottom: '20px', color: '#F1F5F9',
  },
  heroGradient: {
    background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 50%, #93C5FD 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  heroSub: {
    maxWidth: '520px', color: '#94A3B8', fontSize: '1.0625rem',
    lineHeight: 1.75, marginBottom: '36px', fontFamily: "'Inter', sans-serif",
  },
  heroCta: {
    display: 'inline-flex', alignItems: 'center', gap: '10px',
    padding: '14px 32px', borderRadius: '9999px',
    background: '#3B82F6', border: 'none', color: '#fff',
    fontSize: '15px', fontWeight: 600, fontFamily: "'Inter', sans-serif",
    cursor: 'pointer', boxShadow: '0 0 30px rgba(59,130,246,0.3)',
    transition: 'all 0.2s',
  },
  heroCtaSecondary: {
    display: 'inline-flex', alignItems: 'center',
    padding: '14px 28px', borderRadius: '9999px',
    border: '1px solid #1E2028', color: '#94A3B8',
    fontSize: '15px', fontWeight: 500, fontFamily: "'Inter', sans-serif",
    cursor: 'pointer', textDecoration: 'none', transition: 'all 0.2s',
  },
  floatRow: {
    position: 'relative', width: '100%', maxWidth: '780px',
    height: '220px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '16px',
  },
  floatCard: {
    background: '#0F1117', border: '1px solid #1E2028',
    borderRadius: '16px', padding: '18px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    width: '180px', flexShrink: 0,
  },
  floatCardCenter: {
    width: '220px', borderColor: 'rgba(59,130,246,0.25)',
    boxShadow: '0 0 40px rgba(59,130,246,0.10), 0 24px 60px rgba(0,0,0,0.6)',
    paddingBottom: '20px', marginBottom: '10px',
  },
  floatLabel: { fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' },
  floatValue: { fontFamily: "'Syne', sans-serif", fontSize: '26px', fontWeight: 800, color: '#F1F5F9', marginBottom: '4px' },
  liveBadge: { background: 'rgba(16,185,129,0.15)', color: '#10B981', fontSize: '10px', fontFamily: "'IBM Plex Mono', monospace", padding: '2px 8px', borderRadius: '9999px', border: '1px solid rgba(16,185,129,0.3)' },
  visBadge: { display: 'inline-block', fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace", padding: '3px 10px', borderRadius: '9999px' },
  miniBarRow: { display: 'flex', gap: '4px', marginTop: '14px', alignItems: 'flex-end', height: '28px' },
  trustStrip: { borderTop: '1px solid #1E2028', borderBottom: '1px solid #1E2028', padding: '24px 24px', background: '#0A0B0E' },
  trustInner: { maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' },
  trustLabel: { fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#475569', letterSpacing: '0.15em', textTransform: 'uppercase' },
  trustPill: { display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #1E2028', background: '#161820', padding: '10px 20px', borderRadius: '9999px' },
  section: { padding: '88px 24px' },
  sectionInner: { maxWidth: '960px', margin: '0 auto' },
  sectionHeader: { textAlign: 'center', marginBottom: '56px' },
  sectionH2: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', letterSpacing: '-0.025em', color: '#F1F5F9', margin: '8px 0 0' },
  sectionSub: { color: '#94A3B8', fontSize: '15px', marginTop: '10px' },
  pill: { display: 'inline-block', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#475569', border: '1px solid #1E2028', background: '#0F1117', padding: '5px 14px', borderRadius: '9999px', letterSpacing: '0.12em', textTransform: 'uppercase' },
  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
  stepCard: { background: '#0F1117', border: '1px solid #1E2028', borderRadius: '16px', padding: '28px' },
  stepNum: { fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#3B82F6', letterSpacing: '0.1em', fontWeight: 600 },
  stepTitle: { fontFamily: "'Syne', sans-serif", fontSize: '16px', fontWeight: 700, color: '#F1F5F9', margin: '10px 0 8px' },
  stepDesc: { fontSize: '14px', color: '#94A3B8', lineHeight: '1.65', margin: 0 },
  featGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' },
  featCard: { background: '#0F1117', border: '1px solid #1E2028', borderRadius: '18px', padding: '28px', transition: 'border-color 0.2s, transform 0.2s' },
  featIcon: { width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1E2028', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' },
  featTitle: { fontFamily: "'Syne', sans-serif", fontSize: '15px', fontWeight: 700, color: '#F1F5F9', marginBottom: '8px' },
  featDesc: { fontSize: '13px', color: '#94A3B8', lineHeight: '1.65' },
  historyBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#0F1117', border: '1px solid #1E2028', borderRadius: '10px', color: '#475569', fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer', letterSpacing: '0.05em' },
  historyDropdown: { position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#0F1117', border: '1px solid #1E2028', borderRadius: '12px', zIndex: 50, overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' },
  historyItem: { width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid #1E2028', cursor: 'pointer', transition: 'background 0.15s' },
  inputCard: { background: '#0F1117', border: '1px solid #1E2028', borderRadius: '20px', padding: '32px', boxShadow: '0 0 60px rgba(59,130,246,0.04)' },
  inputLabel: { display: 'block', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#475569', marginBottom: '8px' },
  input: { width: '100%', background: '#07080C', border: '1px solid #1E2028', borderRadius: '10px', padding: '13px 16px', color: '#F1F5F9', fontSize: '15px', fontFamily: "'Inter', sans-serif", outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' },
  submitBtn: { width: '100%', marginTop: '24px', padding: '15px', borderRadius: '10px', border: 'none', background: '#3B82F6', color: '#fff', fontSize: '15px', fontWeight: 600, fontFamily: "'Inter', sans-serif", cursor: 'pointer', boxShadow: '0 0 24px rgba(59,130,246,0.25)', transition: 'all 0.2s' },
  footer: { borderTop: '1px solid #1E2028', padding: '28px 24px', textAlign: 'center' },
};
