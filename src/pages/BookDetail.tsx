import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, ChevronDown, Circle, ClipboardCheck, Dumbbell, GraduationCap, Pencil, Star } from 'lucide-react';
import type { AreaId, Book } from '../types';
import { useStore } from '../store';
import { AREA_MAP, CATEGORIES, EXAM_AREAS, KINDS } from '../data/osnova';
import { areaMastery, bookAreas, bookProgress, isBookLearned, masteryKey } from '../lib/progress';
import { DIFFICULTY_TYPES, type SessionConfig } from '../lib/session';
import { useStartSession } from './SessionPage';
import { Button, Card, EmptyState, Pct, ProgressBar, Segmented, Tag, cx } from '../components/ui';

type Tab = 'full' | 'quick' | 'exam' | 'notes' | 'progress';

export function bookTrainingConfig(b: Book, areas: AreaId[] = []): SessionConfig {
  return {
    title: areas.length === 1 ? `${b.title} – ${AREA_MAP[areas[0]].short}` : `Trénink: ${b.title}`,
    mode: 'kniha',
    difficulty: 'medium',
    bookIds: [b.id],
    areas,
    types: ['abc', 'truefalse', 'flashcard', 'fill', 'order', 'identifyWork', 'identifyAuthor', ...(areas.length ? (['open'] as const) : [])],
    count: areas.length === 1 ? 8 : 15,
    includeGlobal: false,
  };
}

export function fullExamConfig(b: Book): SessionConfig {
  return {
    title: `Celá maturitní otázka: ${b.title}`,
    mode: 'cela-otazka',
    difficulty: 'hard',
    bookIds: [b.id],
    areas: [...EXAM_AREAS],
    types: ['abc', 'truefalse', 'fill', 'order', 'flashcard', 'open'],
    count: 40,
    perArea: 2,
    bySection: true,
    includeGlobal: false,
  };
}

export function BookDetail() {
  const { id } = useParams();
  const { data, updateBook } = useStore();
  const start = useStartSession();
  const book = data.books.find((b) => b.id === id);
  const [tab, setTab] = useState<Tab>('full');
  if (!book) return <EmptyState icon="❓" title="Kniha nenalezena" action={<Button to="/knihy">Zpět na knihy</Button>} />;
  const progress = bookProgress(data, book);
  const learned = isBookLearned(data, book);

  return (
    <div>
      <div className="mb-2 text-sm">
        <Link to="/knihy" className="text-brand-700 hover:underline dark:text-brand-400">
          ← Moje knihy
        </Link>
      </div>
      <Card className="mb-5 overflow-hidden">
        <div className="bg-gradient-to-br from-brand-700 to-brand-950 p-5 text-white sm:p-7">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm text-brand-200">{CATEGORIES[book.category].label}</div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">{book.title}</h1>
              <p className="mt-1 text-brand-100">
                {book.author}
                {book.authorLife && ` (${book.authorLife})`} · {book.year}
              </p>
            </div>
            <button onClick={() => updateBook(book.id, { favorite: !book.favorite })} className="rounded-lg p-2 hover:bg-white/10" aria-label="Oblíbená">
              <Star size={24} className={book.favorite ? 'fill-amber-300 text-amber-300' : ''} />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="chip bg-white/15 text-white">{KINDS[book.kind]}</span>
            {book.genre && <span className="chip bg-white/15 text-white">{book.genre}</span>}
            {book.movement && <span className="chip bg-white/15 text-white">{book.movement}</span>}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <ProgressBar value={progress} className="flex-1 bg-white/20" color="bg-white" height="h-2.5" />
            <span className="font-bold tabular-nums">{Math.round(progress * 100)} %</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 p-4">
          <Button icon={<Dumbbell size={18} />} onClick={() => start(bookTrainingConfig(book))}>
            Trénovat knihu
          </Button>
          <Button variant="secondary" icon={<ClipboardCheck size={18} />} onClick={() => start(fullExamConfig(book))}>
            Otestovat celou maturitní otázku
          </Button>
          <Button variant="secondary" icon={<GraduationCap size={18} />} to={`/simulace/${book.id}`}>
            Simulace ústní zkoušky
          </Button>
          <Button variant="ghost" icon={<Pencil size={17} />} to={`/knihy/${book.id}/upravit`}>
            Upravit
          </Button>
          <button
            onClick={() => updateBook(book.id, { learned: !book.learned })}
            className={cx('flex items-center gap-1.5 rounded-xl px-3 text-sm font-semibold', learned ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800')}
          >
            {book.learned ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            {book.learned ? 'Označeno jako naučené' : learned ? 'Naučeno (podle výsledků)' : 'Označit jako naučené'}
          </button>
        </div>
      </Card>

      <Segmented
        className="mb-5"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'full', label: '📖 Kompletní příprava' },
          { value: 'quick', label: '⚡ Za 10 minut' },
          { value: 'exam', label: '🎓 Maturitní otázky' },
          { value: 'notes', label: '📝 Moje poznámky' },
          { value: 'progress', label: '📊 Pokrok' },
        ]}
      />

      {tab === 'full' && <FullView book={book} />}
      {tab === 'quick' && <QuickView book={book} />}
      {tab === 'exam' && <ExamQuestions book={book} />}
      {tab === 'notes' && <Notes book={book} />}
      {tab === 'progress' && <BookProgress book={book} />}
    </div>
  );
}

