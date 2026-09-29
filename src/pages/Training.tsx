import { useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import type { AreaId, Difficulty, QuestionType, SectionId } from '../types';
import { useStore } from '../store';
import { AREAS, CATEGORIES, CATEGORY_ORDER, SECTIONS } from '../data/osnova';
import { DIFFICULTY_INFO, DIFFICULTY_TYPES, TYPE_INFO, buildSession, type SessionConfig } from '../lib/session';
import { dueSession, minutesSession, randomSession, unknownSession } from '../lib/quick';
import { speechSupported } from '../lib/speech';
import { useStartSession } from './SessionPage';
import { Button, Card, PageHeader, SectionTitle, Toggle, cx } from '../components/ui';

type Mode = 'mix' | QuestionType;

const MODES: { id: Mode; emoji: string; letter?: string; desc: string }[] = [
  { id: 'mix', emoji: '🧩', desc: 'Kombinace typů podle obtížnosti' },
  { id: 'flashcard', emoji: '🃏', letter: 'A', desc: 'Otázka → otočit → umím / nejsem si jistý / neumím' },
  { id: 'abc', emoji: '🔤', letter: 'B', desc: 'Výběr ze 3–4 možností s vysvětlením' },
  { id: 'truefalse', emoji: '⚖️', letter: 'C', desc: 'Rozhodni, zda tvrzení platí' },
  { id: 'match', emoji: '🔗', letter: 'D', desc: 'Autor → dílo, postava → dílo, pojem → definice…' },
  { id: 'fill', emoji: '✏️', letter: 'E', desc: 'Doplň chybějící údaj' },
  { id: 'order', emoji: '↕️', letter: 'F', desc: 'Seřaď děj, období nebo díla' },
  { id: 'identifyWork', emoji: '🔎', letter: 'G', desc: 'Podle popisu napiš název díla' },
  { id: 'identifyAuthor', emoji: '👤', letter: 'H', desc: 'K dílu napiš autora' },
  { id: 'identifyTerm', emoji: '📖', letter: 'I', desc: 'Podle definice napiš literární pojem' },
  { id: 'open', emoji: '📝', letter: 'J', desc: 'Vlastní odpověď, porovnání s klíčovými body' },
  { id: 'speech', emoji: '🎤', letter: 'K', desc: 'Odpověz nahlas – přepis a klíčové body (experimentální)' },
];

const SECTION_CHOICES: SectionId[] = ['art1', 'art2', 'art3', 'lhk', 'basics'];

export function Training() {
  const { data } = useStore();
  const start = useStartSession();
  const [mode, setMode] = useState<Mode>('mix');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [bookIds, setBookIds] = useState<string[]>([]);
  const [sections, setSections] = useState<SectionId[]>([]);
  const [terms, setTerms] = useState(true);
  const [nonArt, setNonArt] = useState(false);
  const [count, setCount] = useState(15);

  const types: QuestionType[] = mode === 'mix' ? DIFFICULTY_TYPES[difficulty] : mode === 'speech' ? ['open'] : [mode];
  const onlyTerms = mode === 'identifyTerm';

  const cfg: SessionConfig = useMemo(() => {
    const areas: AreaId[] = sections.length ? AREAS.filter((a) => sections.includes(a.section)).map((a) => a.id) : [];
    const withExtras = [...areas, ...(sections.length && (terms || onlyTerms) ? (['terms'] as AreaId[]) : []), ...(sections.length && nonArt ? (['nonart1', 'nonart2'] as AreaId[]) : [])];
    const modeLabel = mode === 'mix' ? `${DIFFICULTY_INFO[difficulty].emoji} ${DIFFICULTY_INFO[difficulty].label} obtížnost` : TYPE_INFO[mode].label;
    return {
      title: `${modeLabel}${bookIds.length === 1 ? ` – ${data.books.find((b) => b.id === bookIds[0])?.title}` : bookIds.length ? ` – ${bookIds.length} knihy` : ''}`,
      mode: mode === 'mix' ? `mix-${difficulty}` : mode,
      difficulty,
      bookIds: onlyTerms ? ['__none__'] : bookIds,
      areas: withExtras,
      types,
      count,
      includeTerms: terms || onlyTerms,
      includeNonArt: nonArt,
      includeGlobal: bookIds.length === 0 || bookIds.length >= 3,
      speech: mode === 'speech',
    };
  }, [mode, difficulty, bookIds, sections, terms, nonArt, count, types, onlyTerms, data.books]);

  const available = useMemo(() => buildSession(data, { ...cfg, count: 999 }).length, [data, cfg]);

  const toggleBook = (id: string) => setBookIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <div>
      <PageHeader title="Trénink" emoji="💪" sub="Vyber způsob učení, obtížnost a co chceš procvičit." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[5, 15, 30, 60].map((m) => (
          <button key={m} onClick={() => start(minutesSession(m))} className="card p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="font-bold">⏱️ Mám {m} minut</div>
            <div className="text-xs text-slate-500">automatický trénink</div>
          </button>
        ))}
        <button onClick={() => start(randomSession())} className="card p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="font-bold">🎲 Náhodný trénink</div>
          <div className="text-xs text-slate-500">mix všeho</div>
        </button>
        <button
          onClick={() => start(unknownSession())}
          disabled={!Object.keys(data.unknown).length}
          className="card p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
        >
          <div className="font-bold">🔥 Jen to, co neumím</div>
          <div className="text-xs text-slate-500">{Object.keys(data.unknown).length} otázek</div>
        </button>
        <button onClick={() => start(dueSession())} className="card p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="font-bold">🔁 Opakování</div>
          <div className="text-xs text-slate-500">otázky, které jsou na řadě</div>
        </button>
        <button onClick={() => start({ ...randomSession(), title: '🔥 Maturita – mix osnovy', mode: 'mix-maturita', difficulty: 'maturita', types: ['open'], count: 8 })} className="card p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="font-bold">🔥 Maturitní mix</div>
          <div className="text-xs text-slate-500">celá osnova, bez nápověd</div>
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <SectionTitle sub="Každý režim testuje jinak – střídej je.">1. Režim učení</SectionTitle>
            <div className="grid gap-2 sm:grid-cols-2">
              {MODES.map((m) => {
                const disabled = m.id === 'speech' && !speechSupported();
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={cx(
                      'flex items-start gap-3 rounded-xl border-2 p-3 text-left transition',
                      mode === m.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 hover:border-brand-300 dark:border-slate-700',
                    )}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="min-w-0">
                      <span className="block font-semibold">
                        {m.letter && <span className="mr-1 text-slate-400">{m.letter})</span>}
                        {m.id === 'mix' ? 'Mix podle obtížnosti' : TYPE_INFO[m.id].label}
                      </span>
                      <span className="block text-xs text-slate-500">{m.desc}</span>
                      {disabled && <span className="block text-xs text-amber-600">Mikrofon zde nejspíš nebude fungovat – odpověď lze napsat.</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle>2. Obtížnost</SectionTitle>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(DIFFICULTY_INFO) as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDifficulty(d);
                    if (d === 'maturita') setMode('mix');
                  }}
                  className={cx('rounded-xl border-2 p-3 text-left transition', difficulty === d ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 hover:border-brand-300 dark:border-slate-700')}
                >
                  <div className="font-semibold">
                    {DIFFICULTY_INFO[d].emoji} {DIFFICULTY_INFO[d].label.toUpperCase()}
                  </div>
                  <div className="text-xs text-slate-500">{DIFFICULTY_INFO[d].description}</div>
                </button>
              ))}
            </div>
            {mode !== 'mix' && <p className="mt-2 text-xs text-slate-500">U konkrétního režimu obtížnost ovlivňuje výběr otázek (lehčí / hlubší).</p>}
          </Card>

          <Card className="p-5">
            <SectionTitle sub="Nevybereš-li nic, trénuje se z celé osnovy.">3. Oblasti osnovy</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {SECTION_CHOICES.map((s) => (
                <Toggle key={s} checked={sections.includes(s)} onChange={(v) => setSections((x) => (v ? [...x, s] : x.filter((y) => y !== s)))} label={SECTIONS[s].label} />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <Toggle checked={terms} onChange={setTerms} label="📖 Literární pojmy" />
              <Toggle checked={nonArt} onChange={setNonArt} label="📰 Neumělecký text" />
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle
              sub="Nevybereš-li nic, použijí se všechny knihy."
              action={
                bookIds.length > 0 && (
                  <button className="text-sm font-semibold text-brand-700 dark:text-brand-400" onClick={() => setBookIds([])}>
                    Zrušit výběr
                  </button>
                )
              }
            >
              4. Knihy
            </SectionTitle>
            {CATEGORY_ORDER.map((c) => {
              const books = data.books.filter((b) => b.category === c);
              if (!books.length) return null;
              return (
                <div key={c} className="mb-3">
                  <button
                    className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 hover:text-brand-700"
                    onClick={() => setBookIds((ids) => [...new Set([...ids, ...books.map((b) => b.id)])])}
                  >
                    {CATEGORIES[c].label} +
                  </button>
                  <div className="flex flex-wrap gap-1.5">
                    {books.map((b) => (
                      <Toggle key={b.id} checked={bookIds.includes(b.id)} onChange={() => toggleBook(b.id)} label={b.title} />
                    ))}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        <div>
          <Card className="sticky top-20 p-5">
            <SectionTitle>Shrnutí</SectionTitle>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Režim</dt>
                <dd className="text-right font-semibold">{mode === 'mix' ? 'Mix' : TYPE_INFO[mode].label}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Obtížnost</dt>
                <dd className="font-semibold">
                  {DIFFICULTY_INFO[difficulty].emoji} {DIFFICULTY_INFO[difficulty].label}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Knihy</dt>
                <dd className="font-semibold">{onlyTerms ? '—' : bookIds.length || 'všechny'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">K dispozici</dt>
                <dd className="font-semibold">{available} otázek</dd>
              </div>
            </dl>
            <div className="mt-4">
              <label className="label">Počet otázek</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[5, 10, 15, 25].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={cx('rounded-lg py-2 text-sm font-semibold', count === n ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800')}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <Button size="lg" className="mt-5 w-full" icon={<Play size={18} />} disabled={!available} onClick={() => start(cfg)}>
              Začít trénink
            </Button>
            {!available && <p className="mt-2 text-xs text-rose-600">Pro tuto kombinaci nejsou otázky – uprav výběr.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}
