import { useState, useRef, useEffect } from 'react';
import type { AEOResult, ChatMessage } from '../lib/types';
import { sendChat } from '../lib/api';

interface ChatPanelProps {
  context: Partial<AEOResult>;
}

export default function ChatPanel({ context }: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: context.score !== null && context.score !== undefined
        ? `I've analysed your AEO results. Your score is **${context.score}/100** (${context.visibility} visibility, ${context.confidence} confidence).${context.why_lost?.length ? ' I can see why competitors are outranking you.' : ''} What would you like to improve?`
        : `I've analysed the AI responses for "${context.query}". No business name was tracked, so I can discuss the general landscape. What would you like to know?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, open]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const reply = await sendChat(userMsg.content, context);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 100,
            width: '52px', height: '52px', borderRadius: '50%',
            background: '#3B82F6', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 28px rgba(59,130,246,0.45)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          title="AEO Assistant"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 6h12M4 10h9M4 14h6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="17" cy="17" r="3" fill="#10B981"/>
          </svg>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 99,
          width: '360px', maxHeight: '500px',
          background: '#0F1117', border: '1px solid #1E2028', borderRadius: '18px',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.65), 0 0 40px rgba(59,130,246,0.08)',
          animation: 'slideUp 0.2s ease',
        }}>
          <style>{`
            @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
            @keyframes dotPulse { 0%,80%,100%{opacity:0.2;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
          `}</style>

          {/* Header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #1E2028', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg, #3B82F6, #60A5FA)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.5"/>
                <path d="M5 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 600, color: '#F1F5F9' }}>AEO Assistant</div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '1px' }}>Ask me how to improve</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginRight: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
              <span style={{ fontSize: '10px', color: '#10B981', fontFamily: "'IBM Plex Mono', monospace" }}>online</span>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: '16px', padding: '2px 4px', lineHeight: 1 }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div
                  style={{
                    maxWidth: '82%', padding: '9px 13px', borderRadius: '14px',
                    fontSize: '13px', lineHeight: '1.6', fontFamily: "'Inter', sans-serif",
                    ...(msg.role === 'user'
                      ? { background: '#3B82F6', color: '#fff', borderBottomRightRadius: '4px' }
                      : { background: '#161820', border: '1px solid #1E2028', color: '#94A3B8', borderBottomLeftRadius: '4px' }
                    ),
                  }}
                  dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                />
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', gap: '4px', padding: '9px 13px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6', animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid #1E2028', display: 'flex', gap: '8px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your score…"
              style={{ flex: 1, background: '#07080C', border: '1px solid #1E2028', borderRadius: '9px', padding: '9px 13px', color: '#F1F5F9', fontSize: '13px', fontFamily: "'Inter', sans-serif", outline: 'none' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#3B82F6'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#1E2028'; }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              style={{ padding: '9px 16px', borderRadius: '9px', background: '#3B82F6', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, fontFamily: "'Inter', sans-serif", cursor: 'pointer', opacity: isLoading || !input.trim() ? 0.4 : 1, transition: 'opacity 0.2s', flexShrink: 0 }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
