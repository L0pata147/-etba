import type { AppData, AreaId, Book, SectionId, StudyPlan, StudyWeek, SubjectId, Topic } from '../types';
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
  sitePracticalProgress,
  cloudPracticalProgress,
  levelFromXp,
  longestStreak,
} from './progress';
import { SITE_TOPICS } from '../data/site';
import { arenaCounts, contestLog } from './arena';
import { ALL_TOPICS, SUBJECT_TOPICS } from '../data/subjects';

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

export interface TopicRecommendation {
  topic: Topic;
  mastery: number;
  reason: string;
}

/** Doporučená témata z IT předmětů – slabá, dlouho neopakovaná, z aktuálního týdne plánu; střídá předměty */
export function itRecommendations(data: AppData, count = 2, now = Date.now()): TopicRecommendation[] {
  const planTopics = new Set(currentWeek(data.plan)?.topicIds ?? []);
  const scored = ALL_TOPICS.map((topic) => {
    const v = topicProgress(data, topic.id);
    const last = bookLastStudied(data, topic.id);
    const stale = last ? Math.min(2, (now - last) / DAY / 7) : 1.2;
    const score = (1 - v) * 2 + stale + (planTopics.has(topic.id) ? 1.5 : 0) + Math.random() * 0.4;
    const reason = !last ? (planTopics.has(topic.id) ? 'podle studijního plánu' : 'zatím neprocvičeno') : v < 0.5 ? `slabé téma (${Math.round(v * 100)} %)` : now - last > 5 * DAY ? 'dlouho neopakováno' : `upevnit (${Math.round(v * 100)} %)`;
    return { topic, mastery: v, reason, score };
  }).sort((a, b) => b.score - a.score);
  const out: TopicRecommendation[] = [];
  const usedSubjects = new Set<string>();
  for (const c of scored) {
    if (out.length >= count) break;
    if (usedSubjects.has(c.topic.subject) && usedSubjects.size < 3) continue;
    usedSubjects.add(c.topic.subject);
    out.push(c);
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
  /** skupina odznaků se stupni (bronz, stříbro, zlato) */
  family?: string;
  tier?: 1 | 2 | 3;
}

/** Pomocné výpočty pro odznaky */
const totalQuestions = (d: AppData) => Object.values(d.activity).reduce((s, a) => s + a.questions, 0);
const totalSeconds = (d: AppData) => Object.values(d.activity).reduce((s, a) => s + a.seconds, 0);
const simCount = (d: AppData) => d.sessions.filter((s) => s.mode === 'simulace' || s.mode === 'simulace-site').length;
const sessionHour = (s: { date: number }) => new Date(s.date).getHours();
const subjectAt = (d: AppData, s: SubjectId, min: number) => subjectProgress(d)[s] >= min;

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
  { id: 'hw-test', emoji: '🖥️', label: 'Hardwarový test', description: 'Napiš cvičný test z hardwaru alespoň na 80 %.', check: (d) => d.sessions.some((s) => s.mode === 'hw-test' && s.score >= 0.8) },
  { id: 'sloh', emoji: '✍️', label: 'Slohař', description: 'Dokonči 3 slohové práce.', check: (d) => (d.writings ?? []).filter((w) => w.finished).length >= 3 },
  { id: 'hours-5', emoji: '⏱️', label: '5 hodin učení', description: 'Stráv učením celkem 5 hodin.', check: (d) => totalSeconds(d) >= 5 * 3600, family: 'cas', tier: 1 },
  // --- stupňované odznaky ---
  { id: 'hours-20', emoji: '⏱️', label: '20 hodin učení', description: 'Stráv učením celkem 20 hodin.', check: (d) => totalSeconds(d) >= 20 * 3600, family: 'cas', tier: 2 },
  { id: 'hours-50', emoji: '⏱️', label: '50 hodin učení', description: 'Stráv učením celkem 50 hodin.', check: (d) => totalSeconds(d) >= 50 * 3600, family: 'cas', tier: 3 },
  { id: 'streak-30', emoji: '🔥', label: '30 dní v řadě', description: 'Uč se 30 dní po sobě.', check: (d) => longestStreak(d) >= 30, family: 'serie', tier: 2 },
  { id: 'streak-100', emoji: '🔥', label: '100 dní v řadě', description: 'Uč se 100 dní po sobě.', check: (d) => longestStreak(d) >= 100, family: 'serie', tier: 3 },
  { id: 'q-100', emoji: '✏️', label: '100 odpovědí', description: 'Odpověz celkem na 100 otázek.', check: (d) => totalQuestions(d) >= 100, family: 'otazky', tier: 1 },
  { id: 'q-500', emoji: '✏️', label: '500 odpovědí', description: 'Odpověz celkem na 500 otázek.', check: (d) => totalQuestions(d) >= 500, family: 'otazky', tier: 2 },
  { id: 'q-2000', emoji: '✏️', label: '2 000 odpovědí', description: 'Odpověz celkem na 2 000 otázek.', check: (d) => totalQuestions(d) >= 2000, family: 'otazky', tier: 3 },
  { id: 'level-5', emoji: '⭐', label: 'Úroveň 5', description: 'Dosáhni úrovně 5.', check: (d) => levelFromXp(d.xp).level >= 5, family: 'uroven', tier: 1 },
  { id: 'level-10', emoji: '⭐', label: 'Úroveň 10', description: 'Dosáhni úrovně 10.', check: (d) => levelFromXp(d.xp).level >= 10, family: 'uroven', tier: 2 },
  { id: 'level-15', emoji: '⭐', label: 'Úroveň 15', description: 'Dosáhni úrovně 15.', check: (d) => levelFromXp(d.xp).level >= 15, family: 'uroven', tier: 3 },
  { id: 'sim-5', emoji: '🎓', label: '5 simulací', description: 'Absolvuj 5 simulací ústní zkoušky.', check: (d) => simCount(d) >= 5, family: 'simulace', tier: 2 },
  { id: 'sim-20', emoji: '🎓', label: '20 simulací', description: 'Absolvuj 20 simulací ústní zkoušky.', check: (d) => simCount(d) >= 20, family: 'simulace', tier: 3 },
  { id: 'perfect-5', emoji: '💯', label: '5× na 100 %', description: 'Dokonči 5 tréninků (min. 8 otázek) bez chyby.', check: (d) => d.sessions.filter((s) => s.total >= 8 && s.score >= 0.999).length >= 5, family: 'perfekt', tier: 2 },
  // --- předměty ---
  { id: 'cjl-master', emoji: '📕', label: 'Mistr češtiny', description: 'Zvládni češtinu aspoň na 80 %.', check: (d) => subjectAt(d, 'cjl', 0.8) },
  { id: 'site-master', emoji: '🛰️', label: 'Mistr sítí', description: 'Zvládni počítačové sítě aspoň na 80 %.', check: (d) => subjectAt(d, 'site', 0.8) },
  { id: 'hw-master', emoji: '🔧', label: 'Mistr hardwaru', description: 'Zvládni hardware aspoň na 80 %.', check: (d) => subjectAt(d, 'hw', 0.8) },
  { id: 'cloud-master', emoji: '☁️', label: 'Mistr cloudu', description: 'Zvládni cloud aspoň na 80 %.', check: (d) => subjectAt(d, 'cloud', 0.8) },
  { id: 'subnet', emoji: '🧮', label: 'Subnetting', description: 'Odpověz na 30 příkladů výpočtů adresace s úspěšností aspoň 80 %.', check: (d) => { const m = d.mastery[masteryKey('site-vypocty', 'it-vypocty')]; return !!m && m.attempts >= 30 && m.correct / m.attempts >= 0.8; } },
  { id: 'site-sim', emoji: '📡', label: 'Ústní ze sítí', description: 'Dokonči simulaci ústní zkoušky ze sítí aspoň na 80 %.', check: (d) => d.sessions.some((s) => s.mode === 'simulace-site' && s.score >= 0.8) },
  { id: 'terminal-10', emoji: '🖥️', label: 'Terminálový mág', description: 'Dokonči 10 úloh v simulovaném terminálu.', check: (d) => d.sessions.filter((s) => s.mode === 'terminal').length >= 10 },
  { id: 'books-all', emoji: '🏛️', label: 'Celá četba', description: 'Nauč se všechny knihy ze svého seznamu.', check: (d) => d.books.length > 0 && d.books.every((b) => isBookLearned(d, b)) },
  // --- zajímavosti ---
  { id: 'night-owl', emoji: '🦉', label: 'Noční sova', description: 'Dokonči trénink po 22. hodině.', check: (d) => d.sessions.some((s) => sessionHour(s) >= 22) },
  { id: 'early-bird', emoji: '🐦', label: 'Ranní ptáče', description: 'Dokonči trénink před 7. hodinou ráno.', check: (d) => d.sessions.some((s) => sessionHour(s) < 7 && sessionHour(s) >= 4) },
  { id: 'all-four', emoji: '🧩', label: 'Všestrannost', description: 'Procvič za jeden den všechny čtyři předměty.', check: (d) => allFourInOneDay(d) },
];

