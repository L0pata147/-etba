import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Database, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import type { Book, CategoryId, LiteraryKind } from '../types';
import { useStore } from '../store';
import { CATEGORIES, CATEGORY_ORDER, KINDS } from '../data/osnova';
import { BOOK_DATABASE, seedToBook } from '../data/books';
import { bookLastStudied, bookProgress, isBookLearned, needsReview } from '../lib/progress';
import { normalize } from '../lib/text';
import { Button, Card, EmptyState, Modal, PageHeader, ProgressBar, Segmented, Tag, cx, relativeDays } from '../components/ui';

type Status = 'all' | 'learned' | 'todo' | 'favorite' | 'review';

export function Books() {
  const { data, updateBook, deleteBook, addBook, toast } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<CategoryId | 'all'>('all');
  const [kind, setKind] = useState<LiteraryKind | 'all'>('all');
  const [status, setStatus] = useState<Status>('all');
  const [sort, setSort] = useState<'list' | 'progress' | 'title'>('list');
  const [toDelete, setToDelete] = useState<Book | null>(null);
  const [dbOpen, setDbOpen] = useState(false);

  const filtered = useMemo(() => {
    const nq = normalize(query);
    let list = data.books.filter((b) => {
      if (nq && !normalize(`${b.title} ${b.author} ${b.genre} ${b.movement}`).includes(nq)) return false;
      if (cat !== 'all' && b.category !== cat) return false;
      if (kind !== 'all' && b.kind !== kind) return false;
      if (status === 'learned' && !isBookLearned(data, b)) return false;
      if (status === 'todo' && isBookLearned(data, b)) return false;
      if (status === 'favorite' && !b.favorite) return false;
      if (status === 'review' && !needsReview(data, b)) return false;
      return true;
    });
    if (sort === 'progress') list = [...list].sort((a, b) => bookProgress(data, a) - bookProgress(data, b));
    if (sort === 'title') list = [...list].sort((a, b) => a.title.localeCompare(b.title, 'cs'));
    return list;
  }, [data, query, cat, kind, status, sort]);

  const byCat = CATEGORY_ORDER.map((c) => ({ c, books: filtered.filter((b) => b.category === c) })).filter((x) => x.books.length);

  return (
    <div>
      <PageHeader
        title="Moje knihy"
        emoji="📚"
        sub={`${data.books.length} knih v maturitním seznamu`}
        action={
          <>
            <Button variant="secondary" icon={<Database size={18} />} onClick={() => setDbOpen(true)}>
              Přidat z databáze
            </Button>
            <Button icon={<Plus size={18} />} onClick={() => navigate('/knihy/nova')}>
              Přidat ručně
            </Button>
          </>
        }
      />

      <Card className="mb-5 space-y-3 p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Hledat podle názvu, autora, žánru…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto py-2 text-sm" value={cat} onChange={(e) => setCat(e.target.value as CategoryId | 'all')} aria-label="Kategorie">
            <option value="all">Všechny kategorie</option>
            {CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {CATEGORIES[c].label}
              </option>
            ))}
          </select>
          <select className="input w-auto py-2 text-sm" value={kind} onChange={(e) => setKind(e.target.value as LiteraryKind | 'all')} aria-label="Literární druh">
            <option value="all">Všechny druhy</option>
            {Object.entries(KINDS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select className="input w-auto py-2 text-sm" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Řazení">
            <option value="list">Pořadí seznamu</option>
            <option value="progress">Od nejslabší</option>
            <option value="title">Abecedně</option>
          </select>
        </div>
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'Vše' },
            { value: 'todo', label: 'K naučení' },
            { value: 'learned', label: 'Naučené' },
            { value: 'review', label: 'Zopakovat' },
            { value: 'favorite', label: '★ Oblíbené' },
          ]}
        />
      </Card>

      {!data.books.length ? (
        <EmptyState icon="📖" title="Seznam je prázdný" text="Přidej knihy z databáze nebo ručně." action={<Button onClick={() => setDbOpen(true)}>Přidat z databáze</Button>} />
      ) : !filtered.length ? (
        <EmptyState icon="🔍" title="Nic nenalezeno" text="Zkus změnit hledání nebo filtry." />
      ) : (
        <div className="space-y-6">
          {byCat.map(({ c, books }) => (
            <section key={c}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                {CATEGORIES[c].label} <span className="text-slate-400">({books.length})</span>
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {books.map((b) => (
                  <BookCard
                    key={b.id}
                    book={b}
                    progress={bookProgress(data, b)}
                    learned={isBookLearned(data, b)}
                    review={needsReview(data, b)}
                    last={bookLastStudied(data, b.id)}
                    onFavorite={() => updateBook(b.id, { favorite: !b.favorite })}
                    onLearned={() => updateBook(b.id, { learned: !b.learned })}
                    onDelete={() => setToDelete(b)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Smazat knihu?">
        <p>
          Opravdu chceš ze seznamu odstranit <b>{toDelete?.title}</b>? Poznámky ke knize se smažou. {toDelete?.source === 'database' && 'Knihu můžeš později znovu přidat z databáze.'}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setToDelete(null)}>
            Zrušit
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 size={16} />}
            onClick={() => {
              if (toDelete) {
                deleteBook(toDelete.id);
                toast(`Kniha ${toDelete.title} byla smazána.`);
              }
              setToDelete(null);
            }}
          >
            Smazat
          </Button>
        </div>
      </Modal>

      <DatabaseModal
        open={dbOpen}
        onClose={() => setDbOpen(false)}
        existing={new Set(data.books.map((b) => b.templateId ?? b.id))}
        onAdd={(id, edit) => {
          const seed = BOOK_DATABASE.find((s) => s.id === id)!;
          const taken = data.books.some((b) => b.id === seed.id);
          const book = seedToBook(seed, taken ? { id: `${seed.id}-${Date.now().toString(36)}` } : {});
          addBook(book);
          toast(`Přidáno: ${book.title}`, 'success');
          if (edit) navigate(`/knihy/${book.id}/upravit`);
        }}
      />
    </div>
  );
}

function BookCard({
  book: b,
  progress,
  learned,
  review,
  last,
  onFavorite,
  onLearned,
  onDelete,
}: {
  book: Book;
  progress: number;
  learned: boolean;
  review: boolean;
  last: number;
  onFavorite: () => void;
  onLearned: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="group flex flex-col p-4 transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <Link to={`/knihy/${b.id}`} className="min-w-0 flex-1">
          <h3 className="truncate text-[17px] font-bold group-hover:text-brand-700 dark:group-hover:text-brand-400">{b.title}</h3>
          <p className="truncate text-sm text-slate-500">
            {b.author} · {b.year}
          </p>
        </Link>
        <IconBtn label={b.favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'} onClick={onFavorite}>
          <Star size={19} className={b.favorite ? 'fill-amber-400 text-amber-400' : ''} />
        </IconBtn>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Tag>{KINDS[b.kind]}</Tag>
        {learned && <Tag tone="emerald">✓ Naučeno</Tag>}
        {review && <Tag tone="amber">Zopakovat</Tag>}
        {b.source === 'custom' && <Tag tone="violet">Vlastní</Tag>}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <ProgressBar value={progress} className="flex-1" />
        <span className="w-10 text-right text-sm font-semibold tabular-nums">{Math.round(progress * 100)}%</span>
      </div>
      <div className="mt-1 text-xs text-slate-500">{last ? `Naposledy procvičeno ${relativeDays(last)}` : 'Zatím neprocvičeno'}</div>
      <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-3 dark:border-slate-800">
        <button
          onClick={onLearned}
          className={cx('mr-auto flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium', b.learned ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800')}
        >
          {b.learned ? <CheckCircle2 size={17} /> : <Circle size={17} />}
          {b.learned ? 'Označeno jako naučené' : 'Označit jako naučené'}
        </button>
        <Link to={`/knihy/${b.id}/upravit`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Upravit">
          <Pencil size={17} />
        </Link>
        <IconBtn label="Smazat" onClick={onDelete}>
          <Trash2 size={17} />
        </IconBtn>
      </div>
    </Card>
  );
}

function IconBtn({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={label} title={label}>
      {children}
    </button>
  );
}

export function DatabaseModal({ open, onClose, existing, onAdd }: { open: boolean; onClose: () => void; existing: Set<string>; onAdd: (id: string, edit: boolean) => void }) {
  const [q, setQ] = useState('');
  const list = BOOK_DATABASE.filter((b) => !q || normalize(`${b.title} ${b.author}`).includes(normalize(q)));
  return (
    <Modal open={open} onClose={onClose} title="Přidat knihu z databáze" wide>
      <p className="mb-3 text-sm text-slate-500">
        Předvyplněné informace o dílech. Po přidání je můžeš libovolně upravit. Údaje vždy ověř se svým učitelem nebo čítankou.
      </p>
      <input className="input mb-3" placeholder="Hledat…" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {list.map((b) => {
          const has = existing.has(b.id);
          return (
            <li key={b.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{b.title}</div>
                <div className="truncate text-sm text-slate-500">
                  {b.author} · {CATEGORIES[b.category].short}
                </div>
              </div>
              {has ? (
                <Tag tone="emerald">V seznamu</Tag>
              ) : (
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => onAdd(b.id, true)}>
                    Přidat a upravit
                  </Button>
                  <Button size="sm" onClick={() => onAdd(b.id, false)}>
                    Přidat
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