function Block({ title, children, emoji }: { title: string; children: ReactNode; emoji?: string }) {
  return (
    <Card className="p-5">
      <h2 className="mb-2 text-lg font-bold">
        {emoji && <span className="mr-1.5">{emoji}</span>}
        {title}
      </h2>
      <div className="space-y-2 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">{children}</div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <span className="font-semibold text-slate-900 dark:text-slate-100">{label}: </span>
      <span className="whitespace-pre-line">{value}</span>
    </div>
  );
}

function FullView({ book: b }: { book: Book }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Block title="Základní informace" emoji="📌">
        <Row label="Autor" value={`${b.author}${b.authorLife ? ` (${b.authorLife})` : ''}`} />
        <Row label="Rok" value={b.year} />
        <Row label="Literární druh" value={KINDS[b.kind]} />
        <Row label="Žánr" value={b.genre} />
        <Row label="Období" value={b.period} />
        <Row label="Směr" value={b.movement} />
      </Block>
      <Block title="Téma a motivy" emoji="💡">
        <Row label="Téma" value={b.theme} />
        {b.motifs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {b.motifs.map((m) => (
              <Tag key={m} tone="brand">
                {m}
              </Tag>
            ))}
          </div>
        )}
        <Row label="Hlavní myšlenka" value={b.mainIdea} />
      </Block>
      <div className="lg:col-span-2">
        <Block title="Děj" emoji="📜">
          <p className="whitespace-pre-line">{b.plot || '—'}</p>
          {b.plotEvents.length > 0 && (
            <ol className="mt-3 list-decimal space-y-1 pl-5">
              {b.plotEvents.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ol>
          )}
        </Block>
      </div>
      <Block title="Postavy" emoji="👥">
        {b.mainCharacters.map((c) => (
          <div key={c.name}>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</span> – {c.description}
          </div>
        ))}
        {b.sideCharacters.length > 0 && <div className="pt-2 text-sm font-bold uppercase text-slate-500">Vedlejší postavy</div>}
        {b.sideCharacters.map((c) => (
          <div key={c.name} className="text-sm">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</span> – {c.description}
          </div>
        ))}
      </Block>
      <Block title="Časoprostor a kompozice" emoji="🧭">
        <Row label="Prostředí" value={b.setting} />
        <Row label="Čas" value={b.time} />
        <Row label="Kompozice" value={b.composition} />
      </Block>
      <Block title="Vypravěč a promluvy" emoji="🗣️">
        <Row label="Vypravěč / lyrický subjekt" value={b.narrator} />
        <Row label="Vyprávěcí způsoby" value={b.narrativeModes} />
        <Row label="Typy promluv" value={b.speechTypes} />
        <Row label="Veršová výstavba" value={b.verse || 'Dílo je psáno prózou.'} />
      </Block>
      <Block title="Jazyk a literární prostředky" emoji="✍️">
        <Row label="Jazykové prostředky" value={b.language} />
        <Row label="Tropy a figury" value={b.tropes} />
      </Block>
      <Block title="Autor" emoji="👤">
        <p className="whitespace-pre-line">{b.authorContext || '—'}</p>
        {b.otherWorks.length > 0 && <Row label="Další díla" value={b.otherWorks.join(', ')} />}
      </Block>
      <Block title="Literárněhistorický kontext" emoji="🏛️">
        <p className="whitespace-pre-line">{b.historicalContext || '—'}</p>
      </Block>
      {(b.interpretation || b.examTips) && (
        <div className="lg:col-span-2">
          <Block title="K ústní maturitě" emoji="🎓">
            <Row label="Interpretace" value={b.interpretation} />
            <Row label="Na co se zaměřit" value={b.examTips} />
          </Block>
        </div>
      )}
      {b.source === 'database' && (
        <p className="text-xs text-slate-500 lg:col-span-2">
          Údaje z databáze aplikace – nejasnosti vždy ověř v čítance nebo u svého vyučujícího. Knihu můžeš kdykoli upravit.
        </p>
      )}
    </div>
  );
}

