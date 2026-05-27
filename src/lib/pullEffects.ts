export type PullEffectId = "float" | "burst" | "flutter";

export type PullEffectDef = {
  id: PullEffectId;
  name: string;
  description: string;
  particleCount: number;
  durationMs: number;
};

export const PULL_EFFECTS: PullEffectDef[] = [
  {
    id: "float",
    name: "Gentle Float",
    description: "One sheet lifts up and drifts down",
    particleCount: 1,
    durationMs: 700,
  },
  {
    id: "burst",
    name: "Burst Scatter",
    description: "Sheets explode outward in every direction",
    particleCount: 8,
    durationMs: 650,
  },
  {
    id: "flutter",
    name: "Flutter Storm",
    description: "A whirl of sheets spins and fans outward",
    particleCount: 6,
    durationMs: 800,
  },
];

export type EffectParticle = {
  id: number;
  effectId: PullEffectId;
  styleId: string;
  index: number;
  tx: number;
  ty: number;
  rot: number;
  scale: number;
  delayMs: number;
};

export function spawnPullParticles(
  effectId: PullEffectId,
  styleId: string,
  baseId: number,
): { particles: EffectParticle[]; durationMs: number } {
  const def = PULL_EFFECTS.find((e) => e.id === effectId) ?? PULL_EFFECTS[0];

  if (effectId === "float") {
    const x = (Math.random() - 0.5) * 120;
    return {
      durationMs: def.durationMs,
      particles: [
        {
          id: baseId,
          effectId,
          styleId,
          index: 0,
          tx: x,
          ty: 120,
          rot: 12,
          scale: 1,
          delayMs: 0,
        },
      ],
    };
  }

  if (effectId === "burst") {
    const count = def.particleCount;
    const particles: EffectParticle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const dist = 130 + Math.random() * 70;
      particles.push({
        id: baseId + i,
        effectId,
        styleId,
        index: i,
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist - 40,
        rot: (angle * 180) / Math.PI + (Math.random() - 0.5) * 40,
        scale: 0.65 + Math.random() * 0.35,
        delayMs: i * 18,
      });
    }
    return { particles, durationMs: def.durationMs };
  }

  // flutter
  const count = def.particleCount;
  const particles: EffectParticle[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle = t * Math.PI * 2 * 1.4 + Math.random() * 0.5;
    const dist = 90 + t * 80 + Math.random() * 30;
    particles.push({
      id: baseId + i,
      effectId,
      styleId,
      index: i,
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist - 60,
      rot: angle * 57 + 180 + (Math.random() - 0.5) * 60,
      scale: 0.55 + Math.random() * 0.4,
      delayMs: i * 45,
    });
  }
  return { particles, durationMs: def.durationMs };
}
