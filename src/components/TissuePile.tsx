"use client";

import type { CSSProperties } from "react";

const MAX_RENDER = 180;
const PILE_HEIGHT_VH = 44;

type PileStyle = { id: string; tissue: string };

type TissuePileProps = {
  styleIds: string[];
  styles: PileStyle[];
  totalPulled: number;
};

function hash(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export default function TissuePile({
  styleIds,
  styles,
  totalPulled,
}: TissuePileProps) {
  if (styleIds.length === 0) return null;

  const count = styleIds.length;
  const renderCount = Math.min(count, MAX_RENDER);
  const startIndex = count - renderCount;
  const newestIndex = count - 1;

  const layerStep = count > 100 ? 5.5 : count > 50 ? 6.5 : 8;
  const sheetH = count > 100 ? 7 : count > 50 ? 8 : 10;
  const sheetW = count > 100 ? 26 : count > 50 ? 30 : 36;

  const styleMap = new Map(styles.map((s) => [s.id, s.tissue]));

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[5] overflow-hidden"
      style={{ height: `${PILE_HEIGHT_VH}vh` }}
      aria-hidden
    >
      <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-amber-200/55 via-amber-100/25 to-transparent" />

      {Array.from({ length: renderCount }).map((_, i) => {
        const globalIndex = startIndex + i;
        const styleId = styleIds[globalIndex];
        const tissue =
          styleMap.get(styleId) ?? styles[0]?.tissue ?? "from-white to-zinc-100";
        const layer = Math.floor(globalIndex / 10);
        const x = hash(globalIndex * 3.1) * 90 + 5;
        const y = layer * layerStep + hash(globalIndex * 7.7) * 3;
        const rot = (hash(globalIndex * 11.3) - 0.5) * 22;
        const isNewest = globalIndex === newestIndex;
        const isRecent = globalIndex >= newestIndex - 2 && globalIndex < newestIndex;

        const animClass = isNewest
          ? "pile-sheet-drop"
          : isRecent
            ? "pile-sheet-settle"
            : "";

        const cssVars = {
          "--pile-rot": `${rot}deg`,
        } as CSSProperties;

        return (
          <div
            key={globalIndex}
            className={`absolute rounded-md bg-gradient-to-b shadow-md ring-1 ring-amber-900/10 ${tissue} ${animClass}`}
            style={{
              ...cssVars,
              left: `${x}%`,
              bottom: y,
              width: sheetW,
              height: sheetH,
              transform: isNewest || isRecent ? undefined : `translateX(-50%) rotate(${rot}deg)`,
              zIndex: globalIndex,
              opacity: 0.88 + hash(globalIndex) * 0.12,
            }}
          />
        );
      })}

      {count > MAX_RENDER && (
        <p className="absolute bottom-3 right-4 rounded-full bg-white/85 px-2.5 py-1 text-xs font-semibold text-amber-900/85 shadow-sm backdrop-blur-sm">
          +{count - MAX_RENDER} more
        </p>
      )}
      {totalPulled > 0 && (
        <p className="absolute bottom-3 left-4 rounded-full bg-white/85 px-2.5 py-1 text-xs font-semibold tabular-nums text-amber-900/85 shadow-sm backdrop-blur-sm">
          Pile: {count}
        </p>
      )}
    </div>
  );
}
