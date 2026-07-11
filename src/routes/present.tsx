import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  loadMode,
  loadQuestions,
  MODE_LABEL,
  playBeep,
  type Question,
} from "@/lib/quiz-store";

export const Route = createFileRoute("/present")({
  component: Present,
});

const REVEAL_MS = 3000; // how long the answer stays on screen before auto-advance

function Present() {
  const nav = useNavigate();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [phase, setPhase] = useState<"ask" | "reveal" | "done">("ask");
  const [paused, setPaused] = useState(false);

  const tickRef = useRef<number | null>(null);
  const advanceRef = useRef<number | null>(null);

  // Load questions for the selected mode on mount.
  useEffect(() => {
    const mode = loadMode();
    const all = loadQuestions().filter((q) => q.mode === mode);
    setQuestions(all);
    if (all.length > 0) setRemaining(all[0].durationSec);

    // Try enter fullscreen (best-effort).
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    return () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  const total = questions?.length ?? 0;
  const current = questions && idx < total ? questions[idx] : null;

  // Countdown loop.
  useEffect(() => {
    if (!current || phase !== "ask" || paused) return;
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
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [current, phase, paused, idx]);

  // Auto-advance after reveal.
  useEffect(() => {
    if (phase !== "reveal") return;
    advanceRef.current = window.setTimeout(() => {
      if (idx + 1 < total) {
        setIdx(idx + 1);
        setRemaining(questions![idx + 1].durationSec);
        setPhase("ask");
      } else {
        setPhase("done");
      }
    }, REVEAL_MS);
    return () => {
      if (advanceRef.current) window.clearTimeout(advanceRef.current);
    };
  }, [phase, idx, total, questions]);

  // Keyboard controls.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") nav({ to: "/" });
      else if (e.key === " ") { e.preventDefault(); setPaused((p) => !p); }
      else if (e.key === "ArrowRight" && phase === "ask") {
        if (tickRef.current) window.clearInterval(tickRef.current);
        setPhase("reveal");
        setRemaining(0);
        playBeep();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, nav]);

  if (!questions) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-foreground">Loading…</div>;
  }

  if (total === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-foreground">
        <div className="text-3xl font-bold">No questions yet</div>
        <p className="mt-3 text-muted-foreground">Add questions in the admin panel for this mode.</p>
        <div className="mt-6 flex gap-3">
          <Link to="/" className="rounded-full border border-border px-5 py-2 text-sm">Home</Link>
          <Link to="/admin" className="rounded-full px-5 py-2 text-sm font-semibold text-primary-foreground"
                style={{ background: "var(--gradient-gold, linear-gradient(135deg, oklch(0.82 0.15 85), oklch(0.72 0.13 60)))" }}>
            Open Admin
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-foreground">
        <div className="text-sm font-semibold tracking-widest text-primary">PRESENTATION COMPLETE</div>
        <div className="mt-3 text-6xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {total} slides
        </div>
        <p className="mt-2 text-lg text-muted-foreground">{MODE_LABEL[loadMode()]}</p>
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => { setIdx(0); setRemaining(questions[0].durationSec); setPhase("ask"); }}
            className="rounded-full px-8 py-3 text-sm font-semibold text-primary-foreground"
            style={{ background: "var(--gradient-gold, linear-gradient(135deg, oklch(0.82 0.15 85), oklch(0.72 0.13 60)))" }}
          >
            Restart
          </button>
          <Link to="/" className="rounded-full border border-border px-8 py-3 text-sm font-semibold">
            Exit
          </Link>
        </div>
      </div>
    );
  }

  return <Slide q={current!} idx={idx} total={total} remaining={remaining} phase={phase} paused={paused} />;
}

function Slide({
  q, idx, total, remaining, phase, paused,
}: {
  q: Question; idx: number; total: number; remaining: number;
  phase: "ask" | "reveal"; paused: boolean;
}) {
  const pct = useMemo(() => (remaining / q.durationSec) * 100, [remaining, q.durationSec]);
  const low = remaining <= 5 && phase === "ask";
  const mm = Math.floor(remaining / 60);
  const ss = (remaining % 60).toString().padStart(2, "0");

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      {/* pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, oklch(0.82 0.15 85) 1px, transparent 1px)",
          backgroundSize: "70px 70px",
        }}
      />

      {/* top bar: progress + timer */}
      <div className="relative z-10 flex items-center justify-between px-10 pt-8">
        <div className="text-sm font-semibold tracking-widest text-primary">
          SLIDE {idx + 1} / {total}
        </div>
        <div
          className="rounded-full px-6 py-2 font-mono text-2xl font-bold tabular-nums"
          style={{
            background: low ? "oklch(0.62 0.22 27 / 0.25)" : "oklch(0.30 0.05 165 / 0.7)",
            color: low ? "oklch(0.85 0.14 27)" : "var(--foreground)",
          }}
        >
          {mm}:{ss}
        </div>
      </div>

      {/* progress bar */}
      <div className="relative z-10 mx-10 mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full transition-all duration-1000 ease-linear"
          style={{
            width: `${pct}%`,
            background: low
              ? "oklch(0.62 0.22 27)"
              : "var(--gradient-gold, linear-gradient(90deg, oklch(0.82 0.15 85), oklch(0.72 0.13 60)))",
          }}
        />
      </div>

      {/* main slide content */}
      <div key={idx} className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 py-10 animate-fade-in">
        {q.arabic && (
          <div
            className="mb-6 text-right text-5xl leading-tight sm:text-6xl"
            style={{ fontFamily: "Amiri, serif", direction: "rtl" }}
          >
            {q.arabic}
          </div>
        )}

        <h2 className="max-w-5xl text-center text-3xl font-semibold leading-snug sm:text-5xl">
          {q.prompt}
        </h2>

        <div className="mt-12 grid w-full max-w-4xl gap-4 sm:grid-cols-2">
          {q.options.map((opt, i) => {
            const isCorrect = phase === "reveal" && i === q.correctIndex;
            return (
              <div
                key={i}
                className="flex items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-500"
                style={{
                  borderColor: isCorrect ? "oklch(0.75 0.18 150)" : "var(--border)",
                  background: isCorrect
                    ? "oklch(0.75 0.18 150 / 0.18)"
                    : "oklch(0.22 0.04 165 / 0.6)",
                  boxShadow: isCorrect ? "0 0 30px oklch(0.75 0.18 150 / 0.4)" : "none",
                  transform: isCorrect ? "scale(1.03)" : "scale(1)",
                }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold"
                  style={{
                    background: isCorrect
                      ? "oklch(0.75 0.18 150)"
                      : "oklch(0.35 0.04 165)",
                    color: isCorrect ? "oklch(0.15 0.03 165)" : "var(--foreground)",
                  }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-lg sm:text-xl">{opt}</span>
              </div>
            );
          })}
        </div>

        {phase === "reveal" && (
          <div className="mt-10 text-sm font-semibold tracking-widest text-primary">
            ✓ CORRECT ANSWER REVEALED · NEXT SLIDE IN {Math.ceil(REVEAL_MS / 1000)}s
          </div>
        )}
      </div>

      {/* footer hints */}
      <div className="relative z-10 flex items-center justify-between px-10 pb-6 text-xs text-muted-foreground">
        <span>{MODE_LABEL[q.mode]}</span>
        <span>
          {paused ? "⏸ PAUSED · " : ""}Space = pause · → = skip · Esc = exit
        </span>
      </div>
    </div>
  );
}