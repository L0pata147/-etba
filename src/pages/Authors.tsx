import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Dumbbell, UserRound } from 'lucide-react';
import { useStore } from '../store';
import { authorQuestions, groupAuthors, type Author } from '../lib/authors';
import { bookProgress } from '../lib/progress';
import { shuffle } from '../lib/random';
import { CATEGORIES, KINDS } from '../data/osnova';
import type { Book } from '../types';
import { useStartSession } from './SessionPage';
import { Button, Card, EmptyState, PageHeader, ProgressBar, SectionTitle, Tag } from '../components/ui';

function useAuthorTraining() {
  const { data } = useStore();
  const start = useStartSession();
  return (title: string, only?: Author[], count = 15) => {
    const qs = shuffle(authorQuestions(data.books, data.books, only)).slice(0, count);
    start({ title, mode: 'autori', difficulty: 'medium', bookIds: [], areas: [], types: [], count: qs.length, questions: qs });
  };
}

/** Seznam autorů z maturitní četby */
export function Authors() {
  const { data } = useStore();
  const train = useAuthorTraining();
  const authors = useMemo(() => groupAuthors(data.books), [data.books]);
  const total = useMemo(() => authorQuestions(data.books, data.books).length, [data.books]);

  if (!authors.length) return <EmptyState icon={<UserRound size={36} />} title="Zatím žádní autoři" text="Autoři se objeví, jakmile budeš mít v seznamu knihy." action={<Button to="/knihy">Moje knihy</Button>} />;

  return (
    <div>
      <PageHeader
        title="Autoři"
        sub={`${authors.length} autorů z tvé četby – život, díla, směr a kontext tvorby.`}
        action={
          <Button icon={<Dumbbell size={18} />} onClick={() => train('Otázky na autory')}>
            Trénovat autory
          </Button>
        }
      />
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
        Trénink obsahuje jen otázky o autorech: kdo co napsal, kdy žil, další díla, směr a kontext tvorby ({total} otázek).
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {authors.map((a) => {
          const p = a.books.reduce((s, b) => s + bookProgress(data, b), 0) / a.books.length;
          return (
            <Link key={a.id} to={`/autori/${a.id}`} className="card block p-4 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-100 font-display text-sm font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                  {initials(a.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[17px] font-bold leading-snug">{a.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{a.life || 'údaje o životě neuvedeny'}</div>
                  <div className="mt-1.5 truncate text-sm text-slate-600 dark:text-slate-300">{a.books.map((b) => b.title).join(', ')}</div>
                </div>
              </div>
              <ProgressBar value={p} className="mt-3" color="bg-rose-500" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** Profil autora */
export function AuthorDetail() {
  const { id } = useParams();
  const { data } = useStore();
  const train = useAuthorTraining();
  const author = useMemo(() => groupAuthors(data.books).find((a) => a.id === id), [data.books, id]);
  if (!author) return <EmptyState icon={<UserRound size={36} />} title="Autor nenalezen" action={<Button to="/autori">Zpět na autory</Button>} />;

  return (
    <div>
      <Link to="/autori" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
        <ArrowLeft size={16} /> Autoři
      </Link>
      <PageHeader
        title={author.name}
        sub={author.life}
        action={
          <Button icon={<Dumbbell size={18} />} onClick={() => train(`Autor: ${author.name}`, [author], 10)}>
            Trénovat tohoto autora
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {author.books.map((b) => (
            <Card key={b.id} className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold">Kontext tvorby – {b.title}</h2>
              </div>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">{b.authorContext || 'K této knize zatím není kontext autora vyplněný.'}</p>
              {b.historicalContext && (
                <>
                  <div className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Literárněhistorický kontext</div>
                  <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">{b.historicalContext}</p>
                </>
              )}
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle>Z tvé četby</SectionTitle>
            <ul className="space-y-3">
              {author.books.map((b) => (
                <BookRow key={b.id} b={b} />
              ))}
            </ul>
          </Card>
          {author.otherWorks.length > 0 && (
            <Card className="p-5">
              <SectionTitle>Další díla</SectionTitle>
              <ul className="space-y-1.5 text-[15px]">
                {author.otherWorks.map((w) => (
                  <li key={w} className="flex gap-2">
                    <BookOpen size={16} className="mt-0.5 shrink-0 text-slate-400" />
                    {w}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card className="p-5">
            <SectionTitle>Směr a období</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {[...author.movements, ...author.periods.filter((p) => !author.movements.includes(p))].map((m) => (
                <Tag key={m}>{m}</Tag>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BookRow({ b }: { b: Book }) {
  const { data } = useStore();
  return (
    <li>
      <Link to={`/knihy/${b.id}`} className="block hover:opacity-80">
        <div className="font-semibold">{b.title}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {b.year} · {KINDS[b.kind]} · {CATEGORIES[b.category].short}
        </div>
        <ProgressBar value={bookProgress(data, b)} className="mt-1.5" color="bg-rose-500" />
      </Link>
    </li>
  );
}

function initials(name: string): string {
  const parts = name.replace(/\(.*?\)/g, '').split(/\s+/).filter((p) => /^\p{Lu}/u.test(p));
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}
