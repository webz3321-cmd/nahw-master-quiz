import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

// ============================================================
// Al-Nahw Arabic Grammar Quiz
// Round 1: 10 MCQs, 60s each
// Round 2: 5 open-answer, 120s each
// Timer starts when the user presses "Start".
// ============================================================

type MCQ = {
  id: number;
  question: string;
  arabic?: string;
  options: string[];
  answer: number; // index
};

type OpenQ = {
  id: number;
  question: string;
  arabic?: string;
  answer: string; // accepted answer (case/space-insensitive)
};

// Placeholder questions — replace with your own content.
const ROUND1: MCQ[] = [
  { id: 1, question: "What does 'النحو' (al-Nahw) mean?", arabic: "النحو", options: ["Morphology", "Grammar / Syntax", "Rhetoric", "Phonetics"], answer: 1 },
  { id: 2, question: "The subject of a verbal sentence is called:", options: ["المبتدأ", "الفاعل", "المفعول به", "الخبر"], answer: 1 },
  { id: 3, question: "The predicate of a nominal sentence is:", options: ["الفاعل", "المبتدأ", "الخبر", "الحال"], answer: 2 },
  { id: 4, question: "Which is a حرف (particle)?", options: ["كتاب", "ذهب", "في", "طالب"], answer: 2 },
  { id: 5, question: "The sign of raf' (nominative) in a singular noun is usually:", options: ["Fatha", "Damma", "Kasra", "Sukun"], answer: 1 },
  { id: 6, question: "'كان' and its sisters make the خبر:", options: ["مرفوع", "منصوب", "مجرور", "مجزوم"], answer: 1 },
  { id: 7, question: "'إنّ' and its sisters make the اسم:", options: ["مرفوع", "منصوب", "مجرور", "مجزوم"], answer: 1 },
  { id: 8, question: "Sign of jazm in a sound present verb is:", options: ["Sukun", "Fatha", "Damma", "Kasra"], answer: 0 },
  { id: 9, question: "المضاف إليه is always:", options: ["مرفوع", "منصوب", "مجرور", "مجزوم"], answer: 2 },
  { id: 10, question: "Which is NOT one of the five nouns (الأسماء الخمسة)?", options: ["أب", "أخ", "ذو", "قلم"], answer: 3 },
];

const ROUND2: OpenQ[] = [
  { id: 1, question: "Name the three parts of speech in Arabic (in Arabic).", answer: "اسم فعل حرف" },
  { id: 2, question: "What is the i'rab of الفاعل?", answer: "مرفوع" },
  { id: 3, question: "What is the i'rab of المفعول به?", answer: "منصوب" },
  { id: 4, question: "Give the Arabic term for a nominal sentence.", answer: "الجملة الاسمية" },
  { id: 5, question: "Give the Arabic term for a verbal sentence.", answer: "الجملة الفعلية" },
];

const R1_SECONDS = 60;
const R2_SECONDS = 120;

type Stage = "intro" | "round1" | "round1-review" | "round2" | "round2-review" | "results";

