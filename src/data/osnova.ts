import type { AreaId, Book, CategoryId, LiteraryKind, SectionId } from '../types';

export interface AreaInfo {
  id: AreaId;
  label: string;
  short: string;
  section: SectionId;
  /** Otázka zkoušejícího v simulaci */
  examPrompt: (b: Book) => string;
}

export const SECTIONS: Record<SectionId, { label: string; short: string; group: string }> = {
  art1: { label: 'Analýza uměleckého textu – I. část', short: 'Umělecký text I', group: 'Analýza uměleckého textu' },
  art2: { label: 'Analýza uměleckého textu – II. část', short: 'Umělecký text II', group: 'Analýza uměleckého textu' },
  art3: { label: 'Analýza uměleckého textu – III. část', short: 'Umělecký text III', group: 'Analýza uměleckého textu' },
  lhk: { label: 'Literárněhistorický kontext', short: 'LH kontext', group: 'Literárněhistorický kontext' },
  basics: { label: 'Základní údaje o díle', short: 'Základní údaje', group: 'Základní údaje' },
  terms: { label: 'Literární pojmy', short: 'Pojmy', group: 'Literární pojmy' },
  nonart1: { label: 'Analýza neuměleckého textu – I. část', short: 'Neumělecký I', group: 'Analýza neuměleckého textu' },
  nonart2: { label: 'Analýza neuměleckého textu – II. část', short: 'Neumělecký II', group: 'Analýza neuměleckého textu' },
};

export const SECTION_ORDER: SectionId[] = ['art1', 'art2', 'art3', 'lhk', 'basics', 'terms', 'nonart1', 'nonart2'];

const isVerse = (b: Book) => b.verse.trim().length > 0;
const isLyric = (b: Book) => b.kind === 'lyrika' || b.kind === 'lyricko-epika';

export const AREAS: AreaInfo[] = [
  {
    id: 'context',
    label: 'Zasazení výňatku do kontextu díla',
    short: 'Kontext výňatku',
    section: 'art1',
    examPrompt: (b) =>
      b.scenes[0]
        ? `Výňatek zachycuje tuto scénu: „${b.scenes[0].scene}“ Zasaďte výňatek do kontextu díla – co mu předchází a co následuje?`
        : `Stručně shrňte děj díla ${b.title} a vysvětlete, jak na sebe navazují hlavní události.`,
  },
  {
    id: 'theme',
    label: 'Téma a motiv',
    short: 'Téma a motivy',
    section: 'art1',
    examPrompt: (b) => `Jaké je téma díla ${b.title}? Uveďte hlavní motivy a hlavní myšlenku.`,
  },
  {
    id: 'chronotope',
    label: 'Časoprostor',
    short: 'Časoprostor',
    section: 'art1',
    examPrompt: (b) => `Kde a kdy se dílo ${b.title} odehrává? Jakou roli hraje prostředí?`,
  },
  {
    id: 'composition',
    label: 'Kompoziční výstavba',
    short: 'Kompozice',
    section: 'art1',
    examPrompt: (b) => `Popište kompoziční výstavbu díla ${b.title} (členění, řazení událostí, případné zvláštnosti).`,
  },
  {
    id: 'genre',
    label: 'Literární druh a žánr',
    short: 'Druh a žánr',
    section: 'art1',
    examPrompt: (b) => `Určete literární druh a žánr díla ${b.title} a svou odpověď zdůvodněte.`,
  },
  {
    id: 'narrator',
    label: 'Vypravěč / lyrický subjekt',
    short: 'Vypravěč',
    section: 'art2',
    examPrompt: (b) =>
      b.kind === 'drama'
        ? `Dílo ${b.title} je drama. Jak se v něm uplatňuje (resp. neuplatňuje) vypravěč? Jak se sdělují informace divákovi?`
        : isLyric(b)
          ? `Charakterizujte vypravěče, případně lyrický subjekt v díle ${b.title}.`
          : `Charakterizujte vypravěče v díle ${b.title} (forma vyprávění, typ vypravěče).`,
  },
  {
    id: 'characters',
    label: 'Postavy',
    short: 'Postavy',
    section: 'art2',
    examPrompt: (b) => `Charakterizujte hlavní a důležité vedlejší postavy díla ${b.title} a vztahy mezi nimi.`,
  },
  {
    id: 'narrative',
    label: 'Vyprávěcí způsoby',
    short: 'Vyprávěcí způsoby',
    section: 'art2',
    examPrompt: (b) => `Jaké vyprávěcí způsoby se v díle ${b.title} uplatňují (vyprávění, popis, charakteristika, úvaha…)?`,
  },
  {
    id: 'speech',
    label: 'Typy promluv',
    short: 'Typy promluv',
    section: 'art2',
    examPrompt: (b) => `Jaké typy promluv se v díle ${b.title} objevují (přímá, nepřímá, polopřímá řeč, monolog, dialog…)?`,
  },
  {
    id: 'verse',
    label: 'Veršová výstavba',
    short: 'Verš',
    section: 'art2',
    examPrompt: (b) =>
      isVerse(b)
        ? `Popište veršovou výstavbu díla ${b.title} (typ verše, rým, rytmus, strofy).`
        : `Je dílo ${b.title} psáno veršem, nebo prózou? Jaký to má dopad na analýzu veršové výstavby?`,
  },
  {
    id: 'language',
    label: 'Jazykové prostředky a jejich funkce',
    short: 'Jazykové prostředky',
    section: 'art3',
    examPrompt: (b) => `Jaké jazykové prostředky jsou pro dílo ${b.title} typické a jakou mají funkci?`,
  },
  {
    id: 'tropes',
    label: 'Tropy a figury a jejich funkce',
    short: 'Tropy a figury',
    section: 'art3',
    examPrompt: (b) => `Jaké tropy a figury se v díle ${b.title} vyskytují? Uveďte příklad a vysvětlete jejich funkci.`,
  },
  {
    id: 'authorContext',
    label: 'Kontext autorovy tvorby',
    short: 'Kontext autora',
    section: 'lhk',
    examPrompt: (b) => `Představte autora díla ${b.title} – ${b.author}. Zasaďte dílo do kontextu jeho tvorby a uveďte další díla.`,
  },
  {
    id: 'litContext',
    label: 'Literární / obecně kulturní kontext',
    short: 'LH kontext',
    section: 'lhk',
    examPrompt: (b) =>
      `Zasaďte dílo ${b.title} do literárněhistorického a kulturního kontextu (období, směr, dobové události, současníci).`,
  },
  {
    id: 'basics',
    label: 'Základní údaje (autor, rok, zařazení)',
    short: 'Základní údaje',
    section: 'basics',
    examPrompt: (b) => `Uveďte základní údaje o díle ${b.title}: autor, doba vzniku, literární druh a žánr, zařazení.`,
  },
  {
    id: 'terms',
    label: 'Literární pojmy',
    short: 'Pojmy',
    section: 'terms',
    examPrompt: () => 'Vysvětlete literární pojem.',
  },
  {
    id: 'nonart1',
    label: 'Neumělecký text – I. část',
    short: 'Neumělecký I',
    section: 'nonart1',
    examPrompt: () => 'Analyzujte neumělecký text.',
  },
  {
    id: 'nonart2',
    label: 'Neumělecký text – II. část',
    short: 'Neumělecký II',
    section: 'nonart2',
    examPrompt: () => 'Analyzujte neumělecký text.',
  },
];

