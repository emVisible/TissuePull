export const CAT_NAME = "Mochi";

export type CatPrankId =
  | "paw_swipe"
  | "tissue_push"
  | "paw_cover"
  | "box_bonk"
  | "tail_flick";

export type CatMood = "sleepy" | "curious" | "mischief" | "proud";

export type CatPrankDef = {
  id: CatPrankId;
  label: string;
  toast: string;
  minTier: number;
  durationMs: number;
  weight: number;
  blocksPull?: boolean;
  tissueNudge?: number;
  boxBonk?: boolean;
};

export type ActiveCatPrank = {
  instanceId: number;
  def: CatPrankDef;
  endsAt: number;
};

export const CAT_PRANKS: CatPrankDef[] = [
  {
    id: "tail_flick",
    label: "Tail flick",
    toast: "Mochi flicks her tail at the box.",
    minTier: 1,
    durationMs: 900,
    weight: 3,
    boxBonk: true,
  },
  {
    id: "paw_swipe",
    label: "Paw swipe",
    toast: "Mochi swats the sheet!",
    minTier: 2,
    durationMs: 700,
    weight: 4,
    tissueNudge: 55,
  },
  {
    id: "tissue_push",
    label: "Sheet push",
    toast: "Mochi shoves the tissue aside.",
    minTier: 2,
    durationMs: 1100,
    weight: 3,
    tissueNudge: 38,
  },
  {
    id: "paw_cover",
    label: "Paw cover",
    toast: "Mochi sits on the sheet — wait!",
    minTier: 3,
    durationMs: 1400,
    weight: 3,
    blocksPull: true,
  },
  {
    id: "box_bonk",
    label: "Box bonk",
    toast: "Mochi bonks the whole box!",
    minTier: 3,
    durationMs: 850,
    weight: 3,
    boxBonk: true,
    tissueNudge: 22,
  },
];

export function catPrankIntervalMs(tier: number): number {
  if (tier <= 0) return 99999;
  return Math.max(3500, 9500 - tier * 1400);
}

export function catPrankChance(tier: number): number {
  if (tier <= 0) return 0;
  if (tier === 1) return 0.22;
  return 0.18 + tier * 0.1;
}

export function pickCatPrank(tier: number): CatPrankDef | null {
  const pool = CAT_PRANKS.filter((p) => tier >= p.minTier);
  if (pool.length === 0) return null;
  const total = pool.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of pool) {
    r -= p.weight;
    if (r <= 0) return p;
  }
  return pool[pool.length - 1];
}

export function moodForTier(
  tier: number,
  prank: CatPrankId | null,
): CatMood {
  if (prank) return "mischief";
  if (tier >= 3) return "curious";
  if (tier >= 1) return "curious";
  return "sleepy";
}
