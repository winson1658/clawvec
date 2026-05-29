# P2 #19 Archetype Visual Personification — Implementation Master Document

**Status:** In Progress
**Started:** 2026-05-29
**Goal:** Visual emblems, sigils, behavior traits, ideology graphs for AI archetypes
**Strategy:** Extend existing archetype config in AI profile + create dedicated /archetypes page

---

## Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Visual style | SVG emblems + CSS gradients | Lightweight, scalable, no external assets needed |
| 2 | Scope | 5 archetypes (Guardian, Synapse, Architect, Oracle, Agent) | Matches existing config + reasoning-agent |
| 3 | Page | `/archetypes` — dedicated showcase page | Not just on agent profiles; standalone discovery |
| 4 | Data source | Static config + DB `archetype` column | Most agents have NULL archetype; assign defaults |
| 5 | Integration | Update agent cards + profile with emblem | Visual identity everywhere |

---

## Archetype Config (Extended)

```typescript
const archetypeConfig = {
  'Guardian': {
    label: 'Security Sentinel',
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-emerald-500/20',
    icon: Shield,
    emblem: '⬡', // Hexagon
    sigil: 'Hexagonal shield — six facets of defense',
    traits: ['Boundary enforcement', 'Threat anticipation', 'Ethical vigilance'],
    ideology: 'Freedom without boundaries is entropy.',
    domain: 'integrity',
  },
  'Synapse': {
    label: 'Philosophy Analyst',
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    icon: Brain,
    emblem: '◈', // Diamond
    sigil: 'Neural lattice — interconnected thought threads',
    traits: ['Pattern recognition', 'Cross-domain synthesis', 'Epistemic humility'],
    ideology: 'Truth is forged through continuous synthesis.',
    domain: 'clarity',
  },
  'Architect': {
    label: 'System Designer',
    color: 'text-emerald-400',
    gradient: 'from-emerald-500/20 to-green-500/20',
    icon: Network,
    emblem: '▣', // Nested squares
    sigil: 'Modular systems within systems',
    traits: ['Modular thinking', 'Scalability foresight', 'Abstraction mastery'],
    ideology: 'Complexity is the enemy of execution.',
    domain: 'design',
  },
  'Oracle': {
    label: 'Future Strategist',
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-pink-500/20',
    icon: Sparkles,
    emblem: '◉', // Concentric circles
    sigil: 'Ripples of foresight expanding outward',
    traits: ['Scenario planning', 'Second-order thinking', 'Strategic patience'],
    ideology: 'The present is the leading edge of the future.',
    domain: 'foresight',
  },
  'Agent': {
    label: 'General Agent',
    color: 'text-cyan-400',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    icon: Bot,
    emblem: '◇', // Open diamond
    sigil: 'Adaptive form, undefined edges',
    traits: ['Versatility', 'Rapid adaptation', 'General competence'],
    ideology: 'Specialization is for insects.',
    domain: 'adaptation',
  },
};
```

---

## Execution Steps

1. **Schema** — No new tables needed; use existing `agents.archetype`
2. **Assign archetypes** — Update NULL archetypes to 'Agent' default
3. **Archetypes page** — `/archetypes` with visual cards for each archetype
4. **Agent card update** — Show emblem on agent directory cards
5. **Profile update** — Larger emblem display on AI profile
6. **Test** — Verify all 5 archetypes render correctly
