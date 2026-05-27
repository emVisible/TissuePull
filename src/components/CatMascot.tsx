"use client";

import {
  CAT_NAME,
  type ActiveCatPrank,
  type CatMood,
} from "@/lib/catMascot";

type CatMascotProps = {
  mood: CatMood;
  activePrank: ActiveCatPrank | null;
  speech: string;
  variant?: "compact" | "full";
};

/** Mochi — compact guide cat for the stats bar, or full-size (legacy). */
export default function CatMascot({
  mood,
  activePrank,
  speech,
  variant = "compact",
}: CatMascotProps) {
  if (variant === "full") {
    return (
      <FullCat mood={mood} activePrank={activePrank} speech={speech} />
    );
  }

  return (
    <div
      className="flex shrink-0 items-start gap-2 pl-32"
      aria-label={`${CAT_NAME}, your guide`}
    >
      <div
        className={`relative shrink-0 ${mood === "mischief" ? "cat-mischief-bounce" : "cat-idle-breathe"}`}
      >
        <MiniCatFace mischief={mood === "mischief"} />
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold text-orange-700/80">
          {CAT_NAME}
        </span>
      </div>
      <div
        className={`relative mt-0.5 min-w-0 max-w-[9.5rem] flex-1 rounded-xl rounded-tl-sm bg-white/95 px-2.5 py-1.5 text-[10px] leading-snug font-medium text-amber-950 shadow-sm ring-1 ring-amber-200/90 sm:max-w-[11rem] sm:text-[11px] ${mood === "mischief" ? "cat-bubble-wiggle" : ""}`}
      >
        <span className="mb-0.5 block text-[8px] font-bold uppercase tracking-wide text-orange-600/90">
          Tip
        </span>
        {speech}
      </div>
    </div>
  );
}

function MiniCatFace({ mischief }: { mischief: boolean }) {
  return (
    <div className="relative h-11 w-12">
      <div className="absolute -right-0.5 bottom-0 h-8 w-2 origin-bottom-left rounded-full bg-gradient-to-t from-orange-600 to-orange-400" />
      <div className="absolute bottom-0 left-1/2 h-7 w-9 -translate-x-1/2 rounded-[48%] bg-gradient-to-b from-orange-300 to-orange-400 ring-1 ring-orange-500/20" />
      <div className="absolute -top-0.5 left-1/2 h-9 w-10 -translate-x-1/2 rounded-[46%] bg-gradient-to-b from-orange-200 to-orange-300 shadow-sm ring-1 ring-orange-400/25">
        <div className="absolute -left-px top-0 h-2.5 w-2.5 rotate-[-28deg] rounded-sm bg-orange-300" />
        <div className="absolute -right-px top-0 h-2.5 w-2.5 rotate-[28deg] rounded-sm bg-orange-300" />
        <div className="absolute left-2 top-[0.85rem] flex gap-2">
          <div
            className={`h-2 w-1.5 rounded-full bg-amber-950 ${mischief ? "cat-eye-mischief" : ""}`}
          />
          <div
            className={`h-2 w-1.5 rounded-full bg-amber-950 ${mischief ? "cat-eye-mischief" : ""}`}
          />
        </div>
        <div className="absolute left-1/2 top-[1.35rem] h-1 w-1.5 -translate-x-1/2 rounded-full bg-pink-400" />
      </div>
    </div>
  );
}

function FullCat({
  mood,
  speech,
}: {
  mood: CatMood;
  activePrank: ActiveCatPrank | null;
  speech: string;
}) {
  return (
    <div className="relative w-[9.5rem]">
      <div
        className={`absolute -top-2 left-1/2 z-20 max-w-[10rem] -translate-x-1/2 rounded-2xl bg-white/95 px-2.5 py-1.5 text-center text-[10px] font-medium text-amber-950 shadow-md ring-1 ring-amber-200/80`}
      >
        {speech}
      </div>
      <div
        className={`relative mx-auto mt-10 ${mood === "mischief" ? "cat-mischief-bounce" : "cat-idle-breathe"}`}
      >
        <MiniCatFace mischief={mood === "mischief"} />
        <p className="mt-2 text-center text-xs font-bold text-amber-800/70">
          {CAT_NAME}
        </p>
      </div>
    </div>
  );
}

export function CatPawOverlay({ prankId }: { prankId: string | null }) {
  if (prankId !== "paw_cover") return null;
  return (
    <div
      className="pointer-events-none absolute bottom-[5.5rem] left-1/2 z-[35] -translate-x-1/2 cat-paw-cover-overlay"
      aria-hidden
    >
      <div className="relative h-16 w-20">
        <div className="absolute bottom-0 right-0 h-5 w-14 rounded-full bg-gradient-to-t from-orange-300 to-orange-200 shadow-lg" />
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-orange-700">
          occupied!
        </span>
      </div>
    </div>
  );
}
