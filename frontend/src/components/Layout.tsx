import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  onAnalyzeClick?: () => void;
}

export default function Layout({ children, onAnalyzeClick }: LayoutProps) {
  const navigate = useNavigate();

  const handleAnalyzeClick = () => {
    if (onAnalyzeClick) { onAnalyzeClick(); return; }
    const el = document.getElementById('scanner');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    else navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#07080C' }}>
      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: '64px',
        background: 'rgba(7,8,12,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid #1E2028',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: '0 24px',
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo — clickable, routes to home */}
          <button
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(59,130,246,0.4)',
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5" stroke="white" strokeWidth="2"/>
                <path d="M4 7h6M7 4v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '15px', color: '#F1F5F9' }}>
              VisibAI
            </span>
          </button>

          {/* CTA */}
          <button onClick={handleAnalyzeClick} style={{
            padding: '8px 20px', borderRadius: '9999px',
            border: '1px solid #3B82F6', background: 'transparent',
            color: '#3B82F6', fontSize: '13px', fontWeight: 600,
            fontFamily: "'Inter', sans-serif", cursor: 'pointer',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#3B82F6'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3B82F6'; }}>
            Free Analysis
          </button>
        </div>
      </nav>

      {/* Page content */}
      <div style={{ paddingTop: '64px', position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
