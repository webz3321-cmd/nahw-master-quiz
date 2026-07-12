// Quiz data store — persisted in localStorage.
// 4 modes, each with up to 3 optional rounds:
//   Round 1 → MCQ
//   Round 2 → Short answer (non-MCQ, reveal model answer)
//   Round 3 → Sentence writing (reveal model sentence)

export type Mode = "nahwi" | "fiqhi" | "grammar" | "maths";
export type RoundNum = 1 | 2 | 3;
export type QType = "mcq" | "short" | "sentence";

export type Question = {
  id: string;
  mode: Mode;
  round: RoundNum;
  prompt: string;
  arabic?: string;
  // MCQ fields (round 1)
  options?: string[];
  correctIndex?: number;
  // Open answer (round 2 & 3) — revealed when timer ends
  answer?: string;
  durationSec: number;
};

export type RoundConfig = { enabled: boolean; title: string };
export type ModeConfig = { rounds: Record<RoundNum, RoundConfig> };

export const MODE_LABEL: Record<Mode, string> = {
  nahwi: "Al-Nahwi · النحو",
  fiqhi: "Al-Fiqhi Shafi · الفقه الشافعي",
  grammar: "Grammar Quiz",
  maths: "Maths Talent",
};

export const MODE_SHORT: Record<Mode, string> = {
  nahwi: "النحو",
  fiqhi: "الفقه",
  grammar: "Grammar",
  maths: "Maths",
};

// Distinct visual theme per mode — used as inline CSS variables on the runner + cards.
export type Theme = {
  bg: string;
  panel: string;
  border: string;
  primary: string;
  primaryContrast: string;
  accent: string;
  gradient: string;
  glow: string;
  dot: string;
};

export const MODE_THEME: Record<Mode, Theme> = {
  // deep emerald + warm gold
  nahwi: {
    bg: "oklch(0.16 0.03 165)",
    panel: "oklch(0.22 0.04 165 / 0.7)",
    border: "oklch(0.35 0.04 165)",
    primary: "oklch(0.82 0.15 85)",
    primaryContrast: "oklch(0.18 0.03 165)",
    accent: "oklch(0.55 0.14 165)",
    gradient: "linear-gradient(135deg, oklch(0.88 0.15 90), oklch(0.72 0.16 60))",
    glow: "0 20px 60px -20px oklch(0.82 0.15 85 / 0.45)",
    dot: "oklch(0.82 0.15 85)",
  },
  // royal indigo + rose gold
  fiqhi: {
    bg: "oklch(0.17 0.05 285)",
    panel: "oklch(0.24 0.06 285 / 0.7)",
    border: "oklch(0.36 0.06 285)",
    primary: "oklch(0.80 0.14 25)",
    primaryContrast: "oklch(0.18 0.05 285)",
    accent: "oklch(0.55 0.15 300)",
    gradient: "linear-gradient(135deg, oklch(0.82 0.14 20), oklch(0.65 0.18 340))",
    glow: "0 20px 60px -20px oklch(0.80 0.14 25 / 0.45)",
    dot: "oklch(0.80 0.14 25)",
  },
  // teal / cyan academic
  grammar: {
    bg: "oklch(0.17 0.04 220)",
    panel: "oklch(0.24 0.05 220 / 0.7)",
    border: "oklch(0.36 0.05 220)",
    primary: "oklch(0.78 0.14 200)",
    primaryContrast: "oklch(0.15 0.04 220)",
    accent: "oklch(0.55 0.13 200)",
    gradient: "linear-gradient(135deg, oklch(0.82 0.13 195), oklch(0.68 0.16 230))",
    glow: "0 20px 60px -20px oklch(0.78 0.14 200 / 0.45)",
    dot: "oklch(0.78 0.14 200)",
  },
  // charcoal + electric lime for maths
  maths: {
    bg: "oklch(0.15 0.01 260)",
    panel: "oklch(0.22 0.02 260 / 0.7)",
    border: "oklch(0.35 0.02 260)",
    primary: "oklch(0.85 0.18 130)",
    primaryContrast: "oklch(0.15 0.02 260)",
    accent: "oklch(0.60 0.15 140)",
    gradient: "linear-gradient(135deg, oklch(0.88 0.18 130), oklch(0.72 0.20 155))",
    glow: "0 20px 60px -20px oklch(0.85 0.18 130 / 0.45)",
    dot: "oklch(0.85 0.18 130)",
  },
};

const Q_KEY = "alnahw.quiz.v2";
const MODE_KEY = "alnahw.mode.v2";
const CFG_KEY = "alnahw.cfg.v2";
export const ADMIN_PASSCODE = "alnahw2026";

export const DEFAULT_ROUND_TITLES: Record<RoundNum, string> = {
  1: "Round 1 · Multiple Choice",
  2: "Round 2 · Short Answer",
  3: "Round 3 · Sentence Writing",
};

export const ROUND_TYPE: Record<RoundNum, QType> = {
  1: "mcq",
  2: "short",
  3: "sentence",
};

