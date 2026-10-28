import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import type { SubjectId } from '../types';
import { useStore } from '../store';
import { CATEGORY_ORDER } from '../data/osnova';
import { SUBJECT_TOPICS, ALL_TOPIC_MAP } from '../data/subjects';
import {
  TERM_SHEET_GROUPS,
  authorCard,
  bookSheet,
  chronologySheet,
  commandSheets,
  procedureSheets,
  stylesSheet,
  termSheet,
  topicSheet,
  writingSheets,
  type AuthorCard,
  type Sheet,
  type SheetSection,
} from '../lib/cheatsheet';
import { ALL_COMMANDS, PLATFORM_LABEL } from '../data/site/commands';
import { ALL_PROCEDURES } from '../data/site/procedures';
import { WRITING_FORMS } from '../data/writing';
import { FUNCTIONAL_STYLES } from '../data/styles';
import type { Platform } from '../types';
import { groupAuthors } from '../lib/authors';
import { TERMS } from '../data/terms';
import { printPage } from '../lib/native';
import { Button, Card, PageHeader, Segmented, Toggle, cx } from '../components/ui';

type Source = Extract<SubjectId, 'cjl' | 'site' | 'hw' | 'cloud'> | 'pojmy' | 'autori' | 'chronologie' | 'sloh' | 'prikazy' | 'postupy-site' | 'postupy-cloud';
const EXTRA_LABEL: Record<Source, string> = {
  cjl: '📚 Četba (knihy)',
  autori: '✍️ Autoři (kartičky)',
  pojmy: '📖 Literární pojmy',
  chronologie: '🗓️ Chronologie četby',
  sloh: '📝 Slohové útvary a styly',
  site: '🌐 Témata',
  prikazy: '⌨️ Příkazy Cisco a Linux',
  'postupy-site': '🪜 Postupy (Cisco, Linux, Windows)',
  hw: '🖥️ Okruhy',
  cloud: '☁️ Okruhy',
  'postupy-cloud': '🪜 Postupy (úložiště, Docker, virtualizace)',
};
const sourceLabel = (s: Source) => EXTRA_LABEL[s];
/** Taháky rozdělené podle zkoušek (id zkoušek odpovídají menu) */
const EXAMS: { id: string; label: string; sources: Source[] }[] = [
  { id: 'cjl-ustni', label: '📚 Čeština – ústní', sources: ['cjl', 'autori', 'pojmy', 'chronologie'] },
  { id: 'cjl-pisemna', label: '📝 Čeština – písemka', sources: ['sloh'] },
  { id: 'site-ustni', label: '🌐 Sítě – ústní', sources: ['site'] },
  { id: 'site-prakticka', label: '🛠️ Sítě – praktická', sources: ['prikazy', 'postupy-site'] },
  { id: 'hw-test', label: '🖥️ HW – test', sources: ['hw'] },
  { id: 'cloud-prakticka', label: '☁️ Cloud – praktická', sources: ['cloud', 'postupy-cloud'] },
];
const examOf = (s: Source) => EXAMS.find((e) => e.sources.includes(s))!;
const PROC_PLATFORMS: Record<'postupy-site' | 'postupy-cloud', Platform[]> = {
  'postupy-site': ['cisco', 'linux', 'windows'],
  'postupy-cloud': ['storage', 'docker', 'virtualbox', 'proxmox', 'hyperv'],
};
/** Platformy na tahák příkazů */
const CMD_PLATFORMS: Platform[] = ['cisco', 'linux'];
const cmdKey = (p: Platform, g: string) => `${p}|${g}`;
const SLOH_ITEMS = [
  { id: 'utvary', label: 'Slohové útvary', sub: `${WRITING_FORMS.length} útvarů – stavba, jazyk, chyby` },
  { id: 'styly', label: 'Funkční styly', sub: `${FUNCTIONAL_STYLES.length} stylů – znaky, postupy, útvary` },
];
type Size = 'auto' | 'S' | 'M';

/** Co se po přepnutí taháku rovnou vybere – u taháků s pár položkami vše */
function defaultPick(s: Source): Set<string> {
  if (s === 'chronologie') return new Set(['chronologie']);
  if (s === 'sloh') return new Set(SLOH_ITEMS.map((x) => x.id));
  if (s === 'pojmy') return new Set(TERM_SHEET_GROUPS.map((g) => g.id));
  return new Set();
}

