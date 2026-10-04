import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Flag, Play } from 'lucide-react';
import type { AnswerResult, FillQuestion, Question, SectionId, SessionRecord } from '../../types';
import { useStore } from '../../store';
import { AREA_MAP } from '../../data/osnova';
import { buildSession } from '../../lib/session';
import { checkFillAnswer } from '../../lib/answers';
import { uid } from '../../lib/random';
import { correctAnswerText, Prompt } from '../../components/questions';
import { Button, Card, Modal, PageHeader, Pct, Segmented, Tag, Toggle, cx } from '../../components/ui';
import { Countdown } from '../site/SiteOral';

type Answer = string | number | boolean | undefined;

const TYPES = ['abc', 'truefalse', 'fill', 'identifyTerm'] as const;

function isCorrect(q: Question, a: Answer): boolean {
  if (a === undefined || a === '') return false;
  if (q.type === 'abc') return a === q.correctIndex;
  if (q.type === 'truefalse') return a === q.isTrue;
  if (q.type === 'fill' || q.type === 'identifyTerm') return checkFillAnswer(q as FillQuestion, String(a));
  return false;
}

const gradeOf = (p: number) => (p >= 0.88 ? 1 : p >= 0.72 ? 2 : p >= 0.55 ? 3 : p >= 0.4 ? 4 : 5);

export function HwTest() {
  const [cfg, setCfg] = useState<{ count: number; calc: boolean; minutes: number } | null>(null);
  const [runKey, setRunKey] = useState(0);
  if (cfg) return <TestRun key={runKey} {...cfg} onAgain={() => (setRunKey((k) => k + 1), setCfg(null))} />;
  return <TestSetup onStart={setCfg} />;
}