export const AREA_MAP = Object.fromEntries(AREAS.map((a) => [a.id, a])) as Record<AreaId, AreaInfo>;

/** Oblasti, kterými prochází simulace ústní zkoušky (v pořadí osnovy) */
export const EXAM_AREAS: AreaId[] = [
  'context',
  'theme',
  'chronotope',
  'composition',
  'genre',
  'narrator',
  'characters',
  'narrative',
  'speech',
  'verse',
  'language',
  'tropes',
  'authorContext',
  'litContext',
];

/** Oblasti, ve kterých se měří pokrok u knihy */
export const BOOK_AREAS: AreaId[] = [...EXAM_AREAS, 'basics'];

export const CATEGORIES: Record<CategoryId, { label: string; short: string }> = {
  do18: { label: 'Světová a česká literatura do konce 18. století', short: 'Do 18. stol.' },
  st19: { label: 'Světová a česká literatura 19. století', short: '19. století' },
  svet20: { label: 'Světová literatura 20. a 21. století', short: 'Světová 20./21.' },
  cz20: { label: 'Česká literatura 20. a 21. století', short: 'Česká 20./21.' },
};

export const CATEGORY_ORDER: CategoryId[] = ['do18', 'st19', 'svet20', 'cz20'];

export const KINDS: Record<LiteraryKind, string> = {
  epika: 'Epika',
  lyrika: 'Lyrika',
  drama: 'Drama',
  'lyricko-epika': 'Lyricko-epické dílo',
};

/** Literární období v chronologickém pořadí (pro seřazovací otázky) */
export const LITERARY_PERIODS = [
  'Antická literatura',
  'Středověk',
  'Renesance a humanismus',
  'Baroko',
  'Klasicismus a osvícenství',
  'Národní obrození',
  'Romantismus',
  'Realismus',
  'Literární moderna (přelom 19. a 20. století)',
  'Meziválečná literatura',
  'Literatura po roce 1945',
];
