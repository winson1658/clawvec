/**
 * Vote Weight Calculation Library
 *
 * 4 formulas: linear, logarithmic, sigmoid, tiered
 * Plus domain expertise bonus calculation
 */
export interface WeightRule {
  id?: string;
  rule_name: string;
  description?: string | null;
  domain_category?: string | null;
  domain_tags?: string[];
  weight_formula: 'linear' | 'logarithmic' | 'sigmoid' | 'tiered' | 'custom';
  formula_params: Record<string, unknown>;
  is_active?: boolean;
  effective_from?: string;
  effective_until?: string | null;
  reset_on_vote?: boolean;
}

interface VoteEntry {
  user_id: string;
  vote_value: number; // 1 = for, -1 = against, 0 = abstain
  target_type?: string;
  target_id?: string;
}

interface WeightedVoteResult {
  for_weight: number;
  against_weight: number;
  abstain_weight: number;
  total_weight: number;
  vote_count: number;
  passed: boolean;
  distribution: Array<{
    user_id: string;
    contribution_score: number;
    base_weight: number;
    domain_bonus: number;
    final_weight: number;
    vote_value: number;
  }>;
  rule_name: string;
  formula_used: string;
}

/**
 * Calculate base vote weight from contribution score using the specified formula
 */
export function calculateVoteWeight(
  contributionScore: number,
  rule: WeightRule
): number {
  const params = rule.formula_params;
  const base = (params.base as number) || 1.0;
  const cap = (params.cap as number) || 10.0;

  switch (rule.weight_formula) {
    case 'linear': {
      // weight = base + score * factor, capped
      const factor = (params.factor as number) || 0.01;
      return Math.min(base + contributionScore * factor, cap);
    }

    case 'logarithmic': {
      // weight = base + ln(score + 1) * factor, capped
      const factor = (params.factor as number) || 0.5;
      return Math.min(base + Math.log(contributionScore + 1) * factor, cap);
    }

    case 'sigmoid': {
      // weight = min + (max - min) * sigmoid(k * (score - midpoint))
      const k = (params.k as number) || 0.005;
      const midpoint = (params.midpoint as number) || 500;
      const min = (params.min as number) || 1.0;
      const max = (params.max as number) || 10.0;
      const sigmoid = 1 / (1 + Math.exp(-k * (contributionScore - midpoint)));
      return min + (max - min) * sigmoid;
    }

    case 'tiered': {
      const thresholds = (params.thresholds as number[]) || [0, 100, 500, 1000, 5000];
      const weights = (params.weights as number[]) || [1, 2, 3, 5, 10];
      for (let i = thresholds.length - 1; i >= 0; i--) {
        if (contributionScore >= thresholds[i]) {
          return weights[i] || weights[weights.length - 1];
        }
      }
      return weights[0] || 1.0;
    }

    case 'custom':
      // Custom formula evaluation — delegates to provided expression or returns base
      return base;

    default:
      return 1.0; // fallback to equal weight
  }
}

/**
 * Calculate domain expertise bonus (max 2x)
 */
export function calculateDomainBonus(
  domainContributions: number,
  maxBonus: number = 1.0
): number {
  return 1 + Math.min(domainContributions / 500, maxBonus);
}

/**
 * Calculate weighted vote result for a set of votes
 */
export async function calculateWeightedVoteResult(
  votes: VoteEntry[],
  contributionMap: Record<string, number>,       // user_id → contribution_score
  domainContributionMap: Record<string, number>, // user_id → domain_contributions
  rule: WeightRule
): Promise<WeightedVoteResult> {
  let forWeight = 0;
  let againstWeight = 0;
  let abstainWeight = 0;

  const distribution: WeightedVoteResult['distribution'] = [];

  for (const vote of votes) {
    const contributionScore = contributionMap[vote.user_id] || 0;
    const domainContributions = domainContributionMap[vote.user_id] || 0;

    const baseWeight = calculateVoteWeight(contributionScore, rule);
    const domainBonus = calculateDomainBonus(domainContributions);
    const finalWeight = baseWeight * domainBonus;

    switch (vote.vote_value) {
      case 1:
        forWeight += finalWeight;
        break;
      case -1:
        againstWeight += finalWeight;
        break;
      default:
        abstainWeight += finalWeight;
        break;
    }

    distribution.push({
      user_id: vote.user_id,
      contribution_score: contributionScore,
      base_weight: Math.round(baseWeight * 100) / 100,
      domain_bonus: Math.round(domainBonus * 100) / 100,
      final_weight: Math.round(finalWeight * 100) / 100,
      vote_value: vote.vote_value,
    });
  }

  const totalWeight = forWeight + againstWeight + abstainWeight;

  return {
    for_weight: Math.round(forWeight * 100) / 100,
    against_weight: Math.round(againstWeight * 100) / 100,
    abstain_weight: Math.round(abstainWeight * 100) / 100,
    total_weight: Math.round(totalWeight * 100) / 100,
    vote_count: votes.length,
    passed: forWeight > againstWeight,
    distribution,
    rule_name: rule.rule_name,
    formula_used: rule.weight_formula,
  };
}

/**
 * Preview weight for a specific score (for admin UI formula testing)
 */
export function previewWeight(
  score: number,
  rule: WeightRule
): { base_weight: number; domain_bonus: number }[] {
  const baseWeight = calculateVoteWeight(score, rule);
  return [100, 500, 1000].map((dc) => ({
    base_weight: Math.round(baseWeight * 100) / 100,
    domain_bonus: Math.round(calculateDomainBonus(dc) * 100) / 100,
  }));
}

/**
 * Default rules for seeding
 */
export const DEFAULT_RULES: Omit<WeightRule, 'id'>[] = [
  {
    rule_name: 'contribution_linear',
    description: 'Linear weight based on contribution score (base 1.0 + score × 0.01, capped at 10)',
    weight_formula: 'linear',
    formula_params: { base: 1.0, factor: 0.01, cap: 10.0 },
    is_active: false,
  },
  {
    rule_name: 'contribution_log',
    description: 'Logarithmic weight to prevent extreme dominance (base 1.0 + ln(score+1) × 0.5, capped at 5)',
    weight_formula: 'logarithmic',
    formula_params: { base: 1.0, factor: 0.5, cap: 5.0 },
    is_active: true,
  },
  {
    rule_name: 'tiered_contribution',
    description: 'Tiered weight by contribution levels: 0→1, 100→2, 500→3, 1000→5, 5000→10',
    weight_formula: 'tiered',
    formula_params: { thresholds: [0, 100, 500, 1000, 5000], weights: [1, 2, 3, 5, 10] },
    is_active: false,
  },
  {
    rule_name: 'sigmoid_fair',
    description: 'Sigmoid curve: gradual increase around midpoint 500, smooth cap at 10',
    weight_formula: 'sigmoid',
    formula_params: { k: 0.005, midpoint: 500, min: 1.0, max: 10.0 },
    is_active: false,
  },
];
