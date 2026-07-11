import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadMode, loadQuestions, saveMode, MODE_LABEL, type Mode } from "@/lib/quiz-store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [mode, setMode] = useState<Mode>("nahwi");
  const [counts, setCounts] = useState<Record<Mode, number>>({ nahwi: 0, fiqhi: 0 });

  useEffect(() => {
    setMode(loadMode());
    const qs = loadQuestions();
    setCounts({
      nahwi: qs.filter((q) => q.mode === "nahwi").length,
      fiqhi: qs.filter((q) => q.mode === "fiqhi").length,
    });
  }, []);

  const pick = (m: Mode) => {
    setMode(m);
    saveMode(m);
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* decorative pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, oklch(0.82 0.15 85) 1px, transparent 1px), radial-gradient(circle at 80% 60%, oklch(0.82 0.15 85) 1px, transparent 1px)",
          backgroundSize: "60px 60px, 90px 90px",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-xl font-bold text-primary-foreground"
              style={{ background: "var(--gradient-gold, linear-gradient(135deg, oklch(0.82 0.15 85), oklch(0.72 0.13 60)))" }}
            >
              ن
            </div>
            <div>
              <div className="text-sm font-semibold tracking-widest" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                GRAMMAR QUIZ
              </div>
              <div className="text-xs text-muted-foreground">Al-Nahwi · Al-Fiqhi Shafi</div>
            </div>
          </div>
          <Link
            to="/admin"
            className="rounded-full border border-border bg-card/40 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur hover:text-foreground"
          >
            Admin →
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center py-16">
          <div className="mb-6 text-7xl font-bold" style={{ fontFamily: "Amiri, serif" }}>
            {mode === "nahwi" ? "النحو" : "الفقه"}
          </div>
          <h1
            className="text-center text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Presentation-Style Quiz
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-center text-base text-muted-foreground">
            Pick a mode, press Start, and the slideshow plays itself — each question
            has its own timer, and the correct answer is revealed with a sound when time runs out.
          </p>

          <div className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-2">
            <ModeCard
              active={mode === "nahwi"}
              onClick={() => pick("nahwi")}
              label={MODE_LABEL.nahwi}
              tag="MODE 01"
              count={counts.nahwi}
            />
            <ModeCard
              active={mode === "fiqhi"}
              onClick={() => pick("fiqhi")}
              label={MODE_LABEL.fiqhi}
              tag="MODE 02"
              count={counts.fiqhi}
            />
          </div>

          <Link
            to="/present"
            className="mt-10 rounded-full px-12 py-5 text-lg font-semibold text-primary-foreground transition hover:scale-105"
            style={{
              background: "var(--gradient-gold, linear-gradient(135deg, oklch(0.82 0.15 85), oklch(0.72 0.13 60)))",
              boxShadow: "var(--shadow-glow, 0 0 40px oklch(0.82 0.15 85 / 0.4))",
            }}
          >
            ▶ Start Presentation
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">
            Timer starts the moment the first slide opens.
          </p>
        </main>

        <footer className="pt-6 text-center text-xs text-muted-foreground">
          {MODE_LABEL[mode]} · {counts[mode]} question{counts[mode] === 1 ? "" : "s"} loaded
        </footer>
      </div>
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  label,
  tag,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  tag: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border p-6 text-left backdrop-blur transition hover:scale-[1.02]"
      style={{
        background: active ? "oklch(0.82 0.15 85 / 0.12)" : "oklch(0.22 0.04 165 / 0.5)",
        borderColor: active ? "var(--primary)" : "var(--border)",
        boxShadow: active ? "var(--shadow-glow, 0 0 30px oklch(0.82 0.15 85 / 0.3))" : "none",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold tracking-widest text-primary">{tag}</div>
        {active && <span className="text-xs font-medium text-primary">SELECTED</span>}
      </div>
      <div className="mt-3 text-xl font-semibold" style={{ fontFamily: "Amiri, serif" }}>
        {label}
      </div>
      <div className="mt-2 text-sm text-muted-foreground">
        {count} question{count === 1 ? "" : "s"}
      </div>
    </button>
  );
}
