export interface RecommendationScoreBreakdown {
  explicitInterest: number;
  inferredInterest: number;
  intent: number;
  vibe: number;
  audience: number;
  location: number;
  time: number;
  price: number;
  freshness: number;
  quality: number;
  diversityPenalty: number;
  duplicatePenalty: number;
  total: number;
}

export interface RecommendedQuestResult {
  id: string;
  title: string;
  description: string;
  score: number;
  scoreBreakdown: RecommendationScoreBreakdown;
  explanation: string[];
}
