import type { PullEffectId } from "./pullEffects";

let audioCtx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function setSoundMuted(value: boolean) {
  muted = value;
}

export function isSoundMuted() {
  return muted;
}

async function ensureRunning(ctx: AudioContext) {
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
}

function noiseBurst(
  ctx: AudioContext,
  start: number,
  duration: number,
  gain: number,
  filterFreq: number,
  filterQ = 1,
) {
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const env = 1 - i / bufferSize;
    data[i] = (Math.random() * 2 - 1) * env;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  filter.Q.value = filterQ;

  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + duration);

  source.connect(filter);
  filter.connect(g);
  g.connect(ctx.destination);
  source.start(start);
  source.stop(start + duration + 0.05);
}

function tone(
  ctx: AudioContext,
  start: number,
  freq: number,
  duration: number,
  gain: number,
  type: OscillatorType = "sine",
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function playFloatSound(ctx: AudioContext, t: number, intensity: number) {
  const g = 0.12 * intensity;
  noiseBurst(ctx, t, 0.09, g, 2200, 0.8);
  tone(ctx, t, 180 + Math.random() * 40, 0.06, g * 0.35, "triangle");
}

function playBurstSound(ctx: AudioContext, t: number, intensity: number) {
  const g = 0.14 * intensity;
  noiseBurst(ctx, t, 0.05, g * 1.1, 1800, 1.2);
  tone(ctx, t, 320, 0.04, g * 0.5, "square");
  tone(ctx, t + 0.03, 480, 0.03, g * 0.35, "sine");
  for (let i = 0; i < 4; i++) {
    const offset = i * 0.022;
    noiseBurst(ctx, t + offset, 0.025, g * 0.45, 2600 + i * 200, 1.5);
  }
}

function playFlutterSound(ctx: AudioContext, t: number, intensity: number) {
  const g = 0.11 * intensity;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(900, t);
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.28);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1400, t);
  filter.frequency.exponentialRampToValueAtTime(400, t + 0.3);

  gain.gain.setValueAtTime(g * 0.08, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.35);

  noiseBurst(ctx, t, 0.22, g * 0.9, 800, 0.6);
  noiseBurst(ctx, t + 0.08, 0.14, g * 0.5, 1200, 1);
}

const SOUND_PLAYERS: Record<
  PullEffectId,
  (ctx: AudioContext, t: number, intensity: number) => void
> = {
  float: playFloatSound,
  burst: playBurstSound,
  flutter: playFlutterSound,
};

/** Play the pull SFX for the given effect. Intensity scales with combo (1–1.5). */
export async function playPullSound(
  effectId: PullEffectId,
  combo = 1,
) {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;

  try {
    await ensureRunning(ctx);
    const t = ctx.currentTime;
    const intensity = Math.min(1.5, 1 + (combo - 1) * 0.05);
    SOUND_PLAYERS[effectId](ctx, t, intensity);
  } catch {
    // Autoplay policies or missing audio — ignore
  }
}

/** Wrong click — box, hazard, or jam */
export async function playPenaltySound() {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  try {
    await ensureRunning(ctx);
    const t = ctx.currentTime;
    tone(ctx, t, 90, 0.15, 0.1, "sawtooth");
    noiseBurst(ctx, t + 0.02, 0.08, 0.08, 400, 0.8);
  } catch {
    // ignore
  }
}

/** Centered pull on drifting sheet */
export async function playPerfectSound() {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  try {
    await ensureRunning(ctx);
    const t = ctx.currentTime;
    tone(ctx, t, 520, 0.08, 0.07, "sine");
    tone(ctx, t + 0.05, 780, 0.1, 0.06, "triangle");
  } catch {
    // ignore
  }
}

/** Softer click when restocking an empty box */
export async function playBoxRestockSound() {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  try {
    await ensureRunning(ctx);
    const t = ctx.currentTime;
    tone(ctx, t, 140, 0.12, 0.08, "sine");
    tone(ctx, t + 0.06, 200, 0.1, 0.06, "triangle");
  } catch {
    // ignore
  }
}
