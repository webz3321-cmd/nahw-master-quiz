import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  loadConfig,
  loadMode,
  loadQuestions,
  saveMode,
  MODE_LABEL,
  MODE_SHORT,
  MODE_THEME,
  type Mode,
  type ModeConfig,
} from "@/lib/quiz-store";

export const Route = createFileRoute("/")({
  component: Index,
});

const MODES: Mode[] = ["nahwi", "fiqhi", "grammar", "maths"];

function Index() {
  const [mode, setMode] = useState<Mode>("nahwi");
  const [counts, setCounts] = useState<Record<Mode, number>>({ nahwi: 0, fiqhi: 0, grammar: 0, maths: 0 });
  const [cfg, setCfg] = useState<Record<Mode, ModeConfig> | null>(null);

  useEffect(() => {
    setMode(loadMode());
    const qs = loadQuestions();
    setCounts({
      nahwi: qs.filter((q) => q.mode === "nahwi").length,
      fiqhi: qs.filter((q) => q.mode === "fiqhi").length,
      grammar: qs.filter((q) => q.mode === "grammar").length,
      maths: qs.filter((q) => q.mode === "maths").length,
    });
    setCfg(loadConfig());
  }, []);

  const pick = (m: Mode) => { setMode(m); saveMode(m); };
  const theme = MODE_THEME[mode];

  return (
    <div
      className="min-h-screen w-full transition-colors duration-500"
      style={{ background: theme.bg, color: "oklch(0.97 0.02 90)" }}
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, ${theme.dot} 1px, transparent 1px), radial-gradient(circle at 80% 60%, ${theme.dot} 1px, transparent 1px)`,
          backgroundSize: "60px 60px, 90px 90px",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-xl font-bold"
              style={{ background: theme.gradient, color: theme.primaryContrast }}
            >
              ✦
            </div>
            <div>
              <div className="text-sm font-semibold tracking-widest" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                QUIZ PRESENTATIONS
              </div>
              <div className="text-xs opacity-70">4 modes · 3 rounds each</div>
            </div>
          </div>
          <Link
            to="/admin"
            className="rounded-full border px-4 py-1.5 text-xs font-medium opacity-80 hover:opacity-100"
            style={{ borderColor: theme.border }}
          >
            Admin →
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center py-12">
          <div className="mb-4 text-7xl font-bold" style={{ fontFamily: "Amiri, serif", color: theme.primary }}>
            {MODE_SHORT[mode]}
          </div>
          <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Presentation-Style Quiz
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-center text-base opacity-70">
            Pick a mode, press Start, and the slideshow runs itself — each round has its own
            questions and timers, and answers reveal with a sound when time is up.
          </p>

          <div className="mt-10 grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODES.map((m, i) => (
              <ModeCard
                key={m}
                active={mode === m}
                onClick={() => pick(m)}
                label={MODE_LABEL[m]}
                tag={`MODE 0${i + 1}`}
                count={counts[m]}
                rounds={cfg ? cfg[m] : null}
                theme={MODE_THEME[m]}
              />
            ))}
          </div>

          <Link
            to="/present"
            className="mt-10 rounded-full px-12 py-5 text-lg font-semibold transition hover:scale-105"
            style={{ background: theme.gradient, color: theme.primaryContrast, boxShadow: theme.glow }}
          >
            ▶ Start Presentation
          </Link>
          <p className="mt-3 text-xs opacity-70">Timer starts the moment the first slide opens.</p>
        </main>

        <footer className="pt-6 text-center text-xs opacity-70">
          {MODE_LABEL[mode]} · {counts[mode]} question{counts[mode] === 1 ? "" : "s"} loaded
        </footer>
      </div>
    </div>
  );
}

function ModeCard({
  active, onClick, label, tag, count, rounds, theme,
}: {
  active: boolean; onClick: () => void; label: string; tag: string; count: number;
  rounds: ModeConfig | null;
  theme: ReturnType<() => typeof MODE_THEME[Mode]> | typeof MODE_THEME[Mode];
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border p-5 text-left backdrop-blur transition hover:scale-[1.02]"
      style={{
        background: active ? theme.panel : "oklch(0 0 0 / 0.25)",
        borderColor: active ? theme.primary : theme.border,
        boxShadow: active ? theme.glow : "none",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold tracking-widest" style={{ color: theme.primary }}>{tag}</div>
        {active && <span className="text-[10px] font-medium" style={{ color: theme.primary }}>SELECTED</span>}
      </div>
      <div className="mt-3 text-lg font-semibold leading-tight">{label}</div>
      <div className="mt-1 text-xs opacity-70">{count} question{count === 1 ? "" : "s"}</div>
      {rounds && (
        <div className="mt-3 flex gap-1">
          {[1, 2, 3].map((r) => {
            const on = rounds.rounds[r as 1 | 2 | 3].enabled;
            return (
              <span
                key={r}
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  background: on ? theme.primary : "oklch(0 0 0 / 0.3)",
                  color: on ? theme.primaryContrast : "oklch(0.75 0.02 90)",
                  opacity: on ? 1 : 0.5,
                }}
              >
                R{r}
              </span>
            );
          })}
        </div>
      )}
    </button>
  );
}