function defaultConfig(): Record<Mode, ModeConfig> {
  const mk = (): ModeConfig => ({
    rounds: {
      1: { enabled: true, title: DEFAULT_ROUND_TITLES[1] },
      2: { enabled: true, title: DEFAULT_ROUND_TITLES[2] },
      3: { enabled: false, title: DEFAULT_ROUND_TITLES[3] },
    },
  });
  return { nahwi: mk(), fiqhi: mk(), grammar: mk(), maths: mk() };
}

function seed(): Question[] {
  return [
    // Al-Nahwi — R1
    { id: "n1", mode: "nahwi", round: 1, prompt: "What does 'النحو' (al-Nahw) mean?", arabic: "النحو",
      options: ["Morphology", "Grammar / Syntax", "Rhetoric", "Phonetics"], correctIndex: 1, durationSec: 30 },
    { id: "n2", mode: "nahwi", round: 1, prompt: "The subject of a verbal sentence is called:",
      options: ["المبتدأ", "الفاعل", "المفعول به", "الخبر"], correctIndex: 1, durationSec: 30 },
    { id: "n3", mode: "nahwi", round: 2, prompt: "Define الفاعل in your own words.",
      answer: "The doer of the action in a verbal sentence — always مرفوع.", durationSec: 45 },

    // Al-Fiqhi — R1
    { id: "f1", mode: "fiqhi", round: 1, prompt: "How many فرض acts are in wudu (Shafi'i)?",
      options: ["Four", "Five", "Six", "Seven"], correctIndex: 2, durationSec: 30 },
    { id: "f2", mode: "fiqhi", round: 1, prompt: "The founder of the Shafi'i madhhab is:",
      options: ["Imam Malik", "Imam Abu Hanifa", "Imam al-Shafi'i", "Imam Ahmad"], correctIndex: 2, durationSec: 30 },
    { id: "f3", mode: "fiqhi", round: 2, prompt: "State the ruling on reciting al-Fatiha in every rak'ah.",
      answer: "It is a rukn (pillar) — the salah is invalid without it in each rak'ah.", durationSec: 45 },

    // Grammar Quiz — R1
    { id: "g1", mode: "grammar", round: 1, prompt: "Which is a proper noun?",
      options: ["city", "London", "book", "river"], correctIndex: 1, durationSec: 25 },
    { id: "g2", mode: "grammar", round: 1, prompt: "Choose the correct verb: 'She ___ to school every day.'",
      options: ["go", "goes", "going", "gone"], correctIndex: 1, durationSec: 25 },
    { id: "g3", mode: "grammar", round: 3, prompt: "Write a sentence using the past perfect tense.",
      answer: "e.g. 'By the time we arrived, the movie had already started.'", durationSec: 60 },

    // Maths Talent — R1
    { id: "m1", mode: "maths", round: 1, prompt: "What is 12 × 12?",
      options: ["124", "144", "142", "148"], correctIndex: 1, durationSec: 20 },
    { id: "m2", mode: "maths", round: 1, prompt: "Which is a prime number?",
      options: ["9", "15", "17", "21"], correctIndex: 2, durationSec: 20 },
    { id: "m3", mode: "maths", round: 2, prompt: "Solve for x:  2x + 6 = 20",
      answer: "x = 7", durationSec: 45 },
  ];
}

export function loadQuestions(): Question[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(Q_KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(Q_KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as Question[];
  } catch {
    return seed();
  }
}

export function saveQuestions(qs: Question[]) {
  localStorage.setItem(Q_KEY, JSON.stringify(qs));
}

export function loadMode(): Mode {
  if (typeof window === "undefined") return "nahwi";
  const v = localStorage.getItem(MODE_KEY) as Mode | null;
  return v && ["nahwi", "fiqhi", "grammar", "maths"].includes(v) ? v : "nahwi";
}

export function saveMode(m: Mode) {
  localStorage.setItem(MODE_KEY, m);
}

export function loadConfig(): Record<Mode, ModeConfig> {
  if (typeof window === "undefined") return defaultConfig();
  try {
    const raw = localStorage.getItem(CFG_KEY);
    if (!raw) {
      const c = defaultConfig();
      localStorage.setItem(CFG_KEY, JSON.stringify(c));
      return c;
    }
    // shallow-merge with defaults so newly added modes still work
    const parsed = JSON.parse(raw) as Partial<Record<Mode, ModeConfig>>;
    const base = defaultConfig();
    (Object.keys(base) as Mode[]).forEach((m) => {
      if (parsed[m]) base[m] = parsed[m]!;
    });
    return base;
  } catch {
    return defaultConfig();
  }
}

export function saveConfig(c: Record<Mode, ModeConfig>) {
  localStorage.setItem(CFG_KEY, JSON.stringify(c));
}

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

// Web Audio beep — no asset needed.
export function playBeep() {
  try {
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    const ctx = new AC();
    const now = ctx.currentTime;
    const beep = (t: number, freq: number, dur = 0.18) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, now + t);
      g.gain.exponentialRampToValueAtTime(0.35, now + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(now + t);
      o.stop(now + t + dur + 0.05);
    };
    beep(0, 880);
    beep(0.22, 660);
    beep(0.44, 990, 0.32);
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch {}
}