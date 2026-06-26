// features/cosmos/engine/forceMap.ts
// 7×7 color tier interaction matrix for the v2.8b force system
// v2.8b: blue↔indigo oscillate/attract_weak, orange⇄green oscillate
// v2.3: +oscillate, +burst, +shear_attract force types

export type ColorTier = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'indigo' | 'violet'

export type ForceEffect =
  | 'attract_strong'   // ×2.0 — strong pull
  | 'attract_weak'     // ×0.7 — gentle pull
  | 'repel_strong'     // ×-2.0 + burst@35px — push + explode
  | 'repel_weak'       // ×-0.7 — gentle push
  | 'burst'            // ×-8.0@35px, neutral far — pure explosion
  | 'oscillate'        // sin(dist/30)×1.5 — distance-based oscillation
  | 'shear_attract'    // ×1.5 + density shear — attract but tear clusters
  | 'degrade'          // energy ×0.9995 + jitter — breakdown
  | 'neutral'          // ×0 — no interaction

export const TIERS: ColorTier[] = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet']

/** Force multiplier lookup (base multiplier, not including distance-dependent effects) */
export const FORCE_MULTIPLIER: Record<ForceEffect, number> = {
  attract_strong: 1.2,   // v2.4.1: reduced from 1.5 — gentler attraction, less clustering
  attract_weak: 0.7,
  repel_strong: -2.0,
  repel_weak: -0.7,
  burst: -8.0,          // used only within BURST_RADIUS
  oscillate: 1.5,       // amplitude; actual sign oscillates with distance
  shear_attract: 1.5,   // base attraction + density shear override
  degrade: 0,
  neutral: 0,
}

/**
 * 7×7 Interaction Matrix v2.7b — balance pass (keep blue/violet off edges)
 *
 * Changes from v2.3:
 *   Blue↔Red: repel_weak → neutral (water envelops fire, not repels it)
 *   Violet↔Green: burst → oscillate (spirit dances with life, not explodes)
 *   Green↔Blue: attract_strong → oscillate (dynamic dance instead of clumping)
 *   Green↔Violet: attract_strong → burst (spirit cannot be contained by life)
 *   Red↔Indigo: repel_strong → burst (fire vs abyss — explosive)
 *   Yellow↔Violet: repel_strong → burst (light vs spirit)
 *   Orange↔Indigo: repel_strong → burst
 *   Violet↔Yellow/Green: burst (spirit breaks light and life)
 */
const MATRIX: ForceEffect[][] = [
  //         red       orange     yellow     green      blue       indigo     violet
  /* red    */ ['neutral',     'attract_weak',  'neutral',      'attract_strong', 'repel_weak',    'burst',        'repel_weak'],
  /* orange */ ['attract_weak', 'neutral',      'attract_strong','oscillate',    'repel_weak',    'burst',        'neutral'],
  /* yellow */ ['neutral',     'attract_strong','neutral',       'degrade',       'repel_weak',    'repel_weak',   'burst'],
  /* green  */ ['attract_strong','oscillate',  'degrade',       'neutral',       'oscillate',     'neutral',      'burst'],
  /* blue   */ ['neutral',     'repel_weak',   'repel_weak',    'oscillate',     'neutral',       'oscillate',    'attract_weak'],
  /* indigo */ ['burst',       'burst',        'repel_weak',    'neutral',       'attract_weak',  'neutral',      'attract_weak'],
  /* violet */ ['repel_weak',  'neutral',      'burst',         'oscillate',    'attract_weak',   'attract_weak',  'neutral'],
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
 * Get the base force multiplier between two color tiers.
 * For oscillate, returns the amplitude (sign determined by distance in nbody.ts).
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
 * Check if this effect should trigger burst at close range.
 */
export function shouldBurst(source: ColorTier, target: ColorTier): boolean {
  const e = getEffect(source, target)
  return e === 'burst' || e === 'repel_strong'
}

/**
 * Check if this effect uses oscillation.
 */
export function isOscillate(source: ColorTier, target: ColorTier): boolean {
  return getEffect(source, target) === 'oscillate'
}

/**
 * Check if this effect is shear_attract (attracts but adds density shear).
 */
export function isShearAttract(source: ColorTier, target: ColorTier): boolean {
  return getEffect(source, target) === 'shear_attract'
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
