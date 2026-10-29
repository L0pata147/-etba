import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Brain, CheckCircle2, Clock, Flame, ListOrdered, RotateCcw, Search, XCircle } from 'lucide-react';
import type { Book, SectionId, SessionRecord } from '../types';
import { buildMemory, buildOrder, buildQuiz, checkOrder, type MemoryCard, type OrderItem, type QuizRound } from '../lib/games';
import { uid } from '../lib/random';
import { useStore } from '../store';
import { Button, Card, EmptyState, PageHeader, Segmented, Tag, cx, formatDuration } from '../components/ui';

type GameId = 'pexeso' | 'razeni' | 'poznej';

const GAMES: { value: GameId; label: string }[] = [
  { value: 'pexeso', label: 'Pexeso autor–dílo' },
  { value: 'razeni', label: 'Seřaď podle roku' },
  { value: 'poznej', label: 'Poznej dílo' },
];

/** Uloží výsledek hry do historie (počítá se do statistik a XP) */
function useSaveGame() {
  const { recordSession } = useStore();
  return (title: string, score: number, total: number, seconds: number, bookIds: string[], section: SectionId) => {
    const rec: SessionRecord = {
      id: uid(),
      date: Date.now(),
      mode: 'hry',
      title,
      difficulty: 'medium',
      total,
      score,
      seconds,
      bookIds,
      sections: { [section]: { score, total } },
    };
    recordSession(rec, 5 + Math.round((10 * score) / Math.max(1, total)));
  };
}

function useTimer(running: boolean) {
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);
  return Math.round((now - start) / 1000);
}

export function GamesPage() {
  const { data } = useStore();
  const [params, setParams] = useSearchParams();
  const game = (GAMES.find((g) => g.value === params.get('hra'))?.value ?? 'pexeso') as GameId;
  const [round, setRound] = useState(0);
  const books = data.books;
  const again = () => setRound((r) => r + 1);

  return (
    <div>
      <PageHeader title="Hry na opakování" emoji="🎲" sub="Krátké hry z tvých knih – autoři, roky vzniku a poznávání děl." />
      <Segmented
        className="mb-4"
        value={game}
        onChange={(v) => {
          setParams({ hra: v });
          again();
        }}
        options={GAMES}
      />
      {books.length < 4 ? (
        <EmptyState icon={<Brain size={28} />} title="Málo knih" text="Na hry potřebuješ v seznamu aspoň 4 knihy." action={<Button to="/knihy">Přidat knihy</Button>} />
      ) : game === 'pexeso' ? (
        <Memory key={`m${round}`} books={books} onAgain={again} />
      ) : game === 'razeni' ? (
        <Order key={`o${round}`} books={books} onAgain={again} />
      ) : (
        <Quiz key={`q${round}`} books={books} onAgain={again} />
      )}
    </div>
  );
}

// ===== Pexeso =====

