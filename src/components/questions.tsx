import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowDown, ArrowUp, Check, GripVertical, Mic, MicOff, RotateCcw, X } from 'lucide-react';
import type {
  AbcQuestion,
  AnswerResult,
  FillQuestion,
  FlashcardQuestion,
  MatchQuestion,
  OpenQuestion,
  OrderQuestion,
  Question,
  TrueFalseQuestion,
} from '../types';
import { evaluatePoints, matchesAnswer } from '../lib/text';
import { shuffle } from '../lib/random';
import { useSpeechRecognition } from '../lib/speech';
import { useStore } from '../store';
import { Button, cx } from './ui';

export type Submit = (r: Omit<AnswerResult, 'questionId' | 'seconds'>) => void;

interface P<Q> {
  q: Q;
  result: AnswerResult | null;
  onSubmit: Submit;
}

export function correctAnswerText(q: Question): string {
  switch (q.type) {
    case 'abc':
      return q.options[q.correctIndex];
    case 'truefalse':
      return q.isTrue ? 'Pravda' : 'Lež';
    case 'match':
      return q.pairs.map((p) => `${p.left} → ${p.right}`).join('\n');
    case 'order':
      return q.items.map((x, i) => `${i + 1}. ${x}`).join('\n');
    case 'fill':
    case 'identifyWork':
    case 'identifyAuthor':
    case 'identifyTerm':
      return q.answer;
    case 'open':
    case 'speech':
      return q.modelAnswer;
    case 'flashcard':
      return q.answer;
  }
}

export function QuestionBody(props: P<Question>) {
  const { q } = props;
  switch (q.type) {
    case 'flashcard':
      return <Flashcard {...(props as P<FlashcardQuestion>)} />;
    case 'abc':
      return <Abc {...(props as P<AbcQuestion>)} />;
    case 'truefalse':
      return <TrueFalse {...(props as P<TrueFalseQuestion>)} />;
    case 'match':
      return <Match {...(props as P<MatchQuestion>)} />;
    case 'order':
      return <Order {...(props as P<OrderQuestion>)} />;
    case 'open':
    case 'speech':
      return <Open {...(props as P<OpenQuestion>)} />;
    default:
      return <Fill {...(props as P<FillQuestion>)} />;
  }
}

export function Prompt({ text }: { text: string }) {
  return <h2 className="whitespace-pre-line text-xl font-bold leading-snug tracking-tight sm:text-2xl">{text}</h2>;
}

// ---------- Flashcard ----------

