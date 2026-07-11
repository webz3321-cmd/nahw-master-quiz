import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ADMIN_PASSCODE,
  loadQuestions,
  saveQuestions,
  newId,
  MODE_LABEL,
  type Mode,
  type Question,
} from "@/lib/quiz-store";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

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
    } else {
      setError("Incorrect passcode");
    }
  };

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-border bg-card/60 p-8 backdrop-blur">
          <div className="text-xs font-semibold tracking-widest text-primary">ADMIN ACCESS</div>
          <h1 className="mt-2 text-2xl font-bold">Enter passcode</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Only admins can add or edit quiz questions.
          </p>
          <input
            autoFocus
            type="password"
            value={pass}
            onChange={(e) => { setPass(e.target.value); setError(""); }}
            placeholder="••••••••"
            className="mt-6 w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary"
          />
          {error && <div className="mt-2 text-sm text-destructive">{error}</div>}
          <button
            type="submit"
            className="mt-4 w-full rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground"
            style={{ background: "var(--gradient-gold, linear-gradient(135deg, oklch(0.82 0.15 85), oklch(0.72 0.13 60)))" }}
          >
            Unlock
          </button>
          <Link to="/" className="mt-4 block text-center text-xs text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </form>
      </div>
    );
  }

  return <AdminPanel />;
}

function AdminPanel() {
  const [mode, setMode] = useState<Mode>("nahwi");
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => { setQuestions(loadQuestions()); }, []);

  const filtered = questions.filter((q) => q.mode === mode);

  const persist = (next: Question[]) => {
    setQuestions(next);
    saveQuestions(next);
  };

  const addQuestion = () => {
    const q: Question = {
      id: newId(),
      mode,
      prompt: "New question",
      arabic: "",
      options: ["", "", "", ""],
      correctIndex: 0,
      durationSec: 30,
    };
    persist([...questions, q]);
  };

  const updateQ = (id: string, patch: Partial<Question>) => {
    persist(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const deleteQ = (id: string) => {
    if (!confirm("Delete this question?")) return;
    persist(questions.filter((q) => q.id !== id));
  };

  const move = (id: string, dir: -1 | 1) => {
    // reorder within the same mode by swapping in the global list
    const idsInMode = questions.filter((q) => q.mode === mode).map((q) => q.id);
    const pos = idsInMode.indexOf(id);
    const swapWith = idsInMode[pos + dir];
    if (!swapWith) return;
    const next = [...questions];
    const a = next.findIndex((q) => q.id === id);
    const b = next.findIndex((q) => q.id === swapWith);
    [next[a], next[b]] = [next[b], next[a]];
    persist(next);
  };

  const signOut = () => {
    sessionStorage.removeItem("alnahw.admin");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-primary-foreground"
              style={{ background: "var(--gradient-gold, linear-gradient(135deg, oklch(0.82 0.15 85), oklch(0.72 0.13 60)))" }}
            >
              ن
            </div>
            <div>
              <div className="text-sm font-semibold tracking-widest">ADMIN PANEL</div>
              <div className="text-xs text-muted-foreground">Manage quiz questions</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="rounded-full border border-border px-4 py-1.5 text-xs">Home</Link>
            <Link to="/present" className="rounded-full border border-border px-4 py-1.5 text-xs">▶ Preview</Link>
            <button onClick={signOut} className="rounded-full border border-border px-4 py-1.5 text-xs">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* mode switcher */}
        <div className="mb-6">
          <div className="text-xs font-semibold tracking-widest text-primary">WEBSITE MODE</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Switch mode to see and edit only that subject's questions. The home page runs whichever mode is selected here.
          </p>
          <div className="mt-3 inline-flex rounded-full border border-border bg-card/40 p-1">
            {(["nahwi", "fiqhi"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="rounded-full px-5 py-2 text-sm font-medium transition"
                style={{
                  background: mode === m
                    ? "var(--gradient-gold, linear-gradient(135deg, oklch(0.82 0.15 85), oklch(0.72 0.13 60)))"
                    : "transparent",
                  color: mode === m ? "var(--primary-foreground)" : "var(--foreground)",
                }}
              >
                {MODE_LABEL[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-semibold">
            {filtered.length} question{filtered.length === 1 ? "" : "s"} in {MODE_LABEL[mode]}
          </div>
          <button
            onClick={addQuestion}
            className="rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground"
            style={{ background: "var(--gradient-gold, linear-gradient(135deg, oklch(0.82 0.15 85), oklch(0.72 0.13 60)))" }}
          >
            + Add question
          </button>
        </div>

        <div className="space-y-4">
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No questions yet. Click "Add question" to create the first slide.
            </div>
          )}
          {filtered.map((q, i) => (
            <QuestionEditor
              key={q.id}
              q={q}
              index={i}
              total={filtered.length}
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
  q: Question;
  index: number;
  total: number;
  onChange: (patch: Partial<Question>) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const setOption = (i: number, v: string) => {
    const next = [...q.options];
    next[i] = v;
    onChange({ options: next });
  };

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold tracking-widest text-primary">
          SLIDE {index + 1}
        </div>
        <div className="flex gap-1">
          <button
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-30"
          >↑</button>
          <button
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-30"
          >↓</button>
          <button
            onClick={onDelete}
            className="ml-2 rounded-md border border-destructive/50 px-2 py-1 text-xs text-destructive"
          >Delete</button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Question (English)</label>
          <textarea
            rows={2}
            value={q.prompt}
            onChange={(e) => onChange({ prompt: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Timer (seconds)</label>
          <input
            type="number"
            min={5}
            max={600}
            value={q.durationSec}
            onChange={(e) => onChange({ durationSec: Math.max(5, Number(e.target.value) || 30) })}
            className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="text-xs font-medium text-muted-foreground">Arabic text (optional)</label>
        <input
          value={q.arabic ?? ""}
          onChange={(e) => onChange({ arabic: e.target.value })}
          placeholder="النص العربي..."
          dir="rtl"
          className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-lg outline-none focus:ring-2 focus:ring-primary"
          style={{ fontFamily: "Amiri, serif" }}
        />
      </div>

      <div className="mt-4">
        <div className="text-xs font-medium text-muted-foreground">
          Options — click the radio to mark the correct one
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {q.options.map((opt, i) => (
            <label
              key={i}
              className="flex items-center gap-2 rounded-lg border p-2"
              style={{
                borderColor: q.correctIndex === i ? "oklch(0.75 0.18 150)" : "var(--border)",
                background: q.correctIndex === i ? "oklch(0.75 0.18 150 / 0.1)" : "transparent",
              }}
            >
              <input
                type="radio"
                name={`correct-${q.id}`}
                checked={q.correctIndex === i}
                onChange={() => onChange({ correctIndex: i })}
                className="accent-primary"
              />
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              <input
                value={opt}
                onChange={(e) => setOption(i, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}