import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play, Trophy, Zap } from 'lucide-react';
import type { FillQuestion, SessionRecord } from '../types';
import { useStore } from '../store';
import { GENERATORS, generateCalcQuestions } from '../lib/netgen';
import { HW_GENERATORS, generateHwCalcQuestions } from '../lib/hwgen';
import { checkFillAnswer } from '../lib/answers';
import { pick, uid } from '../lib/random';
import { Button, Card, PageHeader, Segmented, Tag, cx } from '../components/ui';

type Subject = 'site' | 'hw';
const DURATIONS = [60, 120, 300];
const LABEL: Record<Subject, string> = { site: 'Síťové výpočty', hw: 'Převody a jednotky' };

function nextQuestion(subject: Subject, kinds: string[]): FillQuestion {
  const kind = pick(kinds);
  const q = (subject === 'site' ? generateCalcQuestions(1, [kind]) : generateHwCalcQuestions(1, [kind]))[0];
  return q as FillQuestion;
}

const mode = (subject: Subject, sec: number) => `dril-${subject}-${sec}`;

/** Typy s krátkou přesnou odpovědí, které jdou spočítat rychle */
function drillKinds(subject: Subject): string[] {
  const gens = subject === 'site' ? GENERATORS : HW_GENERATORS;
  return Object.keys(gens).filter((k) => !['vlsm', 'split', 'disk-gib', 'framebuffer', 'transfer'].includes(k) && gens[k].gen(0).type === 'fill');
}