const arena = (d: AppData) => arenaCounts(contestLog(d));

/** Odznaky za soutěže ve skupině – do platinové trofeje se nepočítají (ne každý má skupinu) */
export const CONTEST_BADGES: BadgeDef[] = [
  { id: 'kviz-1', emoji: '🧠', label: 'První kvíz dne', description: 'Zahraj si kvíz dne se skupinou.', check: (d) => arena(d).daily >= 1, family: 'kviz', tier: 1 },
  { id: 'kviz-10', emoji: '🧠', label: '10 kvízů dne', description: 'Zahraj si 10 kvízů dne.', check: (d) => arena(d).daily >= 10, family: 'kviz', tier: 2 },
  { id: 'kviz-30', emoji: '🧠', label: '30 kvízů dne', description: 'Zahraj si 30 kvízů dne.', check: (d) => arena(d).daily >= 30, family: 'kviz', tier: 3 },
  { id: 'kviz-win', emoji: '🥇', label: 'Vítěz kvízu dne', description: 'Buď první v kvízu dne (hrát musí aspoň dva).', check: (d) => arena(d).dailyWins >= 1, family: 'kviz-vyhry', tier: 1 },
  { id: 'kviz-win-5', emoji: '🥇', label: '5 vítězství v kvízu', description: 'Vyhraj 5 kvízů dne.', check: (d) => arena(d).dailyWins >= 5, family: 'kviz-vyhry', tier: 2 },
  { id: 'kviz-win-20', emoji: '🥇', label: '20 vítězství v kvízu', description: 'Vyhraj 20 kvízů dne.', check: (d) => arena(d).dailyWins >= 20, family: 'kviz-vyhry', tier: 3 },
  { id: 'duel-1', emoji: '⚔️', label: 'První výhra v duelu', description: 'Vyhraj duel s kamarádem.', check: (d) => arena(d).duelWins >= 1, family: 'duel', tier: 1 },
  { id: 'duel-5', emoji: '⚔️', label: '5 výher v duelu', description: 'Vyhraj 5 duelů.', check: (d) => arena(d).duelWins >= 5, family: 'duel', tier: 2 },
  { id: 'duel-20', emoji: '⚔️', label: '20 výher v duelu', description: 'Vyhraj 20 duelů.', check: (d) => arena(d).duelWins >= 20, family: 'duel', tier: 3 },
  { id: 'week-1', emoji: '👑', label: 'Vítěz týdne', description: 'Vyhraj týdenní výzvu (nejvíc XP ve skupině za týden).', check: (d) => arena(d).weekWins >= 1, family: 'tyden', tier: 1 },
  { id: 'week-3', emoji: '👑', label: '3× vítěz týdne', description: 'Vyhraj týdenní výzvu třikrát.', check: (d) => arena(d).weekWins >= 3, family: 'tyden', tier: 2 },
  { id: 'week-10', emoji: '👑', label: '10× vítěz týdne', description: 'Vyhraj týdenní výzvu desetkrát.', check: (d) => arena(d).weekWins >= 10, family: 'tyden', tier: 3 },
];

