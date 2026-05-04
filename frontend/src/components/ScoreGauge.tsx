import { useState, useEffect } from 'react';

interface ScoreGaugeProps {
  score: number | null;
}

export default function ScoreGauge({ score }: ScoreGaugeProps) {
  const hasScore = score !== null && score !== undefined;
  const [animScore, setAnimScore] = useState(0);
  const [offset, setOffset] = useState(251.2);

  useEffect(() => {
    if (!hasScore) { setAnimScore(0); setOffset(251.2); return; }
    const target = score as number;
    // Animate number
    const start = Date.now();
    const duration = 1200;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimScore(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // Arc
    const timer = setTimeout(() => {
      setOffset(251.2 * (1 - target / 100));
    }, 80);
    return () => clearTimeout(timer);
  }, [score, hasScore]);

  const strokeColor = !hasScore
    ? '#1E2028'
    : animScore >= 70 ? '#10B981'
    : animScore >= 40 ? '#F59E0B'
    : '#EF4444';

  const glowColor = !hasScore ? 'transparent' : strokeColor;

  return (
    <svg viewBox="0 0 200 120" width="190" height="115" style={{ overflow: 'visible' }}>
      {/* Background arc */}
      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1E2028" strokeWidth="12" strokeLinecap="round" />

      {/* Foreground arc */}
      <path
        d="M 20 100 A 80 80 0 0 1 180 100"
        fill="none"
        stroke={strokeColor}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray="251.2"
        strokeDashoffset={hasScore ? offset : 251.2}
        style={{ transition: 'stroke-dashoffset 1.2s ease, stroke 0.5s ease' }}
      />

      {/* Glow layer */}
      {hasScore && (
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={glowColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="251.2"
          strokeDashoffset={offset}
          opacity="0.25"
          style={{ filter: 'blur(5px)', transition: 'stroke-dashoffset 1.2s ease' }}
        />
      )}

      {/* Score number */}
      <text x="100" y="90" textAnchor="middle"
        fontFamily="'IBM Plex Mono', monospace" fontWeight="700" fontSize="32"
        fill={hasScore ? '#F1F5F9' : '#2E3140'}>
        {hasScore ? animScore : '—'}
      </text>

      {/* /100 or hint */}
      <text x="100" y="107" textAnchor="middle"
        fontFamily="'IBM Plex Mono', monospace" fontSize="11" fill="#475569">
        {hasScore ? '/ 100' : 'no business'}
      </text>
    </svg>
  );
}