export function Drill() {
  const [params, setParams] = useSearchParams();
  const subject: Subject = params.get('predmet') === 'hw' ? 'hw' : 'site';
  const { data } = useStore();
  const [sec, setSec] = useState(60);
  const [running, setRunning] = useState(0);
  const gens = subject === 'site' ? GENERATORS : HW_GENERATORS;
  const allKinds = drillKinds(subject);
  const [kinds, setKinds] = useState<string[]>(allKinds);
  const best = (s: number) =>
    data.sessions.filter((x) => x.mode === mode(subject, s)).reduce((m, x) => Math.max(m, Math.round(x.score * x.total)), 0);

  if (running) return <DrillRun key={running} subject={subject} seconds={sec} kinds={kinds.length ? kinds : allKinds} best={best(sec)} onEnd={() => setRunning(0)} />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Rychlostní dril" emoji="⚡" sub="Kolik příkladů stihneš správně spočítat, než vyprší čas? Výsledky se ukládají jako osobní rekordy." />
      <Card className="space-y-4 p-6">
        <div>
          <div className="mb-1 text-sm font-semibold">Předmět</div>
          <Segmented
            value={subject}
            onChange={(v) => {
              setParams({ predmet: v });
              setKinds(drillKinds(v));
            }}
            options={[
              { value: 'site', label: '🌐 Sítě' },
              { value: 'hw', label: '🖥️ Hardware' },
            ]}
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold">Čas</div>
          <Segmented value={sec} onChange={setSec} options={DURATIONS.map((d) => ({ value: d, label: d < 120 ? `${d} s` : `${d / 60} min` }))} />
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold">Typy příkladů</div>
          <div className="flex flex-wrap gap-1.5">
            {allKinds.map((k) => (
              <button
                key={k}
                onClick={() => setKinds((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]))}
                className={cx('rounded-lg border px-2.5 py-1 text-sm', kinds.includes(k) ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15' : 'border-slate-300 text-slate-500 dark:border-slate-700')}
              >
                {gens[k].label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {DURATIONS.map((d) => (
            <Tag key={d} tone={best(d) ? 'amber' : 'slate'}>
              🏆 {d < 120 ? `${d} s` : `${d / 60} min`}: {best(d) || '—'}
            </Tag>
          ))}
        </div>
        <Button size="lg" className="w-full" icon={<Play size={18} />} disabled={!kinds.length} onClick={() => setRunning(Date.now())}>
          Start – {LABEL[subject]}
        </Button>
      </Card>
    </div>
  );
}

function DrillRun({ subject, seconds, kinds, best, onEnd }: { subject: Subject; seconds: number; kinds: string[]; best: number; onEnd: () => void }) {
  const { recordAnswer, recordSession } = useStore();
  const [q, setQ] = useState(() => nextQuestion(subject, kinds));
  const [value, setValue] = useState('');
  const [left, setLeft] = useState(seconds);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(0);
  const [flash, setFlash] = useState<null | { ok: boolean; answer: string }>(null);
  const [mistakes, setMistakes] = useState<{ q: FillQuestion; given: string }[]>([]);
  const startedAt = useRef(Date.now());
  const qStart = useRef(Date.now());
  const saved = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const over = left <= 0;

  useEffect(() => {
    const t = setInterval(() => setLeft(seconds - Math.floor((Date.now() - startedAt.current) / 1000)), 250);
    return () => clearInterval(t);
  }, [seconds]);

  useEffect(() => {
    if (!over || saved.current) return;
    saved.current = true;
    if (!done) return;
    const rec: SessionRecord = {
      id: uid(),
      date: Date.now(),
      mode: mode(subject, seconds),
      title: `Rychlostní dril – ${LABEL[subject]} (${seconds} s)`,
      difficulty: 'medium',
      total: done,
      score: correct / done,
      seconds,
      bookIds: [`${subject}-vypocty`],
      sections: { 'it-vypocty': { score: correct / done, total: done } },
    };
    recordSession(rec, 10 + correct * 2);
  }, [over, done, correct, subject, seconds, recordSession]);

  const submit = () => {
    if (over || !value.trim()) return;
    const ok = checkFillAnswer(q, value);
    recordAnswer(q, { questionId: q.id, score: ok ? 1 : 0, userAnswer: value.trim(), seconds: (Date.now() - qStart.current) / 1000 });
    setDone((d) => d + 1);
    if (ok) setCorrect((c) => c + 1);
    else setMistakes((m) => [...m, { q, given: value.trim() }]);
    setFlash({ ok, answer: q.answer });
    setValue('');
    setQ(nextQuestion(subject, kinds));
    qStart.current = Date.now();
    input.current?.focus();
  };

  if (over) {
    const record = correct > best;
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Card className="p-6 text-center">
          {record ? <Trophy className="mx-auto text-amber-500" size={40} /> : <Zap className="mx-auto text-brand-500" size={40} />}
          <div className="mt-2 text-5xl font-extrabold">{correct}</div>
          <div className="text-slate-500">
            správně z {done} za {seconds} s
          </div>
          <div className={cx('mt-2 font-semibold', record ? 'text-amber-600' : 'text-slate-500')}>{record ? 'Nový osobní rekord!' : `Rekord: ${best}`}</div>
          <div className="mt-4 flex justify-center gap-2">
            <Button onClick={onEnd}>Znovu</Button>
          </div>
        </Card>
        {mistakes.length > 0 && (
          <Card className="p-5">
            <h2 className="mb-2 font-bold">Chyby</h2>
            <ul className="space-y-3 text-sm">
              {mistakes.map((m, k) => (
                <li key={k}>
                  <div className="font-medium">{m.q.prompt}</div>
                  <div>
                    Tvoje: <span className="text-rose-600">{m.given}</span> · správně: <b className="text-emerald-700 dark:text-emerald-400">{m.q.answer}</b>
                  </div>
                  <div className="whitespace-pre-line text-slate-500">{m.q.explanation}</div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center gap-3">
        <button onClick={onEnd} className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
          Ukončit
        </button>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className={cx('h-full transition-all', left < 10 ? 'bg-rose-500' : 'bg-brand-500')} style={{ width: `${(left / seconds) * 100}%` }} />
        </div>
        <span className="w-12 text-right font-bold tabular-nums">{Math.max(0, left)} s</span>
      </div>
      <div className="mb-3 flex gap-2 text-sm">
        <Tag tone="emerald">✓ {correct}</Tag>
        <Tag tone="rose">✗ {done - correct}</Tag>
        {best > 0 && <Tag tone="amber">🏆 {best}</Tag>}
      </div>
      <Card className="p-6">
        <p className="whitespace-pre-line text-xl font-bold">{q.prompt}</p>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input ref={input} autoFocus value={value} onChange={(e) => setValue(e.target.value)} aria-label="Výsledek" autoComplete="off" className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-lg dark:border-slate-700 dark:bg-slate-900" />
          <Button type="submit" size="lg">
            OK
          </Button>
        </form>
        {flash && (
          <p key={done} className={cx('animate-pop mt-3 font-semibold', flash.ok ? 'text-emerald-600' : 'text-rose-600')}>
            {flash.ok ? '✓ Správně' : `✗ Správně bylo: ${flash.answer}`}
          </p>
        )}
      </Card>
    </div>
  );
}