/** Platinová trofej: všechny ostatní odznaky */
export const PLATINUM: BadgeDef = {
  id: 'platina',
  emoji: '🏆',
  label: 'Platinová trofej',
  description: 'Získej všechny ostatní odznaky.',
  check: (d) => BADGES.every((b) => !!d.badges[b.id]),
};

/** Odznaky, které se ve stupních zobrazují pod sebou (první stupeň = původní odznak) */
const FAMILY_FIRST: Record<string, string> = { serie: 'streak-7', simulace: 'first-sim', perfekt: 'perfect' };
export const badgeFamily = (b: BadgeDef): string | undefined => b.family ?? Object.keys(FAMILY_FIRST).find((f) => FAMILY_FIRST[f] === b.id);
export const badgeTier = (b: BadgeDef): 1 | 2 | 3 | undefined => b.tier ?? (badgeFamily(b) ? 1 : undefined);

function allFourInOneDay(d: AppData): boolean {
  const byDay = new Map<string, Set<SubjectId>>();
  for (const s of d.sessions) {
    const day = dayKey(new Date(s.date));
    const subj = new Set<SubjectId>();
    // u terminálu jsou v bookIds i id úloh – předmět určí jen položky pokroku
    const ids = s.mode === 'terminal' ? s.bookIds.filter((id) => /^(site|hw|cloud)-/.test(id)) : s.bookIds;
    for (const id of ids) subj.add(id.startsWith('site-') ? 'site' : id.startsWith('hw-') ? 'hw' : id.startsWith('cloud-') ? 'cloud' : 'cjl');
    if (s.mode.startsWith('hw')) subj.add('hw');
    if (s.mode.startsWith('site') || s.mode === 'simulace-site' || (s.mode === 'terminal' && !ids.length)) subj.add('site');
    if (s.mode.startsWith('cloud')) subj.add('cloud');
    const set = byDay.get(day) ?? new Set<SubjectId>();
    subj.forEach((x) => set.add(x));
    byDay.set(day, set);
    if (set.size === 4) return true;
  }
  return false;
}

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
  const topicLists = Object.values(SUBJECT_TOPICS).map((list) => [...list].sort((a, b) => topicProgress(data, a.id) - topicProgress(data, b.id) || a.number - b.number));
  const topicsForWeek = (i: number) => topicLists.flatMap((list) => {
    const per = Math.max(1, Math.ceil(list.length / studyWeeks));
    return list.slice(i * per, i * per + per).map((t) => t.id);
  });
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
      topicIds: isReserve ? [] : topicsForWeek(i),
      extras: isReserve ? ['Celkové opakování', 'Simulace ústní maturity', 'Sítě: simulace ústní a praktické'] : [extrasCycle[i % extrasCycle.length], practicalCycle[i % practicalCycle.length]],
      done: false,
    });
  }
  return { createdAt: Date.now(), weeks };
}

