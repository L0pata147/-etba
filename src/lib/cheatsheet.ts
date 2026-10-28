/** Taháky k tisku – výběr toho nejdůležitějšího z knihy / tématu tak, aby se to vešlo zhruba na A4 */
import type { Book, Term, TermCategory, Topic } from '../types';
import { TERMS, TERM_CATEGORIES } from '../data/terms';
import { CATEGORIES, KINDS } from '../data/osnova';
import { SUBJECTS } from '../data/subjects';
import type { Author } from './authors';
import type { CommandItem, Platform, Procedure } from '../types';
import type { WritingForm } from '../data/writing';
import type { FunctionalStyle } from '../data/styles';
import { approxYear } from './generator';

export interface SheetSection {
  title: string;
  text?: string;
  list?: string[];
  /** Číslovaný seznam (děj v bodech) */
  ordered?: boolean;
  /** Dvojice pojem – výklad */
  pairs?: { term: string; def: string }[];
  /** Pojem v páru je příkaz (neproporcionální písmo) */
  mono?: boolean;
  /** Kroky postupu (s příkazem) */
  steps?: { text: string; cmd?: string }[];
  /** Řádky „popisek: text“ */
  rows?: { label: string; text: string }[];
}

export interface Sheet {
  id: string;
  title: string;
  subtitle: string;
  meta: string[];
  sections: SheetSection[];
  /** Dlouhý tahák – rozdělí se na stránky podle změřené výšky částí */
  pack?: boolean;
  /** Barva čáry pod nadpisem (odliší druh taháku, např. pojmy od knih) */
  accent?: string;
}

