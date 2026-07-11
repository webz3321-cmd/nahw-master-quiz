// Quiz data store — persisted in localStorage.
// Two modes: Al-Nahwi (Arabic grammar) and Al-Fiqhi Shafi (Islamic jurisprudence).

export type Mode = "nahwi" | "fiqhi";

export type Question = {
  id: string;
  mode: Mode;
  prompt: string;
  arabic?: string;
  options: string[]; // 4 options
  correctIndex: number; // 0-3
  durationSec: number; // per-question countdown
};

export const MODE_LABEL: Record<Mode, string> = {
  nahwi: "Al-Nahwi · النحو",
  fiqhi: "Al-Fiqhi Shafi · الفقه الشافعي",
};

const KEY = "alnahw.quiz.v1";
const MODE_KEY = "alnahw.mode.v1";
export const ADMIN_PASSCODE = "alnahw2026";

function seed(): Question[] {
  return [
    // ---------- Al-Nahwi ----------
    { id: "n1", mode: "nahwi", prompt: "What does 'النحو' (al-Nahw) mean?", arabic: "النحو",
      options: ["Morphology", "Grammar / Syntax", "Rhetoric", "Phonetics"], correctIndex: 1, durationSec: 30 },
    { id: "n2", mode: "nahwi", prompt: "The subject of a verbal sentence is called:",
      options: ["المبتدأ", "الفاعل", "المفعول به", "الخبر"], correctIndex: 1, durationSec: 30 },
    { id: "n3", mode: "nahwi", prompt: "The predicate of a nominal sentence is:",
      options: ["الفاعل", "المبتدأ", "الخبر", "الحال"], correctIndex: 2, durationSec: 30 },
    { id: "n4", mode: "nahwi", prompt: "Which of these is a حرف (particle)?",
      options: ["كتاب", "ذهب", "في", "طالب"], correctIndex: 2, durationSec: 30 },
    { id: "n5", mode: "nahwi", prompt: "'إنّ' and its sisters make the اسم:",
      options: ["مرفوع", "منصوب", "مجرور", "مجزوم"], correctIndex: 1, durationSec: 30 },

    // ---------- Al-Fiqhi Shafi ----------
    { id: "f1", mode: "fiqhi", prompt: "How many obligatory (فرض) acts are in wudu according to the Shafi'i madhhab?",
      options: ["Four", "Five", "Six", "Seven"], correctIndex: 2, durationSec: 30 },
    { id: "f2", mode: "fiqhi", prompt: "The minimum amount required to give in Zakat al-Fitr per person is approximately:",
      options: ["One sa'", "Half a sa'", "Two sa'", "One mudd"], correctIndex: 0, durationSec: 30 },
    { id: "f3", mode: "fiqhi", prompt: "In the Shafi'i school, reciting Surah al-Fatiha in every rak'ah is:",
      options: ["Sunnah", "Mustahabb", "Rukn (pillar)", "Makruh"], correctIndex: 2, durationSec: 30 },
    { id: "f4", mode: "fiqhi", prompt: "The founder of the Shafi'i madhhab is:",
      options: ["Imam Malik", "Imam Abu Hanifa", "Imam al-Shafi'i", "Imam Ahmad"], correctIndex: 2, durationSec: 30 },
    { id: "f5", mode: "fiqhi", prompt: "The nisab of gold for zakat is approximately:",
      options: ["20 mithqals (~85g)", "50 mithqals", "100 mithqals", "10 mithqals"], correctIndex: 0, durationSec: 30 },
  ];
}

export function loadQuestions(): Question[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as Question[];
  } catch {
    return seed();
  }
}

export function saveQuestions(qs: Question[]) {
  localStorage.setItem(KEY, JSON.stringify(qs));
}

export function loadMode(): Mode {
  if (typeof window === "undefined") return "nahwi";
  return (localStorage.getItem(MODE_KEY) as Mode) || "nahwi";
}

export function saveMode(m: Mode) {
  localStorage.setItem(MODE_KEY, m);
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