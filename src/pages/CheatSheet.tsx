import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import type { SubjectId } from '../types';
import { useStore } from '../store';
import { CATEGORY_ORDER } from '../data/osnova';
import { SUBJECTS, SUBJECT_TOPICS, ALL_TOPIC_MAP } from '../data/subjects';
import { bookSheet, topicSheet, type Sheet } from '../lib/cheatsheet';
import { printPage } from '../lib/native';
import { Button, Card, PageHeader, Segmented, Toggle, cx } from '../components/ui';

type Source = Extract<SubjectId, 'cjl' | 'site' | 'hw' | 'cloud'>;
type Size = 'S' | 'M';

export function CheatSheetPage() {
  const [params] = useSearchParams();
  // odkaz z jiné knihy / tématu otevře výběr znovu
  return <CheatSheetInner key={params.get('k') ?? params.get('t') ?? ''} />;
}

function CheatSheetInner() {
  const { data, toast } = useStore();
  const [params] = useSearchParams();
  const initialTopic = params.get('t') ? ALL_TOPIC_MAP[params.get('t')!] : undefined;
  const [source, setSource] = useState<Source>(initialTopic && initialTopic.subject !== 'cjl' ? initialTopic.subject : 'cjl');
  const [picked, setPicked] = useState<Set<string>>(() => new Set([params.get('k') ?? params.get('t') ?? ''].filter(Boolean)));
  const [size, setSize] = useState<Size>('S');
  const [notes, setNotes] = useState(false);

  const books = useMemo(() => [...data.books].sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)), [data.books]);
  const items =
    source === 'cjl' ? books.map((b) => ({ id: b.id, label: b.title || 'Bez názvu', sub: b.author })) : SUBJECT_TOPICS[source].map((t) => ({ id: t.id, label: `${t.number}. ${t.title}`, sub: '' }));
  const chosen = items.filter((i) => picked.has(i.id));
  const sheets: Sheet[] = source === 'cjl' ? books.filter((b) => picked.has(b.id)).map((b) => bookSheet(b, notes)) : SUBJECT_TOPICS[source].filter((t) => picked.has(t.id)).map(topicSheet);

  const toggle = (id: string) =>
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const switchSource = (s: Source) => {
    setSource(s);
    setPicked(new Set());
  };
  const print = () => {
    const name = sheets.length === 1 ? `Tahák – ${sheets[0].title}` : `Taháky – ${SUBJECTS[source].short}`;
    if (!printPage(name)) toast('Tisk umí až nová verze Android aplikace – stáhni si ji v Nastavení.', 'error');
  };

  return (
    <div>
      <div className="print:hidden">
        <PageHeader title="Taháky k tisku" emoji="🖨️" sub="To nejdůležitější z knihy nebo tématu na jednu stránku A4. Vytiskni si je, nebo je ulož jako PDF." />
        <Card className="mb-5 space-y-4 p-5">
          <Segmented value={source} onChange={switchSource} options={(['cjl', 'site', 'hw', 'cloud'] as Source[]).map((s) => ({ value: s, label: `${SUBJECTS[s].emoji} ${SUBJECTS[s].short}` }))} />
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{source === 'cjl' ? 'Knihy z mého seznamu' : 'Témata'}</span>
              <span className="text-slate-500 dark:text-slate-400">· vybráno {chosen.length}</span>
              <button className="ml-auto font-semibold text-brand-700 hover:underline dark:text-brand-400" onClick={() => setPicked(new Set(items.map((i) => i.id)))}>
                Vybrat vše
              </button>
              <button className="font-semibold text-slate-500 hover:underline dark:text-slate-400" onClick={() => setPicked(new Set())}>
                Zrušit výběr
              </button>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">V seznamu zatím nemáš žádné knihy.</p>
            ) : (
              <div className="grid max-h-72 gap-1 overflow-y-auto pr-1 sm:grid-cols-2">
                {items.map((i) => (
                  <label
                    key={i.id}
                    className={cx(
                      'flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm',
                      picked.has(i.id) ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.04]',
                    )}
                  >
                    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={picked.has(i.id)} onChange={() => toggle(i.id)} />
                    <span className="min-w-0">
                      <span className="font-medium">{i.label}</span>
                      {i.sub && <span className="text-slate-500 dark:text-slate-400"> – {i.sub}</span>}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold">Písmo:</span>
            <Segmented
              value={size}
              onChange={setSize}
              options={[
                { value: 'S', label: 'Menší (vejde se víc)' },
                { value: 'M', label: 'Větší' },
              ]}
            />
            {source === 'cjl' && <Toggle checked={notes} onChange={setNotes} label="Přidat moje poznámky" />}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button icon={<Printer size={18} />} onClick={print} disabled={!sheets.length}>
              Vytisknout / uložit PDF
            </Button>
            <span className="text-xs text-slate-500 dark:text-slate-400">V okně tisku vyber tiskárnu, nebo „Uložit jako PDF“. Každý tahák začíná na nové stránce.</span>
          </div>
        </Card>
        {sheets.length > 0 && <h2 className="mb-3 text-lg font-bold">Náhled</h2>}
      </div>

      <div className="space-y-6 print:space-y-0">
        {sheets.map((s) => (
          <SheetView key={s.id} sheet={s} size={size} />
        ))}
      </div>
    </div>
  );
}

/** Jedna stránka taháku – vždy černá na bílé (i v tmavém režimu), jako papír */
function SheetView({ sheet: s, size }: { sheet: Sheet; size: Size }) {
  return (
    <article
      className={cx(
        'mx-auto max-w-[210mm] break-after-page rounded-lg bg-white p-6 text-slate-900 shadow-lg ring-1 ring-slate-200 print:max-w-none print:rounded-none print:p-0 print:shadow-none print:ring-0 [&:last-child]:break-after-auto',
        size === 'S' ? 'text-[11px] leading-snug' : 'text-[13px] leading-normal',
      )}
    >
      <header className="mb-3 border-b-2 border-slate-900 pb-2">
        <h1 className={cx('font-extrabold leading-tight', size === 'S' ? 'text-xl' : 'text-2xl')}>{s.title}</h1>
        <div className="font-semibold text-slate-700">{s.subtitle}</div>
        {s.meta.length > 0 && <div className="mt-0.5 text-slate-600">{s.meta.join(' · ')}</div>}
      </header>
      <div className="gap-5 sm:columns-2 print:columns-2">
        {s.sections.map((sec) => (
          <section key={sec.title} className="mb-2.5 break-inside-avoid">
            <h2 className="mb-0.5 font-bold uppercase tracking-wide text-slate-800" style={{ fontSize: '0.85em' }}>
              {sec.title}
            </h2>
            {sec.text && <p className="whitespace-pre-line">{sec.text}</p>}
            {sec.list &&
              (sec.ordered ? (
                <ol className="list-decimal space-y-0.5 pl-4">
                  {sec.list.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ol>
              ) : (
                <ul className="list-disc space-y-0.5 pl-4">
                  {sec.list.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              ))}
            {sec.pairs && (
              <dl className="space-y-0.5">
                {sec.pairs.map((p) => (
                  <div key={p.term}>
                    <dt className="inline font-semibold">{p.term}</dt>
                    <dd className="inline"> – {p.def}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
