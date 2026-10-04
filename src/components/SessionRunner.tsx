import { itemLabel } from '../lib/topicgen';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Flag, RotateCcw, Timer, X } from 'lucide-react';
import type { AnswerResult, Difficulty, Question, SectionId, SessionRecord } from '../types';
import { AREA_MAP, SECTIONS, SECTION_ORDER } from '../data/osnova';
import { useStore } from '../store';
import { uid } from '../lib/random';
import { TYPE_INFO } from '../lib/session';
import { QuestionBody, correctAnswerText } from './questions';
import { Button, Card, Modal, ProgressBar, Tag, cx, formatDuration } from './ui';

interface Props {
  questions: Question[];
  title: string;
  mode: string;
  difficulty: Difficulty;
  showSections?: boolean;
  onRestart?: (qs: Question[]) => void;
}

export function bookLabel(bookId: string, books: { id: string; title: string }[]): string {
  if (bookId === 'global') return 'Více děl';
  if (bookId === 'terms') return 'Literární pojmy';
  if (bookId.startsWith('nonart')) return 'Neumělecký text';
  if (/^(site|hw|cloud)-/.test(bookId)) return itemLabel(bookId) ?? 'IT předmět';
  return books.find((b) => b.id === bookId)?.title ?? 'Kniha';
}