function TestSetup({ onStart }: { onStart: (c: { count: number; calc: boolean; minutes: number }) => void }) {
  const { data } = useStore();
  const [count, setCount] = useState(30);
  const [calc, setCalc] = useState(true);
  const [timed, setTimed] = useState(true);
  const last = data.sessions.filter((s) => s.mode === 'hw-test').slice(0, 5);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Cvičný test – hardware" emoji="📝" sub="Technické vybavení počítačů · písemný test ve stylu Moodlu" />
      <Card className="p-6">
        <h2 className="font-bold">Jak test probíhá</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-slate-600 dark:text-slate-300">
          <li>Časový limit 60 minut, jako u zkoušky.</li>
          <li>Otázky výběrové, pravda/nepravda a s krátkou odpovědí (pojem, číslo, převod).</li>
          <li>Mezi otázkami můžeš libovolně přecházet, vracet se a označit si je vlaječkou.</li>
          <li>Správnost uvidíš až po odevzdání – s vysvětlením ke každé otázce.</li>
        </ul>
        <div className="mt-5 space-y-4">
          <div>
            <div className="mb-1 text-sm font-semibold">Počet otázek</div>
            <Segmented value={count} onChange={setCount} options={[20, 30, 40].map((n) => ({ value: n, label: String(n) }))} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Toggle checked={calc} onChange={setCalc} label="Včetně převodů a výpočtů" />
            <Toggle checked={timed} onChange={setTimed} label="Časový limit 60 min" />
          </div>
        </div>
        <Button size="lg" className="mt-6 w-full" icon={<Play size={18} />} onClick={() => onStart({ count, calc, minutes: timed ? 60 : 0 })}>
          Zahájit pokus
        </Button>
      </Card>
      {last.length > 0 && (
        <Card className="mt-5 p-5">
          <h2 className="mb-2 font-bold">Předchozí pokusy</h2>
          <ul className="space-y-1 text-sm">
            {last.map((s) => (
              <li key={s.id} className="flex justify-between">
                <span>{new Date(s.date).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span className="font-semibold">
                  <Pct value={s.score} /> · známka {gradeOf(s.score)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function TestRun({ count, calc, minutes, onAgain }: { count: number; calc: boolean; minutes: number; onAgain: () => void }) {
  const { data, recordAnswer, recordSession } = useStore();
  const [qs] = useState<Question[]>(() =>
    buildSession(data, { title: '', mode: 'hw-test', difficulty: 'medium', bookIds: [], areas: [], types: [...TYPES], count, subject: 'hw', site: { calc } }),
  );
  const [answers, setAnswers] = useState<Answer[]>(() => qs.map(() => undefined));
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [i, setI] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [finished, setFinished] = useState(false);
  const startedAt = useRef(Date.now());
  const saved = useRef(false);

  const finish = useCallback(() => {
    setConfirm(false);
    setFinished(true);
  }, []);

  // Automatické odevzdání po vypršení času
  useEffect(() => {
    if (!minutes || finished) return;
    const t = setInterval(() => {
      if (Date.now() - startedAt.current >= minutes * 60000) finish();
    }, 1000);
    return () => clearInterval(t);
  }, [minutes, finished, finish]);

  const results = useMemo(() => qs.map((q, k) => isCorrect(q, answers[k])), [qs, answers]);

  useEffect(() => {
    if (!finished || saved.current || !qs.length) return;
    saved.current = true;
    const seconds = Math.round((Date.now() - startedAt.current) / 1000);
    const sections: Partial<Record<SectionId, { score: number; total: number }>> = {};
    qs.forEach((q, k) => {
      const r: AnswerResult = { questionId: q.id, score: results[k] ? 1 : 0, userAnswer: answers[k] === undefined ? '(bez odpovědi)' : String(answers[k]), seconds: seconds / qs.length, dontKnow: answers[k] === undefined };
      recordAnswer(q, r);
      const sec = AREA_MAP[q.area].section;
      const s = sections[sec] ?? { score: 0, total: 0 };
      s.score += r.score;
      s.total += 1;
      sections[sec] = s;
    });
    const score = results.filter(Boolean).length / qs.length;
    const rec: SessionRecord = {
      id: uid(),
      date: Date.now(),
      mode: 'hw-test',
      title: `Cvičný test – hardware (${qs.length} otázek)`,
      difficulty: 'medium',
      total: qs.length,
      score,
      seconds,
      bookIds: [...new Set(qs.map((q) => q.bookId))],
      sections: Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, { score: v!.score / v!.total, total: v!.total }])),
    };
    recordSession(rec, 60);
  }, [finished, qs, answers, results, recordAnswer, recordSession]);

  if (!qs.length) return <Card className="p-6">Nepodařilo se sestavit test.</Card>;

  const setAnswer = (v: Answer) => setAnswers((a) => a.map((x, k) => (k === i ? v : x)));
  const unanswered = answers.filter((a) => a === undefined || a === '').length;

  if (finished) {
    const correct = results.filter(Boolean).length;
    const p = correct / qs.length;
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-brand-700 to-brand-950 p-6 text-white sm:p-8">
            <div className="text-sm text-brand-200">Cvičný test – Technické vybavení počítačů</div>
            <div className="mt-2 flex items-end gap-4">
              <div className="text-6xl font-extrabold">{gradeOf(p)}</div>
              <div className="pb-2">
                <div className="text-lg font-bold">
                  {correct} / {qs.length} bodů · <Pct value={p} />
                </div>
                <div className="text-brand-100">orientační známka – skutečnou stupnici určuje škola</div>
              </div>
            </div>
          </div>
        </Card>
        <div className="space-y-3">
          {qs.map((q, k) => (
            <Card key={q.id + k} className={cx('p-5', results[k] ? 'border-emerald-300 dark:border-emerald-800' : 'border-rose-300 dark:border-rose-900')}>
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
                <span>{results[k] ? '✅' : '❌'}</span> Otázka {k + 1}
              </div>
              <p className="whitespace-pre-line font-medium">{q.prompt}</p>
              <div className="mt-2 text-sm">
                <span className="text-slate-500">Tvoje odpověď: </span>
                <b>{answerText(q, answers[k])}</b>
              </div>
              {!results[k] && (
                <div className="mt-1 text-sm">
                  <span className="text-slate-500">Správně: </span>
                  <b className="text-emerald-700 dark:text-emerald-400">{correctAnswerText(q)}</b>
                </div>
              )}
              {q.explanation && <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">{q.explanation}</p>}
            </Card>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onAgain}>Nový pokus</Button>
          <Button variant="secondary" to="/hw">
            Zpět na hardware
          </Button>
        </div>
      </div>
    );
  }

  const q = qs[i];
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-bold">Cvičný test – hardware</h1>
        <span className="ml-auto text-sm text-slate-500">{minutes ? <Countdown since={startedAt.current} seconds={minutes * 60} /> : 'bez limitu'}</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_15rem]">
        <Card className="p-5 sm:p-7">
          <div className="mb-3 flex items-center gap-2">
            <Tag tone="brand">
              Otázka {i + 1} z {qs.length}
            </Tag>
            <Tag>{answers[i] === undefined || answers[i] === '' ? 'Dosud nezodpovězeno' : 'Zodpovězeno'}</Tag>
            <button
              onClick={() =>
                setFlags((f) => {
                  const n = new Set(f);
                  if (n.has(i)) n.delete(i);
                  else n.add(i);
                  return n;
                })
              }
              className={cx('ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold', flags.has(i) ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800')}
            >
              <Flag size={15} /> {flags.has(i) ? 'Označeno' : 'Označit otázku'}
            </button>
          </div>
          <TestQuestion key={i} q={q} value={answers[i]} onChange={setAnswer} />
          <div className="mt-6 flex justify-between gap-2">
            <Button variant="secondary" icon={<ArrowLeft size={16} />} disabled={i === 0} onClick={() => setI(i - 1)}>
              Předchozí
            </Button>
            {i + 1 < qs.length ? (
              <Button icon={<ArrowRight size={16} />} onClick={() => setI(i + 1)}>
                Další stránka
              </Button>
            ) : (
              <Button onClick={() => setConfirm(true)}>Dokončit pokus…</Button>
            )}
          </div>
        </Card>
        <Card className="h-fit p-4">
          <div className="mb-2 text-sm font-semibold">Navigace v testu</div>
          <div className="grid grid-cols-6 gap-1.5 lg:grid-cols-5">
            {qs.map((_, k) => {
              const answered = answers[k] !== undefined && answers[k] !== '';
              return (
                <button
                  key={k}
                  onClick={() => setI(k)}
                  aria-label={`Otázka ${k + 1}`}
                  className={cx(
                    'relative h-9 rounded-md border text-sm font-semibold tabular-nums',
                    k === i ? 'border-brand-600 ring-2 ring-brand-500/40' : 'border-slate-300 dark:border-slate-700',
                    answered ? 'bg-slate-200 dark:bg-slate-700' : 'bg-white dark:bg-slate-900',
                  )}
                >
                  {k + 1}
                  {flags.has(k) && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-500" />}
                </button>
              );
            })}
          </div>
          <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => setConfirm(true)}>
            Dokončit pokus…
          </Button>
        </Card>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Odevzdat test?">
        <p>
          Nezodpovězeno: <b>{unanswered}</b> z {qs.length}. Označeno vlaječkou: <b>{flags.size}</b>.
        </p>
        <p className="mt-1 text-sm text-slate-500">Po odevzdání už odpovědi nepůjde změnit.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirm(false)}>
            Vrátit se k testu
          </Button>
          <Button onClick={finish}>Odevzdat vše a ukončit</Button>
        </div>
      </Modal>
    </div>
  );
}

function answerText(q: Question, a: Answer): string {
  if (a === undefined || a === '') return '—';
  if (q.type === 'abc') return q.options[a as number] ?? '—';
  if (q.type === 'truefalse') return a ? 'Pravda' : 'Nepravda';
  return String(a);
}

function TestQuestion({ q, value, onChange }: { q: Question; value: Answer; onChange: (v: Answer) => void }) {
  if (q.type === 'abc') {
    return (
      <div>
        <div className="mb-4">
          <Prompt text={q.prompt} />
        </div>
        <p className="mb-2 text-sm text-slate-500">Vyberte jednu odpověď:</p>
        <div className="space-y-2">
          {q.options.map((o, k) => (
            <label key={k} className={cx('flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition', value === k ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800')}>
              <input type="radio" name={q.id} checked={value === k} onChange={() => onChange(k)} className="mt-1" />
              <span>
                <b className="mr-1">{String.fromCharCode(97 + k)}.</b> {o}
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  }
  if (q.type === 'truefalse') {
    return (
      <div>
        <div className="mb-4">
          <Prompt text={q.prompt} />
        </div>
        <p className="mb-2 text-sm text-slate-500">Je tvrzení pravdivé?</p>
        <div className="flex flex-wrap gap-2">
          {[
            [true, 'Pravda'],
            [false, 'Nepravda'],
          ].map(([v, l]) => (
            <label key={String(v)} className={cx('flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5', value === v ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15' : 'border-slate-200 dark:border-slate-800')}>
              <input type="radio" name={q.id} checked={value === v} onChange={() => onChange(v as boolean)} />
              {l as string}
            </label>
          ))}
        </div>
      </div>
    );
  }
  const f = q as FillQuestion;
  return (
    <div>
      <div className="mb-4">
        <Prompt text={q.prompt} />
      </div>
      <label className="mt-2 block text-sm text-slate-500" htmlFor={`a-${q.id}`}>
        {f.inputLabel ?? 'Odpověď'}:
      </label>
      <input
        id={`a-${q.id}`}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        className={cx('mt-1 w-full max-w-md rounded-xl border border-slate-300 bg-white px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900', f.exact && 'font-mono')}
      />
    </div>
  );
}