function QuickView({ book: b }: { book: Book }) {
  const start = useStartSession();
  const items = b.quick.length
    ? b.quick
    : [
        `${b.author}${b.year ? `, ${b.year}` : ''} – ${KINDS[b.kind].toLowerCase()}, ${b.genre}`,
        b.theme,
        b.mainCharacters.map((c) => c.name).join(', '),
        b.narratorShort && `Vypravěč: ${b.narratorShort}`,
        b.movement,
      ].filter(Boolean);
  return (
    <div className="space-y-4">
      <Card className="p-5 sm:p-7">
        <h2 className="mb-1 text-xl font-bold">⚡ Naučit se za 10 minut</h2>
        <p className="mb-4 text-sm text-slate-500">To nejdůležitější o díle. Přečti si body a pak si je hned ověř krátkým testem.</p>
        <ol className="space-y-3">
          {items.map((t, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-800 dark:bg-brand-500/20 dark:text-brand-200">{i + 1}</span>
              <span className="pt-0.5 text-[16px] leading-relaxed">{t}</span>
            </li>
          ))}
        </ol>
      </Card>
      <Button
        size="lg"
        icon={<Dumbbell size={18} />}
        onClick={() => start({ ...bookTrainingConfig(b), title: `Rychlý test: ${b.title}`, types: DIFFICULTY_TYPES.easy, count: 10, difficulty: 'easy' })}
      >
        Ověřit si to (10 rychlých otázek)
      </Button>
    </div>
  );
}

function ExamQuestions({ book: b }: { book: Book }) {
  const areas = EXAM_AREAS;
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        Otázky, které ti může položit zkoušející. Zkus si nejdřív odpovědět nahlas, pak si rozbal vzorovou odpověď.
      </p>
      {b.deepQuestions.map((d, i) => (
        <Reveal key={`d${i}`} tag="Porozumění" q={d.q} a={d.answer} />
      ))}
      {areas.map((a) => (
        <Reveal key={a} tag={AREA_MAP[a].label} q={AREA_MAP[a].examPrompt(b)} a={areaSummary(b, a)} />
      ))}
    </div>
  );
}

function areaSummary(b: Book, a: AreaId): string {
  switch (a) {
    case 'context':
      return b.scenes[0]?.context ? `${b.scenes[0].context}\n\n${b.plot}` : b.plot;
    case 'theme':
      return `${b.theme}\nMotivy: ${b.motifs.join(', ')}\nHlavní myšlenka: ${b.mainIdea}`;
    case 'chronotope':
      return `${b.setting}\n${b.time}`;
    case 'composition':
      return b.composition;
    case 'genre':
      return `${KINDS[b.kind]} – ${b.genre}`;
    case 'narrator':
      return b.narrator;
    case 'characters':
      return b.mainCharacters.map((c) => `${c.name} – ${c.description}`).join('\n');
    case 'narrative':
      return b.narrativeModes;
    case 'speech':
      return b.speechTypes;
    case 'verse':
      return b.verse || 'Dílo je psáno prózou.';
    case 'language':
      return b.language;
    case 'tropes':
      return b.tropes;
    case 'authorContext':
      return `${b.authorContext}\nDalší díla: ${b.otherWorks.join(', ')}`;
    case 'litContext':
      return `${b.period}; ${b.movement}\n${b.historicalContext}`;
    default:
      return '';
  }
}

function Reveal({ tag, q, a }: { tag: string; q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-400">{tag}</div>
      <p className="mt-1 font-semibold">{q}</p>
      <button onClick={() => setOpen(!open)} className="mt-2 flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
        <ChevronDown size={16} className={cx('transition', open && 'rotate-180')} />
        {open ? 'Skrýt odpověď' : 'Zobrazit vzorovou odpověď'}
      </button>
      {open && <p className="animate-fade-up mt-2 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-[15px] leading-relaxed dark:bg-slate-800/60">{a || '—'}</p>}
    </Card>
  );
}

function Notes({ book }: { book: Book }) {
  const { updateBook } = useStore();
  const [text, setText] = useState(book.notes);
  const [saved, setSaved] = useState(true);
  useEffect(() => {
    if (text === book.notes) return;
    setSaved(false);
    const t = setTimeout(() => {
      updateBook(book.id, { notes: text });
      setSaved(true);
    }, 600);
    return () => clearTimeout(t);
  }, [text, book.id, book.notes, updateBook]);
  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold">📝 Moje poznámky</h2>
        <span className="text-xs text-slate-500">{saved ? '✓ Uloženo' : 'Ukládám…'}</span>
      </div>
      <textarea
        className="input min-h-[260px] resize-y leading-relaxed"
        placeholder="Např. „Učitel se často ptá na…“, vlastní postřehy, citáty, co si zapamatovat…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <p className="mt-2 text-xs text-slate-500">Poznámky se ukládají automaticky a jsou součástí exportu dat.</p>
    </Card>
  );
}

function BookProgress({ book }: { book: Book }) {
  const { data } = useStore();
  const start = useStartSession();
  const areas = useMemo(() => bookAreas(book), [book]);
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-lg font-bold">Pokrok podle oblastí osnovy</h2>
      <div className="space-y-3">
        {areas.map((a) => {
          const v = areaMastery(data, book.id, a);
          const m = data.mastery[masteryKey(book.id, a)];
          return (
            <div key={a} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{AREA_MAP[a].label}</span>
                  <span className="text-slate-500">{m ? <Pct value={v} /> : 'neprocvičeno'}</span>
                </div>
                <ProgressBar value={v} />
              </div>
              <Button size="sm" variant="ghost" onClick={() => start(bookTrainingConfig(book, [a]))}>
                Trénovat
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
