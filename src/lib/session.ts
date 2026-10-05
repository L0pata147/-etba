import type { AppData, AreaId, Book, Difficulty, Question, QuestionType, SectionId, SubjectId } from '../types';
import { AREA_MAP } from '../data/osnova';
import { generateBookQuestions, generateGlobalQuestions, generateNonArtQuestions, generateTermQuestions } from './generator';
import { areaMastery, masteryKey, masteryValue } from './progress';
import { shuffle, weightedSample } from './random';
import { generateSpellingQuestions } from './spellinggen';
import { generateStyleQuestions } from './stylegen';
import { buildSubjectPool, type ItSubject, type SitePoolOptions } from './topicgen';

export const DIFFICULTY_TYPES: Record<Difficulty, QuestionType[]> = {
  easy: ['abc', 'truefalse', 'flashcard'],
  medium: ['fill', 'match', 'identifyWork', 'identifyAuthor', 'identifyTerm', 'order', 'abc'],
  hard: ['open', 'fill', 'order', 'identifyWork'],
  maturita: ['open'],
};

export const DIFFICULTY_INFO: Record<Difficulty, { label: string; emoji: string; description: string }> = {
  easy: { label: 'Lehká', emoji: '🟢', description: 'ABC, pravda / lež, jednoduché kartičky' },
  medium: { label: 'Střední', emoji: '🟡', description: 'Doplňování, přiřazování, identifikace díla a autora, seřazování' },
  hard: { label: 'Těžká', emoji: '🔴', description: 'Vlastní odpovědi, komplexní otázky, kombinace oblastí' },
  maturita: { label: 'Maturita', emoji: '🔥', description: 'Otázky z celé osnovy, bez nabízených odpovědí' },
};

export const TYPE_INFO: Record<QuestionType, { label: string; short: string; seconds: number }> = {
  flashcard: { label: 'Kartičky (flashcards)', short: 'Kartička', seconds: 20 },
  abc: { label: 'ABC kvíz', short: 'ABC', seconds: 20 },
  truefalse: { label: 'Pravda / lež', short: 'Pravda/lež', seconds: 12 },
  match: { label: 'Přiřazování', short: 'Přiřazování', seconds: 60 },
  fill: { label: 'Doplňování', short: 'Doplňování', seconds: 30 },
  order: { label: 'Seřazování', short: 'Seřazování', seconds: 45 },
  identifyWork: { label: 'Identifikace díla', short: 'Které dílo?', seconds: 30 },
  identifyAuthor: { label: 'Identifikace autora', short: 'Který autor?', seconds: 25 },
  identifyTerm: { label: 'Identifikace pojmu', short: 'Který pojem?', seconds: 25 },
  open: { label: 'Vlastní odpověď', short: 'Vlastní odpověď', seconds: 150 },
  speech: { label: 'Mluvená odpověď', short: 'Mluvená odpověď', seconds: 150 },
};

export interface SessionConfig {
  title: string;
  mode: string;
  difficulty: Difficulty;
  /** prázdné = všechny knihy */
  bookIds: string[];
  /** prázdné = všechny oblasti */
  areas: AreaId[];
  types: QuestionType[];
  count: number;
  /** Časový rozpočet v minutách – pokud je zadán, počet otázek se odvodí z něj */
  minutes?: number;
  includeTerms?: boolean;
  termIds?: string[];
  includeNonArt?: boolean;
  nonArtIds?: string[];
  includeGlobal?: boolean;
  /** Pravopisná cvičení (písemná práce) */
  includeSpelling?: boolean;
  onlyUnknown?: boolean;
  onlyDue?: boolean;
  /** Konkrétní otázky (např. zopakování chyb) */
  questions?: Question[];
  /** Otázky se mluví (mikrofon) */
  speech?: boolean;
  /** Seřadit podle osnovy a na konci ukázat souhrn po částech */
  bySection?: boolean;
  /** Pro každou oblast jen N otázek */
  perArea?: number;
  /** Předmět – výchozí čeština (literatura); 'all' = všechny předměty, 'it' = všechny IT předměty */
  subject?: SubjectId | 'all' | 'it';
  /** Výběr z Počítačových sítí (témata, příkazy, postupy, výpočty) */
  site?: SitePoolOptions;
}

