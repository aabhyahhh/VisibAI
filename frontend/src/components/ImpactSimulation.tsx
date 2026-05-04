import { useState, useEffect } from 'react';
import type { ImpactSimulation as ImpactSimulationData } from '../lib/types';

interface Props {
  data: ImpactSimulationData;
}

const visColor = (v: string) => {
  switch (v) {
    case 'High':      return '#10B981';
    case 'Medium':    return '#F59E0B';
    case 'Low':       return '#EF4444';
    default:          return '#475569';
  }
};

export default function ImpactSimulation({ data }: Props) {
  const [animGain, setAnimGain] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const dur = 900;
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnimGain(Math.round(ease * data.score_gain));
      if (p < 1) requestAnimationFrame(tick);
    };
    const t = setTimeout(() => requestAnimationFrame(tick), 200);
    return () => clearTimeout(t);
  }, [data.score_gain]);

  const currentC = visColor(data.current_visibility);
  const projectedC = visColor(data.projected_visibility);
  const improved = data.projected_visibility !== data.current_visibility;

  return (
    <div>
      {/* Score arrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Current</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '36px', fontWeight: 800, color: currentC, lineHeight: 1 }}>{data.current_score}</div>
          <div style={{ fontSize: '11px', color: '#475569' }}>/ 100</div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 700, color: '#10B981' }}>+{animGain} pts</div>
          <div style={{ width: '100%', height: '2px', background: 'linear-gradient(90deg, #2E3140, #10B981)', borderRadius: '1px', position: 'relative' }}>
            <div style={{ position: 'absolute', right: '-4px', top: '-5px', color: '#10B981', fontSize: '12px' }}>▶</div>
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#475569' }}>{data.time_estimate}</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Projected</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '36px', fontWeight: 800, color: projectedC, lineHeight: 1 }}>{data.projected_score}</div>
          <div style={{ fontSize: '11px', color: '#475569' }}>/ 100</div>
        </div>
      </div>

      {/* Visibility change */}
      {improved && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', padding: '10px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: currentC, background: `${currentC}18`, padding: '2px 9px', borderRadius: '9999px', border: `1px solid ${currentC}30` }}>{data.current_visibility}</span>
          <span style={{ fontSize: '11px', color: '#475569' }}>→</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: projectedC, background: `${projectedC}18`, padding: '2px 9px', borderRadius: '9999px', border: `1px solid ${projectedC}30` }}>{data.projected_visibility}</span>
          <span style={{ fontSize: '12px', color: '#10B981', marginLeft: '4px' }}>visibility tier jump</span>
        </div>
      )}

      {/* Key actions */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
        Actions to get there
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.key_actions.map((action, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#3B82F6', marginTop: '1px' }}>
              {i + 1}
            </div>
            <span style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.55' }}>{action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
