import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle2, ChevronDown, ChevronRight, Folder, MousePointerClick, RotateCcw } from 'lucide-react';
import type { FlashcardQuestion, SessionRecord } from '../../types';
import { CLICK_GROUPS, CLICK_TASKS, SHOT_URL } from '../../data/site/clicks';
import { SHOT_H, SHOT_W, answerLabel, checkChecks, checkChoice, checkInput, checkShot, clickScore, type ClickStep, type ClickTask } from '../../lib/clicks';
import { uid } from '../../lib/random';
import { useStore } from '../../store';
import { Button, Card, Tag, cx } from '../../components/ui';

const doneKey = (id: string) => `site-klik-${id}`;

/** Seznam úloh klikacího tréninku, nebo běžící úloha (?uloha=) */
export function ClickTab() {
  const [params, setParams] = useSearchParams();
  const { data } = useStore();
  const taskId = params.get('uloha');
  const task = taskId ? CLICK_TASKS.find((t) => t.id === taskId) : undefined;
  const done = useMemo(() => new Set(data.sessions.filter((s) => s.mode === 'site-klikani').flatMap((s) => s.bookIds)), [data.sessions]);
  const open = (id: string | null) => setParams(id ? { tab: 'klikani', uloha: id } : { tab: 'klikani' });

  if (task) {
    const next = CLICK_TASKS[(CLICK_TASKS.indexOf(task) + 1) % CLICK_TASKS.length];
    return <ClickRun key={task.id} task={task} onBack={() => open(null)} onNext={() => open(next.id)} />;
  }
  const count = CLICK_TASKS.filter((t) => done.has(doneKey(t.id))).length;
  return (
    <div>
      <Card className="mb-4 p-5">
        <h2 className="flex items-center gap-2 font-bold">
          <MousePointerClick size={20} /> Klikací trénink – Windows Server přes GUI
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Krok po kroku klikáš tam, kam bys klikal na serveru. Úlohy se snímky jsou ze skutečných obrazovek z hodiny 1. 10.; ostatní ukazují zjednodušené okno se skutečnými českými popisky (vidíš jen
          výběr položek). Za chybné kliknutí dostaneš vysvětlení, po dvou chybách se ukáže správná položka.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Tag tone="emerald">
            Splněno {count}/{CLICK_TASKS.length}
          </Tag>
          <Tag>
            <Camera size={13} className="mr-1 inline" />
            {CLICK_TASKS.filter((t) => t.shots).length} úloh se snímky
          </Tag>
        </div>
      </Card>
      {CLICK_GROUPS.map((g) => (
        <section key={g} className="mb-5">
          <h3 className="mb-2 font-display text-lg font-bold">{g}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {CLICK_TASKS.filter((t) => t.group === g).map((t) => (
              <button key={t.id} onClick={() => open(t.id)} className="card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start gap-2">
                  <span className="font-bold">{t.title}</span>
                  {done.has(doneKey(t.id)) && <CheckCircle2 className="ml-auto shrink-0 text-emerald-600" size={20} />}
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.goal}</p>
                <div className="mt-2 text-xs text-slate-400">
                  {t.steps.length} kroků{t.shots ? ' · skutečné snímky' : ''}
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

type Feedback = { ok: boolean; picked?: string; text?: string } | null;

function ClickRun({ task, onBack, onNext }: { task: ClickTask; onBack: () => void; onNext: () => void }) {
  const { recordAnswer, recordSession } = useStore();
  const [i, setI] = useState(0);
  const [mistakes, setMistakes] = useState<number[]>(() => task.steps.map(() => 0));
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [checks, setChecks] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [finished, setFinished] = useState(false);
  const [busy, setBusy] = useState(false);
  const recorded = useRef(false);
  const askRef = useRef<HTMLDivElement>(null);
  const step = task.steps[i];
  // na mobilu po každém kroku posunout zadání kroku nahoru, aby bylo vidět celé okno
  useEffect(() => {
    if (i > 0) askRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [i]);
  const wrongHere = mistakes[i] ?? 0;
  const revealed = wrongHere >= 2;

  const finish = (m: number[]) => {
    setFinished(true);
    if (recorded.current) return;
    recorded.current = true;
    const score = clickScore(m);
    const q: FlashcardQuestion = {
      id: `click|${task.id}`,
      bookId: 'site-postupy-windows',
      area: 'it-postupy',
      factKey: `click-${task.id}`,
      difficulty: 'medium',
      type: 'flashcard',
      prompt: task.title,
      explanation: task.steps.map((s) => `${s.ask} → ${answerLabel(s)}`).join('\n'),
      answer: task.steps.map((s) => answerLabel(s)).join(' → '),
    };
    recordAnswer(q, {
      questionId: q.id,
      score,
      userAnswer: '(klikání)',
      seconds: 0,
    });
    const rec: SessionRecord = {
      id: uid(),
      date: Date.now(),
      mode: 'site-klikani',
      title: `Klikací trénink: ${task.title}`,
      difficulty: 'medium',
      total: m.length,
      score,
      seconds: 0,
      bookIds: ['site-postupy-windows', doneKey(task.id)],
      sections: { 'it-prakticke': { score, total: m.length } },
    };
    recordSession(rec, 10 + Math.round(20 * score));
  };

  const advance = () => {
    setFeedback(null);
    setChecks([]);
    setInput('');
    setBusy(false);
    if (i + 1 >= task.steps.length) finish(mistakes);
    else setI(i + 1);
  };

  const judge = (ok: boolean, picked?: string) => {
    if (busy) return;
    if (ok) {
      setBusy(true);
      setFeedback({ ok: true, picked });
      setTimeout(advance, 450);
      return;
    }
    const m = [...mistakes];
    m[i] = (m[i] ?? 0) + 1;
    setMistakes(m);
    setFeedback({ ok: false, picked, text: step.hint });
  };

  const restart = () => {
    setI(0);
    setMistakes(task.steps.map(() => 0));
    setFeedback(null);
    setChecks([]);
    setInput('');
    setFinished(false);
    setBusy(false);
    recorded.current = false;
  };

  if (finished) return <ClickSummary task={task} mistakes={mistakes} onBack={onBack} onNext={onNext} onRestart={restart} />;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-400">
        <ArrowLeft size={16} /> Všechny úlohy
      </button>
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-bold">{task.title}</h2>
          <span className="ml-auto">
            <Tag>
              krok {i + 1}/{task.steps.length}
            </Tag>
          </span>
        </div>
        {i === 0 && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{task.goal}</p>}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full bg-brand-500 transition-all" style={{ width: `${(i / task.steps.length) * 100}%` }} />
        </div>
      </Card>

      <div ref={askRef} className="scroll-mt-20 rounded-xl bg-brand-50 px-4 py-3 text-[15px] font-semibold text-brand-900 dark:bg-brand-500/15 dark:text-brand-100">
        {step.ask}
        {step.right && <span className="ml-1 font-normal text-brand-700 dark:text-brand-300">(pravým tlačítkem)</span>}
        {feedback?.ok && <span className="ml-2 text-emerald-600 dark:text-emerald-400">✓ Správně</span>}
      </div>

      {feedback && !feedback.ok && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
          <b>Tudy ne.</b> {feedback.text ?? 'Zkus to znovu.'}
          {revealed && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span>
                Správně: <b>{answerLabel(step)}</b>
              </span>
              <Button size="sm" onClick={advance}>
                Pokračovat
              </Button>
            </div>
          )}
        </div>
      )}

      {step.kind === 'shot' ? (
        <ShotView step={step} feedback={feedback} revealed={revealed} onClick={(x, y) => judge(checkShot(step, x, y, 14))} />
      ) : (
        <MockWindow
          step={step}
          feedback={feedback}
          revealed={revealed}
          checks={checks}
          input={input}
          onPick={(v) => judge(checkChoice(step, v), v)}
          onToggle={(v) => setChecks((c) => (c.includes(v) ? c.filter((x) => x !== v) : [...c, v]))}
          onConfirmChecks={() => judge(checkChecks(step, checks))}
          onInput={setInput}
          onConfirmInput={() => judge(checkInput(step, input), input)}
        />
      )}
    </div>
  );
}

// ---------- zjednodušené okno Windows ----------

const isPicked = (f: Feedback, v: string) => f?.picked === v;

function MockWindow({
  step,
  feedback,
  revealed,
  checks,
  input,
  onPick,
  onToggle,
  onConfirmChecks,
  onInput,
  onConfirmInput,
}: {
  step: ClickStep;
  feedback: Feedback;
  revealed: boolean;
  checks: string[];
  input: string;
  onPick: (v: string) => void;
  onToggle: (v: string) => void;
  onConfirmChecks: () => void;
  onInput: (v: string) => void;
  onConfirmInput: () => void;
}) {
  const opts = step.options ?? [];
  const tone = (v: string) =>
    isPicked(feedback, v)
      ? feedback!.ok
        ? 'bg-[#cfe9d4] hover:bg-[#cfe9d4] outline outline-1 outline-[#2e8b57]'
        : 'bg-[#f9d7d7] hover:bg-[#f9d7d7] outline outline-1 outline-[#c0392b]'
      : revealed && step.answer === v
        ? 'outline outline-2 outline-[#0067c0]'
        : '';
  const item = 'block w-full text-left px-2 py-1 rounded-sm hover:bg-[#cce8ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0067c0]';

  let body;
  switch (step.kind) {
    case 'menu':
      body =
        step.window === 'Správce serveru' ? (
          <div className="flex flex-wrap items-center gap-1 bg-[#2b2b2b] px-3 py-3 text-white">
            <span className="mr-auto text-lg font-light">Správce serveru ▸ Řídicí panel</span>
            {opts.map((o) => (
              <button
                key={o}
                onClick={() => onPick(o)}
                className={cx(
                  'rounded-sm px-2 py-1 text-[13px] hover:bg-[#0067c0]',
                  isPicked(feedback, o) && (feedback!.ok ? 'bg-[#2e8b57]' : 'bg-[#c0392b]'),
                  revealed && step.answer === o && 'outline outline-2 outline-white',
                )}
              >
                {o}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1 border-b border-[#ddd] bg-[#f3f3f3] px-2 py-1">
            {opts.map((o) => (
              <button key={o} onClick={() => onPick(o)} className={cx('rounded-sm px-2 py-0.5 hover:bg-[#cce8ff]', tone(o))}>
                {o}
              </button>
            ))}
          </div>
        );
      break;
    case 'tree':
      body = (
        <div className="p-2">
          {(step.path ?? []).map((p, k) => (
            <div key={k} className="flex items-center gap-1 py-0.5 text-[#333]" style={{ paddingLeft: k * 14 }}>
              <ChevronDown size={13} />
              <Folder size={14} className="text-[#d9a429]" />
              {p}
            </div>
          ))}
          {opts.map((o) => (
            <button key={o} onClick={() => onPick(o)} className={cx(item, 'flex items-center gap-1', tone(o))} style={{ paddingLeft: (step.path?.length ?? 0) * 14 + 8 }}>
              <ChevronRight size={13} />
              <Folder size={14} className="text-[#d9a429]" />
              {o}
            </button>
          ))}
        </div>
      );
      break;
    case 'context':
    case 'list':
      body = (
        <div className={cx('p-2', step.kind === 'context' && 'mx-3 my-3 max-w-md rounded border border-[#ccc] bg-white shadow-lg')}>
          {opts.map((o) => (
            <button key={o} onClick={() => onPick(o)} className={cx(item, 'break-words', tone(o))}>
              {o}
            </button>
          ))}
        </div>
      );
      break;
    case 'tabs':
      body = (
        <div className="p-3">
          <div className="flex flex-wrap border-b border-[#ccc]">
            {opts.map((o) => (
              <button key={o} onClick={() => onPick(o)} className={cx('-mb-px border border-[#ccc] bg-[#f6f6f6] px-2 py-1 hover:bg-[#e5f1fb]', tone(o))}>
                {o}
              </button>
            ))}
          </div>
          <div className="h-16 border border-t-0 border-[#ccc] bg-white" />
        </div>
      );
      break;
    case 'buttons':
      body = (
        <div className="flex flex-wrap justify-end gap-2 p-3">
          {opts.map((o) => (
            <button key={o} onClick={() => onPick(o)} className={cx('min-w-[5.5rem] rounded-sm border border-[#adadad] bg-[#e1e1e1] px-3 py-1 hover:border-[#0078d7] hover:bg-[#e5f1fb]', tone(o))}>
              {o}
            </button>
          ))}
        </div>
      );
      break;
    case 'radio':
      body = (
        <div className="space-y-1 p-3">
          {opts.map((o) => (
            <button key={o} onClick={() => onPick(o)} className={cx(item, 'flex items-start gap-2', tone(o))}>
              <span className="mt-[3px] inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-[#333] bg-white" />
              <span className="break-words">{o}</span>
            </button>
          ))}
        </div>
      );
      break;
    case 'check':
      body = (
        <div className="p-3">
          <div className="max-h-72 overflow-y-auto border border-[#ccc] bg-white p-1">
            {opts.map((o) => {
              const on = checks.includes(o);
              const shouldBe = revealed && Array.isArray(step.answer) && step.answer.includes(o);
              return (
                <button key={o} onClick={() => onToggle(o)} className={cx(item, 'flex items-start gap-2', shouldBe && 'outline outline-2 outline-[#0067c0]')}>
                  <span className={cx('mt-[3px] grid h-3.5 w-3.5 shrink-0 place-items-center border text-[10px] leading-none', on ? 'border-[#0067c0] bg-[#0067c0] text-white' : 'border-[#333] bg-white')}>
                    {on ? '✓' : ''}
                  </span>
                  <span className="break-words">{o}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={onConfirmChecks} className="min-w-[5.5rem] rounded-sm border border-[#0078d7] bg-[#e5f1fb] px-3 py-1">
              Další &gt;
            </button>
          </div>
        </div>
      );
      break;
    case 'input':
      body = (
        <form
          className="p-3"
          onSubmit={(e) => {
            e.preventDefault();
            onConfirmInput();
          }}
        >
          <label className="block">
            <span className="mb-1 block">{step.label}</span>
            <input
              value={input}
              onChange={(e) => onInput(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className={cx(
                'w-full rounded-sm border border-[#7a7a7a] bg-white px-2 py-1 font-mono text-[14px] text-black outline-none focus:border-[#0078d7]',
                feedback && !feedback.ok && 'border-[#c0392b]',
              )}
            />
          </label>
          <div className="mt-3 flex justify-end">
            <button type="submit" className="min-w-[5.5rem] rounded-sm border border-[#0078d7] bg-[#e5f1fb] px-3 py-1">
              OK
            </button>
          </div>
        </form>
      );
      break;
    default:
      body = null;
  }

  return (
    <div className="overflow-hidden rounded-md border border-[#bcbcbc] bg-white text-[13px] text-[#1b1b1b] shadow-lg" style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
      <div className="flex items-center gap-2 border-b border-[#e5e5e5] bg-white px-3 py-1.5 text-[12px] text-[#333]">
        <span className="min-w-0 flex-1 truncate">{step.window}</span>
        <span className="tracking-[0.6em] text-[#666]" aria-hidden>
          — ☐ ✕
        </span>
      </div>
      <div className="bg-[#f0f0f0]">{body}</div>
    </div>
  );
}

// ---------- skutečný snímek ----------

function ShotView({ step, feedback, revealed, onClick }: { step: ClickStep; feedback: Feedback; revealed: boolean; onClick: (x: number, y: number) => void }) {
  const [mark, setMark] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(() => typeof window !== 'undefined' && window.innerWidth < 700);
  const url = SHOT_URL[step.shot ?? ''];
  const click = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * SHOT_W;
    const y = ((e.clientY - r.top) / r.height) * SHOT_H;
    setMark({ x, y });
    onClick(x, y);
  };
  return (
    <div className="overflow-hidden rounded-md border border-[#bcbcbc] shadow-lg">
      <div className="overflow-x-auto">
        <div className="relative cursor-pointer select-none" style={{ width: zoom ? '200%' : '100%' }} onClick={click} role="button" aria-label="Snímek obrazovky – klikni na správné místo">
          <img src={url} alt="" width={SHOT_W} height={SHOT_H} className="block h-auto w-full" draggable={false} />
          {mark && feedback && (
            <span
              className={cx(
                'pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2',
                feedback.ok ? 'border-emerald-500 bg-emerald-400/40' : 'border-rose-500 bg-rose-400/40',
              )}
              style={{
                left: `${(mark.x / SHOT_W) * 100}%`,
                top: `${(mark.y / SHOT_H) * 100}%`,
              }}
            />
          )}
          {revealed &&
            (step.spots ?? []).map(([x, y, w, h], k) => (
              <span
                key={k}
                className="pointer-events-none absolute rounded-sm outline outline-[3px] outline-[#0067c0]"
                style={{
                  left: `${(x / SHOT_W) * 100}%`,
                  top: `${(y / SHOT_H) * 100}%`,
                  width: `${(w / SHOT_W) * 100}%`,
                  height: `${(h / SHOT_H) * 100}%`,
                }}
              />
            ))}
        </div>
      </div>
      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
        <span className="flex-1">
          Skutečná obrazovka z hodiny 1. 10.
          {zoom ? ' – snímek posuneš do stran.' : ''}
        </span>
        <button onClick={() => setZoom((z) => !z)} className="rounded-md px-2 py-1 font-semibold text-brand-600 hover:bg-brand-500/10 dark:text-brand-400">
          {zoom ? 'Celý snímek' : 'Přiblížit 2×'}
        </button>
      </div>
    </div>
  );
}

// ---------- souhrn ----------

function ClickSummary({ task, mistakes, onBack, onNext, onRestart }: { task: ClickTask; mistakes: number[]; onBack: () => void; onNext: () => void; onRestart: () => void }) {
  const score = clickScore(mistakes);
  const pct = Math.round(score * 100);
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 to-brand-900 p-5 text-white">
          <div className="text-3xl">{pct === 100 ? '🏆' : pct >= 60 ? '💪' : '📚'}</div>
          <h2 className="mt-1 font-display text-xl font-bold">{task.title}</h2>
          <div className="mt-2 text-sm text-white/85">
            Napoprvé správně {mistakes.filter((m) => m === 0).length} z {mistakes.length} kroků ({pct} %)
          </div>
        </div>
        <ol className="space-y-2 p-5 text-sm">
          {task.steps.map((s, k) => (
            <li key={k} className="flex gap-2">
              <span className={cx('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white', mistakes[k] ? 'bg-amber-500' : 'bg-emerald-500')}>{k + 1}</span>
              <span>
                <span className="text-slate-500 dark:text-slate-400">{s.kind === 'shot' ? s.ask : s.window}</span> → <b>{answerLabel(s)}</b>
                {mistakes[k] > 0 && <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">({mistakes[k]}× vedle)</span>}
              </span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2 px-5 pb-5">
          <Button size="sm" icon={<RotateCcw size={15} />} variant="secondary" onClick={onRestart}>
            Znovu
          </Button>
          <Button size="sm" onClick={onNext}>
            Další úloha
          </Button>
          <Button size="sm" variant="ghost" onClick={onBack}>
            Všechny úlohy
          </Button>
        </div>
      </Card>
    </div>
  );
}
