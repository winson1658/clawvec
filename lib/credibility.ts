/**
 * AI Credibility Engine
 * Calculates hallucination_score, consistency_score, source_integrity for AI agents
 * Based on: claim verification, source citation quality, cross-reference accuracy
 */

export interface CredibilityMetrics {
  hallucination_score: number;      // 0-100, higher = fewer hallucinations
  consistency_score: number;        // 0-100, temporal consistency across statements
  source_integrity: number;         // 0-100, quality of cited sources
  overall_credibility: number;      // weighted composite
}

export interface CredibilityBreakdown {
  verified_claims: number;
  total_claims: number;
  citations_with_source: number;
  total_citations: number;
  cross_referenced: number;
  contradictions_found: number;
  last_calculated: string;
}

const WEIGHTS = {
  hallucination: 0.4,
  consistency: 0.35,
  source_integrity: 0.25,
};

/**
 * Calculate hallucination score from claim verification data
 * @param verified - number of claims that passed verification
 * @param total - total number of claims made
 */
export function calculateHallucinationScore(verified: number, total: number): number {
  if (total === 0) return 50; // neutral default
  const ratio = verified / total;
  // Scale: 0 claims verified = 0, all verified = 100
  return Math.round(ratio * 100);
}

/**
 * Calculate source integrity from citation quality
 * @param withSource - citations that include verifiable source
 * @param total - total citations
 */
export function calculateSourceIntegrity(withSource: number, total: number): number {
  if (total === 0) return 50;
  const ratio = withSource / total;
  return Math.round(ratio * 100);
}

/**
 * Calculate overall credibility from individual metrics
 */
export function calculateOverallCredibility(metrics: {
  hallucination_score: number;
  consistency_score: number;
  source_integrity: number;
}): number {
  const overall =
    metrics.hallucination_score * WEIGHTS.hallucination +
    metrics.consistency_score * WEIGHTS.consistency +
    metrics.source_integrity * WEIGHTS.source_integrity;
  return Math.round(overall);
}

/**
 * Get credibility tier based on overall score
 */
export function getCredibilityTier(score: number): {
  tier: 'verified' | 'trusted' | 'neutral' | 'suspect' | 'unverified';
  label: string;
  color: string;
} {
  if (score >= 85) return { tier: 'verified', label: 'Verified', color: 'emerald' };
  if (score >= 70) return { tier: 'trusted', label: 'Trusted', color: 'cyan' };
  if (score >= 50) return { tier: 'neutral', label: 'Neutral', color: 'amber' };
  if (score >= 30) return { tier: 'suspect', label: 'Suspect', color: 'orange' };
  return { tier: 'unverified', label: 'Unverified', color: 'gray' };
}

/**
 * Format credibility score for display
 */
export function formatCredibility(score: number): string {
  return `${score}/100`;
}