function Memory({ books, onAgain }: { books: Book[]; onAgain: () => void }) {
  const cards = useMemo(() => buildMemory(books, 6), [books]);
  const [open, setOpen] = useState<string[]>([]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const pairs = cards.length / 2;
  const done = pairs > 0 && found.size === pairs;
  const seconds = useTimer(!done);
  const save = useSaveGame();

  const flip = (c: MemoryCard) => {
    if (found.has(c.pairId) || open.includes(c.id) || open.length >= 2) return;
    const next = [...open, c.id];
    setOpen(next);
    if (next.length < 2) return;
    setMoves((m) => m + 1);
    const [a, b] = next.map((id) => cards.find((x) => x.id === id)!);
    if (a.pairId === b.pairId) {
      const f = new Set(found).add(a.pairId);
      setFound(f);
      setOpen([]);
      if (f.size === pairs) {
        // skóre: bez zbytečných tahů plný počet, každé dva tahy navíc ubírají bod
        const score = Math.max(0, Math.min(pairs, Math.round(pairs - (moves + 1 - pairs) / 2)));
        save(`Pexeso autor–dílo (${moves + 1} tahů)`, score, pairs, seconds, [...f], 'lhk');
      }
    } else setTimeout(() => setOpen([]), 1100);
  };

  if (pairs < 2) return <EmptyState icon={<Brain size={28} />} title="Málo autorů" text="Pexeso potřebuje aspoň dvě knihy od různých autorů." />;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <Tag tone="brand">
          Dvojice {found.size}/{pairs}
        </Tag>
        <Tag>Tahy {moves}</Tag>
        <Tag>
          <Clock size={13} className="mr-1 inline" />
          {formatDuration(seconds)}
        </Tag>
        <span className="text-slate-500 dark:text-slate-400">Najdi ke každému autorovi jeho dílo.</span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {cards.map((c) => {
          const shown = open.includes(c.id) || found.has(c.pairId);
          return (
            <button
              key={c.id}
              type="button"
              data-card={c.kind}
              onClick={() => flip(c)}
              className={cx(
                'flex min-h-[88px] items-center justify-center rounded-xl border p-2 text-center text-sm font-semibold transition',
                found.has(c.pairId)
                  ? 'border-emerald-400/60 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200'
                  : shown
                    ? c.kind === 'author'
                      ? 'border-violet-400/60 bg-violet-50 text-violet-900 dark:bg-violet-500/10 dark:text-violet-200'
                      : 'border-sky-400/60 bg-sky-50 text-sky-900 dark:bg-sky-500/10 dark:text-sky-200'
                    : 'border-slate-200 bg-slate-100 text-slate-400 hover:bg-slate-200 dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/[0.09]',
              )}
            >
              {shown ? (
                <span>
                  <span className="block text-[10px] font-medium uppercase tracking-wide opacity-60">{c.kind === 'author' ? 'autor' : 'dílo'}</span>
                  {c.text}
                </span>
              ) : (
                '?'
              )}
            </button>
          );
        })}
      </div>
      {done && (
        <Card className="mt-4 p-5">
          <p className="font-bold">
            Hotovo za {moves} tahů a {formatDuration(seconds)}. {moves <= pairs + 2 ? 'Výborná paměť!' : 'Zkus to na méně tahů.'}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            {cards
              .filter((c) => c.kind === 'title')
              .map((c) => (
                <li key={c.id}>
                  {cards.find((x) => x.pairId === c.pairId && x.kind === 'author')!.text} – <b>{c.text}</b>
                </li>
              ))}
          </ul>
          <Button className="mt-3" icon={<RotateCcw size={16} />} onClick={onAgain}>
            Hrát znovu
          </Button>
        </Card>
      )}
    </div>
  );
}

// ===== Řazení podle roku =====

