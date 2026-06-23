// features/universe/engine/forceMap.ts
// 7×7 color tier interaction matrix for the v2.1 force system

export type ColorTier = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'indigo' | 'violet'

export type ForceEffect = 'attract_strong' | 'attract_weak' | 'repel_strong' | 'repel_weak' | 'degrade' | 'neutral'

export const TIERS: ColorTier[] = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet']

/** Force multiplier lookup */
const FORCE_MULTIPLIER: Record<ForceEffect, number> = {
  attract_strong: 2.0,
  attract_weak: 0.7,
  repel_strong: -2.0,
  repel_weak: -0.7,
  degrade: 0,       // special: handled separately
  neutral: 0,
}

/**
 * 7×7 Interaction Matrix
 * Row = source color, Col = target color
 * Effect describes force FROM row ONTO col
 */
const MATRIX: ForceEffect[][] = [
  // red    orange  yellow  green   blue    indigo  violet
  ['neutral',     'attract_weak',  'neutral',      'attract_strong', 'repel_weak',    'repel_strong',  'repel_weak'],   // red
  ['attract_weak', 'neutral',      'attract_strong','attract_weak',  'repel_weak',    'repel_strong',  'neutral'],       // orange
  ['neutral',     'attract_strong','neutral',       'degrade',       'repel_weak',    'repel_weak',    'repel_strong'],  // yellow
  ['attract_strong','attract_weak','degrade',       'neutral',       'attract_strong', 'neutral',       'attract_strong'],// green
  ['repel_weak',  'repel_weak',   'repel_weak',    'attract_strong', 'neutral',       'attract_strong', 'attract_weak'], // blue
  ['repel_strong','repel_strong',  'repel_weak',    'neutral',       'attract_strong', 'neutral',       'attract_weak'], // indigo
  ['repel_weak',  'neutral',      'repel_strong',  'attract_strong', 'attract_weak',   'attract_weak',  'neutral'],      // violet
]

const TIER_INDEX: Record<ColorTier, number> = {
  red: 0, orange: 1, yellow: 2, green: 3, blue: 4, indigo: 5, violet: 6,
}

/**
 * Get the force effect between two color tiers.
 */
export function getEffect(source: ColorTier, target: ColorTier): ForceEffect {
  return MATRIX[TIER_INDEX[source]][TIER_INDEX[target]]
}

/**
 * Get the force multiplier between two color tiers.
 */
export function getForceMultiplier(source: ColorTier, target: ColorTier): number {
  return FORCE_MULTIPLIER[getEffect(source, target)]
}

/**
 * Check if the effect is "degrade" (target loses energy).
 */
export function isDegrade(source: ColorTier, target: ColorTier): boolean {
  return getEffect(source, target) === 'degrade'
}

/**
 * Map a hue value (0-360) to a color tier.
 * Uses floating ranges (±15° around each anchor hue).
 */
export function hueToTier(hue: number): ColorTier {
  const anchors: [number, ColorTier][] = [
    [0, 'red'], [30, 'orange'], [60, 'yellow'],
    [120, 'green'], [195, 'blue'], [255, 'indigo'], [290, 'violet'],
  ]

  let closest: ColorTier = 'red'
  let minDist = 360

  for (const [anchor, tier] of anchors) {
    const diff = Math.abs(hue - anchor)
    const dist = Math.min(diff, 360 - diff)
    if (dist < minDist) {
      minDist = dist
      closest = tier
    }
  }

  return closest
}

/**
 * Get the RGB color for a given hue.
 */
export function hueToColor(hue: number): [number, number, number] {
  const h = ((hue % 360) + 360) % 360
  const s = 0.85
  const l = 0.55

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2

  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ]
}