function Index() {
  const [stage, setStage] = useState<Stage>("intro");
  const [idx, setIdx] = useState(0);
  const [r1Answers, setR1Answers] = useState<(number | null)[]>(() => Array(ROUND1.length).fill(null));
  const [r2Answers, setR2Answers] = useState<string[]>(() => Array(ROUND2.length).fill(""));
  const [locked, setLocked] = useState(false); // once answered/time out

  const isR1 = stage === "round1";
  const isR2 = stage === "round2";
  const currentQ = isR1 ? ROUND1[idx] : isR2 ? ROUND2[idx] : null;
  const totalSecs = isR1 ? R1_SECONDS : R2_SECONDS;

  const [remaining, setRemaining] = useState(totalSecs);
  const timerRef = useRef<number | null>(null);

  // reset timer whenever question or stage changes
  useEffect(() => {
    if (!isR1 && !isR2) return;
    setRemaining(totalSecs);
    setLocked(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          setLocked(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [stage, idx, isR1, isR2, totalSecs]);

  const r1Score = useMemo(
    () => r1Answers.reduce<number>((acc, a, i) => acc + (a === ROUND1[i].answer ? 1 : 0), 0),
    [r1Answers],
  );
  const r2Score = useMemo(
    () =>
      r2Answers.reduce<number>((acc, a, i) => {
        const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
        return acc + (norm(a) && norm(a) === norm(ROUND2[i].answer) ? 1 : 0);
      }, 0),
    [r2Answers],
  );

  const goNext = () => {
    if (isR1) {
      if (idx + 1 < ROUND1.length) setIdx(idx + 1);
      else {
        setIdx(0);
        setStage("round1-review");
      }
    } else if (isR2) {
      if (idx + 1 < ROUND2.length) setIdx(idx + 1);
      else setStage("results");
    }
  };

  const pickMcq = (choice: number) => {
    if (locked) return;
    const next = [...r1Answers];
    next[idx] = choice;
    setR1Answers(next);
    setLocked(true);
  };

  const submitOpen = () => {
    setLocked(true);
  };

  const pct = (remaining / totalSecs) * 100;
  const lowTime = remaining <= 10;

  return (
    <div className="min-h-screen w-full text-foreground" style={{ background: "var(--gradient-hero)" }}>
      <ArabicPattern />
      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-10">
        <Header stage={stage} idx={idx} />

        <main className="flex flex-1 items-center justify-center py-8">
          {stage === "intro" && <Intro onStart={() => { setIdx(0); setStage("round1"); }} />}

          {(isR1 || isR2) && currentQ && (
            <QuestionCard
              round={isR1 ? 1 : 2}
              index={idx}
              total={isR1 ? ROUND1.length : ROUND2.length}
              remaining={remaining}
              totalSecs={totalSecs}
              pct={pct}
              lowTime={lowTime}
              locked={locked}
            >
              {isR1 ? (
                <McqBody
                  q={ROUND1[idx]}
                  chosen={r1Answers[idx]}
                  locked={locked}
                  onPick={pickMcq}
                />
              ) : (
                <OpenBody
                  q={ROUND2[idx]}
                  value={r2Answers[idx]}
                  locked={locked}
                  onChange={(v) => {
                    const next = [...r2Answers];
                    next[idx] = v;
                    setR2Answers(next);
                  }}
                  onSubmit={submitOpen}
                />
              )}

              <div className="mt-8 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {locked ? (remaining === 0 ? "Time's up" : "Answer locked") : "Choose your answer"}
                </span>
                <button
                  onClick={goNext}
                  disabled={!locked}
                  className="rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
                >
                  {idx + 1 === (isR1 ? ROUND1.length : ROUND2.length)
                    ? isR1
                      ? "Finish Round 1 →"
                      : "See Results →"
                    : "Next question →"}
                </button>
              </div>
            </QuestionCard>
          )}

          {stage === "round1-review" && (
            <RoundBreak
              title="Round 1 complete"
              subtitle={`Score: ${r1Score} / ${ROUND1.length}`}
              cta="Begin Round 2 →"
              note="Round 2: 5 open-answer questions · 2 minutes each"
              onNext={() => { setIdx(0); setStage("round2"); }}
            />
          )}

          {stage === "results" && (
            <Results
              r1={r1Score}
              r2={r2Score}
              onRestart={() => {
                setR1Answers(Array(ROUND1.length).fill(null));
                setR2Answers(Array(ROUND2.length).fill(""));
                setIdx(0);
                setStage("intro");
              }}
            />
          )}
        </main>

        <footer className="pt-6 text-center text-xs text-muted-foreground">
          Al-Nahw · Arabic Grammar Quiz
        </footer>
      </div>
    </div>
  );
}

// ---------- Sub-components ----------

function Header({ stage, idx }: { stage: Stage; idx: number }) {
  const label =
    stage === "intro"
      ? "Welcome"
      : stage === "round1"
        ? `Round 1 · Question ${idx + 1} / ${ROUND1.length}`
        : stage === "round1-review"
          ? "Round 1 · Complete"
          : stage === "round2"
            ? `Round 2 · Question ${idx + 1} / ${ROUND2.length}`
            : "Results";
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-primary-foreground"
          style={{ background: "var(--gradient-gold)" }}
        >
          ن
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wide" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            AL-NAHW QUIZ
          </div>
          <div className="text-xs text-muted-foreground">Arabic Grammar · النحو العربي</div>
        </div>
      </div>
      <div className="rounded-full border border-border bg-card/40 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
        {label}
      </div>
    </header>
  );
}

function ArabicPattern() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.06]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 20%, oklch(0.82 0.15 85) 1px, transparent 1px), radial-gradient(circle at 80% 60%, oklch(0.82 0.15 85) 1px, transparent 1px)",
        backgroundSize: "60px 60px, 90px 90px",
      }}
    />
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="w-full max-w-2xl animate-fade-in text-center">
      <div className="mb-6 text-6xl font-bold" style={{ fontFamily: "Amiri, serif" }}>
        النحو
      </div>
      <h1
        className="text-4xl font-bold tracking-tight sm:text-5xl"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Al-Nahw Arabic Grammar Quiz
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
        Two rounds. Sharp timers. Real grammar.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <RoundCard
          num="01"
          title="Multiple Choice"
          meta="10 questions · 60 seconds each"
        />
        <RoundCard
          num="02"
          title="Open Answer"
          meta="5 questions · 120 seconds each"
        />
      </div>

      <button
        onClick={onStart}
        className="mt-10 rounded-full px-10 py-4 text-base font-semibold text-primary-foreground transition hover:scale-105"
        style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
      >
        Start Quiz — Timer begins
      </button>
      <p className="mt-3 text-xs text-muted-foreground">
        The timer starts the moment you press start.
      </p>
    </div>
  );
}

