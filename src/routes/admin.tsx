import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ADMIN_PASSCODE,
  loadConfig,
  loadQuestions,
  saveConfig,
  saveQuestions,
  newId,
  MODE_LABEL,
  MODE_THEME,
  ROUND_TYPE,
  type Mode,
  type ModeConfig,
  type Question,
  type RoundNum,
} from "@/lib/quiz-store";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

const MODES: Mode[] = ["nahwi", "fiqhi", "grammar", "maths"];

function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem("alnahw.admin") === "1") setAuthed(true);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === ADMIN_PASSCODE) {
      sessionStorage.setItem("alnahw.admin", "1");
      setAuthed(true);
    } else setError("Incorrect passcode");
  };

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-border bg-card/60 p-8 backdrop-blur">
          <div className="text-xs font-semibold tracking-widest text-primary">ADMIN ACCESS</div>
          <h1 className="mt-2 text-2xl font-bold">Enter passcode</h1>
          <p className="mt-1 text-sm text-muted-foreground">Only admins can edit quiz questions and rounds.</p>
          <input
            autoFocus type="password" value={pass}
            onChange={(e) => { setPass(e.target.value); setError(""); }}
            placeholder="••••••••"
            className="mt-6 w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary"
          />
          {error && <div className="mt-2 text-sm text-destructive">{error}</div>}
          <button type="submit" className="mt-4 w-full rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground"
                  style={{ background: "var(--gradient-gold, linear-gradient(135deg, oklch(0.82 0.15 85), oklch(0.72 0.13 60)))" }}>
            Unlock
          </button>
          <Link to="/" className="mt-4 block text-center text-xs text-muted-foreground hover:text-foreground">← Back to home</Link>
        </form>
      </div>
    );
  }

  return <AdminPanel />;
}

