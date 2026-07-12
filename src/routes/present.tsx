import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  loadConfig,
  loadMode,
  loadQuestions,
  MODE_LABEL,
  MODE_SHORT,
  MODE_THEME,
  playBeep,
  type Mode,
  type Question,
  type RoundNum,
} from "@/lib/quiz-store";

export const Route = createFileRoute("/present")({
  component: Present,
});

const REVEAL_MS = 3500;
const INTRO_MS = 3500;

type Slide =
  | { kind: "intro"; round: RoundNum; title: string; count: number }
  | { kind: "q"; q: Question; round: RoundNum };

function Present() {
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("nahwi");
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [phase, setPhase] = useState<"intro" | "ask" | "reveal" | "done">("intro");
  const [paused, setPaused] = useState(false);

  const tickRef = useRef<number | null>(null);
  const advanceRef = useRef<number | null>(null);

  useEffect(() => {
    const m = loadMode();
    setMode(m);
    const cfg = loadConfig()[m];
    const all = loadQuestions().filter((q) => q.mode === m);

    const built: Slide[] = [];
    ([1, 2, 3] as RoundNum[]).forEach((r) => {
      if (!cfg.rounds[r].enabled) return;
      const qs = all.filter((q) => q.round === r);
      if (qs.length === 0) return;
      built.push({ kind: "intro", round: r, title: cfg.rounds[r].title, count: qs.length });
      qs.forEach((q) => built.push({ kind: "q", q, round: r }));
    });

    setSlides(built);
    if (built.length > 0) {
      setPhase(built[0].kind === "intro" ? "intro" : "ask");
      if (built[0].kind === "q") setRemaining(built[0].q.durationSec);
    }

    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    return () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  const total = slides?.length ?? 0;
  const current = slides && idx < total ? slides[idx] : null;

  const goNext = () => {
    if (idx + 1 >= total) {
      setPhase("done");
      return;
    }
    const next = slides![idx + 1];
    setIdx(idx + 1);
    if (next.kind === "intro") {
      setPhase("intro");
      setRemaining(0);
    } else {
      setPhase("ask");
      setRemaining(next.q.durationSec);
    }
  };

  // Countdown for question slides
  useEffect(() => {
    if (!current || current.kind !== "q" || phase !== "ask" || paused) return;
    tickRef.current = window.setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          if (tickRef.current) window.clearInterval(tickRef.current);
          setPhase("reveal");
          playBeep();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, [current, phase, paused, idx]);

  // Auto-advance after reveal
  useEffect(() => {
    if (phase !== "reveal") return;
    advanceRef.current = window.setTimeout(goNext, REVEAL_MS);
    return () => { if (advanceRef.current) window.clearTimeout(advanceRef.current); };
  }, [phase, idx, total]);

  // Auto-advance intro slide
  useEffect(() => {
    if (phase !== "intro" || !current || current.kind !== "intro" || paused) return;
    advanceRef.current = window.setTimeout(goNext, INTRO_MS);
    return () => { if (advanceRef.current) window.clearTimeout(advanceRef.current); };
  }, [phase, idx, current, paused]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") nav({ to: "/" });
      else if (e.key === " ") { e.preventDefault(); setPaused((p) => !p); }
      else if (e.key === "ArrowRight") {
        if (phase === "ask") {
          if (tickRef.current) window.clearInterval(tickRef.current);
          setPhase("reveal");
          setRemaining(0);
          playBeep();
        } else {
          if (advanceRef.current) window.clearTimeout(advanceRef.current);
          goNext();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, nav, idx, total]);

  const theme = MODE_THEME[mode];

  if (!slides) {
    return <div className="flex min-h-screen items-center justify-center" style={{ background: theme.bg, color: "oklch(0.97 0.02 90)" }}>Loading…</div>;
  }

  if (total === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
           style={{ background: theme.bg, color: "oklch(0.97 0.02 90)" }}>
        <div className="text-3xl font-bold">No questions for this mode</div>
        <p className="mt-3 opacity-70">Enable rounds and add questions in the admin panel.</p>
        <div className="mt-6 flex gap-3">
          <Link to="/" className="rounded-full border px-5 py-2 text-sm" style={{ borderColor: theme.border }}>Home</Link>
          <Link to="/admin" className="rounded-full px-5 py-2 text-sm font-semibold"
                style={{ background: theme.gradient, color: theme.primaryContrast }}>
            Open Admin
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
           style={{ background: theme.bg, color: "oklch(0.97 0.02 90)" }}>
        <div className="text-sm font-semibold tracking-widest" style={{ color: theme.primary }}>PRESENTATION COMPLETE</div>
        <div className="mt-3 text-6xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {slides.filter((s) => s.kind === "q").length} questions
        </div>
        <p className="mt-2 text-lg opacity-70">{MODE_LABEL[mode]}</p>
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => {
              setIdx(0);
              const s0 = slides[0];
              setPhase(s0.kind === "intro" ? "intro" : "ask");
              if (s0.kind === "q") setRemaining(s0.q.durationSec);
            }}
            className="rounded-full px-8 py-3 text-sm font-semibold"
            style={{ background: theme.gradient, color: theme.primaryContrast }}
          >
            Restart
          </button>
          <Link to="/" className="rounded-full border px-8 py-3 text-sm font-semibold" style={{ borderColor: theme.border }}>
            Exit
          </Link>
        </div>
      </div>
    );
  }

  if (current!.kind === "intro") {
    return <RoundIntro slide={current as Extract<Slide, { kind: "intro" }>} mode={mode} />;
  }
  return (
    <QuestionSlide
      slide={current as Extract<Slide, { kind: "q" }>}
      mode={mode}
      idx={idx}
      total={total}
      remaining={remaining}
      phase={phase as "ask" | "reveal"}
      paused={paused}
    />
  );
}

function RoundIntro({ slide, mode }: { slide: Extract<Slide, { kind: "intro" }>; mode: Mode }) {
  const theme = MODE_THEME[mode];
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden"
         style={{ background: theme.bg, color: "oklch(0.97 0.02 90)" }}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]"
           style={{ backgroundImage: `radial-gradient(circle at 30% 30%, ${theme.dot} 2px, transparent 2px)`, backgroundSize: "80px 80px" }} />
      <div key={slide.round} className="relative z-10 text-center animate-fade-in">
        <div className="text-sm font-semibold tracking-[0.4em]" style={{ color: theme.primary }}>
          {MODE_LABEL[mode]}
        </div>
        <div className="mt-8 text-[10rem] font-bold leading-none" style={{ color: theme.primary, fontFamily: "'Space Grotesk', sans-serif" }}>
          R{slide.round}
        </div>
        <h1 className="mt-4 text-5xl font-bold sm:text-6xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {slide.title}
        </h1>
        <p className="mt-6 text-lg opacity-70">{slide.count} question{slide.count === 1 ? "" : "s"}</p>
        <div className="mt-10 inline-block rounded-full px-6 py-2 text-xs font-semibold tracking-widest"
             style={{ background: theme.panel, color: theme.primary }}>
          STARTING SHORTLY…
        </div>
      </div>
    </div>
  );
}