function RoundCard({ num, title, meta }: { num: string; title: string; meta: string }) {
  return (
    <div
      className="rounded-2xl border border-border p-5 text-left backdrop-blur"
      style={{ background: "oklch(0.22 0.04 165 / 0.5)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="text-xs font-semibold tracking-widest text-primary">ROUND {num}</div>
      <div className="mt-2 text-lg font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{meta}</div>
    </div>
  );
}

function QuestionCard({
  round,
  index,
  total,
  remaining,
  totalSecs,
  pct,
  lowTime,
  locked,
  children,
}: {
  round: number;
  index: number;
  total: number;
  remaining: number;
  totalSecs: number;
  pct: number;
  lowTime: boolean;
  locked: boolean;
  children: React.ReactNode;
}) {
  const mm = Math.floor(remaining / 60);
  const ss = (remaining % 60).toString().padStart(2, "0");
  return (
    <div
      key={`${round}-${index}`}
      className="w-full max-w-2xl animate-fade-in rounded-3xl border border-border p-8 backdrop-blur"
      style={{ background: "oklch(0.22 0.04 165 / 0.75)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xs font-semibold tracking-widest text-primary">
          ROUND {round} · {index + 1} / {total}
        </div>
        <div
          className={`rounded-full px-3 py-1 text-sm font-mono font-semibold ${
            lowTime ? "text-destructive-foreground" : "text-foreground"
          }`}
          style={{
            background: lowTime
              ? "oklch(0.62 0.22 27 / 0.3)"
              : "oklch(0.30 0.05 165 / 0.8)",
          }}
        >
          {mm}:{ss}
        </div>
      </div>

      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full transition-all duration-1000 ease-linear"
          style={{
            width: `${pct}%`,
            background: lowTime ? "oklch(0.62 0.22 27)" : "var(--gradient-gold)",
          }}
        />
      </div>

      {children}
      {locked && <div className="sr-only">Answer locked</div>}
      <div className="mt-2 text-xs text-muted-foreground">
        {locked ? "" : `Total: ${totalSecs}s`}
      </div>
    </div>
  );
}

function McqBody({
  q,
  chosen,
  locked,
  onPick,
}: {
  q: MCQ;
  chosen: number | null;
  locked: boolean;
  onPick: (i: number) => void;
}) {
  return (
    <div>
      {q.arabic && (
        <div className="mb-3 text-right text-3xl" style={{ fontFamily: "Amiri, serif" }}>
          {q.arabic}
        </div>
      )}
      <h2 className="text-xl font-semibold leading-snug sm:text-2xl">
        {q.question}
      </h2>
      <div className="mt-6 grid gap-3">
        {q.options.map((opt, i) => {
          const isChosen = chosen === i;
          const isCorrect = locked && i === q.answer;
          const isWrong = locked && isChosen && i !== q.answer;
          return (
            <button
              key={i}
              disabled={locked}
              onClick={() => onPick(i)}
              className="group flex items-center gap-4 rounded-xl border p-4 text-left transition hover:scale-[1.01] disabled:cursor-not-allowed"
              style={{
                borderColor: isCorrect
                  ? "oklch(0.72 0.18 150)"
                  : isWrong
                    ? "oklch(0.62 0.22 27)"
                    : isChosen
                      ? "var(--primary)"
                      : "var(--border)",
                background: isCorrect
                  ? "oklch(0.72 0.18 150 / 0.15)"
                  : isWrong
                    ? "oklch(0.62 0.22 27 / 0.15)"
                    : isChosen
                      ? "oklch(0.82 0.15 85 / 0.12)"
                      : "oklch(0.30 0.05 165 / 0.4)",
              }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  background: isChosen || isCorrect ? "var(--gradient-gold)" : "oklch(0.35 0.04 165)",
                  color: isChosen || isCorrect ? "var(--primary-foreground)" : "var(--foreground)",
                }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-base">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OpenBody({
  q,
  value,
  locked,
  onChange,
  onSubmit,
}: {
  q: OpenQ;
  value: string;
  locked: boolean;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
  const correct = locked && norm(value) === norm(q.answer);
  return (
    <div>
      {q.arabic && (
        <div className="mb-3 text-right text-3xl" style={{ fontFamily: "Amiri, serif" }}>
          {q.arabic}
        </div>
      )}
      <h2 className="text-xl font-semibold leading-snug sm:text-2xl">
        {q.question}
      </h2>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={locked}
        rows={3}
        placeholder="Type your answer…"
        className="mt-6 w-full rounded-xl border p-4 text-lg outline-none transition focus:ring-2"
        style={{
          background: "oklch(0.18 0.03 165 / 0.8)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
          fontFamily: "Amiri, serif",
          direction: "rtl",
        }}
      />
      {!locked && (
        <button
          onClick={onSubmit}
          className="mt-4 rounded-full border border-border px-5 py-2 text-sm font-medium hover:bg-secondary"
        >
          Submit answer
        </button>
      )}
      {locked && (
        <div
          className="mt-4 rounded-xl border p-4 text-sm"
          style={{
            borderColor: correct ? "oklch(0.72 0.18 150)" : "oklch(0.62 0.22 27)",
            background: correct
              ? "oklch(0.72 0.18 150 / 0.12)"
              : "oklch(0.62 0.22 27 / 0.12)",
          }}
        >
          <div className="font-semibold">
            {correct ? "Correct" : "Expected answer"}
          </div>
          <div className="mt-1 text-right text-lg" style={{ fontFamily: "Amiri, serif" }}>
            {q.answer}
          </div>
        </div>
      )}
    </div>
  );
}

function RoundBreak({
  title,
  subtitle,
  cta,
  note,
  onNext,
}: {
  title: string;
  subtitle: string;
  cta: string;
  note: string;
  onNext: () => void;
}) {
  return (
    <div className="w-full max-w-xl animate-fade-in text-center">
      <div className="text-sm font-semibold tracking-widest text-primary">MILESTONE</div>
      <h2 className="mt-2 text-4xl font-bold">{title}</h2>
      <p className="mt-2 text-lg text-muted-foreground">{subtitle}</p>
      <p className="mt-6 text-sm text-muted-foreground">{note}</p>
      <button
        onClick={onNext}
        className="mt-8 rounded-full px-8 py-3 text-sm font-semibold text-primary-foreground"
        style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
      >
        {cta}
      </button>
    </div>
  );
}

function Results({ r1, r2, onRestart }: { r1: number; r2: number; onRestart: () => void }) {
  const total = r1 + r2;
  const max = ROUND1.length + ROUND2.length;
  const pct = Math.round((total / max) * 100);
  return (
    <div className="w-full max-w-2xl animate-fade-in text-center">
      <div className="text-sm font-semibold tracking-widest text-primary">FINAL SCORE</div>
      <div className="mt-3 text-7xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {total}
        <span className="text-3xl text-muted-foreground"> / {max}</span>
      </div>
      <div className="mt-2 text-lg text-muted-foreground">{pct}% correct</div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <ScoreCard label="Round 1 · MCQ" score={r1} total={ROUND1.length} />
        <ScoreCard label="Round 2 · Open" score={r2} total={ROUND2.length} />
      </div>

      <button
        onClick={onRestart}
        className="mt-10 rounded-full px-8 py-3 text-sm font-semibold text-primary-foreground"
        style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
      >
        Restart Quiz
      </button>
    </div>
  );
}

function ScoreCard({ label, score, total }: { label: string; score: number; total: number }) {
  return (
    <div
      className="rounded-2xl border border-border p-6 text-left"
      style={{ background: "oklch(0.22 0.04 165 / 0.6)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="text-xs font-semibold tracking-widest text-primary">{label}</div>
      <div className="mt-2 text-3xl font-bold">
        {score} <span className="text-base text-muted-foreground">/ {total}</span>
      </div>
    </div>
  );
}