/** Výška a šířka tiskové plochy A4 při okrajích 10 mm (v CSS px, 96 dpi) s malou rezervou */
// Okraj 12 mm je přímo v taháku (padding), protože prohlížeče okraje z @page často ignorují a tisknou až ke kraji papíru
const PAGE_W_MM = 210 - 2 * 12;
const PAGE_H_PX = Math.floor(((297 - 2 * 12 - 5) * 96) / 25.4);
const FIXED_PX: Record<Exclude<Size, 'auto'>, number> = { S: 11, M: 13 };

export function CheatSheetPage() {
  const [params] = useSearchParams();
  // odkaz z jiné knihy / tématu otevře výběr znovu
  return <CheatSheetInner key={params.get('k') ?? params.get('t') ?? (params.has('pojmy') ? 'pojmy' : params.has('autori') ? 'autori' : (params.get('zk') ?? ''))} />;
}

function CheatSheetInner() {
  const { data, toast } = useStore();
  const [params, setParams] = useSearchParams();
  const initialTopic = params.get('t') ? ALL_TOPIC_MAP[params.get('t')!] : undefined;
  const termsLink = params.has('pojmy');
  const authorsLink = params.has('autori');
  const examLink = EXAMS.find((e) => e.id === params.get('zk'));
  const [source, setSource] = useState<Source>(
    termsLink ? 'pojmy' : authorsLink ? 'autori' : initialTopic && initialTopic.subject !== 'cjl' ? initialTopic.subject : examLink ? examLink.sources[0] : 'cjl',
  );
  const [picked, setPicked] = useState<Set<string>>(() =>
    termsLink
      ? new Set(TERM_SHEET_GROUPS.map((g) => g.id))
      : authorsLink
        ? new Set(groupAuthors(data.books).map((a) => a.id))
        : examLink && !params.get('k') && !params.get('t')
          ? defaultPick(examLink.sources[0])
          : new Set([params.get('k') ?? params.get('t') ?? ''].filter(Boolean)),
  );
  const [perPage, setPerPage] = useState<4 | 6>(6);
  const [size, setSize] = useState<Size>('auto');
  const [notes, setNotes] = useState(false);

  const books = useMemo(() => [...data.books].sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)), [data.books]);
  const authors = useMemo(() => groupAuthors(books), [books]);
  const items =
    source === 'prikazy'
      ? CMD_PLATFORMS.flatMap((p) =>
          [...new Set(ALL_COMMANDS.filter((c) => c.platform === p).map((c) => c.group))].map((g) => ({
            id: cmdKey(p, g),
            label: `${p === 'cisco' ? 'Cisco' : 'Linux'} – ${g}`,
            sub: `${ALL_COMMANDS.filter((c) => c.platform === p && c.group === g).length} příkazů`,
          })),
        )
      : source === 'postupy-site' || source === 'postupy-cloud'
        ? ALL_PROCEDURES.filter((p) => PROC_PLATFORMS[source].includes(p.platform)).map((p) => ({ id: p.id, label: p.title, sub: PLATFORM_LABEL[p.platform] }))
        : source === 'chronologie'
          ? [{ id: 'chronologie', label: 'Všechny knihy z mého seznamu podle doby vzniku', sub: `${books.length} děl` }]
          : source === 'sloh'
            ? SLOH_ITEMS
            : source === 'autori'
              ? authors.map((a) => ({ id: a.id, label: a.name, sub: a.books.map((b) => b.title).join(', ') }))
              : source === 'cjl'
                ? books.map((b) => ({ id: b.id, label: b.title || 'Bez názvu', sub: b.author }))
                : source === 'pojmy'
                  ? TERM_SHEET_GROUPS.map((g) => ({ id: g.id, label: g.title, sub: `${TERMS.filter((t) => g.categories.includes(t.category)).length} pojmů` }))
                  : SUBJECT_TOPICS[source].map((t) => ({ id: t.id, label: `${t.number}. ${t.title}`, sub: '' }));
  const chosen = items.filter((i) => picked.has(i.id));
  const cards: AuthorCard[] = source === 'autori' ? authors.filter((a) => picked.has(a.id)).map(authorCard) : [];
  const cardPages = Array.from({ length: Math.ceil(cards.length / perPage) }, (_, i) => cards.slice(i * perPage, (i + 1) * perPage));
  const sheets: Sheet[] =
    source === 'prikazy'
      ? CMD_PLATFORMS.flatMap((p) =>
          commandSheets(
            p,
            PLATFORM_LABEL[p],
            ALL_COMMANDS,
            [...new Set(ALL_COMMANDS.filter((c) => c.platform === p).map((c) => c.group))].filter((g) => picked.has(cmdKey(p, g))),
          ),
        )
      : source === 'postupy-site' || source === 'postupy-cloud'
        ? PROC_PLATFORMS[source].flatMap((p) => {
            const list = ALL_PROCEDURES.filter((x) => x.platform === p && picked.has(x.id));
            return list.length ? procedureSheets(p, PLATFORM_LABEL[p], list) : [];
          })
        : source === 'chronologie'
          ? picked.has('chronologie')
            ? [chronologySheet(books)]
            : []
          : source === 'sloh'
            ? [...(picked.has('utvary') ? writingSheets(WRITING_FORMS) : []), ...(picked.has('styly') ? [stylesSheet(FUNCTIONAL_STYLES)] : [])]
            : source === 'autori'
              ? []
              : source === 'cjl'
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
    setPicked(defaultPick(s));
  };
  const exam = examOf(source);
  const print = () => {
    const name =
      source === 'autori' ? 'Kartičky autorů' : sheets.length === 1 ? `Tahák – ${sheets[0].title}` : `Taháky – ${exam.label.replace(/^\S+\s/, '')} – ${EXTRA_LABEL[source].replace(/^\S+\s/, '')}`;
    if (!printPage(name)) toast('Tisk umí až nová verze Android aplikace – stáhni si ji v Nastavení.', 'error');
  };

  return (
    <div>
      <div className="print:hidden">
        <PageHeader title="Taháky k tisku" emoji="🖨️" sub="To nejdůležitější z knihy nebo tématu na jednu stránku A4. Vytiskni si je, nebo je ulož jako PDF." />
        <Card className="mb-5 space-y-4 p-5">
          <div>
            <div className="mb-1.5 text-sm font-semibold">Zkouška</div>
            <Segmented value={exam.id} onChange={(id) => setParams({ zk: id }, { replace: true })} options={EXAMS.map((e) => ({ value: e.id, label: e.label }))} />
          </div>
          {exam.sources.length > 1 && (
            <div>
              <div className="mb-1.5 text-sm font-semibold">Tahák</div>
              <Segmented value={source} onChange={switchSource} options={exam.sources.map((s) => ({ value: s, label: sourceLabel(s) }))} />
            </div>
          )}
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">
                {source === 'cjl'
                  ? 'Knihy z mého seznamu'
                  : source === 'autori'
                    ? 'Autoři knih z mého seznamu'
                    : source === 'pojmy'
                      ? 'Skupiny pojmů (každá na jednu stránku)'
                      : source === 'prikazy'
                        ? 'Skupiny příkazů (víc skupin na stránku)'
                        : source === 'postupy-site' || source === 'postupy-cloud'
                          ? 'Postupy (víc postupů na stránku)'
                          : source === 'chronologie' || source === 'sloh'
                            ? 'Co vytisknout'
                            : 'Témata'}
              </span>
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
            {source === 'autori' && (
              <Segmented
                value={perPage}
                onChange={setPerPage}
                options={[
                  { value: 6, label: '6 na stránku' },
                  { value: 4, label: '4 na stránku' },
                ]}
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button icon={<Printer size={18} />} onClick={print} disabled={!sheets.length && !cards.length}>
              Vytisknout / uložit PDF
            </Button>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              V okně tisku vyber tiskárnu, nebo „Uložit jako PDF“. {source === 'autori' ? 'Kartičky mají čárkovaný okraj na vystřižení.' : 'Každý tahák začíná na nové stránce.'}
            </span>
          </div>
        </Card>
        {(sheets.length > 0 || cards.length > 0) && <h2 className="mb-3 text-lg font-bold">Náhled</h2>}
      </div>

      <div className="space-y-6 print:space-y-0">
        {sheets.map((s) => (s.pack ? <PackedSheets key={s.id} sheet={s} size={size} /> : <SheetView key={s.id} sheet={s} size={size} />))}
        {cardPages.map((p, i) => (
          <CardPage key={`${perPage}-${i}-${p.map((c) => c.id).join()}`} cards={p} perPage={perPage} size={size} />
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
        {s.sections.map((sec, k) => (
          <SectionView key={`${sec.title}-${k}`} sec={sec} />
        ))}
      </div>
    </>
  );
}

const CARD_GAP_MM = 4;
const CARD_PAD_MM = 3;
const mmToPx = (mm: number) => (mm * 96) / 25.4;

/** Stránka kartiček autorů (2 sloupce × 2 nebo 3 řady) – kartičky stejně velké, na vystřižení */
function CardPage({ cards, perPage, size }: { cards: AuthorCard[]; perPage: 4 | 6; size: Size }) {
  const rows = perPage / 2;
  const cellH = (297 - 2 * 12 - 5 - CARD_GAP_MM * (rows - 1)) / rows;
  const cellW = (PAGE_W_MM - CARD_GAP_MM) / 2;
  const [fit, setFit] = useState(10);
  const probes = useRef<(HTMLDivElement | null)[]>([]);
  // „Vyplnit A4“: největší písmo, se kterým se do své kartičky vejde i ten nejdelší autor ze stránky
  useLayoutEffect(() => {
    if (size !== 'auto') return;
    // rezerva na čárkovaný rámeček a zaokrouhlení při tisku
    const limit = mmToPx(cellH - 2 * CARD_PAD_MM) - 8;
    let lo = 7;
    let hi = 18;
    for (let i = 0; i < 9; i++) {
      const mid = (lo + hi) / 2;
      const ok = probes.current.every((el) => {
        if (!el) return true;
        el.style.fontSize = `${mid}px`;
        return el.offsetHeight <= limit;
      });
      if (ok) lo = mid;
      else hi = mid;
    }
    setFit(Math.floor(lo * 4) / 4);
  }, [cards, size, cellH]);
  const px = size === 'auto' ? fit : FIXED_PX[size];
  return (
    <>
      {size === 'auto' && (
        <div aria-hidden className="pointer-events-none fixed left-[-10000px] top-0 print:hidden">
          {cards.map((c, i) => (
            <div key={c.id} style={{ width: `${cellW - 2 * CARD_PAD_MM - 1}mm` }}>
              <div
                ref={(el) => {
                  probes.current[i] = el;
                }}
                className="bg-white leading-snug"
              >
                <CardBody card={c} />
              </div>
            </div>
          ))}
        </div>
      )}
      <article
        className="mx-auto max-w-[210mm] break-after-page rounded-lg bg-white p-6 leading-snug text-slate-900 shadow-lg ring-1 ring-slate-200 print:max-w-none print:rounded-none print:p-[12mm] print:shadow-none print:ring-0 [&:last-child]:break-after-auto"
        style={{ fontSize: `${px}px` }}
      >
        <div className="grid gap-[4mm] sm:grid-cols-2 print:grid-cols-2">
          {cards.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-[2mm] border border-dashed border-slate-400 p-[3mm] print:h-[var(--cell-h)]" style={{ ['--cell-h' as string]: `${cellH}mm` }}>
              <CardBody card={c} />
            </div>
          ))}
        </div>
      </article>
    </>
  );
}

function CardBody({ card: c }: { card: AuthorCard }) {
  return (
    <>
      <div className="font-extrabold leading-tight" style={{ fontSize: '1.4em' }}>
        {c.name}
      </div>
      {c.life && <div className="mb-1 font-semibold text-slate-600">{c.life}</div>}
      {c.rows.map((r) => (
        <p key={r.label} className="mt-1">
          <b>{r.label}:</b> {r.text}
        </p>
      ))}
    </>
  );
}

function SectionView({ sec }: { sec: SheetSection }) {
  return (
    <section className={cx('mb-2.5', !sec.pairs && !sec.steps && 'break-inside-avoid')}>
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
          {sec.pairs.map((p, i) => (
            <div key={`${p.term}-${i}`} className="break-inside-avoid">
              <dt className={cx('inline font-semibold', sec.mono && 'rounded bg-slate-100 px-1 font-mono [overflow-wrap:anywhere]')} style={sec.mono ? { fontSize: '0.92em' } : undefined}>
                {p.term}
              </dt>
              <dd className="inline"> – {p.def}</dd>
            </div>
          ))}
        </dl>
      )}
      {sec.steps && (
        <ol className="list-decimal space-y-0.5 pl-4">
          {sec.steps.map((st, i) => (
            <li key={i} className="break-inside-avoid">
              {st.text}
              {st.cmd && (
                <pre className="mt-0.5 whitespace-pre-wrap rounded [overflow-wrap:anywhere] bg-slate-100 px-1.5 py-0.5 font-mono text-slate-900" style={{ fontSize: '0.9em' }}>
                  {st.cmd}
                </pre>
              )}
            </li>
          ))}
        </ol>
      )}
      {sec.rows?.map((r) => (
        <p key={r.label}>
          <b>{r.label}:</b> {r.text}
        </p>
      ))}
    </section>
  );
}