export function SessionRunner({ questions, title, mode, difficulty, showSections, onRestart }: Props) {
  const { data, recordAnswer, recordSession, addUnknown } = useStore();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [finished, setFinished] = useState(false);
  const startedAt = useRef(Date.now());
  const qStart = useRef(Date.now());
  const saved = useRef(false);

  const q = questions[index];
  const current = results[index] ?? null;

  useEffect(() => {
    qStart.current = Date.now();
  }, [index]);

  const submit = useCallback(
    (r: Omit<AnswerResult, 'questionId' | 'seconds'>) => {
      if (!q || results.length > index) return;
      const full: AnswerResult = { ...r, questionId: q.id, seconds: (Date.now() - qStart.current) / 1000 };
      setResults((prev) => [...prev, full]);
      recordAnswer(q, full);
    },
    [q, index, results.length, recordAnswer],
  );

  const next = useCallback(() => {
    if (index + 1 >= questions.length) setFinished(true);
    else setIndex((i) => i + 1);
  }, [index, questions.length]);

  // Enter = pokračovat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // na tlačítku by Enter spustil i jeho kliknutí → dvojí posun
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement) return;
      if (e.key === 'Enter' && current && !finished) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, finished, next]);

  const sectionScores = useMemo(() => {
    const acc: Partial<Record<SectionId, { score: number; total: number }>> = {};
    results.forEach((r, i) => {
      const sec = AREA_MAP[questions[i].area].section;
      const a = acc[sec] ?? { score: 0, total: 0 };
      a.score += r.score;
      a.total += 1;
      acc[sec] = a;
    });
    return acc;
  }, [results, questions]);

  const finish = useCallback(() => {
    setFinished(true);
  }, []);

  useEffect(() => {
    if (!finished || saved.current || !results.length) return;
    saved.current = true;
    const total = results.length;
    const score = results.reduce((s, r) => s + r.score, 0) / total;
    const rec: SessionRecord = {
      id: uid(),
      date: Date.now(),
      mode,
      title,
      difficulty,
      total,
      score,
      seconds: Math.round((Date.now() - startedAt.current) / 1000),
      bookIds: [...new Set(questions.slice(0, total).map((x) => x.bookId))],
      sections: Object.fromEntries(Object.entries(sectionScores).map(([k, v]) => [k, { score: v!.score / v!.total, total: v!.total }])),
    };
    recordSession(rec, 20 + (score >= 0.999 && total >= 8 ? 30 : 0));
  }, [finished, results, mode, title, difficulty, questions, sectionScores, recordSession]);

  if (!questions.length) {
    return (
      <Card className="p-8 text-center">
        <div className="text-4xl">🤷</div>
        <h2 className="mt-2 text-xl font-bold">Pro zvolené nastavení nejsou k dispozici žádné otázky</h2>
        <p className="mt-1 text-slate-500">Zkus vybrat jiné knihy, oblasti nebo typy otázek.</p>
        <Button className="mt-4" onClick={() => navigate('/trenink')}>
          Zpět na výběr tréninku
        </Button>
      </Card>
    );
  }

  if (finished) {
    return <Summary questions={questions.slice(0, results.length)} results={results} title={title} showSections={showSections} sectionScores={sectionScores} startedAt={startedAt.current} onRestart={onRestart} />;
  }

  const answered = !!current;
  const correct = current ? current.score >= 0.85 : false;
  const partial = current ? current.score > 0 && current.score < 0.85 : false;
  const selfRated = q.type === 'flashcard' || q.type === 'open' || q.type === 'speech';

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => (results.length ? finish() : navigate(-1))} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Ukončit">
          <X size={22} />
        </button>
        <ProgressBar value={(index + (answered ? 1 : 0)) / questions.length} color="bg-brand-500" height="h-2.5" />
        <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-500">
          {index + 1}/{questions.length}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <Tag tone="brand">{TYPE_INFO[q.type].short}</Tag>
        <Tag>{bookLabel(q.bookId, data.books)}</Tag>
        <Tag tone="violet">{AREA_MAP[q.area].short}</Tag>
        <span className="ml-auto hidden text-slate-500 sm:inline">{title}</span>
      </div>

      <Card className="p-5 sm:p-7" key={index}>
        {q.passage && (
          <div className="mb-5 space-y-3">
            {q.passage.map((p) => (
              <div key={p.label} className="rounded-xl border-l-4 border-brand-400 bg-slate-50 p-4 dark:bg-slate-800/60">
                <div className="mb-1 text-xs font-semibold uppercase text-slate-500">{p.label}</div>
                <p className="whitespace-pre-line text-[15px] leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        )}
        <QuestionBody q={q} result={current} onSubmit={submit} />

        {!answered && !selfRated && (
          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                submit({ score: 0, userAnswer: '(neumím)', dontKnow: true });
              }}
              className="text-sm font-semibold text-rose-600 hover:underline dark:text-rose-400"
            >
              ❌ Neumím – ukaž odpověď a přidej do „Musím se doučit“
            </button>
          </div>
        )}
      </Card>

      {answered && (
        <div
          className={cx(
            'animate-fade-up mt-4 rounded-2xl border-2 p-5',
            selfRated
              ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
              : correct
                ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-500/10'
                : partial
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-500/10'
                  : 'border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-500/10',
          )}
        >
          {!selfRated && (
            <div className="text-lg font-bold">
              {correct ? '✅ Správně!' : partial ? `🟡 Částečně správně (${Math.round(current!.score * 100)} %)` : current!.dontKnow ? '📌 Přidáno do „Musím se doučit“' : '❌ Špatně'}
            </div>
          )}
          {!selfRated && !correct && (
            <div className="mt-2">
              <div className="text-xs font-semibold uppercase text-slate-500">Správná odpověď</div>
              <p className="whitespace-pre-line font-semibold">{correctAnswerText(q)}</p>
            </div>
          )}
          {q.type !== 'open' && q.type !== 'speech' && q.explanation && (
            <div className="mt-2">
              <div className="text-xs font-semibold uppercase text-slate-500">Vysvětlení</div>
              <p className="whitespace-pre-line text-[15px] leading-relaxed">{q.explanation}</p>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={next} icon={index + 1 >= questions.length ? <Flag size={18} /> : <ArrowRight size={18} />} className="flex-1 sm:flex-none">
              {index + 1 >= questions.length ? 'Dokončit a zobrazit výsledky' : 'Pokračovat'}
            </Button>
            {!data.unknown[q.id] && current!.score >= 0.5 && (
              <Button variant="ghost" onClick={() => addUnknown(q)}>
                Přesto přidat do „Musím se doučit“
              </Button>
            )}
          </div>
          <p className="mt-2 hidden text-xs text-slate-500 sm:block">Tip: pokračovat můžeš i klávesou Enter.</p>
        </div>
      )}
    </div>
  );
}

// ---------- Souhrn ----------

function Summary({
  questions,
  results,
  title,
  showSections,
  sectionScores,
  startedAt,
  onRestart,
}: {
  questions: Question[];
  results: AnswerResult[];
  title: string;
  showSections?: boolean;
  sectionScores: Partial<Record<SectionId, { score: number; total: number }>>;
  startedAt: number;
  onRestart?: (qs: Question[]) => void;
}) {
  const { data } = useStore();
  const navigate = useNavigate();
  const [retry, setRetry] = useState<Question | null>(null);
  const total = results.length;
  const score = total ? results.reduce((s, r) => s + r.score, 0) / total : 0;
  const wrong = questions.map((q, i) => ({ q, r: results[i] })).filter((x) => x.r && x.r.score < 0.85);
  const seconds = Math.round((Date.now() - startedAt) / 1000);
  const emoji = score >= 0.9 ? '🏆' : score >= 0.7 ? '🎉' : score >= 0.5 ? '💪' : '📚';

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 to-brand-900 p-6 text-white sm:p-8">
          <div className="text-4xl">{emoji}</div>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Trénink dokončen</h1>
          <p className="text-brand-100">{title}</p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div>
              <div className="text-3xl font-extrabold tabular-nums">{Math.round(score * 100)} %</div>
              <div className="text-sm text-brand-100">úspěšnost</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold tabular-nums">
                {total - wrong.length}/{total}
              </div>
              <div className="text-sm text-brand-100">správně</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold tabular-nums">{formatDuration(seconds)}</div>
              <div className="text-sm text-brand-100">čas</div>
            </div>
          </div>
        </div>
      </Card>

      {(showSections || Object.keys(sectionScores).length > 1) && (
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-bold">Výsledky podle osnovy</h2>
          <div className="space-y-3">
            {SECTION_ORDER.filter((s) => sectionScores[s]).map((s) => {
              const v = sectionScores[s]!;
              const pct = v.score / v.total;
              return (
                <div key={s}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold">{SECTIONS[s].label}</span>
                    <span className="tabular-nums text-slate-500">
                      {Math.round(pct * 100)} % · {v.total} ot.
                    </span>
                  </div>
                  <ProgressBar value={pct} height="h-3" />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {wrong.length > 0 ? (
        <Card className="p-5">
          <h2 className="mb-1 text-lg font-bold">Oprava chyb</h2>
          <p className="mb-4 text-sm text-slate-500">Projdi si, co nevyšlo. Otázky se ti v opakování objeví dříve.</p>
          <div className="space-y-4">
            {wrong.map(({ q, r }, i) => (
              <div key={i} className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900 dark:bg-rose-500/5">
                <div className="mb-1 text-sm font-bold text-rose-700 dark:text-rose-400">
                  ❌ {r.score > 0 ? `Částečně (${Math.round(r.score * 100)} %)` : 'Špatně'} · {bookLabel(q.bookId, data.books)} · {AREA_MAP[q.area].short}
                </div>
                <p className="whitespace-pre-line font-semibold">{q.prompt}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-500">Tvoje odpověď</div>
                    <p className="whitespace-pre-line text-sm">{r.userAnswer || '—'}</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-500">Správná odpověď</div>
                    <p className="whitespace-pre-line text-sm font-medium">{correctAnswerText(q)}</p>
                  </div>
                </div>
                {q.type !== 'open' && q.type !== 'speech' && q.explanation && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold uppercase text-slate-500">Proč</div>
                    <p className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{q.explanation}</p>
                  </div>
                )}
                <Button size="sm" variant="secondary" className="mt-3" icon={<RotateCcw size={15} />} onClick={() => setRetry(q)}>
                  Zopakovat tuto otázku
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <div className="text-3xl">💯</div>
          <p className="mt-1 font-semibold">Bez jediné chyby. Výborně!</p>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {wrong.length > 0 && onRestart && (
          <Button icon={<RotateCcw size={18} />} onClick={() => onRestart(wrong.map((w) => w.q))}>
            Zopakovat všechny chyby ({wrong.length})
          </Button>
        )}
        <Button variant="secondary" onClick={() => navigate('/trenink')}>
          Nový trénink
        </Button>
        <Button variant="ghost" onClick={() => navigate('/')}>
          Zpět na přehled
        </Button>
      </div>

      <RetryModal q={retry} onClose={() => setRetry(null)} />
    </div>
  );
}

/** Zopakování jedné otázky v modálním okně */
export function RetryModal({ q, onClose }: { q: Question | null; onClose: () => void }) {
  const { recordAnswer } = useStore();
  const [result, setResult] = useState<AnswerResult | null>(null);
  const start = useRef(Date.now());
  useEffect(() => {
    setResult(null);
    start.current = Date.now();
  }, [q]);
  if (!q) return null;
  const ok = result ? result.score >= 0.85 : false;
  const selfRated = q.type === 'flashcard' || q.type === 'open' || q.type === 'speech';
  return (
    <Modal open={!!q} onClose={onClose} title="Zopakovat otázku" wide>
      {q.passage?.map((p) => (
        <div key={p.label} className="mb-3 rounded-xl border-l-4 border-brand-400 bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
          <p className="whitespace-pre-line">{p.text}</p>
        </div>
      ))}
      <QuestionBody
        q={q}
        result={result}
        onSubmit={(r) => {
          const full = { ...r, questionId: q.id, seconds: (Date.now() - start.current) / 1000 };
          setResult(full);
          recordAnswer(q, full);
        }}
      />
      {result && (
        <div className={cx('mt-4 rounded-xl p-4', selfRated ? 'bg-slate-100 dark:bg-slate-800' : ok ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-rose-50 dark:bg-rose-500/10')}>
          {!selfRated && <div className="font-bold">{ok ? '✅ Správně!' : '❌ Stále špatně'}</div>}
          {!selfRated && !ok && <p className="mt-1 whitespace-pre-line text-sm">Správně: {correctAnswerText(q)}</p>}
          <Button className="mt-3" size="sm" onClick={onClose}>
            Hotovo
          </Button>
        </div>
      )}
    </Modal>
  );
}

export function TimerBadge({ since }: { since: number }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.floor((Date.now() - since) / 1000);
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <Timer size={15} /> {String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')}
    </span>
  );
}
