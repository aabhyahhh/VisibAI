import { jsPDF } from 'jspdf';
import type { AEOResult } from './types';

// Brand colors (light theme)
const C = {
  blue:       '#3B82F6',
  blueLight:  '#EFF6FF',
  blueMid:    '#BFDBFE',
  green:      '#10B981',
  greenLight: '#ECFDF5',
  amber:      '#F59E0B',
  amberLight: '#FFFBEB',
  red:        '#EF4444',
  redLight:   '#FEF2F2',
  purple:     '#8B5CF6',
  purpleLight:'#F5F3FF',
  slate900:   '#0F172A',
  slate700:   '#334155',
  slate500:   '#64748B',
  slate300:   '#CBD5E1',
  slate100:   '#F1F5F9',
  white:      '#FFFFFF',
  pageBg:     '#F8FAFC',
};

function hex(h: string): [number, number, number] {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function visColor(v: string): string {
  if (v === 'High')   return C.green;
  if (v === 'Medium') return C.amber;
  return C.red;
}
function visLight(v: string): string {
  if (v === 'High')   return C.greenLight;
  if (v === 'Medium') return C.amberLight;
  return C.redLight;
}

export function generatePDFReport(result: AEOResult): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210; // page width mm
  const PH = 297; // page height mm
  const ML = 20;  // margin left
  const MR = 20;  // margin right
  const CW = PW - ML - MR; // content width
  let y = 0;

  // ── helpers ──────────────────────────────────────────────────────────────

  const setFill = (h: string) => { const [r, g, b] = hex(h); doc.setFillColor(r, g, b); };
  const setTxt  = (h: string) => { const [r, g, b] = hex(h); doc.setTextColor(r, g, b); };
  const setDraw = (h: string) => { const [r, g, b] = hex(h); doc.setDrawColor(r, g, b); };

  const text = (
    str: string,
    x: number,
    _y: number,
    opts?: { align?: 'left'|'center'|'right'; maxWidth?: number },
  ) => doc.text(str, x, _y, opts as Parameters<typeof doc.text>[3]);

  function wrapText(str: string, maxW: number, fontSize: number): string[] {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(str, maxW) as string[];
  }

  function rect(x: number, _y: number, w: number, h: number, fill: string, radius = 3) {
    setFill(fill);
    doc.roundedRect(x, _y, w, h, radius, radius, 'F');
  }

  function pill(label: string, x: number, _y: number, bg: string, fg: string) {
    doc.setFontSize(8);
    const w = doc.getTextWidth(label) + 8;
    rect(x, _y - 4, w, 6, bg, 3);
    setTxt(fg);
    doc.setFont('helvetica', 'bold');
    text(label, x + 4, _y, { align: 'left' });
    return w;
  }

  function divider(_y: number, color = C.slate300) {
    setDraw(color);
    doc.setLineWidth(0.3);
    doc.line(ML, _y, PW - MR, _y);
  }

  function sectionLabel(label: string, _y: number, color = C.blue) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    setTxt(color);
    text(label.toUpperCase(), ML, _y);
    return _y + 5;
  }

  // ── HEADER ────────────────────────────────────────────────────────────────
  // Top bar background
  rect(0, 0, PW, 28, C.slate900, 0);

  // VisibAI logo text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  setTxt(C.white);
  text('VisibAI', ML, 17);

  // Blue dot accent after VisibAI
  setFill(C.blue);
  doc.circle(ML + doc.getTextWidth('VisibAI') + 2, 14.5, 1.5, 'F');

  // Right: report title
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setTxt('#94A3B8');
  text('AEO Diagnostic Report', PW - MR, 17, { align: 'right' });

  y = 40;

  // ── TITLE BLOCK ──────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  setTxt(C.slate900);
  text('AI Visibility Report', PW / 2, y, { align: 'center' });
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setTxt(C.slate500);
  text(`Query: "${result.query}"`, PW / 2, y, { align: 'center' });
  y += 6;
  if (result.business_name) {
    text(`Brand: ${result.business_name}`, PW / 2, y, { align: 'center' });
    y += 6;
  }

  y += 4;
  divider(y);
  y += 10;

  // ── SCORE CARD ────────────────────────────────────────────────────────────
  const scoreCardW = 90;
  const scoreCardX = (PW - scoreCardW) / 2;
  const vCol = visColor(result.visibility);
  const vLt  = visLight(result.visibility);

  rect(scoreCardX, y, scoreCardW, 36, vLt, 8);
  setDraw(vCol);
  doc.setLineWidth(0.6);
  doc.roundedRect(scoreCardX, y, scoreCardW, 36, 8, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  setTxt(vCol);
  text(`${result.score ?? 'N/A'}`, PW / 2, y + 18, { align: 'center' });

  doc.setFontSize(9);
  setTxt(C.slate500);
  doc.setFont('helvetica', 'normal');
  text('/ 100', PW / 2 + (result.score !== null ? 16 : 12), y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setTxt(vCol);
  text(`${result.visibility} Visibility`, PW / 2, y + 28, { align: 'center' });

  y += 46;

  // ── SCORE BREAKDOWN ───────────────────────────────────────────────────────
  y = sectionLabel('Score Breakdown', y);
  y += 2;

  const breakdown = Object.entries(result.breakdown) as [string, { score: number; max: number; explanation: string }][];
  const barW = CW - 50;
  const barH = 4;

  breakdown.forEach(([key, item]) => {
    const pct = item.max > 0 ? item.score / item.max : 0;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    setTxt(C.slate700);
    text(key.charAt(0).toUpperCase() + key.slice(1), ML, y + 3);

    // Track bar
    rect(ML + 42, y, barW, barH, C.slate100, 2);
    rect(ML + 42, y, Math.max(barW * pct, 2), barH, C.blue, 2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setTxt(C.slate900);
    text(`${item.score}/${item.max}`, ML + CW, y + 3.5, { align: 'right' });

    y += 9;
  });

  y += 4;
  divider(y);
  y += 10;

  // ── COMPETITORS ───────────────────────────────────────────────────────────
  if (result.competitors.length > 0) {
    y = sectionLabel('Competitors', y, C.red);
    y += 2;

    const cols = 3;
    const cellW = CW / cols;
    result.competitors.slice(0, 9).forEach((c, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = ML + col * cellW;
      const cy = y + row * 10;

      rect(cx, cy - 4, cellW - 4, 8, C.redLight, 4);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      setTxt(C.red);
      text(c, cx + (cellW - 4) / 2, cy, { align: 'center', maxWidth: cellW - 8 });
    });

    const rows = Math.ceil(Math.min(result.competitors.length, 9) / cols);
    y += rows * 10 + 4;

    divider(y);
    y += 10;
  }

  // ── LEADERBOARD ───────────────────────────────────────────────────────────
  if (result.leaderboard && result.leaderboard.length > 0) {
    y = sectionLabel('AI Leaderboard', y, C.purple);
    y += 2;

    result.leaderboard.slice(0, 6).forEach((entry) => {
      const isUser = entry.is_user;
      const rowBg  = isUser ? C.blueLight : (entry.rank <= 3 ? C.slate100 : C.white);

      rect(ML, y - 4, CW, 10, rowBg, 3);

      if (isUser) {
        setDraw(C.blue);
        doc.setLineWidth(0.4);
        doc.roundedRect(ML, y - 4, CW, 10, 3, 3, 'S');
      }

      // Rank
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      setTxt(isUser ? C.blue : C.slate500);
      text(`#${entry.rank}`, ML + 3, y + 2);

      // Name
      doc.setFontSize(9);
      setTxt(isUser ? C.blue : C.slate900);
      text(entry.name + (isUser ? ' (You)' : ''), ML + 18, y + 2);

      // Mentions
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      setTxt(C.slate500);
      text(`${entry.total_mentions}× cited`, ML + CW - 2, y + 2, { align: 'right' });

      y += 11;
    });

    y += 4;
    divider(y);
    y += 10;
  }

  // ── INSIGHTS (WHY LOST) ───────────────────────────────────────────────────
  if (result.why_lost && result.why_lost.length > 0) {
    // New page if too close to bottom
    if (y > PH - 80) { doc.addPage(); y = 20; }

    y = sectionLabel('Key Insights', y, C.amber);
    y += 2;

    result.why_lost.forEach((reason, i) => {
      const clean = reason.replace(/\*\*(.*?)\*\*/g, '$1');
      const lines = wrapText(clean, CW - 14, 8.5);
      const blockH = lines.length * 5 + 10;

      if (y + blockH > PH - 20) { doc.addPage(); y = 20; }

      rect(ML, y - 4, CW, blockH, C.amberLight, 4);

      // number circle
      setFill(C.amber);
      doc.circle(ML + 5, y + blockH / 2 - 4, 3.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      setTxt(C.white);
      text(`${i + 1}`, ML + 5, y + blockH / 2 - 2, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      setTxt(C.slate700);
      lines.forEach((line: string, li: number) => {
        text(line, ML + 13, y + li * 5 + 1);
      });

      y += blockH + 4;
    });

    divider(y);
    y += 10;
  }

  // ── ACTION PLAN ───────────────────────────────────────────────────────────
  if (result.recommendations.length > 0) {
    if (y > PH - 80) { doc.addPage(); y = 20; }

    y = sectionLabel('Action Plan', y, C.green);
    y += 2;

    result.recommendations.forEach((action, i) => {
      const titleLines = wrapText(action.title, CW - 14, 9);
      const whatLines  = wrapText(action.what,  CW - 14, 8);
      const blockH = (titleLines.length * 5) + (whatLines.length * 4.5) + 14;

      if (y + blockH > PH - 20) { doc.addPage(); y = 20; }

      const isHigh = action.priority === 'high';
      rect(ML, y - 4, CW, blockH, isHigh ? '#F0FDF4' : C.slate100, 4);

      // Priority pill
      const pillBg = isHigh ? C.green : action.priority === 'medium' ? C.amber : C.slate300;
      pill(action.priority.toUpperCase(), ML + CW - 28, y - 1, pillBg, C.white);

      // Number
      setFill(isHigh ? C.green : C.slate300);
      doc.circle(ML + 5, y + 2, 3.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      setTxt(C.white);
      text(`${i + 1}`, ML + 5, y + 3.5, { align: 'center' });

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      setTxt(C.slate900);
      titleLines.forEach((line: string, li: number) => {
        text(line, ML + 13, y + li * 5 + 1);
      });

      // What
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      setTxt(C.slate500);
      const whatY = y + titleLines.length * 5 + 3;
      whatLines.forEach((line: string, li: number) => {
        text(line, ML + 13, whatY + li * 4.5);
      });

      y += blockH + 4;
    });
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  // Always on last page
  const footerY = PH - 14;
  divider(footerY - 4, C.slate300);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setTxt(C.slate500);
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  text(`Generated on ${dateStr}`, ML, footerY);
  text('By VisibAI · visib-ai.vercel.app', PW - MR, footerY, { align: 'right' });

  // ── SAVE ─────────────────────────────────────────────────────────────────
  const filename = `visibai-report-${result.query.slice(0, 30).replace(/[^a-z0-9]/gi, '-')}.pdf`;
  doc.save(filename);
}
