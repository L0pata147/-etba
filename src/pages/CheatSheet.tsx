import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import type { SubjectId } from '../types';
import { useStore } from '../store';
import { CATEGORY_ORDER } from '../data/osnova';
import { SUBJECTS, SUBJECT_TOPICS, ALL_TOPIC_MAP } from '../data/subjects';
import { TERM_SHEET_GROUPS, bookSheet, termSheet, topicSheet, type Sheet } from '../lib/cheatsheet';
import { TERMS } from '../data/terms';
import { printPage } from '../lib/native';
import { Button, Card, PageHeader, Segmented, Toggle, cx } from '../components/ui';

type Source = Extract<SubjectId, 'cjl' | 'site' | 'hw' | 'cloud'> | 'pojmy';
const SOURCES: Source[] = ['cjl', 'pojmy', 'site', 'hw', 'cloud'];
const sourceLabel = (s: Source) => (s === 'pojmy' ? '📖 Literární pojmy' : `${SUBJECTS[s].emoji} ${SUBJECTS[s].short}`);
type Size = 'auto' | 'S' | 'M';

/** Výška a šířka tiskové plochy A4 při okrajích 10 mm (v CSS px, 96 dpi) s malou rezervou */
// Okraj 12 mm je přímo v taháku (padding), protože prohlížeče okraje z @page často ignorují a tisknou až ke kraji papíru
const PAGE_W_MM = 210 - 2 * 12;
const PAGE_H_PX = Math.floor(((297 - 2 * 12 - 5) * 96) / 25.4);
const FIXED_PX: Record<Exclude<Size, 'auto'>, number> = { S: 11, M: 13 };

export function CheatSheetPage() {
  const [params] = useSearchParams();
  // odkaz z jiné knihy / tématu otevře výběr znovu
  return <CheatSheetInner key={params.get('k') ?? params.get('t') ?? params.get('pojmy') ?? ''} />;
}

function CheatSheetInner() {
  const { data, toast } = useStore();
  const [params] = useSearchParams();
  const initialTopic = params.get('t') ? ALL_TOPIC_MAP[params.get('t')!] : undefined;
  const termsLink = params.has('pojmy');
  const [source, setSource] = useState<Source>(termsLink ? 'pojmy' : initialTopic && initialTopic.subject !== 'cjl' ? initialTopic.subject : 'cjl');
  const [picked, setPicked] = useState<Set<string>>(() => new Set(termsLink ? TERM_SHEET_GROUPS.map((g) => g.id) : [params.get('k') ?? params.get('t') ?? ''].filter(Boolean)));
  const [size, setSize] = useState<Size>('auto');
  const [notes, setNotes] = useState(false);

  const books = useMemo(() => [...data.books].sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)), [data.books]);
  const items =
    source === 'cjl'
      ? books.map((b) => ({ id: b.id, label: b.title || 'Bez názvu', sub: b.author }))
      : source === 'pojmy'
        ? TERM_SHEET_GROUPS.map((g) => ({ id: g.id, label: g.title, sub: `${TERMS.filter((t) => g.categories.includes(t.category)).length} pojmů` }))
        : SUBJECT_TOPICS[source].map((t) => ({ id: t.id, label: `${t.number}. ${t.title}`, sub: '' }));
  const chosen = items.filter((i) => picked.has(i.id));
  const sheets: Sheet[] =
    source === 'cjl'
      ? books.filter((b) => picked.has(b.id)).map((b) => bookSheet(b, notes))
      : source === 'pojmy'
        ? TERM_SHEET_GROUPS.filter((g) => picked.has(g.id)).map((g) => termSheet(g.id))
        : SUBJECT_TOPICS[source].filter((t) => picked.has(t.id)).map(topicSheet);

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
    const name = sheets.length === 1 ? `Tahák – ${sheets[0].title}` : `Taháky – ${source === 'pojmy' ? 'literární pojmy' : SUBJECTS[source].short}`;
    if (!printPage(name)) toast('Tisk umí až nová verze Android aplikace – stáhni si ji v Nastavení.', 'error');
  };

  return (
    <div>
      <div className="print:hidden">
        <PageHeader title="Taháky k tisku" emoji="🖨️" sub="To nejdůležitější z knihy nebo tématu na jednu stránku A4. Vytiskni si je, nebo je ulož jako PDF." />
        <Card className="mb-5 space-y-4 p-5">
          <Segmented value={source} onChange={switchSource} options={SOURCES.map((s) => ({ value: s, label: sourceLabel(s) }))} />
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{source === 'cjl' ? 'Knihy z mého seznamu' : source === 'pojmy' ? 'Skupiny pojmů (každá na jednu stránku)' : 'Témata'}</span>
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
                { value: 'auto', label: 'Vyplnit A4' },
                { value: 'S', label: 'Menší' },
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
  const [fit, setFit] = useState(11);
  const probe = useRef<HTMLDivElement>(null);
  // „Vyplnit A4“: největší písmo, se kterým se tahák ještě vejde na jednu stránku (měří se na skryté kopii v šířce A4)
  useLayoutEffect(() => {
    const el = probe.current;
    if (size !== 'auto' || !el) return;
    let lo = 8;
    let hi = 17;
    for (let i = 0; i < 9; i++) {
      const mid = (lo + hi) / 2;
      el.style.fontSize = `${mid}px`;
      if (el.offsetHeight <= PAGE_H_PX) lo = mid;
      else hi = mid;
    }
    setFit(Math.floor(lo * 4) / 4);
  }, [s, size]);
  const px = size === 'auto' ? fit : FIXED_PX[size];
  return (
    <>
      {size === 'auto' && (
        <div aria-hidden className="pointer-events-none fixed left-[-10000px] top-0 print:hidden" style={{ width: `${PAGE_W_MM}mm` }}>
          <div ref={probe} className="bg-white leading-snug">
            <SheetBody sheet={s} cols />
          </div>
        </div>
      )}
      <article
        className="mx-auto max-w-[210mm] break-after-page rounded-lg bg-white p-6 leading-snug text-slate-900 shadow-lg ring-1 ring-slate-200 print:max-w-none print:rounded-none print:p-[12mm] print:shadow-none print:ring-0 [&:last-child]:break-after-auto"
        style={{ fontSize: `${px}px` }}
      >
        <SheetBody sheet={s} />
      </article>
    </>
  );
}

function SheetBody({ sheet: s, cols }: { sheet: Sheet; cols?: boolean }) {
  return (
    <>
      <header className="mb-3 border-b-2 border-slate-900 pb-2">
        <h1 className="font-extrabold leading-tight" style={{ fontSize: '1.75em' }}>
          {s.title}
        </h1>
        <div className="font-semibold text-slate-700">{s.subtitle}</div>
        {s.meta.length > 0 && <div className="mt-0.5 text-slate-600">{s.meta.join(' · ')}</div>}
      </header>
      <div className={cx('gap-5 print:columns-2', cols ? 'columns-2' : 'sm:columns-2')}>
        {s.sections.map((sec) => (
          <section key={sec.title} className={cx('mb-2.5', !sec.pairs && 'break-inside-avoid')}>
            <h2 className="mb-0.5 break-after-avoid font-bold uppercase tracking-wide text-slate-800" style={{ fontSize: '0.85em' }}>
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
                  <div key={p.term} className="break-inside-avoid">
                    <dt className="inline font-semibold">{p.term}</dt>
                    <dd className="inline"> – {p.def}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