function Flashcard({ q, result, onSubmit }: P<FlashcardQuestion>) {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    setFlipped(false);
  }, [q.id]);
  return (
    <div>
      <div className="flip-card">
        <div className={cx('flip-inner relative min-h-[220px]', flipped && 'flipped')}>
          <button
            type="button"
            onClick={() => setFlipped(true)}
            className="flip-face absolute inset-0 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/60 p-6 text-center dark:border-brand-700 dark:bg-brand-500/5"
          >
            <Prompt text={q.prompt} />
            <span className="mt-4 text-sm font-medium text-brand-700 dark:text-brand-300">Klikni pro zobrazení odpovědi</span>
          </button>
          <div className="flip-face flip-back absolute inset-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{q.prompt.split('\n')[0]}</div>
            <p className="whitespace-pre-line text-[16px] leading-relaxed">{q.answer}</p>
          </div>
        </div>
      </div>
      {flipped && !result && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button variant="success" onClick={() => onSubmit({ score: 1, userAnswer: 'Umím', confidence: 'good' })}>
            ✅ Umím
          </Button>
          <Button className="bg-amber-500 text-white hover:bg-amber-600" onClick={() => onSubmit({ score: 0.5, userAnswer: 'Nejsem si jistý', confidence: 'hard' })}>
            🤔 Nejsem si jistý
          </Button>
          <Button variant="danger" onClick={() => onSubmit({ score: 0, userAnswer: 'Neumím', confidence: 'again', dontKnow: true })}>
            ❌ Neumím
          </Button>
        </div>
      )}
      {!flipped && (
        <div className="mt-4">
          <Button className="w-full" onClick={() => setFlipped(true)}>
            Zobrazit odpověď
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------- ABC ----------

function Abc({ q, result, onSubmit }: P<AbcQuestion>) {
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => {
    setPicked(null);
  }, [q.id]);
  const letters = 'ABCD';
  return (
    <div>
      <Prompt text={q.prompt} />
      <div className="mt-5 grid gap-2.5">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correctIndex;
          const isPicked = picked === i;
          const state = result ? (isCorrect ? 'correct' : isPicked ? 'wrong' : 'idle') : 'open';
          return (
            <div key={i}>
              <button
                type="button"
                disabled={!!result}
                onClick={() => {
                  setPicked(i);
                  onSubmit({ score: isCorrect ? 1 : 0, userAnswer: opt });
                }}
                className={cx(
                  'flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-[15px] transition',
                  state === 'open' && 'border-slate-200 bg-white hover:border-brand-400 hover:bg-brand-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-500 dark:hover:bg-brand-500/10',
                  state === 'correct' && 'animate-pop border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
                  state === 'wrong' && 'animate-pop border-rose-500 bg-rose-50 dark:bg-rose-500/10',
                  state === 'idle' && 'border-slate-200 opacity-60 dark:border-slate-800',
                )}
              >
                <span
                  className={cx(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm font-bold',
                    state === 'correct' ? 'bg-emerald-500 text-white' : state === 'wrong' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                  )}
                >
                  {state === 'correct' ? <Check size={16} /> : state === 'wrong' ? <X size={16} /> : letters[i]}
                </span>
                <span className="pt-0.5">{opt}</span>
              </button>
              {result && !isCorrect && q.optionNotes?.[i] && (isPicked || q.options.length <= 4) && (
                <p className="mt-1 pl-12 text-sm text-slate-500 dark:text-slate-400">{q.optionNotes[i]}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Pravda / lež ----------

function TrueFalse({ q, result, onSubmit }: P<TrueFalseQuestion>) {
  const [picked, setPicked] = useState<boolean | null>(null);
  useEffect(() => {
    setPicked(null);
  }, [q.id]);
  const btn = (val: boolean, label: string) => {
    const state = result ? (val === q.isTrue ? 'correct' : picked === val ? 'wrong' : 'idle') : 'open';
    return (
      <button
        type="button"
        disabled={!!result}
        onClick={() => {
          setPicked(val);
          onSubmit({ score: val === q.isTrue ? 1 : 0, userAnswer: label });
        }}
        className={cx(
          'rounded-2xl border-2 py-6 text-lg font-bold transition',
          state === 'open' && 'border-slate-200 bg-white hover:border-brand-400 hover:bg-brand-50/60 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-brand-500/10',
          state === 'correct' && 'animate-pop border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300',
          state === 'wrong' && 'animate-pop border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300',
          state === 'idle' && 'border-slate-200 opacity-50 dark:border-slate-800',
        )}
      >
        {val ? '👍 PRAVDA' : '👎 LEŽ'}
      </button>
    );
  };
  return (
    <div>
      <div className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Pravda, nebo lež?</div>
      <Prompt text={q.prompt} />
      <div className="mt-6 grid grid-cols-2 gap-3">
        {btn(true, 'Pravda')}
        {btn(false, 'Lež')}
      </div>
    </div>
  );
}

// ---------- Doplňování / identifikace ----------

const FILL_HINT: Record<string, string> = {
  fill: 'Doplň chybějící údaj',
  identifyWork: 'Napiš název díla',
  identifyAuthor: 'Napiš jméno autora',
  identifyTerm: 'Napiš literární pojem',
};

function Fill({ q, result, onSubmit }: P<FillQuestion>) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setValue('');
    ref.current?.focus();
  }, [q.id]);
  const submit = () => {
    if (!value.trim()) return;
    onSubmit({ score: matchesAnswer(value, q.accepted) ? 1 : 0, userAnswer: value.trim() });
  };
  const ok = result && result.score >= 1;
  return (
    <div>
      <div className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">{FILL_HINT[q.type]}</div>
      <Prompt text={q.prompt} />
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input
          ref={ref}
          className={cx('input text-lg', result && (ok ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-rose-500 bg-rose-50 dark:bg-rose-500/10'))}
          value={value}
          disabled={!!result}
          placeholder="Tvoje odpověď…"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e: KeyboardEvent) => {
            if (e.key === 'Enter' && !result) {
              e.preventDefault();
              e.stopPropagation();
              submit();
            }
          }}
        />
        {!result && (
          <Button onClick={submit} disabled={!value.trim()} className="sm:w-40">
            Odpovědět
          </Button>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-500">Diakritika ani malé překlepy nevadí.</p>
    </div>
  );
}

// ---------- Přiřazování ----------

function Match({ q, result, onSubmit }: P<MatchQuestion>) {
  const rights = useMemo(() => shuffle(q.pairs.map((p) => p.right)), [q.id]);
  const [assign, setAssign] = useState<Record<string, string>>({});
  const [activeLeft, setActiveLeft] = useState<string | null>(null);
  const [dragRight, setDragRight] = useState<string | null>(null);
  useEffect(() => {
    setAssign({});
    setActiveLeft(null);
  }, [q.id]);

  const usedRights = new Set(Object.values(assign));
  const place = (left: string, right: string) => {
    if (result) return;
    setAssign((a) => {
      const next = { ...a };
      for (const k of Object.keys(next)) if (next[k] === right) delete next[k];
      next[left] = right;
      return next;
    });
    setActiveLeft(null);
  };
  const clickRight = (right: string) => {
    if (result) return;
    if (activeLeft) place(activeLeft, right);
    else {
      const firstFree = q.pairs.find((p) => !assign[p.left]);
      if (firstFree) place(firstFree.left, right);
    }
  };
  const complete = q.pairs.every((p) => assign[p.left]);
  const check = () => {
    const correct = q.pairs.filter((p) => assign[p.left] === p.right).length;
    onSubmit({ score: correct / q.pairs.length, userAnswer: q.pairs.map((p) => `${p.left} → ${assign[p.left] ?? '—'}`).join('\n') });
  };

  return (
    <div>
      <div className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Přiřazování</div>
      <Prompt text={q.prompt} />
      <p className="mt-1 text-sm text-slate-500">Klikni na položku vlevo a potom na správnou možnost vpravo (nebo ji přetáhni).</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase text-slate-500">{q.leftLabel}</div>
          {q.pairs.map((p) => {
            const assigned = assign[p.left];
            const correct = result ? assigned === p.right : null;
            return (
              <div
                key={p.left}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => dragRight && place(p.left, dragRight)}
                onClick={() => !result && setActiveLeft(activeLeft === p.left ? null : p.left)}
                className={cx(
                  'cursor-pointer rounded-xl border-2 p-3 transition',
                  activeLeft === p.left ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900',
                  correct === true && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
                  correct === false && 'border-rose-500 bg-rose-50 dark:bg-rose-500/10',
                )}
              >
                <div className="font-semibold">{p.left}</div>
                <div className={cx('mt-1 min-h-[1.5rem] rounded-lg px-2 py-1 text-sm', assigned ? 'bg-slate-100 dark:bg-slate-800' : 'border border-dashed border-slate-300 text-slate-400 dark:border-slate-600')}>
                  {assigned ?? 'sem přiřaď…'}
                </div>
                {result && correct === false && <div className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">✓ {p.right}</div>}
              </div>
            );
          })}
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase text-slate-500">{q.rightLabel}</div>
          {rights.map((r) => (
            <button
              key={r}
              type="button"
              draggable={!result}
              onDragStart={() => setDragRight(r)}
              onDragEnd={() => setDragRight(null)}
              onClick={() => clickRight(r)}
              disabled={!!result}
              className={cx(
                'flex w-full items-center gap-2 rounded-xl border-2 p-3 text-left text-sm transition',
                usedRights.has(r) ? 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900/50' : 'border-slate-200 bg-white hover:border-brand-400 dark:border-slate-700 dark:bg-slate-900',
              )}
            >
              <GripVertical size={16} className="shrink-0 text-slate-400" />
              {r}
            </button>
          ))}
        </div>
      </div>
      {!result && (
        <div className="mt-4 flex gap-2">
          <Button onClick={check} disabled={!complete}>
            Zkontrolovat
          </Button>
          <Button variant="ghost" icon={<RotateCcw size={16} />} onClick={() => setAssign({})}>
            Vymazat
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------- Seřazování ----------

function Order({ q, result, onSubmit }: P<OrderQuestion>) {
  const initial = useMemo(() => {
    let s = shuffle(q.items);
    for (let i = 0; i < 5 && s.every((x, j) => x === q.items[j]); i++) s = shuffle(q.items);
    return s;
  }, [q.id]);
  const [items, setItems] = useState(initial);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  useEffect(() => {
    setItems(initial);
  }, [initial]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || result) return;
    setItems((arr) => {
      const next = [...arr];
      const [x] = next.splice(from, 1);
      next.splice(to, 0, x);
      return next;
    });
  };
  const check = () => {
    const correct = items.filter((x, i) => x === q.items[i]).length;
    onSubmit({ score: correct / items.length, userAnswer: items.map((x, i) => `${i + 1}. ${x}`).join('\n') });
  };
  return (
    <div>
      <div className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Seřazování</div>
      <Prompt text={q.prompt} />
      <p className="mt-1 text-sm text-slate-500">Použij šipky nebo přetáhni položky.</p>
      <ol className="mt-5 space-y-2">
        {items.map((x, i) => {
          const ok = result ? x === q.items[i] : null;
          return (
            <li
              key={x}
              draggable={!result}
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx !== null) move(dragIdx, i);
                setDragIdx(null);
              }}
              className={cx(
                'flex items-center gap-2 rounded-xl border-2 bg-white p-2.5 dark:bg-slate-900',
                ok === null && 'border-slate-200 dark:border-slate-700',
                ok === true && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
                ok === false && 'border-rose-500 bg-rose-50 dark:bg-rose-500/10',
              )}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-bold dark:bg-slate-800">{i + 1}</span>
              <span className="flex-1 text-[15px]">{x}</span>
              {!result && (
                <span className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800" aria-label="Posunout nahoru">
                    <ArrowUp size={16} />
                  </button>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800" aria-label="Posunout dolů">
                    <ArrowDown size={16} />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {!result && (
        <Button className="mt-4" onClick={check}>
          Zkontrolovat pořadí
        </Button>
      )}
    </div>
  );
}

// ---------- Vlastní / mluvená odpověď ----------

export function Open({ q, result, onSubmit, hideRating }: P<OpenQuestion> & { hideRating?: boolean }) {
  const [text, setText] = useState('');
  const [evaluated, setEvaluated] = useState(false);
  const speech = useSpeechRecognition((t) => setText((prev) => (prev ? prev.trimEnd() + ' ' : '') + t));
  const isSpeech = q.type === 'speech';
  const dictation = useStore().data.settings.speechEnabled;
  useEffect(() => {
    setText('');
    setEvaluated(false);
  }, [q.id]);

  const evaluation = useMemo(() => (evaluated ? evaluatePoints(text, q.points) : null), [evaluated, text, q.points]);
  const suggested = evaluation ? (evaluation.score >= 0.7 ? 'good' : evaluation.score >= 0.35 ? 'hard' : 'again') : null;

  const rate = (c: 'good' | 'hard' | 'again') =>
    onSubmit({ score: { good: 1, hard: 0.5, again: 0 }[c], userAnswer: text.trim() || '(bez odpovědi)', confidence: c, dontKnow: c === 'again' && !text.trim() });

  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {isSpeech ? 'Mluvená odpověď' : 'Vlastní odpověď'}
        {isSpeech && <span className="chip bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200">experimentální</span>}
      </div>
      <Prompt text={q.prompt} />

      {!evaluated && (
        <div className="mt-5">
          {(isSpeech || (speech.supported && dictation)) && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {speech.supported ? (
                speech.listening ? (
                  <Button variant="danger" icon={<MicOff size={18} />} onClick={speech.stop}>
                    Zastavit nahrávání
                  </Button>
                ) : (
                  <Button variant={isSpeech ? 'primary' : 'secondary'} icon={<Mic size={18} />} onClick={speech.start}>
                    {isSpeech ? 'Začít mluvit' : 'Nadiktovat'}
                  </Button>
                )
              ) : (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Tento prohlížeč nepodporuje rozpoznávání řeči (funguje v Chrome / Edge). Odpověď napiš do pole.
                </p>
              )}
              {speech.listening && (
                <span className="flex items-center gap-2 text-sm text-rose-600">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" /> Poslouchám…
                </span>
              )}
            </div>
          )}
          {speech.error && <p className="mb-2 text-sm text-rose-600">{speech.error}</p>}
          <textarea
            className="input min-h-[160px] resize-y leading-relaxed"
            value={text + (speech.interim ? ` ${speech.interim}` : '')}
            onChange={(e) => setText(e.target.value)}
            placeholder={isSpeech ? 'Zde se objeví přepis tvé odpovědi (můžeš ho i upravit)…' : 'Napiš odpověď vlastními slovy – jako bys mluvil u maturity…'}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              onClick={() => {
                speech.stop();
                setEvaluated(true);
              }}
              disabled={!text.trim()}
            >
              Vyhodnotit odpověď
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                speech.stop();
                setEvaluated(true);
              }}
            >
              Nevím – ukázat vzorovou odpověď
            </Button>
          </div>
        </div>
      )}

      {evaluation && (
        <div className="mt-5 space-y-4">
          {text.trim() && (
            <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
              <div className="mb-1 text-xs font-semibold uppercase text-slate-500">{isSpeech ? 'Přepis tvé odpovědi' : 'Tvoje odpověď'}</div>
              <p className="whitespace-pre-line text-[15px]">{text}</p>
            </div>
          )}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-bold">Klíčové body</div>
              <div className="text-sm font-semibold tabular-nums">
                {evaluation.results.filter((r) => r.hit).length} / {evaluation.results.length} zmíněno
              </div>
            </div>
            <ul className="space-y-1.5">
              {evaluation.results.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-[15px]">
                  <span className={cx('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white', r.hit ? 'bg-emerald-500' : 'bg-rose-400')}>
                    {r.hit ? <Check size={13} /> : <X size={13} />}
                  </span>
                  <span className={r.hit ? '' : 'text-slate-600 dark:text-slate-400'}>
                    {r.point.label}
                    {!r.hit && <span className="ml-1 text-xs font-semibold text-rose-500">(chybí)</span>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              Hodnocení bez AI porovnává odpověď s klíčovými slovy – je orientační. Rozhodující je tvoje sebehodnocení níže.
            </p>
          </div>
          <details className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-800 dark:bg-brand-500/5" open={!text.trim()}>
            <summary className="cursor-pointer text-sm font-bold text-brand-800 dark:text-brand-200">Vzorová odpověď</summary>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed">{q.modelAnswer}</p>
          </details>
          {!result && !hideRating && (
            <div>
              <div className="mb-2 text-sm font-semibold">Jak jsi odpověděl(a)?</div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ['good', '✅ Zvládl(a)', 'success'],
                    ['hard', '🤔 Částečně', 'amber'],
                    ['again', '❌ Nezvládl(a)', 'danger'],
                  ] as const
                ).map(([c, label, tone]) => (
                  <Button
                    key={c}
                    variant={tone === 'amber' ? 'primary' : tone}
                    className={cx(tone === 'amber' && 'bg-amber-500 hover:bg-amber-600', suggested === c && 'ring-4 ring-brand-400/50')}
                    onClick={() => rate(c)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {suggested && <p className="mt-2 text-xs text-slate-500">Zvýrazněná volba je návrh podle klíčových bodů.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
