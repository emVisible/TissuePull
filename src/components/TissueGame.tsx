"use client";

import CatMascot, { CatPawOverlay } from "@/components/CatMascot";
import GameArena from "@/components/GameArena";
import PullEffectLayer from "@/components/PullEffectLayer";
import TissuePile from "@/components/TissuePile";
import ToastStack, { capToasts } from "@/components/ToastStack";
import {
  catPrankChance,
  catPrankIntervalMs,
  moodForTier,
  pickCatPrank,
  type ActiveCatPrank,
} from "@/lib/catMascot";
import {
  createObstacle,
  getDifficulty,
  isPerfectHit,
  OBSTACLE_META,
  tissueOffsetAt,
  type Obstacle,
  type ObstacleType,
} from "@/lib/challenge";
import {
  PULL_EFFECTS,
  spawnPullParticles,
  type EffectParticle,
  type PullEffectId,
} from "@/lib/pullEffects";
import {
  playBoxRestockSound,
  playPenaltySound,
  playPerfectSound,
  playPullSound,
  setSoundMuted,
} from "@/lib/tissueSounds";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SkillBar from "@/components/SkillBar";
import { getCatGuideTips } from "@/lib/catGuide";
import { getSkill, type SkillId } from "@/lib/skills";

const BOX_CAPACITY = 100;
const COMBO_WINDOW_MS = 1400;
const STORAGE_KEY = "tissue-game-v3";
const MAX_PARTICLES = 100;
const JAM_MS = 550;

type TissueStyle = {
  id: string;
  name: string;
  description: string;
  unlockCost: number;
  tissue: string;
  box: string;
  accent: string;
  pattern?: "lines" | "dots" | "none";
};

const MAX_PILE_STORE = 500;
const PILE_SEED_CAP = 100;

type SaveData = {
  softCoins: number;
  unlockedStyles: string[];
  selectedStyle: string;
  selectedEffect: PullEffectId;
  soundMuted: boolean;
  relaxMode: boolean;
  totalPulled: number;
  boxesCleared: number;
  perfectPulls: number;
  bestCombo: number;
  maxPerfectStreak: number;
  catPranksEndured: number;
  achievements: string[];
};

const TISSUE_STYLES: TissueStyle[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Crisp white sheets",
    unlockCost: 0,
    tissue: "from-white to-zinc-100",
    box: "from-amber-600 to-amber-800",
    accent: "text-amber-100/90",
    pattern: "lines",
  },
  {
    id: "bamboo",
    name: "Bamboo",
    description: "Eco-friendly green tint",
    unlockCost: 15,
    tissue: "from-emerald-50 to-green-100",
    box: "from-emerald-700 to-emerald-900",
    accent: "text-emerald-100/90",
    pattern: "lines",
  },
  {
    id: "lavender",
    name: "Lavender",
    description: "Calm purple folds",
    unlockCost: 40,
    tissue: "from-violet-50 to-purple-100",
    box: "from-violet-600 to-violet-900",
    accent: "text-violet-100/90",
    pattern: "dots",
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm peach glow",
    unlockCost: 80,
    tissue: "from-orange-50 to-rose-100",
    box: "from-orange-500 to-rose-700",
    accent: "text-orange-50/90",
    pattern: "lines",
  },
  {
    id: "party",
    name: "Party",
    description: "Confetti every pull",
    unlockCost: 150,
    tissue: "from-fuchsia-50 via-yellow-50 to-cyan-50",
    box: "from-fuchsia-600 to-indigo-800",
    accent: "text-fuchsia-100/90",
    pattern: "dots",
  },
];

const ACHIEVEMENTS: Record<
  string,
  { title: string; body: string; check: (ctx: AchievementCtx) => boolean }