export { areaMastery };

// ---------- pokrok po předmětech ----------

/** Zvládnutí jednotlivých předmětů (0–1) */
export function subjectProgress(data: AppData): Record<SubjectId, number> {
  const topicsAvg = (ids: string[]) => (ids.length ? ids.reduce((s, id) => s + topicProgress(data, id), 0) / ids.length : 0);
  const prac = sitePracticalProgress(data);
  const sitePrac = (prac.cisco + (prac.linux + prac.windows) / 2 + prac.postupy + prac.vypocty) / 4;
  return {
    cjl: overview(data).progress,
    site: (topicsAvg(SUBJECT_TOPICS.site.map((t) => t.id)) + sitePrac) / 2,
    hw: (topicsAvg(SUBJECT_TOPICS.hw.map((t) => t.id)) + areaMastery(data, 'hw-vypocty', 'it-vypocty')) / 2,
    cloud: (topicsAvg(SUBJECT_TOPICS.cloud.map((t) => t.id)) + cloudPracticalProgress(data)) / 2,
  };
}

/** Předmět, ke kterému patří klíč „knihy“ (bookId) */
export const subjectOfItem = (bookId: string): SubjectId => (bookId.startsWith('site-') ? 'site' : bookId.startsWith('hw-') ? 'hw' : bookId.startsWith('cloud-') ? 'cloud' : 'cjl');

/** Odpovědi a úspěšnost v předmětu podle záznamů zvládnutí */
export function subjectAnswers(data: AppData, subject: SubjectId): { attempts: number; correct: number } {
  let attempts = 0;
  let correct = 0;
  for (const [k, m] of Object.entries(data.mastery)) {
    if (subjectOfItem(k.split('|')[0]) !== subject) continue;
    attempts += m.attempts;
    correct += m.correct;
  }
  return { attempts, correct };
}

export const LEARNED_TARGET = 0.85;

/** Odhad, kdy bude předmět zvládnutý (podle tempa za posledních až 21 dní) */
export function subjectForecast(data: AppData, subject: SubjectId, now = new Date()): { kind: 'done' | 'wait' | 'flat' | 'date'; days?: number; date?: Date } {
  const days = Object.keys(data.progressHistory)
    .filter((d) => data.progressHistory[d][subject] !== undefined)
    .sort();
  const current = subjectProgress(data)[subject];
  if (current >= LEARNED_TARGET) return { kind: 'done' };
  if (days.length < 3) return { kind: 'wait' };
  const recent = days.filter((d) => (now.getTime() - new Date(d + 'T12:00:00').getTime()) / DAY <= 21);
  const first = recent[0] ?? days[days.length - 3];
  const span = Math.max(1, (now.getTime() - new Date(first + 'T12:00:00').getTime()) / DAY);
  const rate = (current - (data.progressHistory[first][subject] ?? 0)) / span;
  if (rate <= 0.0005) return { kind: 'flat' };
  const need = Math.ceil((LEARNED_TARGET - current) / rate);
  const date = new Date(now);
  date.setDate(date.getDate() + need);
  return { kind: 'date', days: need, date };
}