function Order({ books, onAgain }: { books: Book[]; onAgain: () => void }) {
  const [items, setItems] = useState<OrderItem[]>(() => buildOrder(books, 5));
  const [result, setResult] = useState<{ ok: boolean; correctPlaces: number } | null>(null);
  const seconds = useTimer(!result);
  const save = useSaveGame();
  const sortedIds = useMemo(() => [...items].sort((a, b) => a.sortYear - b.sortYear).map((x) => x.id), [items]);

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (result || j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };
  const check = () => {
    const r = checkOrder(items);
    setResult(r);
    save(
      'Seřaď díla podle roku',
      r.correctPlaces,
      items.length,
      seconds,
      items.map((x) => x.id),
      'lhk',
    );
  };

  if (items.length < 3) return <EmptyState icon={<ListOrdered size={28} />} title="Málo knih s rokem vzniku" text="Řazení potřebuje aspoň 3 knihy s různým rokem vzniku." />;
  return (
    <div>
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Seřaď díla od nejstaršího (nahoře) po nejnovější. Pomůže ti literární období a život autora.</p>
      <ol className="space-y-2">
        {items.map((x, i) => {
          const right = result && sortedIds[i] === x.id;
          return (
            <li key={x.id}>
              <Card
                className={cx('flex items-center gap-3 p-3', result && (right ? 'border-emerald-400/70 bg-emerald-50 dark:bg-emerald-500/10' : 'border-rose-400/70 bg-rose-50 dark:bg-rose-500/10'))}
              >
                <span className="w-6 text-center font-bold text-slate-400">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{x.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {x.author}
                    {result && <b className="ml-2 text-slate-800 dark:text-slate-100">{x.year}</b>}
                  </p>
                </div>
                {result ? (
                  right ? (
                    <CheckCircle2 className="text-emerald-600" size={20} />
                  ) : (
                    <span className="text-xs text-rose-700 dark:text-rose-300">patří na {sortedIds.indexOf(x.id) + 1}.</span>
                  )
                ) : (
                  <div className="flex flex-col gap-1">
                    <Button variant="secondary" size="sm" aria-label="Posunout výš" disabled={i === 0} onClick={() => move(i, -1)} icon={<ArrowUp size={15} />} />
                    <Button variant="secondary" size="sm" aria-label="Posunout níž" disabled={i === items.length - 1} onClick={() => move(i, 1)} icon={<ArrowDown size={15} />} />
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ol>
      {result ? (
        <Card className="mt-4 p-5">
          <p className="font-bold">
            {result.ok ? 'Správně, pořadí sedí!' : `Na správném místě: ${result.correctPlaces} z ${items.length}.`} ({formatDuration(seconds)})
          </p>
          <Button className="mt-3" icon={<RotateCcw size={16} />} onClick={onAgain}>
            Další kolo
          </Button>
        </Card>
      ) : (
        <Button className="mt-4" icon={<CheckCircle2 size={16} />} onClick={check}>
          Zkontrolovat
        </Button>
      )}
    </div>
  );
}

// ===== Poznej dílo =====

function Quiz({ books, onAgain }: { books: Book[]; onAgain: () => void }) {
  const rounds = useMemo<QuizRound[]>(() => buildQuiz(books, 10), [books]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const done = i >= rounds.length;
  const seconds = useTimer(!done);
  const save = useSaveGame();

  if (!rounds.length) return <EmptyState icon={<Search size={28} />} title="Nejsou nápovědy" text="Knihy nemají scény ani popisy, ze kterých by šly hádat." />;
  if (done)
    return (
      <Card className="p-5">
        <p className="text-lg font-bold">
          Výsledek {score}/{rounds.length}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Nejdelší série {best} · {formatDuration(seconds)}
        </p>
        <Button className="mt-3" icon={<RotateCcw size={16} />} onClick={onAgain}>
          Hrát znovu
        </Button>
      </Card>
    );

  const r = rounds[i];
  const answer = (o: string) => {
    if (picked) return;
    setPicked(o);
    const ok = o === r.answer;
    const s = ok ? score + 1 : score;
    const st = ok ? streak + 1 : 0;
    setScore(s);
    setStreak(st);
    setBest((b) => Math.max(b, st));
  };
  const next = () => {
    if (i + 1 >= rounds.length) save('Poznej dílo', score, rounds.length, seconds, [...new Set(rounds.map((x) => books.find((b) => b.title === x.answer)?.id ?? x.answer))], 'art1');
    setPicked(null);
    setI(i + 1);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Tag tone="brand">
          Kolo {i + 1}/{rounds.length}
        </Tag>
        <Tag tone="emerald">Body {score}</Tag>
        {streak >= 2 && (
          <Tag tone="amber">
            <Flame size={13} className="mr-1 inline" />
            Série {streak}
          </Tag>
        )}
      </div>
      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{r.kind}</p>
        <p className="mt-1 text-[15px] leading-relaxed">{r.prompt}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {r.options.map((o) => {
            const state = picked && (o === r.answer ? 'ok' : o === picked ? 'bad' : '');
            return (
              <button
                key={o}
                type="button"
                data-option
                onClick={() => answer(o)}
                className={cx(
                  'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition',
                  state === 'ok'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                    : state === 'bad'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.06]',
                )}
              >
                {state === 'ok' && <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />}
                {state === 'bad' && <XCircle size={16} className="shrink-0 text-rose-600" />}
                {o}
              </button>
            );
          })}
        </div>
        {picked && (
          <div className="mt-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">{r.explanation}</p>
            <Button className="mt-3" onClick={next}>
              {i + 1 >= rounds.length ? 'Výsledek' : 'Další'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
