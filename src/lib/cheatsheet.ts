/** Taháky k tisku – výběr toho nejdůležitějšího z knihy / tématu tak, aby se to vešlo zhruba na A4 */
import type { Book, Term, TermCategory, Topic } from '../types';
import { TERMS, TERM_CATEGORIES } from '../data/terms';
import { CATEGORIES, KINDS } from '../data/osnova';
import { SUBJECTS } from '../data/subjects';
import type { Author } from './authors';

export interface SheetSection {
  title: string;
  text?: string;
  list?: string[];
  /** Číslovaný seznam (děj v bodech) */
  ordered?: boolean;
  /** Dvojice pojem – výklad */
  pairs?: { term: string; def: string }[];
}

export interface Sheet {
  id: string;
  title: string;
  subtitle: string;
  meta: string[];
  sections: SheetSection[];
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

const nonEmpty = (s: SheetSection) => !!(s.text?.trim() || s.list?.length || s.pairs?.length);

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

export function topicSheet(t: Topic): Sheet {
  const subj = SUBJECTS[t.subject];
  return {
    id: t.id,
    title: `${t.number}. ${t.title}`,
    subtitle: `${subj.emoji} ${subj.label}`,
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
