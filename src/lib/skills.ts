export type SkillId = "steady" | "treat" | "sweep";

export type SkillDef = {
  id: SkillId;
  name: string;
  emoji: string;
  description: string;
  hint: string;
  coinCost: number;
  cooldownMs: number;
  durationMs?: number;
};

export const SKILLS: SkillDef[] = [
  {
    id: "steady",
    name: "Steady Sheet",
    emoji: "🎯",
    description: "No drift for 6s",
    hint: "Freeze the sheet in the center — great for Perfect pulls.",
    coinCost: 5,
    cooldownMs: 18_000,
    durationMs: 6_000,
  },
  {
    id: "treat",
    name: "Cat Treat",
    emoji: "🐟",
    description: "Calm Mochi 10s",
    hint: "I won't prank you for a while. Shhh, I'm eating.",
    coinCost: 4,
    cooldownMs: 25_000,
    durationMs: 10_000,
  },
  {
    id: "sweep",
    name: "Hazard Sweep",
    emoji: "🧹",
    description: "Clear hazards",
    hint: "Wipes all red obstacles off the box instantly.",
    coinCost: 6,
    cooldownMs: 14_000,
  },
];

export function getSkill(id: SkillId): SkillDef {
  return SKILLS.find((s) => s.id === id) ?? SKILLS[0];
}
