import { CAT_NAME } from "./catMascot";
import type { SkillId } from "./skills";

export type GuideContext = {
  totalPulled: number;
  isEmpty: boolean;
  relaxMode: boolean;
  combo: number;
  remaining: number;
  obstacleCount: number;
  difficultyTier: number;
  perfectStreak: number;
  jammed: boolean;
  catPrankActive: boolean;
  steadyActive: boolean;
  mochiPacified: boolean;
  skillReady: Partial<Record<SkillId, boolean>>;
};

export function getCatGuideTips(ctx: GuideContext): string[] {
  const tips: string[] = [];

  if (ctx.totalPulled === 0) {
    tips.push(`Hi! I'm ${CAT_NAME} — tap the sheet sticking out of the box to pull!`);
    tips.push("Only the white sheet counts. Don't tap the box itself!");
    return tips;
  }

  if (ctx.isEmpty) {
    tips.push("Box empty! Tap the sheet to load 100 fresh tissues.");
    return tips;
  }

  if (ctx.jammed) {
    tips.push("You're jammed — wait a second after hitting a red hazard.");
  }

  if (ctx.catPrankActive) {
    tips.push("I'm teasing the box! Wait if I'm sitting on your sheet~");
  }

  if (ctx.mochiPacified) {
    tips.push("Munch munch… I'll behave for a while. Pull fast!");
  }

  if (ctx.steadyActive) {
    tips.push("Steady Sheet is on — the tissue won't drift. Go for Perfects!");
  }

  if (ctx.relaxMode) {
    tips.push("Relax mode: no drift, no hazards. Nice and chill~");
    tips.push("Turn off Relax in Shop when you want a real challenge.");
  } else {
    if (ctx.obstacleCount > 0) {
      tips.push(`Red hazards on the box — dodge them! Or use Hazard Sweep below.`);
    }
    if (ctx.difficultyTier >= 3) {
      tips.push("High level! The box shakes more and I prank harder. Stay focused!");
    } else if (ctx.difficultyTier >= 1) {
      tips.push("Pull the drifting sheet when it's centered for 2× coins (Perfect!).");
    }
    if (ctx.combo >= 5) {
      tips.push(`${ctx.combo}× combo! Keep tapping within ~1.4s between pulls.`);
    } else if (ctx.combo >= 2) {
      tips.push("Combo building — quick pulls earn bonus Soft Coins!");
    }
    if (ctx.perfectStreak >= 3) {
      tips.push(`Perfect streak ${ctx.perfectStreak}× — you're a pro!`);
    }
    if (ctx.remaining < 15) {
      tips.push(`Only ${ctx.remaining} sheets left in this box — finish strong!`);
    }
  }

  if (ctx.skillReady.steady) {
    tips.push("Steady Sheet is ready — stops drift for 6 seconds.");
  }
  if (ctx.skillReady.treat) {
    tips.push("Cat Treat ready — bribe me to pause my pranks!");
  }
  if (ctx.skillReady.sweep) {
    tips.push("Hazard Sweep can clear all red obstacles instantly.");
  }

  tips.push("Skills below the box cost a few coins — use them when things get messy!");
  tips.push("Open Shop (top right) for tissue styles, effects, and Relax mode.");

  return tips;
}