function QuestionSlide({
  slide, mode, idx, total, remaining, phase, paused,
}: {
  slide: Extract<Slide, { kind: "q" }>;
  mode: Mode; idx: number; total: number;
  remaining: number; phase: "ask" | "reveal"; paused: boolean;
}) {
  const q = slide.q;
  const theme = MODE_THEME[mode];
  const pct = useMemo(() => (remaining / q.durationSec) * 100, [remaining, q.durationSec]);
  const low = remaining <= 5 && phase === "ask";
  const mm = Math.floor(remaining / 60);
  const ss = (remaining % 60).toString().padStart(2, "0");
  const isMcq = q.options && q.options.length > 0;

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden"
         style={{ background: theme.bg, color: "oklch(0.97 0.02 90)" }}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
           style={{ backgroundImage: `radial-gradient(circle at 20% 20%, ${theme.dot} 1px, transparent 1px)`, backgroundSize: "70px 70px" }} />

      <div className="relative z-10 flex items-center justify-between px-10 pt-8">
        <div className="flex items-center gap-3">
          <span className="rounded-full px-3 py-1 text-xs font-semibold tracking-widest"
                style={{ background: theme.primary, color: theme.primaryContrast }}>
            R{slide.round}
          </span>
          <span className="text-sm font-semibold tracking-widest" style={{ color: theme.primary }}>
            SLIDE {idx + 1} / {total}
          </span>
        </div>
        <div
          className="rounded-full px-6 py-2 font-mono text-2xl font-bold tabular-nums"
          style={{
            background: low ? "oklch(0.62 0.22 27 / 0.25)" : theme.panel,
            color: low ? "oklch(0.85 0.14 27)" : "oklch(0.97 0.02 90)",
          }}
        >
          {mm}:{ss}
        </div>
      </div>

      <div className="relative z-10 mx-10 mt-4 h-2 overflow-hidden rounded-full"
           style={{ background: "oklch(0 0 0 / 0.35)" }}>
        <div
          className="h-full transition-all duration-1000 ease-linear"
          style={{
            width: `${pct}%`,
            background: low ? "oklch(0.62 0.22 27)" : theme.gradient,
          }}
        />
      </div>

      <div key={idx} className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 py-10 animate-fade-in">
        {q.arabic && (
          <div className="mb-6 text-right text-5xl leading-tight sm:text-6xl"
               style={{ fontFamily: "Amiri, serif", direction: "rtl" }}>
            {q.arabic}
          </div>
        )}

        <h2 className="max-w-5xl text-center text-3xl font-semibold leading-snug sm:text-5xl">
          {q.prompt}
        </h2>

        {isMcq ? (
          <div className="mt-12 grid w-full max-w-4xl gap-4 sm:grid-cols-2">
            {q.options!.map((opt, i) => {
              const isCorrect = phase === "reveal" && i === q.correctIndex;
              return (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-500"
                  style={{
                    borderColor: isCorrect ? "oklch(0.75 0.18 150)" : theme.border,
                    background: isCorrect ? "oklch(0.75 0.18 150 / 0.18)" : theme.panel,
                    boxShadow: isCorrect ? "0 0 30px oklch(0.75 0.18 150 / 0.4)" : "none",
                    transform: isCorrect ? "scale(1.03)" : "scale(1)",
                  }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold"
                    style={{
                      background: isCorrect ? "oklch(0.75 0.18 150)" : "oklch(0 0 0 / 0.35)",
                      color: isCorrect ? "oklch(0.15 0.03 165)" : "oklch(0.97 0.02 90)",
                    }}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-lg sm:text-xl">{opt}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-12 w-full max-w-4xl">
            <div
              className="rounded-2xl border p-8 text-center text-xl leading-relaxed transition-all duration-500 sm:text-2xl"
              style={{
                borderColor: phase === "reveal" ? "oklch(0.75 0.18 150)" : theme.border,
                background: phase === "reveal" ? "oklch(0.75 0.18 150 / 0.15)" : theme.panel,
                minHeight: "180px",
                boxShadow: phase === "reveal" ? "0 0 30px oklch(0.75 0.18 150 / 0.4)" : "none",
              }}
            >
              {phase === "reveal" ? (
                <>
                  <div className="mb-3 text-xs font-semibold tracking-widest" style={{ color: theme.primary }}>
                    MODEL ANSWER
                  </div>
                  <div>{q.answer || "—"}</div>
                </>
              ) : (
                <div className="text-base opacity-60">
                  {slide.round === 3 ? "Write your sentence" : "Write your answer"} — model answer will reveal when time is up.
                </div>
              )}
            </div>
          </div>
        )}

        {phase === "reveal" && (
          <div className="mt-10 text-sm font-semibold tracking-widest" style={{ color: theme.primary }}>
            ✓ ANSWER REVEALED · NEXT SLIDE IN {Math.ceil(REVEAL_MS / 1000)}s
          </div>
        )}
      </div>

      <div className="relative z-10 flex items-center justify-between px-10 pb-6 text-xs opacity-70">
        <span>{MODE_LABEL[mode]} · {MODE_SHORT[mode]}</span>
        <span>{paused ? "⏸ PAUSED · " : ""}Space = pause · → = skip · Esc = exit</span>
      </div>
    </div>
  );
}