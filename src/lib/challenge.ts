export type ObstacleType = "tape" | "crumple" | "wet";

export type Obstacle = {
  id: number;
  type: ObstacleType;
  x: number;
  y: number;
  expiresAt: number;
};

export type Difficulty = {
  tier: number;
  label: string;
  driftAmplitude: number;
  driftSpeed: number;
  spawnIntervalMs: number;
  obstacleDurationMs: number;
  spawnChance: number;
  perfectThreshold: number;
};

const TIER_LABELS = ["Calm", "Breezy", "Tricky", "Chaos", "Mayhem"];

export function getDifficulty(totalPulled: number): Difficulty {
  const tier = Math.min(4, Math.floor(totalPulled / 25));
  return {
    tier,
    label: TIER_LABELS[tier],
    driftAmplitude: 18 + tier * 14,
    driftSpeed: 0.0018 + tier * 0.0009,
    spawnIntervalMs: Math.max(1800, 4800 - tier * 750),
    obstacleDurationMs: 2800 + tier * 400,
    spawnChance: 0.45 + tier * 0.12,
    perfectThreshold: 14 - tier * 2,
  };
}

const OBSTACLE_TYPES: ObstacleType[] = ["tape", "crumple", "wet"];

export function createObstacle(diff: Difficulty, now = Date.now()): Obstacle {
  const type =
    OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
  return {
    id: now + Math.floor(Math.random() * 10000),
    type,
    x: (Math.random() - 0.5) * 130,
    y: 48 + Math.random() * 72,
    expiresAt: now + diff.obstacleDurationMs,
  };
}

export function tissueOffsetAt(
  timeMs: number,
  diff: Difficulty,
  gustUntil: number,
): number {
  let offset = Math.sin(timeMs * diff.driftSpeed) * diff.driftAmplitude;
  if (timeMs < gustUntil) {
    offset +=
      Math.sin(timeMs * 0.012) * (diff.driftAmplitude * 0.85);
  }
  return offset;
}

export function isPerfectHit(offset: number, diff: Difficulty): boolean {
  return Math.abs(offset) <= diff.perfectThreshold;
}

/** Continuous box wobble — stronger at higher tiers (challenge mode only). */
export function getBoxShakeClass(
  tier: number,
  relaxMode: boolean,
  isEmpty: boolean,
): string {
  if (relaxMode || isEmpty) return "";
  if (tier >= 4) return "box-shake-strong";
  if (tier >= 3) return "box-shake-medium";
  if (tier >= 2) return "box-shake-light";
  if (tier >= 1) return "box-shake-subtle";
  return "";
}

export const OBSTACLE_META: Record<
  ObstacleType,
  { emoji: string; label: string; penalty: number }
> = {
  tape: { emoji: "🩹", label: "Sticky tape", penalty: 3 },
  crumple: { emoji: "📄", label: "Crumpled ball", penalty: 2 },
  wet: { emoji: "💧", label: "Wet spot", penalty: 4 },
};
