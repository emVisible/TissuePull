"use client";

import { SKILLS, type SkillId } from "@/lib/skills";

type SkillBarProps = {
  softCoins: number;
  cooldownEnds: Record<SkillId, number>;
  steadyActive: boolean;
  treatActive: boolean;
  disabled: boolean;
  onUse: (id: SkillId) => void;
  tick: number;
};

function cooldownLeft(ends: number, now: number): number {
  return Math.max(0, ends - now);
}

export default function SkillBar({
  softCoins,
  cooldownEnds,
  steadyActive,
  treatActive,
  disabled,
  onUse,
  tick,
}: SkillBarProps) {
  const now = tick;

  return (
    <div className="mt-3 w-full max-w-[11.5rem]">
      <p className="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-amber-800/55">
        Skills
      </p>
      <div className="flex gap-1.5">
        {SKILLS.map((skill) => {
          const cd = cooldownLeft(cooldownEnds[skill.id], now);
          const onCd = cd > 0;
          const afford = softCoins >= skill.coinCost;
          const active =
            (skill.id === "steady" && steadyActive) ||
            (skill.id === "treat" && treatActive);
          const canUse = !disabled && !onCd && afford;

          return (
            <button
              key={skill.id}
              type="button"
              disabled={!canUse}
              title={`${skill.name}: ${skill.hint} · ${skill.coinCost} coins`}
              onClick={() => onUse(skill.id)}
              className={`relative flex min-w-0 flex-1 flex-col items-center rounded-xl border-2 px-1 py-2 text-center transition ${
                active
                  ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-300/50"
                  : canUse
                    ? "border-amber-200/90 bg-white/90 hover:border-amber-400 hover:bg-amber-50"
                    : "border-zinc-200/80 bg-white/50 opacity-60"
              }`}
            >
              <span className="text-lg leading-none">{skill.emoji}</span>
              <span className="mt-0.5 text-[9px] font-bold leading-tight text-amber-950">
                {skill.name}
              </span>
              <span className="mt-0.5 text-[8px] leading-tight text-amber-700/70">
                {active ? "Active" : onCd ? `${Math.ceil(cd / 1000)}s` : `${skill.coinCost}🪙`}
              </span>
              {onCd && (
                <div
                  className="absolute inset-0 overflow-hidden rounded-[10px]"
                  aria-hidden
                >
                  <div
                    className="absolute inset-x-0 bottom-0 bg-amber-900/10 transition-all"
                    style={{
                      height: `${(1 - cd / skill.cooldownMs) * 100}%`,
                    }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
