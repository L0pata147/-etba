import { useMemo, useState } from 'react';
import { ChevronDown, Play, Search } from 'lucide-react';
import type { Term, TermCategory } from '../types';
import { TERMS, TERM_CATEGORIES } from '../data/terms';
import { normalize } from '../lib/text';
import type { SessionConfig } from '../lib/session';
import { useStore } from '../store';
import { useStartSession } from './SessionPage';
import { Button, Card, EmptyState, PageHeader, Segmented, Tag, cx } from '../components/ui';

export function termsConfig(title: string, termIds?: string[], count = 12): SessionConfig {
  return {
    title,
    mode: 'pojmy',
    difficulty: 'medium',
    bookIds: ['__none__'],
    areas: ['terms'],
    types: ['abc', 'truefalse', 'flashcard', 'identifyTerm', 'match', 'open'],
    count,
    includeTerms: true,
    termIds,
    includeGlobal: false,
  };
}

export function Terms() {
  const start = useStartSession();
  const { data } = useStore();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<TermCategory | 'all'>('all');
  const [open, setOpen] = useState<string | null>(null);

  const list = useMemo(() => {
    const nq = normalize(query);
    return TERMS.filter((t) => (cat === 'all' || t.category === cat) && (!nq || normalize(`${t.name} ${t.short}`).includes(nq)));
  }, [query, cat]);

  const attempts = data.mastery['terms|terms']?.attempts ?? 0;

  return (
    <div>
      <PageHeader
        title="Literární pojmy"
        emoji="📖"
        sub={`${TERMS.length} pojmů s definicí, vysvětlením a příklady z tvé četby · procvičeno ${attempts}×`}
        action={
          <Button icon={<Play size={18} />} onClick={() => start(termsConfig(cat === 'all' ? 'Literární pojmy' : `Pojmy: ${TERM_CATEGORIES[cat]}`, list.map((t) => t.id), 15))} disabled={!list.length}>
            Otestovat {cat === 'all' && !query ? 'pojmy' : `zobrazené (${list.length})`}
          </Button>
        }
      />
      <Card className="mb-5 space-y-3 p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Hledat pojem…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Segmented
          value={cat}
          onChange={setCat}
          options={[{ value: 'all' as const, label: 'Vše' }, ...(Object.entries(TERM_CATEGORIES) as [TermCategory, string][]).map(([k, v]) => ({ value: k, label: v }))]}
        />
      </Card>
      {!list.length ? (
        <EmptyState icon="🔍" title="Pojem nenalezen" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((t) => (
            <TermCard key={t.id} term={t} open={open === t.id} onToggle={() => setOpen(open === t.id ? null : t.id)} onTest={() => start(termsConfig(`Pojem: ${t.name}`, [t.id], 5))} />
          ))}
        </div>
      )}
    </div>
  );
}

function TermCard({ term: t, open, onToggle, onTest }: { term: Term; open: boolean; onToggle: () => void; onTest: () => void }) {
  return (
    <Card className="p-4">
      <button onClick={onToggle} className="flex w-full items-start gap-3 text-left" aria-expanded={open}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[17px] font-bold">{t.name}</h3>
            <Tag>{TERM_CATEGORIES[t.category]}</Tag>
          </div>
          <p className="mt-1 text-[15px] text-slate-600 dark:text-slate-300">{t.short}</p>
        </div>
        <ChevronDown size={20} className={cx('mt-1 shrink-0 text-slate-400 transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="animate-fade-up mt-3 space-y-2 border-t border-slate-100 pt-3 text-[15px] dark:border-slate-800">
          <p>
            <b>Vysvětlení:</b> {t.detail}
          </p>
          <p>
            <b>Příklad:</b> {t.example}
          </p>
          {t.bookExample && (
            <p className="rounded-lg bg-brand-50 p-2 dark:bg-brand-500/10">
              <b>📚 Z tvé četby:</b> {t.bookExample}
            </p>
          )}
          <Button size="sm" onClick={onTest} icon={<Play size={14} />}>
            Otestovat hned
          </Button>
        </div>
      )}
    </Card>
  );
}
