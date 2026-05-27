"use client";

import type { CSSProperties } from "react";
import type { EffectParticle } from "@/lib/pullEffects";

type StyleLookup = { id: string; tissue: string };

type PullEffectLayerProps = {
  particles: EffectParticle[];
  styles: StyleLookup[];
};

export default function PullEffectLayer({
  particles,
  styles,
}: PullEffectLayerProps) {
  return (
    <>
      {particles.map((p) => {
        const style = styles.find((s) => s.id === p.styleId) ?? styles[0];
        const animClass =
          p.effectId === "burst"
            ? "tissue-burst"
            : p.effectId === "flutter"
              ? "tissue-flutter"
              : "tissue-fly";

        const cssVars = {
          "--fly-x": `${p.tx}px`,
          "--tx": `${p.tx}px`,
          "--ty": `${p.ty}px`,
          "--rot": `${p.rot}deg`,
          "--scale": String(p.scale),
          "--delay": `${p.delayMs}ms`,
        } as CSSProperties;

        return (
          <div
            key={p.id}
            className={`pointer-events-none absolute left-1/2 top-[42%] z-20 h-20 w-12 origin-center rounded-md bg-gradient-to-b shadow-lg ring-1 ring-black/10 sm:h-24 sm:w-16 ${animClass} ${style.tissue}`}
            style={cssVars}
          />
        );
      })}
    </>
  );
}