function AdminPanel() {
  const [mode, setMode] = useState<Mode>("nahwi");
  const [round, setRound] = useState<RoundNum>(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [cfg, setCfg] = useState<Record<Mode, ModeConfig> | null>(null);

  useEffect(() => {
    setQuestions(loadQuestions());
    setCfg(loadConfig());
  }, []);

  if (!cfg) return null;
  const theme = MODE_THEME[mode];
  const filtered = questions.filter((q) => q.mode === mode && q.round === round);
  const roundCfg = cfg[mode].rounds[round];
  const qType = ROUND_TYPE[round];

  const persistQ = (next: Question[]) => { setQuestions(next); saveQuestions(next); };
  const persistCfg = (next: Record<Mode, ModeConfig>) => { setCfg(next); saveConfig(next); };

  const addQuestion = () => {
    const base: Question = {
      id: newId(), mode, round, prompt: "New question",
      durationSec: qType === "mcq" ? 30 : qType === "short" ? 45 : 60,
    };
    if (qType === "mcq") { base.options = ["", "", "", ""]; base.correctIndex = 0; }
    else { base.answer = ""; }
    persistQ([...questions, base]);
  };

  const updateQ = (id: string, patch: Partial<Question>) =>
    persistQ(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const deleteQ = (id: string) => {
    if (!confirm("Delete this question?")) return;
    persistQ(questions.filter((q) => q.id !== id));
  };

  const move = (id: string, dir: -1 | 1) => {
    const ids = questions.filter((q) => q.mode === mode && q.round === round).map((q) => q.id);
    const pos = ids.indexOf(id);
    const swap = ids[pos + dir];
    if (!swap) return;
    const next = [...questions];
    const a = next.findIndex((q) => q.id === id);
    const b = next.findIndex((q) => q.id === swap);
    [next[a], next[b]] = [next[b], next[a]];
    persistQ(next);
  };

  const toggleRound = (r: RoundNum, enabled: boolean) => {
    const next = { ...cfg };
    next[mode] = { rounds: { ...cfg[mode].rounds, [r]: { ...cfg[mode].rounds[r], enabled } } };
    persistCfg(next);
  };
  const setRoundTitle = (r: RoundNum, title: string) => {
    const next = { ...cfg };
    next[mode] = { rounds: { ...cfg[mode].rounds, [r]: { ...cfg[mode].rounds[r], title } } };
    persistCfg(next);
  };

  const signOut = () => { sessionStorage.removeItem("alnahw.admin"); window.location.href = "/"; };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold"
                 style={{ background: theme.gradient, color: theme.primaryContrast }}>✦</div>
            <div>
              <div className="text-sm font-semibold tracking-widest">ADMIN PANEL</div>
              <div className="text-xs text-muted-foreground">Modes · Rounds · Questions</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="rounded-full border border-border px-4 py-1.5 text-xs">Home</Link>
            <Link to="/present" className="rounded-full border border-border px-4 py-1.5 text-xs">▶ Preview</Link>
            <button onClick={signOut} className="rounded-full border border-border px-4 py-1.5 text-xs">Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Mode picker */}
        <div className="mb-6">
          <div className="text-xs font-semibold tracking-widest text-primary">WEBSITE MODE</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Each mode has its own questions, theme, and 3 optional rounds. Preview runs the selected mode.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                key={m} onClick={() => setMode(m)}
                className="rounded-full border px-5 py-2 text-sm font-medium transition"
                style={{
                  background: mode === m ? MODE_THEME[m].gradient : "transparent",
                  color: mode === m ? MODE_THEME[m].primaryContrast : "var(--foreground)",
                  borderColor: mode === m ? MODE_THEME[m].primary : "var(--border)",
                }}
              >
                {MODE_LABEL[m]}
              </button>
            ))}
          </div>
        </div>

        {/* Round configurator */}
        <div className="mb-6 rounded-2xl border border-border bg-card/40 p-5 backdrop-blur">
          <div className="text-xs font-semibold tracking-widest text-primary">ROUNDS · {MODE_LABEL[mode]}</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Enable each round. Round 1 = MCQ · Round 2 = Short answer · Round 3 = Sentence writing. All optional.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {([1, 2, 3] as RoundNum[]).map((r) => {
              const rc = cfg[mode].rounds[r];
              const active = round === r;
              return (
                <div
                  key={r}
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: active ? theme.primary : "var(--border)",
                    background: active ? "oklch(0 0 0 / 0.15)" : "transparent",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <button onClick={() => setRound(r)} className="text-left">
                      <div className="text-[10px] font-semibold tracking-widest" style={{ color: theme.primary }}>ROUND {r}</div>
                      <div className="text-sm font-semibold">
                        {ROUND_TYPE[r] === "mcq" ? "MCQ" : ROUND_TYPE[r] === "short" ? "Short answer" : "Sentence writing"}
                      </div>
                    </button>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
                      <input type="checkbox" checked={rc.enabled}
                             onChange={(e) => toggleRound(r, e.target.checked)}
                             className="accent-primary" />
                      {rc.enabled ? "On" : "Off"}
                    </label>
                  </div>
                  <input
                    value={rc.title}
                    onChange={(e) => setRoundTitle(r, e.target.value)}
                    className="mt-3 w-full rounded-lg border border-border bg-background/60 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    {questions.filter((q) => q.mode === mode && q.round === r).length} question(s)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question list header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">
              Round {round} · {filtered.length} question{filtered.length === 1 ? "" : "s"}
            </div>
            <div className="text-xs text-muted-foreground">
              {roundCfg.enabled ? "Round is ON — will play in the presentation" : "Round is OFF — will be skipped"}
            </div>
          </div>
          <button
            onClick={addQuestion}
            className="rounded-full px-6 py-2.5 text-sm font-semibold"
            style={{ background: theme.gradient, color: theme.primaryContrast }}
          >
            + Add {qType === "mcq" ? "MCQ" : qType === "short" ? "short-answer" : "sentence"} question
          </button>
        </div>

        <div className="space-y-4">
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No questions yet for this round.
            </div>
          )}
          {filtered.map((q, i) => (
            <QuestionEditor
              key={q.id} q={q} index={i} total={filtered.length}
              onChange={(patch) => updateQ(q.id, patch)}
              onDelete={() => deleteQ(q.id)}
              onMove={(dir) => move(q.id, dir)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function QuestionEditor({
  q, index, total, onChange, onDelete, onMove,
}: {
  q: Question; index: number; total: number;
  onChange: (patch: Partial<Question>) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const setOption = (i: number, v: string) => {
    const next = [...(q.options || ["", "", "", ""])];
    next[i] = v;
    onChange({ options: next });
  };
  const isMcq = ROUND_TYPE[q.round] === "mcq";

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold tracking-widest text-primary">
          R{q.round} · SLIDE {index + 1}
        </div>
        <div className="flex gap-1">
          <button disabled={index === 0} onClick={() => onMove(-1)}
                  className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-30">↑</button>
          <button disabled={index === total - 1} onClick={() => onMove(1)}
                  className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-30">↓</button>
          <button onClick={onDelete}
                  className="ml-2 rounded-md border border-destructive/50 px-2 py-1 text-xs text-destructive">Delete</button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Question / prompt</label>
          <textarea
            rows={2} value={q.prompt}
            onChange={(e) => onChange({ prompt: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Timer (seconds)</label>
          <input type="number" min={5} max={600} value={q.durationSec}
                 onChange={(e) => onChange({ durationSec: Math.max(5, Number(e.target.value) || 30) })}
                 className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>

      <div className="mt-3">
        <label className="text-xs font-medium text-muted-foreground">Arabic text (optional)</label>
        <input value={q.arabic ?? ""}
               onChange={(e) => onChange({ arabic: e.target.value })}
               placeholder="النص العربي..." dir="rtl"
               className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-lg outline-none focus:ring-2 focus:ring-primary"
               style={{ fontFamily: "Amiri, serif" }} />
      </div>

      {isMcq ? (
        <div className="mt-4">
          <div className="text-xs font-medium text-muted-foreground">
            Options — click the radio to mark the correct one
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {(q.options ?? ["", "", "", ""]).map((opt, i) => (
              <label key={i} className="flex items-center gap-2 rounded-lg border p-2"
                     style={{
                       borderColor: q.correctIndex === i ? "oklch(0.75 0.18 150)" : "var(--border)",
                       background: q.correctIndex === i ? "oklch(0.75 0.18 150 / 0.1)" : "transparent",
                     }}>
                <input type="radio" name={`correct-${q.id}`}
                       checked={q.correctIndex === i}
                       onChange={() => onChange({ correctIndex: i })}
                       className="accent-primary" />
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                  {String.fromCharCode(65 + i)}
                </span>
                <input value={opt}
                       onChange={(e) => setOption(i, e.target.value)}
                       placeholder={`Option ${String.fromCharCode(65 + i)}`}
                       className="w-full bg-transparent text-sm outline-none" />
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <label className="text-xs font-medium text-muted-foreground">
            Model answer — revealed when the timer ends
          </label>
          <textarea
            rows={q.round === 3 ? 4 : 3}
            value={q.answer ?? ""}
            onChange={(e) => onChange({ answer: e.target.value })}
            placeholder={q.round === 3 ? "Write the model sentence here…" : "Write the model answer here…"}
            className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}
    </div>
  );
}