/** Měřítko pro rozdělení dlouhých taháků (příkazy, postupy) na stránky – písmo, při kterém se stránky plní */
const PACK_PX = 11.5;

/** Tahák, který se nevejde na jednu A4: části se změří a rozdělí na co nejméně stránek, každá stránka pak dostane vlastní velikost písma */
function PackedSheets({ sheet, size }: { sheet: Sheet; size: Size }) {
  const [pages, setPages] = useState<Sheet[] | null>(null);
  const head = useRef<HTMLDivElement>(null);
  const parts = useRef<(HTMLDivElement | null)[]>([]);
  useLayoutEffect(() => {
    const headH = head.current?.offsetHeight ?? 80;
    const cap = 2 * (PAGE_H_PX - headH) * 0.9;
    const heights = sheet.sections.map((_, i) => (parts.current[i]?.offsetHeight ?? 100) + 10);
    const pack = (limit: number) => {
      const res: SheetSection[][] = [];
      let cur: SheetSection[] = [];
      let used = 0;
      sheet.sections.forEach((sec, i) => {
        if (cur.length && used + heights[i] > limit) {
          res.push(cur);
          cur = [];
          used = 0;
        }
        cur.push(sec);
        used += heights[i];
      });
      if (cur.length) res.push(cur);
      return res;
    };
    let out = pack(cap);
    // stejný počet stránek, ale obsah rozdělený rovnoměrně (podobné písmo na všech stránkách)
    const total = heights.reduce((s, h) => s + h, 0);
    for (let f = 1; f <= 1.3 && out.length > 1; f += 0.05) {
      const even = pack(Math.min(cap, Math.max(...heights, (total / out.length) * f)));
      if (even.length === out.length) {
        out = even;
        break;
      }
    }
    setPages(out.map((sections, i) => ({ ...sheet, id: `${sheet.id}-${i + 1}`, title: out.length > 1 ? `${sheet.title} (${i + 1}/${out.length})` : sheet.title, sections, pack: false })));
  }, [sheet]);
  return (
    <>
      <div aria-hidden className="pointer-events-none fixed left-[-10000px] top-0 bg-white leading-snug print:hidden" style={{ width: `${PAGE_W_MM}mm`, fontSize: `${PACK_PX}px` }}>
        <div ref={head}>
          <SheetBody sheet={{ ...sheet, sections: [] }} />
        </div>
        <div style={{ width: `calc((${PAGE_W_MM}mm - 1.25rem) / 2)` }}>
          {sheet.sections.map((sec, i) => (
            <div
              key={i}
              ref={(el) => {
                parts.current[i] = el;
              }}
            >
              <SectionView sec={sec} />
            </div>
          ))}
        </div>
      </div>
      {pages?.map((p) => (
        <SheetView key={p.id} sheet={p} size={size} />
      ))}
    </>
  );
}