const ABBR = /(?:^|[\s(])(?:\p{L}|\d+|tzv|tj|např|atd|apod|sv|st|r|př|n\.\s?l|kap|č|ing|mgr|dr)\.$/iu;

/** Prvních n vět textu (iniciály a zkratky typu „J. V.“, „tzv.“, „1.“ větu neukončí) */
export function firstSentences(text: string | undefined, n: number): string {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  const re = /[.!?]+(?=\s+[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ„(])/g;
  let count = 0;
  for (let m = re.exec(t); m; m = re.exec(t)) {
    const end = m.index + m[0].length;
    if (m[0] === '.' && ABBR.test(t.slice(Math.max(0, end - 12), end))) continue;
    // uvnitř citátu („Zloději!“) věta nekončí
    const head = t.slice(0, end);
    if ((head.match(/„/g)?.length ?? 0) > (head.match(/“/g)?.length ?? 0)) continue;
    if (++count === n) return t.slice(0, end);
  }
  return t;
}

const nonEmpty = (s: SheetSection) => !!(s.text?.trim() || s.list?.length || s.pairs?.length || s.steps?.length || s.rows?.length);

export function bookSheet(b: Book, withNotes = false): Sheet {
  const people = (list: Book['mainCharacters'], n: number) => list.filter((c) => c.name.trim()).map((c) => (c.description.trim() ? `${c.name} – ${firstSentences(c.description, n)}` : c.name));
  const plot = b.plotEvents.filter((e) => e.trim()).length ? b.plotEvents.filter((e) => e.trim()) : b.quick.filter((e) => e.trim());
  const sections: SheetSection[] = [
    { title: 'Téma', text: b.theme },
    { title: 'Hlavní myšlenka', text: firstSentences(b.mainIdea, 2) },
    { title: 'Motivy', text: b.motifs.filter((m) => m.trim()).join(' · ') },
    { title: 'Časoprostor', text: [b.settingShort || firstSentences(b.setting, 1), firstSentences(b.time, 1)].filter(Boolean).join(' · ') },
    { title: 'Kompozice', text: firstSentences(b.composition, 3) },
    { title: 'Vypravěč / lyrický subjekt', text: firstSentences(b.narrator, 2) },
    { title: 'Typy promluv', text: firstSentences(b.speechTypes, 1) },
    { title: 'Verš', text: firstSentences(b.verse, 2) },
    { title: 'Jazyk', text: firstSentences(b.language, 2) },
    { title: 'Tropy a figury', text: firstSentences(b.tropes, 1) },
    { title: 'Hlavní postavy', list: people(b.mainCharacters, 1) },
    { title: 'Vedlejší postavy', list: people(b.sideCharacters, 1).slice(0, 6) },
    { title: 'Děj v bodech', list: plot, ordered: true },
    { title: 'Autor', text: [firstSentences(b.authorContext, 2), b.otherWorks.length ? `Další díla: ${b.otherWorks.join(', ')}.` : ''].filter(Boolean).join(' ') },
    { title: 'Kontext doby', text: firstSentences(b.historicalContext, 2) },
    { title: 'Tipy k maturitě', text: firstSentences(b.examTips, 3) },
  ];
  if (withNotes) sections.push({ title: 'Moje poznámky', text: b.notes });
  return {
    id: b.id,
    title: b.title || 'Kniha bez názvu',
    subtitle: [b.author, b.authorLife && `(${b.authorLife})`, b.year && `· ${b.year}`].filter(Boolean).join(' '),
    meta: [KINDS[b.kind], b.genre, CATEGORIES[b.category]?.short, b.movement].filter((x): x is string => !!x?.trim()),
    sections: sections.filter(nonEmpty),
  };
}

/** Barvy čáry pod nadpisem podle předmětu */
export const SUBJECT_ACCENT = { site: '#22c55e', cloud: '#f97316', hw: '#ef4444' } as const;
const SITE_PLATFORMS: Platform[] = ['cisco', 'linux', 'windows'];
const platformAccent = (p: Platform) => (SITE_PLATFORMS.includes(p) ? SUBJECT_ACCENT.site : SUBJECT_ACCENT.cloud);

export function topicSheet(t: Topic): Sheet {
  const subj = SUBJECTS[t.subject];
  return {
    id: t.id,
    title: `${t.number}. ${t.title}`,
    subtitle: `${subj.emoji} ${subj.label}`,
    accent: t.subject === 'cjl' ? undefined : SUBJECT_ACCENT[t.subject],
    meta: [],
    sections: [{ title: 'Shrnutí', text: t.summary }, ...t.outline.map((o) => ({ title: o.heading, list: o.points })), { title: 'Pojmy', pairs: t.terms }].filter(nonEmpty),
  };
}

/** Literární pojmy na taháky – příbuzné kategorie spojené tak, aby každá skupina byla jedna stránka A4 */
export const TERM_SHEET_GROUPS: { id: string; title: string; categories: TermCategory[]; detail: 'short' | 'full' }[] = [
  // tropů a figur je nejvíc – jen definice a příklad, s vysvětlením by písmo bylo moc drobné
  { id: 'tropy-figury', title: 'Tropy a figury', categories: ['tropy', 'figury'], detail: 'short' },
  { id: 'jazyk-vers', title: 'Jazykové prostředky a verš', categories: ['jazyk', 'vers'], detail: 'full' },
  { id: 'vypravec-kompozice', title: 'Vypravěč, typy promluv a kompozice', categories: ['vypravec', 'promluvy', 'kompozice'], detail: 'full' },
  { id: 'druhy-zanry', title: 'Literární druhy a žánry', categories: ['druhy', 'zanry'], detail: 'full' },
  { id: 'sloh', title: 'Sloh a neumělecký text', categories: ['sloh'], detail: 'full' },
];

/** Definice pojmu na tahák; „full“ přidá vysvětlení a příklad z četby */
function termDef(t: Term, detail: 'short' | 'full'): string {
  const parts = [t.short, detail === 'full' ? t.detail : '', t.example && `Např. ${t.example}`, detail === 'full' && t.bookExample ? `Z četby: ${t.bookExample}` : ''];
  return parts.filter(Boolean).join(' ');
}

export function termSheet(groupId: string, terms: Term[] = TERMS): Sheet {
  const g = TERM_SHEET_GROUPS.find((x) => x.id === groupId)!;
  return {
    id: `pojmy-${g.id}`,
    title: g.title,
    subtitle: '📖 Literární pojmy',
    accent: '#38bdf8',
    meta: [],
    sections: g.categories
      .map((c) => ({
        title: TERM_CATEGORIES[c],
        pairs: terms.filter((t) => t.category === c).map((t) => ({ term: t.name, def: termDef(t, g.detail) })),
      }))
      .filter(nonEmpty),
  };
}

export interface AuthorCard {
  id: string;
  name: string;
  life: string;
  rows: { label: string; text: string }[];
}

/** Malá kartička autora – podklady z knih v seznamu (autorův kontext, díla, další díla) */
export function authorCard(a: Author): AuthorCard {
  const first = a.books.find((b) => b.authorContext.trim()) ?? a.books[0];
  return {
    id: a.id,
    name: a.name,
    life: a.life,
    rows: [
      { label: 'Směr', text: a.movements.join(' · ') },
      { label: 'O autorovi', text: firstSentences(first?.authorContext, 2) },
      { label: 'Ze seznamu', text: a.books.map((b) => `${b.title}${b.year ? ` (${b.year.replace(/\s*\(.*\)$/, '')})` : ''}`).join(', ') },
      { label: 'Další díla', text: a.otherWorks.slice(0, 6).join(', ') },
    ].filter((r) => r.text.trim()),
  };
}

// ---------- taháky na více stránek (příkazy, postupy, sloh) ----------

/** Přibližná „délka“ části taháku ve znacích – podle ní se části rozdělí na stránky */
function weight(s: SheetSection): number {
  const len = (x?: string) => (x ?? '').length;
  return (
    60 +
    len(s.text) +
    (s.list ?? []).reduce((a, x) => a + len(x) + 25, 0) +
    (s.pairs ?? []).reduce((a, p) => a + len(p.term) * 1.3 + len(p.def) + 25, 0) +
    (s.steps ?? []).reduce((a, x) => a + len(x.text) + len(x.cmd) * 1.3 + (x.cmd ? 20 * x.cmd.split('\n').length : 0) + 25, 0) +
    (s.rows ?? []).reduce((a, r) => a + len(r.label) + len(r.text) + 25, 0)
  );
}

/** Rozdělí části na stránky tak, aby každá měla nejvýš `budget` znaků (část se nikdy nedělí) */
export function packSheets(base: { id: string; title: string; subtitle: string; accent?: string }, sections: SheetSection[], budget = 3600): Sheet[] {
  const pages: SheetSection[][] = [];
  let cur: SheetSection[] = [];
  let used = 0;
  for (const s of sections.filter(nonEmpty)) {
    const w = weight(s);
    if (cur.length && used + w > budget) {
      pages.push(cur);
      cur = [];
      used = 0;
    }
    cur.push(s);
    used += w;
  }
  if (cur.length) pages.push(cur);
  return pages.map((p, i) => ({
    id: `${base.id}-${i + 1}`,
    title: pages.length > 1 ? `${base.title} (${i + 1}/${pages.length})` : base.title,
    subtitle: base.subtitle,
    accent: base.accent,
    meta: [],
    sections: p,
    // bez pevného limitu rozdělí stránky až UI podle změřené výšky
    pack: budget === Infinity,
  }));
}

/** Příkazy jedné platformy po skupinách (úkol → příkaz) */
export function commandSheets(platform: Platform, label: string, commands: CommandItem[], groups?: string[]): Sheet[] {
  const own = commands.filter((c) => c.platform === platform);
  const names = [...new Set(own.map((c) => c.group))].filter((g) => !groups || groups.includes(g));
  return packSheets(
    { id: `prikazy-${platform}`, title: `Příkazy – ${label}`, subtitle: '🛠️ Praktická zkouška', accent: platformAccent(platform) },
    names.map((g) => ({ title: g, mono: true, pairs: own.filter((c) => c.group === g).map((c) => ({ term: c.command, def: c.task + (c.note ? ` (${c.note})` : '') })) })),
    Infinity,
  );
}

/** Postupy krok za krokem (víc postupů na stránku) */
export function procedureSheets(id: string, label: string, procedures: Procedure[]): Sheet[] {
  const accent = procedures[0] ? platformAccent(procedures[0].platform) : undefined;
  return packSheets(
    { id: `postupy-${id}`, title: `Postupy – ${label}`, subtitle: '🛠️ Praktická zkouška', accent },
    procedures.map((p) => ({ title: p.title, text: p.goal, steps: p.steps })),
    Infinity,
  );
}

/** Nadpis části chronologie podle roku – století, 20. století rozdělené rokem 1945 */
function periodLabel(y: number, raw: string): string {
  if (!y) return /stolet/.test(raw) ? raw.replace(/^.*?(\d+\.\s*stolet\S*).*$/, '$1') : 'Bez data';
  const c = Math.floor((y - 1) / 100) + 1;
  if (c === 20) return y <= 1945 ? '20. století (do roku 1945)' : '20. století (po roce 1945)';
  return `${c}. století`;
}

/** Chronologie četby – knihy seřazené podle roku vzniku */
export function chronologySheet(books: Book[]): Sheet {
  const sorted = [...books].sort((a, b) => (approxYear(a.year) || 99999) - (approxYear(b.year) || 99999));
  const groups: SheetSection[] = [];
  for (const b of sorted) {
    const label = periodLabel(approxYear(b.year), b.year);
    let g = groups[groups.length - 1];
    if (!g || g.title !== label) groups.push((g = { title: label, pairs: [] }));
    g.pairs!.push({
      term: b.year || '?',
      def: `${b.title} – ${b.author} (${CATEGORIES[b.category].short})${b.movement ? ` · ${b.movement}` : ''}${b.genre ? ` · ${firstSentences(b.genre, 1)}` : ''}`,
    });
  }
  return { id: 'chronologie', title: 'Chronologie mé četby', subtitle: '📚 Literárněhistorický kontext', meta: [`${books.length} děl seřazených podle doby vzniku`], sections: groups };
}

/** Slohové útvary k písemné práci */
export function writingSheets(forms: WritingForm[]): Sheet[] {
  return packSheets(
    { id: 'sloh-utvary', title: 'Slohové útvary', subtitle: '✍️ Písemná práce' },
    forms.map((f) => ({
      title: f.name,
      rows: [
        { label: 'Styl a postup', text: f.style },
        { label: 'Účel', text: f.purpose },
        { label: 'Stavba', text: f.structure.join(' → ') },
        { label: 'Jazyk', text: f.language.join('; ') },
        { label: 'Pozor na', text: f.pitfalls.join('; ') },
      ],
    })),
    Infinity,
  );
}

/** Funkční styly na jednu stránku */
export function stylesSheet(styles: FunctionalStyle[]): Sheet {
  return {
    id: 'sloh-styly',
    title: 'Funkční styly',
    subtitle: '✍️ Písemná práce a neumělecký text',
    meta: [],
    sections: styles.map((s) => ({
      title: `Styl ${s.name}`,
      rows: [
        { label: 'Znaky', text: s.features.join(', ') },
        { label: 'Slohové postupy', text: s.procedures.join(', ') },
        { label: 'Útvary', text: s.forms.join(', ') },
      ],
    })),
  };
}
