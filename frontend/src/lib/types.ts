export interface Entity {
  name: string;
  type: 'brand' | 'product' | 'category';
  positions: number[];
  first_position: number;
  count: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface BreakdownItem {
  score: number;
  max: number;
  explanation: string;
}

// Structured action from recommender
export interface RecommendationAction {
  title: string;
  what: string;
  why: string;
  outcome: string;
  priority: 'high' | 'medium' | 'low';
}

// AEO Leaderboard entry
export interface LeaderboardEntry {
  name: string;
  type: 'brand' | 'product' | 'category';
  total_mentions: number;
  avg_position: number;
  model_coverage: number;
  models: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  is_user: boolean;
  rank: number;
  description: string;
}

// Category Dominance Insight
export interface CategoryDominance {
  detected: boolean;
  top_categories: string[];
  total_mentions: number;
  insight: string;
  opportunity: string;
}

export interface ImpactSimulation {
  current_score: number;
  projected_score: number;
  score_gain: number;
  current_visibility: string;
  projected_visibility: string;
  time_estimate: string;
  key_actions: string[];
}

export interface AIThinking {
  explanation: string;
  priorities: string[];
  category_detected: string;
  competitor_note: string | null;
}

export interface EntitySignal {
  status: 'strong' | 'weak' | 'missing';
  icon: string;
  label: string;
  detail: string;
}

export interface EntityStrengthMap {
  brand_mentions:       EntitySignal;
  product_mentions:     EntitySignal;
  category_association: EntitySignal;
  authority_signals:    EntitySignal;
  review_signals:       EntitySignal;
}

export interface AEOResult {
  query: string;
  business_name: string;
  responses: Record<string, string>;
  entities: Record<string, Entity[]>;
  score: number | null;
  visibility: 'High' | 'Medium' | 'Low' | 'Not Found' | 'N/A';
  confidence: 'High' | 'Medium' | 'Low' | 'N/A';
  breakdown: {
    presence:  BreakdownItem;
    ranking:   BreakdownItem;
    frequency: BreakdownItem;
    sentiment: BreakdownItem;
    authority: BreakdownItem;
  };
  competitors: string[];
  recommendations: RecommendationAction[];
  business_found: boolean;
  why_lost: string[];
  leaderboard: LeaderboardEntry[];
  category_dominance: CategoryDominance | null;
  impact_simulation: ImpactSimulation | null;
  ai_thinking: AIThinking | null;
  entity_strength_map: EntityStrengthMap | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface HistoryEntry {
  id: string;
  query: string;
  business_name: string;
  score: number | null;
  visibility: string;
  timestamp: number;
}