> = {
  first_pull: {
    title: "First Tear",
    body: "You pulled your very first sheet.",
    check: (c) => c.totalPulled >= 1,
  },
  combo_5: {
    title: "Quick Hands",
    body: "Hit a 5× pull combo.",
    check: (c) => c.maxCombo >= 5,
  },
  combo_10: {
    title: "Paper Typhoon",
    body: "Hit a 10× pull combo.",
    check: (c) => c.maxCombo >= 10,
  },
  box_clear: {
    title: "Box Empty",
    body: "Emptied a full tissue box.",
    check: (c) => c.boxesCleared >= 1,
  },
  pulls_50: {
    title: "Half Century",
    body: "Pulled 50 sheets total.",
    check: (c) => c.totalPulled >= 50,
  },
  collector: {
    title: "Style Collector",
    body: "Unlocked 3 tissue styles.",
    check: (c) => c.unlockedCount >= 3,
  },
  perfect_10: {
    title: "Steady Hand",
    body: "Land 10 perfect pulls.",
    check: (c) => c.perfectPulls >= 10,
  },
  focus_8: {
    title: "Laser Focus",
    body: "Hit an 8-pull perfect streak.",
    check: (c) => c.maxPerfectStreak >= 8,
  },
  mayhem: {
    title: "Mayhem Survivor",
    body: "Play at the highest difficulty tier.",
    check: (c) => c.difficultyTier >= 4,
  },
  mochi_friend: {
    title: "Mochi's Buddy",
    body: "Survive 15 of Mochi's pranks.",
    check: (c) => c.catPranksEndured >= 15,
  },
};

type AchievementCtx = {
  totalPulled: number;
  maxCombo: number;
  boxesCleared: number;
  unlockedCount: number;
  perfectPulls: number;
  maxPerfectStreak: number;
  difficultyTier: number;
  catPranksEndured: number;
};

function loadSave(): SaveData {
  if (typeof window === "undefined") {
    return defaultSave();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      ...defaultSave(),
      ...parsed,
      unlockedStyles: parsed.unlockedStyles?.length
        ? parsed.unlockedStyles
        : ["classic"],
      selectedEffect:
        (parsed as SaveData).selectedEffect ?? defaultSave().selectedEffect,
      soundMuted: (parsed as SaveData).soundMuted ?? defaultSave().soundMuted,
      relaxMode: (parsed as SaveData).relaxMode ?? defaultSave().relaxMode,
      perfectPulls:
        (parsed as SaveData).perfectPulls ?? defaultSave().perfectPulls,
      bestCombo: (parsed as SaveData).bestCombo ?? defaultSave().bestCombo,
      maxPerfectStreak:
        (parsed as SaveData).maxPerfectStreak ?? defaultSave().maxPerfectStreak,
      catPranksEndured:
        (parsed as SaveData).catPranksEndured ?? defaultSave().catPranksEndured,
    };
  } catch {
    return defaultSave();
  }
}

function defaultSave(): SaveData {
  return {
    softCoins: 0,
    unlockedStyles: ["classic"],
    selectedStyle: "classic",
    selectedEffect: "float",
    soundMuted: false,
    relaxMode: false,
    totalPulled: 0,
    boxesCleared: 0,
    perfectPulls: 0,
    bestCombo: 0,
    maxPerfectStreak: 0,
    catPranksEndured: 0,
    achievements: [],
  };
}

function coinsForPull(combo: number): number {
  const base = 1;
  const bonus = combo >= 3 ? Math.floor(combo / 3) : 0;
  return base + bonus;
}

function comboLabel(combo: number): string {
  if (combo < 3) return "";
  if (combo < 6) return "Nice!";
  if (combo < 10) return "On fire!";
  return "Unstoppable!";
}