/** Celý obsah sítí – pro opakování a mix */
export const ALL_SITE: SitePoolOptions = { commands: ['cisco', 'linux', 'windows'], procedures: true, calc: true };

/** Celý obsah jednotlivých IT předmětů */
export const ALL_OPTIONS: Record<ItSubject, SitePoolOptions> = {
  site: ALL_SITE,
  hw: { calc: true },
  cloud: { commands: ['virtualbox', 'docker', 'hyperv', 'proxmox'], procedures: true },
};

/** Všechny otázky pro dané knihy + pojmy + neumělecké texty */
export function buildPool(books: Book[], allBooks: Book[], cfg: Partial<SessionConfig> = {}): Question[] {
  const subject = cfg.subject ?? 'cjl';
  if (subject === 'site' || subject === 'hw' || subject === 'cloud') return buildSubjectPool(subject, cfg.site ?? ALL_OPTIONS[subject]);
  const pool: Question[] = subject === 'cjl' ? [] : (['site', 'hw', 'cloud'] as const).flatMap((s) => buildSubjectPool(s, cfg.site ?? ALL_OPTIONS[s]));
  if (subject === 'it') return pool;
  for (const b of books) pool.push(...generateBookQuestions(b, allBooks));
  if (cfg.includeGlobal !== false && books.length >= 3) pool.push(...generateGlobalQuestions(books));
  if (cfg.includeTerms) pool.push(...generateTermQuestions(undefined, cfg.termIds));
  if (cfg.includeSpelling) pool.push(...generateSpellingQuestions());
  if (cfg.includeNonArt) {
    const qs = [...generateNonArtQuestions(), ...generateStyleQuestions()];
    pool.push(...(cfg.nonArtIds?.length ? qs.filter((q) => cfg.nonArtIds!.some((id) => q.bookId === `nonart:${id}`)) : qs));
  }
  return pool;
}

function estimateSeconds(q: Question): number {
  return TYPE_INFO[q.type].seconds;
}

/** Adaptivní výběr otázek – slabé oblasti, otázky k opakování a „neumím“ mají přednost */
export function buildSession(data: AppData, cfg: SessionConfig): Question[] {
  if (cfg.questions?.length) return cfg.questions.map((q) => (cfg.speech && q.type === 'open' ? { ...q, type: 'speech' } : q));

  const now = Date.now();
  const books = cfg.bookIds.length ? data.books.filter((b) => cfg.bookIds.includes(b.id)) : data.books;
  let pool: Question[];

  if (cfg.onlyUnknown) {
    pool = Object.values(data.unknown).map((u) => u.question);
  } else {
    pool = buildPool(books, data.books, cfg);
  }

  const types = new Set<QuestionType>(cfg.types.length ? cfg.types : DIFFICULTY_TYPES[cfg.difficulty]);
  if (types.has('speech')) types.add('open');
  pool = pool.filter((q) => types.has(q.type) || (q.type === 'open' && types.has('speech')));
  if (cfg.areas.length) {
    const areas = new Set(cfg.areas);
    pool = pool.filter((q) => areas.has(q.area));
  }
  // Maturitní obtížnost – jen otázky podle osnovy a hlubší otevřené otázky
  if (cfg.difficulty === 'maturita') pool = pool.filter((q) => q.difficulty === 'maturita' || q.difficulty === 'hard' || q.bookId.startsWith('nonart') || q.bookId === 'terms');
  if (cfg.onlyDue) pool = pool.filter((q) => (data.srs[q.id]?.due ?? Infinity) <= now);

  const weights = pool.map((q) => weightFor(data, q, cfg.difficulty, now));
  // Předvyber více, poté odstraň duplicitní fakta
  const ranked = weightedSample(pool, weights, pool.length);
  const out: Question[] = [];
  const facts = new Set<string>();
  const perBook = new Map<string, number>();
  const perArea = new Map<string, number>();
  // Limit na jednu knihu / téma jen když je z čeho míchat
  const multiItem = new Set(pool.map((q) => q.bookId)).size > 1 && (books.length > 1 || (!!cfg.subject && cfg.subject !== 'cjl'));
  const bookCap = multiItem ? Math.max(2, Math.ceil((cfg.count || 20) * 0.45)) : Infinity;
  let budget = cfg.minutes ? cfg.minutes * 60 : Infinity;
  // Dlouhé otázky (vlastní odpověď) smí zabrat nejvýš ~třetinu času, aby trénink nebyl jen ze 2 otázek
  let openBudget = cfg.minutes ? cfg.minutes * 60 * 0.35 : Infinity;
  const target = cfg.minutes ? Infinity : cfg.count;

  for (const q of ranked) {
    if (out.length >= target) break;
    const fk = `${q.bookId}|${q.factKey}`;
    if (facts.has(fk)) continue;
    if ((perBook.get(q.bookId) ?? 0) >= bookCap) continue;
    if (cfg.perArea && (perArea.get(`${q.bookId}|${q.area}`) ?? 0) >= cfg.perArea) continue;
    const s = estimateSeconds(q);
    const isLong = q.type === 'open' || q.type === 'speech';
    if (s > budget || (isLong && s > openBudget)) {
      if (budget < 12) break;
      continue;
    }
    budget -= s;
    if (isLong) openBudget -= s;
    facts.add(fk);
    perBook.set(q.bookId, (perBook.get(q.bookId) ?? 0) + 1);
    perArea.set(`${q.bookId}|${q.area}`, (perArea.get(`${q.bookId}|${q.area}`) ?? 0) + 1);
    out.push(q);
  }

  let result = cfg.bySection ? sortBySyllabus(out) : shuffle(out);
  if (cfg.speech) result = result.map((q) => (q.type === 'open' ? { ...q, type: 'speech' as const } : q));
  return result;
}

