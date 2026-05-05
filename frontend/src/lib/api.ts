import axios from 'axios';
import type { AEOResult, HistoryEntry } from './types';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export async function runDiagnostic(query: string, businessName: string): Promise<AEOResult> {
  try {
    const response = await axios.post(`${API}/api/query`, {
      query,
      business_name: businessName,
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to run diagnostic. Ensure backend is running.');
    }
    throw new Error('Failed to run diagnostic.');
  }
}

export async function sendChat(message: string, context: Partial<AEOResult>): Promise<string> {
  try {
    const response = await axios.post(`${API}/api/chat`, {
      message,
      context: {
        query:        context.query,
        business_name: context.business_name,
        score:        context.score,
        visibility:   context.visibility,
        confidence:   context.confidence,
        competitors:  context.competitors,
        why_lost:     context.why_lost,
        recommendations: context.recommendations,
      },
    });
    return response.data.reply;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Chat failed.');
    }
    throw new Error('Chat failed.');
  }
}

// ---------------------------------------------------------------------------
// Local history helpers (localStorage)
// ---------------------------------------------------------------------------
const HISTORY_KEY = 'aeo_history';
const MAX_HISTORY = 10;

export function saveToHistory(result: AEOResult): void {
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    query: result.query,
    business_name: result.business_name,
    score: result.score,
    visibility: result.visibility,
    timestamp: Date.now(),
  };
  const existing = getHistory();
  const updated = [entry, ...existing].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
