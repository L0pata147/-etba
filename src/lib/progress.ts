import type { AppData, AreaId, Book, MasteryItem, Question, SrsItem } from '../types';
import { BOOK_AREAS } from '../data/osnova';

const DAY = 24 * 60 * 60 * 1000;

export const masteryKey = (bookId: string, area: AreaId) => `${bookId}|${area}`;

export function masteryValue(m: MasteryItem | undefined): number {
  if (!m || m.n <= 0) return 0;
  return Math.min(1, m.c / (m.n + 0.3));
}

export function updateMastery(m: MasteryItem | undefined, score: number, now: number): MasteryItem {
  const prev = m ?? { c: 0, n: 0, attempts: 0, correct: 0, last: 0 };
  return {
    c: prev.c * 0.9 + score,
    n: prev.n * 0.9 + 1,
    attempts: prev.attempts + 1,
    correct: prev.correct + (score >= 0.7 ? 1 : 0),
    last: now,
  };
}

export type Grade = 'again' | 'hard' | 'good';

export function gradeFromScore(score: number): Grade {
  if (score >= 0.85) return 'good';
  if (score >= 0.45) return 'hard';
  return 'again';
}

/** Jednoduchý spaced repetition (varianta SM-2) */
export function updateSrs(item: SrsItem | undefined, grade: Grade, now: number): SrsItem {
  const prev: SrsItem = item ?? { due: now, interval: 0, ease: 2.3, reps: 0, lapses: 0, last: 0, seen: 0 };
  let { interval, ease, reps, lapses } = prev;
  let due: number;
  if (grade === 'again') {
    interval = 0;
    ease = Math.max(1.3, ease - 0.2);
    reps = 0;
    lapses += 1;
    due = now + 10 * 60 * 1000; // za 10 minut
  } else if (grade === 'hard') {
    interval = Math.max(1, Math.round((interval || 1) * 1.2));
    ease = Math.max(1.3, ease - 0.15);
    reps += 1;
    due = now + interval * DAY;
  } else {
    interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(Math.max(interval, 1) * ease);
    ease = Math.min(3, ease + 0.05);
    reps += 1;
    due = now + interval * DAY;
  }
  return { due, interval, ease, reps, lapses, last: now, seen: prev.seen + 1 };
}

export function isLearnedQuestion(s: SrsItem): boolean {
  return s.reps >= 2 && s.interval >= 3;
}

export function questionBookIds(q: Question): string[] {
  return q.relatedBookIds?.length ? q.relatedBookIds : [q.bookId];
}

export function bookAreas(b: Book): AreaId[] {
  return BOOK_AREAS.filter((a) => a !== 'verse' || b.verse.trim().length > 0);
}

export function areaMastery(data: AppData, bookId: string, area: AreaId): number {
  return masteryValue(data.mastery[masteryKey(bookId, area)]);
}

export function bookProgress(data: AppData, b: Book): number {
  const areas = bookAreas(b);
  const sum = areas.reduce((s, a) => s + areaMastery(data, b.id, a), 0);
  return areas.length ? sum / areas.length : 0;
}

export function bookLastStudied(data: AppData, bookId: string): number {
  let last = 0;
  for (const [k, m] of Object.entries(data.mastery)) {
    if (k.startsWith(bookId + '|') && m.last > last) last = m.last;
  }
  return last;
}

export function bookAttempts(data: AppData, bookId: string): number {
  let n = 0;
  for (const [k, m] of Object.entries(data.mastery)) if (k.startsWith(bookId + '|')) n += m.attempts;
  return n;
}

export const LEARNED_THRESHOLD = 0.75;

export function isBookLearned(data: AppData, b: Book): boolean {
  return b.learned || bookProgress(data, b) >= LEARNED_THRESHOLD;
}

/** Kniha potřebuje zopakovat: byla procvičena, ale dlouho ne, nebo má slabou oblast */
export function needsReview(data: AppData, b: Book, now = Date.now()): boolean {
  const last = bookLastStudied(data, b.id);
  if (!last) return false;
  if (now - last > 7 * DAY) return true;
  return bookAreas(b).some((a) => {
    const m = data.mastery[masteryKey(b.id, a)];
    return m && m.attempts >= 2 && masteryValue(m) < 0.5;
  });
}

export function dueCount(data: AppData, now = Date.now(), prefix?: string): number {
  let n = 0;
  for (const [id, s] of Object.entries(data.srs)) {
    if (prefix && !id.startsWith(prefix)) continue;
    if (s.due <= now) n++;
  }
  return n;
}

// ---------- den, série ----------

export function dayKey(d: Date | number = new Date()): string {
  const x = typeof d === 'number' ? new Date(d) : d;
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function streak(data: AppData, now = new Date()): number {
  let count = 0;
  const d = new Date(now);
  if (!data.activity[dayKey(d)]?.questions) d.setDate(d.getDate() - 1);
  while (data.activity[dayKey(d)]?.questions) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

export function longestStreak(data: AppData): number {
  const days = Object.keys(data.activity)
    .filter((k) => data.activity[k].questions > 0)
    .sort();
  let best = 0;
  let cur = 0;
  let prev: Date | null = null;
  for (const k of days) {
    const d = new Date(k + 'T12:00:00');
    if (prev && Math.round((d.getTime() - prev.getTime()) / DAY) === 1) cur++;
    else cur = 1;
    best = Math.max(best, cur);
    prev = d;
  }
  return best;
}

// ---------- XP, úrovně ----------

export function levelFromXp(xp: number): { level: number; current: number; next: number; progress: number } {
  // úroveň n vyžaduje celkem 100 * n(n-1)/2 XP
  const level = Math.floor((1 + Math.sqrt(1 + (8 * xp) / 100)) / 2);
  const current = (100 * level * (level - 1)) / 2;
  const next = (100 * (level + 1) * level) / 2;
  return { level, current, next, progress: (xp - current) / (next - current) };
}

export const LEVEL_NAMES = ['Začátečník', 'Čtenář', 'Pozorný čtenář', 'Znalec', 'Literát', 'Kritik', 'Expert', 'Maturant', 'Mistr literatury'];

export function levelName(level: number): string {
  return LEVEL_NAMES[Math.min(LEVEL_NAMES.length - 1, level - 1)];
}

export function daysUntil(dateStr: string, now = new Date()): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  if (isNaN(target.getTime())) return null;
  const today = new Date(dayKey(now) + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / DAY);
}

// ---------- Počítačové sítě ----------

export const TOPIC_AREAS: AreaId[] = ['it-pojmy', 'it-teorie', 'it-ustni'];

export function topicProgress(data: AppData, topicId: string): number {
  return TOPIC_AREAS.reduce((s, a) => s + areaMastery(data, topicId, a), 0) / TOPIC_AREAS.length;
}

export function topicLastStudied(data: AppData, topicId: string): number {
  return bookLastStudied(data, topicId);
}

/** Zvládnutí praktické části (příkazy, postupy, výpočty) */
export function sitePracticalProgress(data: AppData): { cisco: number; linux: number; windows: number; postupy: number; vypocty: number } {
  const p = (id: string, a: AreaId) => areaMastery(data, id, a);
  return {
    cisco: p('site-prikazy-cisco', 'it-prikazy'),
    linux: p('site-prikazy-linux', 'it-prikazy'),
    windows: p('site-prikazy-windows', 'it-prikazy'),
    postupy: (p('site-postupy-cisco', 'it-postupy') + p('site-postupy-linux', 'it-postupy') + p('site-postupy-windows', 'it-postupy')) / 3,
    vypocty: p('site-vypocty', 'it-vypocty'),
  };
}
