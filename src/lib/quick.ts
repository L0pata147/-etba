import type { AppData, Question, QuestionType } from '../types';
import { buildSession, questionsForMinutes, typesForMinutes, type SessionConfig } from './session';
import { recommendations } from './insights';
import { AREA_MAP } from '../data/osnova';
import { shuffle } from './random';

const ALL_TYPES: QuestionType[] = ['flashcard', 'abc', 'truefalse', 'match', 'fill', 'order', 'identifyWork', 'identifyAuthor', 'identifyTerm'];

export function minutesSession(minutes: number): SessionConfig {
  return {
    title: `Mám ${minutes} minut`,
    mode: `cas-${minutes}`,
    difficulty: minutes >= 30 ? 'hard' : 'medium',
    bookIds: [],
    areas: [],
    types: typesForMinutes(minutes),
    count: questionsForMinutes(minutes),
    minutes,
    includeTerms: true,
    includeNonArt: minutes >= 30,
    includeGlobal: true,
    subject: 'all',
  };
}

export function randomSession(): SessionConfig {
  return {
    title: 'Náhodný trénink',
    mode: 'nahodny',
    difficulty: 'medium',
    bookIds: [],
    areas: [],
    types: ALL_TYPES,
    count: 15,
    includeTerms: true,
    includeNonArt: true,
    includeGlobal: true,
    subject: 'all',
  };
}

export function unknownSession(): SessionConfig {
  return {
    title: 'Trénuji jen to, co neumím',
    mode: 'neumim',
    difficulty: 'medium',
    bookIds: [],
    areas: [],
    types: [...ALL_TYPES, 'open'],
    count: 25,
    onlyUnknown: true,
  };
}

export function dueSession(): SessionConfig {
  return {
    title: 'Opakování (spaced repetition)',
    mode: 'opakovani',
    difficulty: 'medium',
    bookIds: [],
    areas: [],
    types: [...ALL_TYPES, 'open'],
    count: 25,
    onlyDue: true,
    subject: 'all',
    includeTerms: true,
    includeNonArt: true,
    includeGlobal: true,
  };
}

/** Dnešní doporučený trénink – otázky z doporučených (kniha, oblast) + otázky k opakování */
export function recommendedSession(
  data: AppData,
  items: ReturnType<typeof recommendations> = recommendations(data, 3),
): { cfg: SessionConfig; items: ReturnType<typeof recommendations> } {
  const minutes = data.settings.dailyMinutes || 15;
  const total = questionsForMinutes(minutes);
  const per = Math.max(3, Math.floor(total / Math.max(1, items.length + 1)));
  const types = typesForMinutes(minutes);
  const qs: Question[] = [];
  const used = new Set<string>();
  for (const r of items) {
    const part = buildSession(data, {
      title: '',
      mode: '',
      difficulty: 'medium',
      bookIds: [r.book.id],
      areas: [r.area],
      types: [...types, 'flashcard', 'abc', 'truefalse'],
      count: per,
      includeGlobal: false,
    });
    // Když je oblast malá, doplň z dalších oblastí knihy
    const extra = part.length < per ? buildSession(data, { title: '', mode: '', difficulty: 'medium', bookIds: [r.book.id], areas: [], types, count: per - part.length, includeGlobal: false }) : [];
    for (const q of [...part, ...extra]) if (!used.has(q.id)) (used.add(q.id), qs.push(q));
  }
  const rest = buildSession(data, { ...dueSession(), count: Math.max(3, total - qs.length), onlyDue: Object.values(data.srs).some((s) => s.due <= Date.now()), types });
  for (const q of rest) if (!used.has(q.id) && qs.length < total) (used.add(q.id), qs.push(q));
  const title = items.length ? `Dnešní trénink: ${items.map((i) => `${i.book.title} – ${AREA_MAP[i.area].short.toLowerCase()}`).join(', ')}` : 'Dnešní trénink';
  return {
    items,
    cfg: { title, mode: 'dnesni', difficulty: 'medium', bookIds: [], areas: [], types, count: qs.length, questions: shuffle(qs) },
  };
}
