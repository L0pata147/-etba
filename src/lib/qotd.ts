import type { AppData, Question } from '../types';
import { buildPool } from './session';
import { dayKey } from './progress';

/** Otázka dne – každý den jiná, stejná pro upozornění i stránku v aplikaci */

let cache: { day: string; q: Question | null } | null = null;

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
};

const KEY = 'maturitni-trener:qotd';

export function questionOfDay(data: AppData, day = dayKey()): Question | null {
  if (cache?.day === day) return cache.q;
  // stejná otázka po celý den i po restartu aplikace (generátory nejsou deterministické)
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { day: string; q: Question } | null;
    if (saved?.day === day && saved.q) {
      cache = { day, q: saved.q };
      return saved.q;
    }
  } catch {
    /* úložiště nedostupné */
  }
  const pool = buildPool(data.books, data.books, { subject: 'all', includeTerms: true, includeNonArt: false, includeGlobal: false, includeSpelling: true }).filter(
    (q) => (q.type === 'abc' || q.type === 'truefalse') && !q.passage && q.prompt.length <= 180 && !q.id.startsWith('gen|') && !q.id.startsWith('hwgen|'),
  );
  // jen jedna varianta na otázku (id je stabilní), pořadí podle id
  const byId = new Map(pool.map((q) => [q.id, q]));
  const ids = [...byId.keys()].sort();
  const q = ids.length ? byId.get(ids[hash(day) % ids.length])! : null;
  cache = { day, q };
  try {
    if (q) localStorage.setItem(KEY, JSON.stringify({ day, q }));
  } catch {
    /* úložiště nedostupné */
  }
  return q;
}

/** Text otázky pro upozornění */
export function questionOfDayText(q: Question | null): string {
  if (!q) return '';
  if (q.type === 'abc') return `${q.prompt}\n${q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join('\n')}`;
  if (q.type === 'truefalse') return `${q.prompt}\nPravda, nebo lež?`;
  return q.prompt;
}
