"use client";

import {
  getBoxShakeClass,
  OBSTACLE_META,
  type Obstacle,
  type ObstacleType,
} from "@/lib/challenge";

type ArenaStyle = {
  tissue: string;
  box: string;
  accent: string;
  pattern?: "lines" | "dots" | "none";
};

type GameArenaProps = {
  activeStyle: ArenaStyle;
  isEmpty: boolean;
  boxProgress: number;
  tissueOffset: number;
  pullFlash: number;
  obstacles: Obstacle[];
  jammed: boolean;
  relaxMode: boolean;
  difficultyTier: number;
  gustActive: boolean;
  catBonkActive?: boolean;
  onTissuePull: () => void;
  onBoxMiss: () => void;
  onObstacleHit: (id: number, type: ObstacleType) => void;
  onRestock: () => void;
};

export default function GameArena({
  activeStyle,
  isEmpty,
  boxProgress,
  tissueOffset,
  pullFlash,
  obstacles,
  jammed,
  relaxMode,
  difficultyTier,
  gustActive,
  catBonkActive = false,
  onTissuePull,
  onBoxMiss,
  onObstacleHit,
  onRestock,
}: GameArenaProps) {
  const shakeClass = getBoxShakeClass(difficultyTier, relaxMode, isEmpty);
  const driftX = relaxMode ? 0 : tissueOffset;

  return (
    <div
      className={`tissue-dispenser relative z-10 ${shakeClass} ${gustActive || catBonkActive ? "arena-gust" : ""}`}
    >
      <div className="relative mx-auto h-[10rem] w-[11.5rem]">
        {/* Box body — one unit with tissue */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (isEmpty) onRestock();
            else if (!relaxMode) onBoxMiss();
          }}
          aria-label={isEmpty ? "Restock box" : "Tissue box"}
          className={`absolute inset-x-0 bottom-0 h-[8.25rem] rounded-xl bg-gradient-to-br shadow-xl ring-2 ring-black/25 ${activeStyle.box} ${isEmpty ? "opacity-70" : ""} ${!relaxMode && !isEmpty ? "cursor-crosshair" : ""}`}
        >
          {/* Dispenser slot lip */}
          <div className="pointer-events-none absolute inset-x-5 top-0 z-[1] h-3 rounded-b-md bg-black/25 shadow-inner" />
          <div className="pointer-events-none absolute inset-x-7 top-0.5 z-[2] h-1.5 rounded-full bg-white/15" />

          <div className="absolute inset-x-3 top-5 h-7 rounded bg-white/15" />
          <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-xl bg-black/15">
            <div
              className="h-full bg-white/45 transition-all duration-300"
              style={{ width: `${boxProgress}%` }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pt-4">
            <span className="text-3xl font-black tracking-widest text-black/12">
              TP
            </span>
          </div>
          <div className="absolute -right-0.5 top-1/2 h-[4.5rem] w-1.5 -translate-y-1/2 rounded-r-md bg-black/25" />
          <div
            className={`absolute bottom-2.5 left-0 right-0 text-center text-[11px] font-medium ${activeStyle.accent}`}
          >
            {isEmpty
              ? "Tap sheet for new box"
              : relaxMode
                ? "Tap sheet to pull"
                : "Avoid hazards!"}
          </div>
        </button>

        {/* Sheet emerging from slot — drift wrapper + tug inner */}
        <div
          className="absolute bottom-[6.35rem] left-1/2 z-20"
          style={{
            transform: `translateX(calc(-50% + ${driftX}px))`,
          }}
        >
          <button
            type="button"
            key={pullFlash}
            disabled={jammed && !isEmpty}
            onClick={(e) => {
              e.stopPropagation();
              if (isEmpty) onRestock();
              else onTissuePull();
            }}
            aria-label={
              isEmpty
                ? "Load a new tissue box"
                : jammed
                  ? "Tissue jammed"
                  : "Pull tissue sheet"
            }
            className={`relative h-[4.75rem] w-[4.25rem] rounded-t-md bg-gradient-to-b shadow-lg ring-1 ring-black/10 ${activeStyle.tissue} ${
              isEmpty
                ? "opacity-40"
                : jammed
                  ? "opacity-50 grayscale"
                  : "tissue-tug hover:brightness-105"
            } ${!relaxMode && !isEmpty && !jammed ? "shadow-amber-900/15" : ""}`}
          >
            <div className="absolute inset-x-0 -bottom-1 h-3 rounded-b-sm bg-gradient-to-b from-black/10 to-transparent" />
            <TissuePattern type={activeStyle.pattern} />
          </button>
        </div>

        {/* Slot rim in front of sheet base */}
        <div
          className="pointer-events-none absolute bottom-[6.1rem] left-1/2 z-[25] h-2 w-[5.25rem] -translate-x-1/2 rounded-sm bg-gradient-to-b from-black/35 via-black/20 to-transparent shadow-sm"
          aria-hidden
        />

        {!relaxMode && !isEmpty && (
          <span className="pointer-events-none absolute bottom-[11.1rem] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-900/90 px-2.5 py-0.5 text-[10px] font-semibold text-amber-50 shadow-md">
            Pull here
          </span>
        )}

        {!relaxMode &&
          !isEmpty &&
          obstacles.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onObstacleHit(o.id, o.type);
              }}
              style={{
                left: `calc(50% + ${o.x}px)`,
                top: `calc(100% - 8.25rem + ${Math.min(o.y, 95)}px)`,
              }}
              className="obstacle-pop absolute z-40 -translate-x-1/2 cursor-not-allowed rounded-lg border-2 border-red-400/80 bg-red-50/95 px-2 py-1.5 text-center shadow-lg ring-2 ring-red-300/50"
              aria-label={`Hazard: ${OBSTACLE_META[o.type].label}`}
            >
              <span className="text-xl leading-none">
                {OBSTACLE_META[o.type].emoji}
              </span>
              <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-wide text-red-700">
                Don&apos;t tap
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}

function TissuePattern({ type }: { type?: "lines" | "dots" | "none" }) {
  if (type === "dots") {
    return (
      <>
        <div className="absolute left-3 top-3 h-1 w-1 rounded-full bg-violet-300/60" />
        <div className="absolute right-3 top-8 h-1 w-1 rounded-full bg-violet-300/60" />
        <div className="absolute left-4 top-12 h-1 w-1 rounded-full bg-violet-300/60" />
      </>
    );
  }
  if (type === "none") return null;
  return (
    <>
      <div className="absolute inset-x-2 top-2.5 h-px bg-zinc-200/80" />
      <div className="absolute inset-x-2 top-6 h-px bg-zinc-200/80" />
      <div className="absolute inset-x-2 top-9 h-px bg-zinc-200/80" />
      <div className="absolute inset-x-2 top-12 h-px bg-zinc-200/80" />
    </>
  );
}
