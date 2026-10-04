import type { AppData, AreaId, Book, SectionId, StudyPlan, StudyWeek } from '../types';
import { AREA_MAP, SECTIONS } from '../data/osnova';
import {
  areaMastery,
  bookAreas,
  bookAttempts,
  bookLastStudied,
  bookProgress,
  dayKey,
  daysUntil,
  isBookLearned,
  isLearnedQuestion,
  masteryKey,
  masteryValue,
  streak,
  topicProgress,
} from './progress';
import { SITE_TOPICS } from '../data/site';

const DAY = 86400000;

export interface Recommendation {
  book: Book;
  area: AreaId;
  mastery: number;
  reason: string;
}

/** Doporučení na dnešek – nejslabší oblasti, dlouho neopakované knihy, knihy z aktuálního týdne plánu */
export function recommendations(data: AppData, count = 3, now = Date.now()): Recommendation[] {
  const planBooks = new Set(currentWeek(data.plan)?.bookIds ?? []);
  const candidates: (Recommendation & { score: number })[] = [];
  for (const b of data.books) {
    const last = bookLastStudied(data, b.id);
    const stale = last ? Math.min(2, (now - last) / DAY / 7) : 1.2;
    for (const area of bookAreas(b)) {
      const m = data.mastery[masteryKey(b.id, area)];
      const v = masteryValue(m);
      let dueCnt = 0;
      const prefix = `${b.id}|`;
      for (const [id, s] of Object.entries(data.srs)) if (id.startsWith(prefix) && s.due <= now) dueCnt++;
      let score = (1 - v) * 2 + stale + Math.min(1.5, dueCnt * 0.05) + (planBooks.has(b.id) ? 1.5 : 0) + Math.random() * 0.3;
      if (area === 'basics' && !m) score += 0.8; // začni základy
      let reason: string;
      if (!m) reason = planBooks.has(b.id) ? 'podle studijního plánu' : 'zatím neprocvičeno';
      else if (v < 0.5) reason = `slabá oblast (${Math.round(v * 100)} %)`;
      else if (last && now - last > 5 * DAY) reason = 'dlouho neopakováno';
      else reason = `upevnit (${Math.round(v * 100)} %)`;
      candidates.push({ book: b, area, mastery: v, reason, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const out: Recommendation[] = [];
  const usedBooks = new Set<string>();
  for (const c of candidates) {
    if (usedBooks.has(c.book.id)) continue;
    usedBooks.add(c.book.id);
    out.push(c);
    if (out.length >= count) break;
  }
  return out;
}

export function staleBooks(data: AppData, count = 4): { book: Book; last: number }[] {
  return data.books
    .map((book) => ({ book, last: bookLastStudied(data, book.id) }))
    .sort((a, b) => a.last - b.last)
    .slice(0, count);
}

export interface AreaStat {
  area: AreaId;
  mastery: number;
  attempts: number;
}

/** Průměrná úspěšnost podle oblastí osnovy (přes všechny knihy) */
export function areaStats(data: AppData): AreaStat[] {
  const acc = new Map<AreaId, { sum: number; n: number; attempts: number }>();
  for (const [key, m] of Object.entries(data.mastery)) {
    const area = key.split('|')[1] as AreaId;
    if (!AREA_MAP[area]) continue;
    const a = acc.get(area) ?? { sum: 0, n: 0, attempts: 0 };
    a.sum += masteryValue(m);
    a.n += 1;
    a.attempts += m.attempts;
    acc.set(area, a);
  }
  return [...acc.entries()].map(([area, a]) => ({ area, mastery: a.sum / a.n, attempts: a.attempts }));
}

export function sectionStats(data: AppData): { section: SectionId; mastery: number; attempts: number }[] {
  const acc = new Map<SectionId, { sum: number; n: number; attempts: number }>();
  for (const s of areaStats(data)) {
    const sec = AREA_MAP[s.area].section;
    const a = acc.get(sec) ?? { sum: 0, n: 0, attempts: 0 };
    a.sum += s.mastery;
    a.n++;
    a.attempts += s.attempts;
    acc.set(sec, a);
  }
  return (Object.keys(SECTIONS) as SectionId[]).map((section) => {
    const a = acc.get(section);
    return { section, mastery: a ? a.sum / a.n : 0, attempts: a?.attempts ?? 0 };
  });
}

export function overview(data: AppData) {
  const books = data.books;
  const learned = books.filter((b) => isBookLearned(data, b)).length;
  const progress = books.length ? books.reduce((s, b) => s + bookProgress(data, b), 0) / books.length : 0;
  const now = Date.now();
  const review = books.filter((b) => {
    const last = bookLastStudied(data, b.id);
    if (!last) return false;
    if (now - last > 7 * DAY) return true;
    return bookAreas(b).some((a) => {
      const m = data.mastery[masteryKey(b.id, a)];
      return m && m.attempts >= 2 && masteryValue(m) < 0.5;
    });
  }).length;
  const totals = Object.values(data.activity).reduce(
    (acc, d) => ({ questions: acc.questions + d.questions, correct: acc.correct + d.correct, seconds: acc.seconds + d.seconds }),
    { questions: 0, correct: 0, seconds: 0 },
  );
  const learnedQuestions = Object.values(data.srs).filter(isLearnedQuestion).length;
  const due = Object.values(data.srs).filter((s) => s.due <= now).length;
  return {
    bookCount: books.length,
    learned,
    progress,
    review,
    streak: streak(data),
    ...totals,
    learnedQuestions,
    due,
    sessions: data.sessions.length,
  };
}

// ---------- odznaky ----------

export interface BadgeDef {
  id: string;
  emoji: string;
  label: string;
  description: string;
  check: (data: AppData) => boolean;
}

const TOPIC_AREAS_ANY = (d: AppData, id: string) => (['it-pojmy', 'it-teorie', 'it-ustni'] as const).some((a) => (d.mastery[masteryKey(id, a)]?.attempts ?? 0) > 0);

export const BADGES: BadgeDef[] = [
  { id: 'first-test', emoji: '🏆', label: 'První test', description: 'Dokonči svůj první trénink.', check: (d) => d.sessions.length >= 1 },
  { id: 'perfect', emoji: '💯', label: 'Test na 100 %', description: 'Dokonči trénink (min. 8 otázek) bez chyby.', check: (d) => d.sessions.some((s) => s.total >= 8 && s.score >= 0.999) },
  { id: 'books-5', emoji: '📚', label: '5 knih', description: 'Nauč se 5 knih.', check: (d) => d.books.filter((b) => isBookLearned(d, b)).length >= 5 },
  { id: 'streak-7', emoji: '🔥', label: '7 dní v řadě', description: 'Uč se 7 dní po sobě.', check: (d) => streak(d) >= 7 },
  { id: 'first-sim', emoji: '🎓', label: 'První simulace', description: 'Absolvuj simulaci ústní maturity.', check: (d) => d.sessions.some((s) => s.mode === 'simulace' || s.mode === 'simulace-site') },
  { id: 'learned-100', emoji: '🧠', label: '100 otázek', description: 'Měj 100 naučených otázek (opakovaně správně).', check: (d) => Object.values(d.srs).filter(isLearnedQuestion).length >= 100 },
  { id: 'terms-30', emoji: '📖', label: 'Pojmy', description: 'Odpověz na 30 otázek z literárních pojmů.', check: (d) => (d.mastery[masteryKey('terms', 'terms')]?.attempts ?? 0) >= 30 },
  { id: 'all-books', emoji: '🗺️', label: 'Celý seznam', description: 'Procvič každou knihu ze seznamu.', check: (d) => d.books.length > 0 && d.books.every((b) => bookAttempts(d, b.id) > 0) },
  { id: 'site-topics', emoji: '🌐', label: 'Síťař', description: 'Procvič všech 20 témat z počítačových sítí.', check: (d) => SITE_TOPICS.every((t) => TOPIC_AREAS_ANY(d, t.id)) },
  { id: 'cli-50', emoji: '⌨️', label: 'Příkazová řádka', description: 'Odpověz na 50 otázek z příkazů (Cisco, Linux, Windows).', check: (d) => ['cisco', 'linux', 'windows'].reduce((s, p) => s + (d.mastery[masteryKey(`site-prikazy-${p}`, 'it-prikazy')]?.attempts ?? 0), 0) >= 50 },
  { id: 'hours-5', emoji: '⏱️', label: '5 hodin učení', description: 'Stráv učením celkem 5 hodin.', check: (d) => Object.values(d.activity).reduce((s, a) => s + a.seconds, 0) >= 5 * 3600 },
];

// ---------- studijní plán ----------

export function currentWeek(plan: StudyPlan | null, now = new Date()): StudyWeek | undefined {
  if (!plan) return undefined;
  const today = dayKey(now);
  let cur: StudyWeek | undefined;
  for (const w of plan.weeks) if (w.start <= today) cur = w;
  return cur ?? plan.weeks[0];
}

export function generatePlan(data: AppData, examDate: string, now = new Date()): StudyPlan {
  const days = daysUntil(examDate, now) ?? 70;
  const weeksTotal = Math.max(1, Math.ceil(Math.max(days, 1) / 7));
  const reserve = weeksTotal >= 3 ? 1 : 0;
  const studyWeeks = Math.max(1, weeksTotal - reserve);
  const sorted = [...data.books].sort((a, b) => bookProgress(data, a) - bookProgress(data, b));
  const perWeek = Math.max(1, Math.ceil(sorted.length / studyWeeks));
  const weeks: StudyWeek[] = [];
  const extrasCycle = ['Literární pojmy', 'Neumělecký text', 'Literární pojmy – tropy a figury', 'Opakování slabých oblastí'];
  const practicalCycle = ['Sítě: příkazy Cisco', 'Sítě: výpočty adresace', 'Sítě: Linux / Windows Server', 'Sítě: zadání praktické nanečisto'];
  const topics = [...SITE_TOPICS].sort((a, b) => topicProgress(data, a.id) - topicProgress(data, b.id) || a.number - b.number);
  const topicsPerWeek = Math.max(1, Math.ceil(topics.length / studyWeeks));
  for (let i = 0; i < weeksTotal; i++) {
    const start = new Date(now);
    start.setDate(start.getDate() + i * 7);
    const isReserve = i >= studyWeeks;
    let bookIds: string[];
    if (isReserve) bookIds = [];
    else {
      bookIds = sorted.slice(i * perWeek, i * perWeek + perWeek).map((b) => b.id);
      if (!bookIds.length) {
        // všechny knihy už mají svůj týden – opakování nejslabších
        const k = (i - Math.ceil(sorted.length / perWeek)) * 2;
        bookIds = sorted.slice(k % sorted.length, (k % sorted.length) + 2).map((b) => b.id);
      }
    }
    weeks.push({
      index: i + 1,
      start: dayKey(start),
      bookIds,
      topicIds: isReserve ? [] : topics.slice(i * topicsPerWeek, i * topicsPerWeek + topicsPerWeek).map((t) => t.id),
      extras: isReserve ? ['Celkové opakování', 'Simulace ústní maturity', 'Sítě: simulace ústní a praktické'] : [extrasCycle[i % extrasCycle.length], practicalCycle[i % practicalCycle.length]],
      done: false,
    });
  }
  return { createdAt: Date.now(), weeks };
}

export { areaMastery };
