import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { useStore } from '../store';
import { TERMS } from '../data/terms';
import { ALL_TOPICS, SUBJECTS } from '../data/subjects';
import { ALL_COMMANDS, PLATFORM_LABEL } from '../data/site/commands';
import { ALL_PROCEDURES } from '../data/site/procedures';
import { TROUBLE } from '../data/troubleshoot';
import { WRITING_FORMS } from '../data/writing';
import { platformSubject } from '../lib/topicgen';
import { Card, EmptyState, PageHeader, Tag } from '../components/ui';

/** Malá písmena bez diakritiky */
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

interface Hit {
  group: string;
  title: string;
  snippet: string;
  to: string;
  score: number;
}

interface Doc {
  group: string;
  title: string;
  to: string;
  /** Pole k prohledání – první je nejdůležitější */
  fields: string[];
}

function snippetOf(text: string, q: string): string {
  const i = fold(text).indexOf(q);
  if (i < 0) return text.slice(0, 120);
  const from = Math.max(0, i - 50);
  return `${from ? '…' : ''}${text.slice(from, i + q.length + 70).replace(/\s+/g, ' ')}${i + q.length + 70 < text.length ? '…' : ''}`;
}

const practicalPath = (p: Parameters<typeof platformSubject>[0], tab: string) => `/${platformSubject(p) === 'cloud' ? 'cloud' : 'site'}/prakticka?tab=${tab}`;

export function SearchPage() {
  const { data } = useStore();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');

  const docs = useMemo<Doc[]>(
    () => [
      ...data.books.map((b) => ({ group: '📚 Knihy', title: `${b.title} (${b.author})`, to: `/knihy/${b.id}`, fields: [`${b.title} ${b.author}`, b.notes, b.theme, b.quick.join(' '), b.interpretation] })),
      ...TERMS.map((t) => ({ group: '📖 Literární pojmy', title: t.name, to: '/pojmy', fields: [t.name, `${t.short} ${t.detail} ${t.example}`] })),
      ...ALL_TOPICS.map((t) => ({
        group: `${SUBJECTS[t.subject].emoji} ${SUBJECTS[t.subject].short} – témata`,
        title: `${t.number}. ${t.title}`,
        to: `/tema/${t.id}`,
        fields: [t.title, data.topicNotes[t.id] ?? '', t.terms.map((x) => `${x.term} ${x.def}`).join(' '), `${t.summary} ${t.outline.map((o) => `${o.heading} ${o.points.join(' ')}`).join(' ')}`],
      })),
      ...ALL_COMMANDS.map((c) => ({ group: '⌨️ Příkazy', title: c.command, to: practicalPath(c.platform, 'prikazy'), fields: [c.command, `${c.task} ${PLATFORM_LABEL[c.platform]} ${c.note ?? ''}`] })),
      ...ALL_PROCEDURES.map((p) => ({ group: '🧭 Postupy', title: `${p.title} (${PLATFORM_LABEL[p.platform]})`, to: practicalPath(p.platform, 'postupy'), fields: [p.title, `${p.goal} ${p.steps.map((s) => `${s.text} ${s.cmd ?? ''}`).join(' ')}`] })),
      ...TROUBLE.map((t) => ({ group: '🔧 Najdi chybu', title: t.title, to: practicalPath(t.platform, 'chyby'), fields: [t.title, `${t.symptom} ${t.answer} ${t.fix}`] })),
      ...WRITING_FORMS.map((f) => ({ group: '✍️ Slohové útvary', title: f.name, to: '/sloh?tab=utvary', fields: [f.name, `${f.purpose} ${f.structure.join(' ')} ${f.language.join(' ')}`] })),
      ...data.writings.map((w) => ({ group: '✍️ Moje slohovky', title: w.title, to: `/sloh?prace=${w.id}`, fields: [w.title, w.text] })),
    ],
    [data.books, data.topicNotes, data.writings],
  );

  const hits = useMemo<Hit[]>(() => {
    const query = fold(q.trim());
    if (query.length < 2) return [];
    const words = query.split(/\s+/);
    const out: Hit[] = [];
    for (const d of docs) {
      const folded = d.fields.map((f) => fold(f ?? ''));
      if (!words.every((w) => folded.some((f) => f.includes(w)))) continue;
      const fieldIdx = folded.findIndex((f) => f.includes(words[0]));
      const score = (fold(d.title).includes(query) ? 10 : 0) + (fieldIdx === 0 ? 5 : 0) - fieldIdx;
      const source = d.fields[fieldIdx] ?? d.fields[0];
      out.push({ group: d.group, title: d.title, to: d.to, snippet: fieldIdx === 0 ? '' : snippetOf(source, words[0]), score });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 80);
  }, [q, docs]);

  const groups = useMemo(() => {
    const m = new Map<string, Hit[]>();
    for (const h of hits) m.set(h.group, [...(m.get(h.group) ?? []), h]);
    return [...m.entries()];
  }, [hits]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Hledat" emoji="🔎" sub="Knihy, pojmy, témata všech předmětů, příkazy, postupy, tvoje poznámky i slohovky." />
      <div className="relative mb-5">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setParams(e.target.value ? { q: e.target.value } : {}, { replace: true });
          }}
          placeholder="např. VLAN, RAID 5, Čapek, metafora, docker run…"
          aria-label="Hledaný výraz"
          className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-[16px] dark:border-slate-700 dark:bg-slate-900"
        />
      </div>
      {q.trim().length >= 2 && !hits.length && <EmptyState icon="🤷" title="Nic nenalezeno" text="Zkus jiné slovo nebo kratší výraz." />}
      <div className="space-y-5">
        {groups.map(([g, list]) => (
          <section key={g}>
            <h2 className="mb-2 flex items-center gap-2 font-bold">
              {g} <Tag>{list.length}</Tag>
            </h2>
            <Card className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.map((h, k) => (
                <Link key={h.to + h.title + k} to={h.to} className="block p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <div className="font-semibold">{h.title}</div>
                  {h.snippet && <div className="text-sm text-slate-500 dark:text-slate-400">{h.snippet}</div>}
                </Link>
              ))}
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}