const SECTION_RANK: Record<SectionId, number> = { art1: 0, art2: 1, art3: 2, lhk: 3, basics: 4, terms: 5, nonart1: 6, nonart2: 7, 'it-teorie': 8, 'it-prakticke': 9, 'it-vypocty': 10, sloh: 11 };
const AREA_RANK: AreaId[] = ['context', 'theme', 'chronotope', 'composition', 'genre', 'narrator', 'characters', 'narrative', 'speech', 'verse', 'language', 'tropes', 'authorContext', 'litContext', 'basics', 'terms', 'nonart1', 'nonart2', 'it-ustni', 'it-teorie', 'it-pojmy', 'it-prikazy', 'it-postupy', 'it-vypocty', 'pravopis'];

export function sortBySyllabus(qs: Question[]): Question[] {
  return [...qs].sort((a, b) => {
    const s = SECTION_RANK[AREA_MAP[a.area].section] - SECTION_RANK[AREA_MAP[b.area].section];
    return s !== 0 ? s : AREA_RANK.indexOf(a.area) - AREA_RANK.indexOf(b.area);
  });
}

function weightFor(data: AppData, q: Question, difficulty: Difficulty, now: number): number {
  const m = q.bookId === 'global' ? 0.5 : q.bookId.startsWith('nonart') || q.bookId === 'terms' || q.bookId === 'pravopis' ? masteryValue(data.mastery[masteryKey(q.bookId, q.area)]) : areaMastery(data, q.bookId, q.area);
  const srs = data.srs[q.id];
  let w = 1 + 2.5 * (1 - m);
  if (srs) {
    if (srs.due <= now) w += 2 + Math.min(3, (now - srs.due) / 86400000 / 2);
    else w *= 0.2;
  } else {
    w += 1;
  }
  if (data.unknown[q.id]) w += 3;
  if (q.difficulty === difficulty) w *= 1.6;
  return w * (0.6 + Math.random() * 0.8);
}

/** Počet otázek podle času */
export function questionsForMinutes(minutes: number): number {
  if (minutes <= 5) return 8;
  if (minutes <= 15) return 18;
  if (minutes <= 30) return 30;
  return 50;
}

/** Typy otázek pro rychlý trénink „Mám X minut“ */
export function typesForMinutes(minutes: number): QuestionType[] {
  if (minutes <= 5) return ['abc', 'truefalse', 'flashcard', 'fill'];
  if (minutes <= 15) return ['abc', 'truefalse', 'flashcard', 'fill', 'identifyWork', 'identifyAuthor', 'match', 'order'];
  return ['abc', 'truefalse', 'flashcard', 'fill', 'identifyWork', 'identifyAuthor', 'identifyTerm', 'match', 'order', 'open'];
}