export default function TissueGame() {
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [remaining, setRemaining] = useState(BOX_CAPACITY);
  const [pileStyles, setPileStyles] = useState<string[]>(() => {
    const saved = loadSave();
    const n = Math.min(saved.totalPulled, PILE_SEED_CAP);
    return Array.from({ length: n }, () => saved.selectedStyle);
  });
  const [particles, setParticles] = useState<EffectParticle[]>([]);
  const [pullFlash, setPullFlash] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showShop, setShowShop] = useState(false);
  const [toasts, setToasts] = useState<
    { id: number; title: string; body?: string }[]
  >([]);
  const [sparkles, setSparkles] = useState<
    { id: number; x: number; y: number; color: string }[]
  >([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [tissueOffset, setTissueOffset] = useState(0);
  const [jammed, setJammed] = useState(false);
  const [gustShake, setGustShake] = useState(false);
  const [perfectStreak, setPerfectStreak] = useState(0);
  const [catPrank, setCatPrank] = useState<ActiveCatPrank | null>(null);
  const [catNudge, setCatNudge] = useState(0);
  const [catBonkActive, setCatBonkActive] = useState(false);
  const [steadyUntil, setSteadyUntil] = useState(0);
  const [treatUntil, setTreatUntil] = useState(0);
  const [skillCooldownEnds, setSkillCooldownEnds] = useState<
    Record<SkillId, number>
  >({ steady: 0, treat: 0, sweep: 0 });
  const [skillUiTick, setSkillUiTick] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [clock, setClock] = useState(0);

  const lastPullRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const perfectStreakRef = useRef(0);
  const remainingRef = useRef(BOX_CAPACITY);
  const saveRef = useRef(save);
  const gustUntilRef = useRef(0);
  const jamUntilRef = useRef(0);
  const toastIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const pullBlockedUntilRef = useRef(0);
  const catPrankBusyRef = useRef(false);

  const difficulty = getDifficulty(save.totalPulled);
  const isEmpty = remaining <= 0;
  const activeStyle =
    TISSUE_STYLES.find((s) => s.id === save.selectedStyle) ?? TISSUE_STYLES[0];

  const catMood = moodForTier(difficulty.tier, catPrank?.def.id ?? null);

  const steadyActive = clock > 0 && steadyUntil > clock;
  const treatActive = clock > 0 && treatUntil > clock;

  useEffect(() => {
    const tick = () => setClock(Date.now());
    tick();
    const t = setInterval(tick, 400);
    return () => clearInterval(t);
  }, []);

  const guideTips = useMemo(
    () =>
      getCatGuideTips({
        totalPulled: save.totalPulled,
        isEmpty,
        relaxMode: save.relaxMode,
        combo,
        remaining,
        obstacleCount: obstacles.length,
        difficultyTier: difficulty.tier,
        perfectStreak,
        jammed,
        catPrankActive: !!catPrank,
        steadyActive,
        mochiPacified: treatActive,
        skillReady: {
          steady:
            skillCooldownEnds.steady <= clock &&
            save.softCoins >= getSkill("steady").coinCost,
          treat:
            skillCooldownEnds.treat <= clock &&
            save.softCoins >= getSkill("treat").coinCost,
          sweep:
            skillCooldownEnds.sweep <= clock &&
            save.softCoins >= getSkill("sweep").coinCost,
        },
      }),
    [
      save.totalPulled,
      save.relaxMode,
      save.softCoins,
      isEmpty,
      combo,
      remaining,
      obstacles.length,
      difficulty.tier,
      perfectStreak,
      jammed,
      catPrank,
      steadyActive,
      treatActive,
      skillCooldownEnds,
      clock,
    ],
  );

  useEffect(() => {
    if (guideTips.length <= 1) return;
    const t = setInterval(() => {
      setTipIndex((i) => (i + 1) % guideTips.length);
    }, 7000);
    return () => clearInterval(t);
  }, [guideTips]);

  const catSpeech = guideTips[tipIndex % guideTips.length] ?? guideTips[0];

  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  useEffect(() => {
    saveRef.current = save;
    setSoundMuted(save.soundMuted);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  }, [save]);

  const pushToast = useCallback((title: string, body?: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => capToasts([...prev, { id, title, body }]));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const tryUnlockAchievements = useCallback(
    (next: SaveData, comboNow: number) => {
      const ctx: AchievementCtx = {
        totalPulled: next.totalPulled,
        maxCombo: Math.max(maxComboRef.current, comboNow),
        boxesCleared: next.boxesCleared,
        unlockedCount: next.unlockedStyles.length,
        perfectPulls: next.perfectPulls,
        maxPerfectStreak: next.maxPerfectStreak,
        difficultyTier: getDifficulty(next.totalPulled).tier,
        catPranksEndured: next.catPranksEndured,
      };

      const newly = Object.entries(ACHIEVEMENTS).filter(
        ([id, def]) => !next.achievements.includes(id) && def.check(ctx),
      );

      if (newly.length === 0) return next;

      const ids = newly.map(([id]) => id);
      for (const [, def] of newly) {
        pushToast(def.title, def.body);
      }
      return {
        ...next,
        achievements: [...next.achievements, ...ids],
      };
    },
    [pushToast],
  );

  const breakCombo = useCallback(() => {
    comboRef.current = 0;
    lastPullRef.current = 0;
    perfectStreakRef.current = 0;
    setCombo(0);
    setPerfectStreak(0);
  }, []);

  const restock = useCallback(() => {
    remainingRef.current = BOX_CAPACITY;
    setRemaining(BOX_CAPACITY);
    setObstacles([]);
    setPullFlash((n) => n + 1);
    void playBoxRestockSound();
    pushToast("Fresh box!", "100 new sheets ready to pull.");
  }, [pushToast]);

  useEffect(() => {
    if (save.relaxMode || isEmpty) return;
    let raf = 0;
    const loop = (t: number) => {
      const diff = getDifficulty(saveRef.current.totalPulled);
      const frozen = Date.now() < steadyUntil;
      setTissueOffset(
        frozen ? 0 : tissueOffsetAt(t, diff, gustUntilRef.current),
      );
      setObstacles((prev) => prev.filter((o) => o.expiresAt > Date.now()));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [save.relaxMode, isEmpty, steadyUntil]);

  useEffect(() => {
    if (save.relaxMode || isEmpty) return;
    const diff = getDifficulty(save.totalPulled);
    const timer = setInterval(() => {
      if (Math.random() > diff.spawnChance) return;
      const now = Date.now();
      setObstacles((prev) => {
        const alive = prev.filter((o) => o.expiresAt > now);
        if (alive.length >= 2 + diff.tier) return alive;
        return [...alive, createObstacle(diff, now)];
      });
      if (Math.random() < 0.12 + diff.tier * 0.06) {
        gustUntilRef.current = now + 900;
        setGustShake(true);
        setTimeout(() => setGustShake(false), 360);
      }
    }, diff.spawnIntervalMs);
    return () => clearInterval(timer);
  }, [save.relaxMode, save.totalPulled, isEmpty]);

  const triggerCatPrank = useCallback(
    (tier: number) => {
      const def = pickCatPrank(tier);
      if (!def || catPrankBusyRef.current) return;

      const now = Date.now();
      const instance: ActiveCatPrank = {
        instanceId: now,
        def,
        endsAt: now + def.durationMs,
      };

      catPrankBusyRef.current = true;
      setCatPrank(instance);

      if (def.blocksPull) {
        pullBlockedUntilRef.current = now + def.durationMs;
      }
      if (def.tissueNudge) {
        setCatNudge((Math.random() > 0.5 ? 1 : -1) * def.tissueNudge);
      }
      if (def.boxBonk) {
        gustUntilRef.current = now + 600;
        setCatBonkActive(true);
        setGustShake(true);
        setTimeout(() => {
          setCatBonkActive(false);
          setGustShake(false);
        }, 420);
      }

      pushToast("Mochi!", def.toast);
      setSave((prev) => ({
        ...prev,
        catPranksEndured: prev.catPranksEndured + 1,
      }));

      setTimeout(() => {
        setCatPrank((current) =>
          current?.instanceId === instance.instanceId ? null : current,
        );
        setCatNudge(0);
        catPrankBusyRef.current = false;
      }, def.durationMs);
    },
    [pushToast],
  );

  useEffect(() => {
    if (save.relaxMode || isEmpty) return;
    const tier = getDifficulty(save.totalPulled).tier;
    if (tier < 1) return;

    const timer = setInterval(() => {
      if (Date.now() < treatUntil) return;
      if (catPrankBusyRef.current) return;
      if (Math.random() > catPrankChance(tier)) return;
      triggerCatPrank(tier);
    }, catPrankIntervalMs(tier));

    return () => clearInterval(timer);
  }, [save.relaxMode, save.totalPulled, isEmpty, treatUntil, triggerCatPrank]);

  const useSkill = useCallback(
    (id: SkillId) => {
      const skill = getSkill(id);
      const t = Date.now();
      if (skillCooldownEnds[id] > t) return;
      if (saveRef.current.softCoins < skill.coinCost) {
        pushToast(
          "Not enough coins",
          `Need ${skill.coinCost} coins for ${skill.name}.`,
        );
        return;
      }
      if (isEmpty && id === "sweep") {
        pushToast("No hazards", "Restock a box first.");
        return;
      }

      setSave((prev) => ({
        ...prev,
        softCoins: prev.softCoins - skill.coinCost,
      }));
      setSkillCooldownEnds((prev) => ({
        ...prev,
        [id]: t + skill.cooldownMs,
      }));
      setSkillUiTick(t);

      if (id === "steady" && skill.durationMs) {
        setSteadyUntil(t + skill.durationMs);
        pushToast("Steady Sheet", "Sheet drift paused for 6 seconds!");
      } else if (id === "treat" && skill.durationMs) {
        setTreatUntil(t + skill.durationMs);
        setCatPrank(null);
        setCatNudge(0);
        catPrankBusyRef.current = false;
        pullBlockedUntilRef.current = 0;
        pushToast("Cat Treat", "Mochi is eating — no pranks for 10s!");
      } else if (id === "sweep") {
        setObstacles([]);
        pushToast("Hazard Sweep", "All red hazards cleared!");
      }
    },
    [skillCooldownEnds, isEmpty, pushToast],
  );

  const spawnSparkles = useCallback((count: number) => {
    const colors = ["#fbbf24", "#f472b6", "#34d399", "#60a5fa", "#c084fc"];
    const batch = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 160,
      y: (Math.random() - 0.5) * 80,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setSparkles((prev) => [...prev, ...batch]);
    setTimeout(() => {
      setSparkles((prev) =>
        prev.filter((s) => !batch.some((b) => b.id === s.id)),
      );
    }, 600);
  }, []);

  const executePull = useCallback(
    (perfect: boolean) => {
      const now = Date.now();
      const inCombo = now - lastPullRef.current < COMBO_WINDOW_MS;
      const nextCombo = inCombo ? comboRef.current + 1 : 1;
      lastPullRef.current = now;
      comboRef.current = nextCombo;
      maxComboRef.current = Math.max(maxComboRef.current, nextCombo);

      if (perfect) {
        perfectStreakRef.current += 1;
        setPerfectStreak(perfectStreakRef.current);
        void playPerfectSound();
      } else {
        perfectStreakRef.current = 0;
        setPerfectStreak(0);
      }

      setCombo(nextCombo);
      setPullFlash((n) => n + 1);

      const pulledStyle = saveRef.current.selectedStyle;
      setPileStyles((prev) => [...prev, pulledStyle].slice(-MAX_PILE_STORE));

      const willEmpty = remainingRef.current === 1;
      remainingRef.current -= 1;
      setRemaining(remainingRef.current);

      const coinMult = perfect ? 2 : 1;
      const earned = coinsForPull(nextCombo) * coinMult;

      setSave((prev) => {
        const next: SaveData = {
          ...prev,
          softCoins: prev.softCoins + earned,
          totalPulled: prev.totalPulled + 1,
          boxesCleared: willEmpty ? prev.boxesCleared + 1 : prev.boxesCleared,
          perfectPulls: perfect ? prev.perfectPulls + 1 : prev.perfectPulls,
          bestCombo: Math.max(prev.bestCombo, nextCombo),
          maxPerfectStreak: Math.max(
            prev.maxPerfectStreak,
            perfectStreakRef.current,
          ),
        };
        return tryUnlockAchievements(next, nextCombo);
      });

      if (perfect) {
        pushToast("Perfect!", "2× coins — sheet centered.");
      }

      if (nextCombo >= 5) spawnSparkles(Math.min(nextCombo, 12));

      const { selectedStyle: styleId, selectedEffect: effectId } =
        saveRef.current;
      if (styleId === "party") spawnSparkles(4);

      const baseId = ++particleIdRef.current * 1000;
      const { particles: batch, durationMs } = spawnPullParticles(
        effectId,
        styleId,
        baseId,
      );

      setParticles((prev) => {
        const merged = [...prev, ...batch];
        return merged.length > MAX_PARTICLES
          ? merged.slice(-MAX_PARTICLES)
          : merged;
      });
      void playPullSound(effectId, nextCombo);

      const batchIds = new Set(batch.map((p) => p.id));
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !batchIds.has(p.id)));
      }, durationMs + 80);
    },
    [pushToast, tryUnlockAchievements, spawnSparkles],
  );

  const onTissuePull = useCallback(() => {
    if (remainingRef.current <= 0) {
      restock();
      return;
    }
    if (jamUntilRef.current > Date.now()) {
      void playPenaltySound();
      pushToast("Jammed!", "Wait a beat after hitting a hazard.");
      return;
    }
    if (pullBlockedUntilRef.current > Date.now()) {
      void playPenaltySound();
      pushToast("Mochi!", "She's sitting on the sheet — wait a moment.");
      return;
    }

    const diff = getDifficulty(saveRef.current.totalPulled);
    const offset = saveRef.current.relaxMode ? 0 : tissueOffset;
    const perfect = saveRef.current.relaxMode || isPerfectHit(offset, diff);
    executePull(perfect);
  }, [restock, pushToast, executePull, tissueOffset]);

  const onBoxMiss = useCallback(() => {
    breakCombo();
    void playPenaltySound();
    pushToast("Miss!", "Only the sticking sheet counts.");
  }, [breakCombo, pushToast]);

  const onObstacleHit = useCallback(
    (id: number, type: ObstacleType) => {
      const meta = OBSTACLE_META[type];
      breakCombo();
      jamUntilRef.current = Date.now() + JAM_MS;
      setJammed(true);
      setTimeout(() => setJammed(false), JAM_MS);
      setObstacles((prev) => prev.filter((o) => o.id !== id));
      void playPenaltySound();
      setSave((prev) => ({
        ...prev,
        softCoins: Math.max(0, prev.softCoins - meta.penalty),
      }));
      pushToast(meta.label, `−${meta.penalty} coins · Combo broken`);
    },
    [breakCombo, pushToast],
  );

  useEffect(() => {
    if (combo <= 0) return;
    const t = setTimeout(() => {
      comboRef.current = 0;
      setCombo(0);
    }, COMBO_WINDOW_MS);
    return () => clearTimeout(t);
  }, [combo]);

  const unlockStyle = (style: TissueStyle) => {
    if (save.unlockedStyles.includes(style.id)) {
      setSave((s) => ({ ...s, selectedStyle: style.id }));
      return;
    }
    if (save.softCoins < style.unlockCost) {
      pushToast("Not enough Soft Coins", `Need ${style.unlockCost} coins.`);
      return;
    }
    const next: SaveData = {
      ...save,
      softCoins: save.softCoins - style.unlockCost,
      unlockedStyles: [...save.unlockedStyles, style.id],
      selectedStyle: style.id,
    };
    setSave(tryUnlockAchievements(next, comboRef.current));
    pushToast(`${style.name} unlocked!`, style.description);
  };

  const selectStyle = (styleId: string) => {
    if (!save.unlockedStyles.includes(styleId)) return;
    setSave((s) => ({ ...s, selectedStyle: styleId }));
  };

  const selectEffect = (effectId: PullEffectId) => {
    setSave((s) => ({ ...s, selectedEffect: effectId }));
    void playPullSound(effectId, 1);
  };

  const toggleSound = () => {
    setSave((s) => ({ ...s, soundMuted: !s.soundMuted }));
  };

  const toggleRelaxMode = () => {
    setSave((s) => {
      const relaxMode = !s.relaxMode;
      if (relaxMode) setObstacles([]);
      return { ...s, relaxMode };
    });
    pushToast(
      save.relaxMode ? "Challenge on" : "Relax mode",
      save.relaxMode
        ? "Drifting sheet & hazards are back."
        : "No drift or hazards — chill pulling.",
    );
  };

  const boxProgress =
    ((BOX_CAPACITY - (isEmpty ? 0 : remaining)) / BOX_CAPACITY) * 100;

  const displayOffset =
    (save.relaxMode || isEmpty || steadyActive ? 0 : tissueOffset) + catNudge;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-sky-100 via-amber-50 to-orange-100 px-4 select-none">
      <header className="absolute top-6 z-30 text-center sm:top-8">
        <h1 className="text-3xl font-bold tracking-tight text-amber-900">
          Tissue Pull
        </h1>
        <p className="mt-1 text-sm text-amber-700/80">
          Mochi guides you · Skills help you survive
        </p>
      </header>

      <div className="absolute flex justify-center left-2 right-2 top-[4.75rem] z-30 ml-96 sm:left-3 sm:right-14 sm:top-24">
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap justify-end gap-2 pt-1 sm:justify-center sm:pt-0">
            <Stat label="Pulled" value={save.totalPulled} />
            <Stat label="In box" value={isEmpty ? 0 : remaining} />
            <Stat
              label="Soft Coins"
              value={save.softCoins}
              highlight={save.softCoins > 0}
            />
            {combo >= 2 && (
              <Stat
                label="Combo"
                value={combo}
                suffix="×"
                highlight
                sub={comboLabel(combo)}
              />
            )}
            {!save.relaxMode && (
              <Stat
                label="Level"
                value={difficulty.tier + 1}
                sub={difficulty.label}
              />
            )}
            {perfectStreak >= 2 && (
              <Stat
                label="Perfect"
                value={perfectStreak}
                suffix="×"
                highlight
                sub="streak"
              />
            )}
          </div>
        </div>
        <CatMascot
          mood={catMood}
          activePrank={catPrank}
          speech={catSpeech}
          variant="compact"
        />
      </div>

      <div className="absolute right-4 top-6 z-40 flex gap-2 sm:top-8">
        <button
          type="button"
          onClick={toggleSound}
          aria-label={save.soundMuted ? "Unmute sounds" : "Mute sounds"}
          className="rounded-full bg-white/80 px-3 py-2 text-sm font-semibold text-amber-900 shadow-md backdrop-blur-sm transition hover:bg-white"
        >
          {save.soundMuted ? "🔇" : "🔊"}
        </button>
        <button
          type="button"
          onClick={() => setShowShop((v) => !v)}
          className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-amber-900 shadow-md backdrop-blur-sm transition hover:bg-white"
        >
          {showShop ? "Close" : "Shop"}
        </button>
      </div>

      {showShop && (
        <aside className="absolute right-4 top-20 z-40 w-72 max-h-[70vh] overflow-y-auto rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur-sm sm:top-24">
          <h2 className="text-lg font-bold text-amber-900">Tissue styles</h2>
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Relax mode
                </p>
                <p className="text-xs text-amber-700/80">
                  Disable drift & hazards for casual play.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleRelaxMode}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  save.relaxMode
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-amber-900 ring-1 ring-amber-300"
                }`}
              >
                {save.relaxMode ? "ON" : "OFF"}
              </button>
            </div>
          </div>
          <p className="mb-3 text-xs text-amber-700/70">
            Spend Soft Coins to unlock new looks. Perfect center pulls earn 2×
            coins.
          </p>
          <ul className="space-y-2">
            {TISSUE_STYLES.map((style) => {
              const owned = save.unlockedStyles.includes(style.id);
              const selected = save.selectedStyle === style.id;
              return (
                <li key={style.id}>
                  <button
                    type="button"
                    onClick={() =>
                      owned ? selectStyle(style.id) : unlockStyle(style)
                    }
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
                      selected
                        ? "border-amber-500 bg-amber-50"
                        : "border-transparent bg-zinc-50 hover:bg-zinc-100"
                    }`}
                  >
                    <span
                      className={`h-10 w-8 shrink-0 rounded-md bg-gradient-to-b ${style.tissue} shadow ring-1 ring-black/10`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-zinc-800">
                        {style.name}
                      </span>
                      <span className="block truncate text-xs text-zinc-500">
                        {style.description}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-amber-800">
                      {owned
                        ? selected
                          ? "Active"
                          : "Owned"
                        : `${style.unlockCost} 🪙`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 border-t border-zinc-200 pt-3">
            <h3 className="text-sm font-bold text-amber-900">Pull effects</h3>
            <p className="mb-2 text-xs text-amber-700/70">
              Each effect has its own motion and sound. Tap to preview.
            </p>
            <ul className="space-y-2">
              {PULL_EFFECTS.map((effect) => {
                const selected = save.selectedEffect === effect.id;
                return (
                  <li key={effect.id}>
                    <button
                      type="button"
                      onClick={() => selectEffect(effect.id)}
                      className={`flex w-full flex-col rounded-xl border-2 p-3 text-left transition ${
                        selected
                          ? "border-sky-500 bg-sky-50"
                          : "border-transparent bg-zinc-50 hover:bg-zinc-100"
                      }`}
                    >
                      <span className="font-semibold text-zinc-800">
                        {effect.name}
                        {selected && (
                          <span className="ml-2 text-xs font-normal text-sky-600">
                            Active
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {effect.description}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {save.achievements.length > 0 && (
            <div className="mt-4 border-t border-zinc-200 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Achievements ({save.achievements.length}/
                {Object.keys(ACHIEVEMENTS).length})
              </p>
              <ul className="mt-2 space-y-1 text-xs text-zinc-600">
                {save.achievements.map((id) => (
                  <li key={id}>✓ {ACHIEVEMENTS[id]?.title ?? id}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      )}

      <TissuePile
        styleIds={pileStyles}
        styles={TISSUE_STYLES}
        totalPulled={save.totalPulled}
      />

      {/* Sparkles */}
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-2 w-2 rounded-full sparkle-pop"
          style={{
            marginLeft: s.x,
            marginTop: s.y,
            backgroundColor: s.color,
          }}
        />
      ))}

      <PullEffectLayer particles={particles} styles={TISSUE_STYLES} />

      {/* Combo ring */}
      {combo >= 3 && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-amber-400/30 combo-ring"
          aria-hidden
        />
      )}

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative">
          <GameArena
            activeStyle={activeStyle}
            isEmpty={isEmpty}
            boxProgress={boxProgress}
            tissueOffset={displayOffset}
            pullFlash={pullFlash}
            obstacles={obstacles}
            jammed={jammed}
            relaxMode={save.relaxMode}
            difficultyTier={difficulty.tier}
            gustActive={gustShake}
            catBonkActive={catBonkActive}
            onTissuePull={onTissuePull}
            onBoxMiss={onBoxMiss}
            onObstacleHit={onObstacleHit}
            onRestock={restock}
          />
          <CatPawOverlay prankId={catPrank?.def.id ?? null} />
        </div>
        <SkillBar
          softCoins={save.softCoins}
          cooldownEnds={skillCooldownEnds}
          steadyActive={steadyActive}
          treatActive={treatActive}
          disabled={isEmpty}
          onUse={useSkill}
          tick={skillUiTick > clock ? skillUiTick : clock}
        />
      </div>

      <p className="absolute bottom-10 z-20 max-w-sm text-center text-sm text-amber-800/60">
        {isEmpty
          ? "Box empty — tap the sheet to restock"
          : save.relaxMode
            ? `${BOX_CAPACITY} sheets · Relax mode (no hazards)`
            : `Pull the sheet · Dodge hazards & Mochi's pranks`}
      </p>

      <ToastStack toasts={toasts} />
    </div>
  );
}

function Stat({
  label,
  value,
  suffix = "",
  highlight = false,
  sub,
}: {
  label: string;
  value: number;
  suffix?: string;
  highlight?: boolean;
  sub?: string;
}) {
  return (
    <div
      className={`min-w-[4.5rem] rounded-2xl px-4 py-2.5 shadow-sm backdrop-blur-sm sm:min-w-[5rem] sm:px-5 sm:py-3 ${
        highlight ? "bg-amber-100/90 ring-2 ring-amber-400/40" : "bg-white/70"
      }`}
    >
      <div className="text-xl font-bold tabular-nums text-amber-900 sm:text-2xl">
        {value}
        {suffix}
      </div>
      <div className="text-xs text-amber-700/70">{label}</div>
      {sub && (
        <div className="text-[10px] font-semibold uppercase text-amber-600">
          {sub}
        </div>
      )}
    </div>
  );
}
