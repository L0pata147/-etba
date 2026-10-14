import type { ContestLog, ContestSubject, DailyLog, DuelLog, GroupMembership, Question, SubjectId } from '../types';
import type { GroupRow, GroupStats } from './group';
import { BOOK_DATABASE, DEFAULT_LIST_IDS, seedToBook } from '../data/books';
import { buildPool } from './session';
import { shuffle } from './random';
import { dayKey } from './progress';
import { rpc } from './sync';
import { weekStart } from './arena';

/** Soutěže ve skupině: kvíz dne, duely a týdenní výzva */

export const CONTEST_SIZE = 10;
/** Kolik dní má soupeř na odehrání duelu */
export const DUEL_DAYS = 7;

export const CONTEST_SUBJECTS: { id: ContestSubject; label: string; emoji: string }[] = [
  { id: 'mix', label: 'Mix', emoji: '🎲' },
  { id: 'cjl', label: 'Čeština', emoji: '📚' },
  { id: 'site', label: 'Sítě', emoji: '🌐' },
  { id: 'hw', label: 'Hardware', emoji: '🖥️' },
  { id: 'cloud', label: 'Cloud', emoji: '☁️' },
];
export const CONTEST_SUBJECT_MAP = Object.fromEntries(CONTEST_SUBJECTS.map((s) => [s.id, s])) as Record<ContestSubject, (typeof CONTEST_SUBJECTS)[number]>;

// ---------- otázky ----------

const pools: Partial<Record<SubjectId, Question[]>> = {};

/** Jen otázky, které se vyhodnotí samy (ABC, pravda/lež) – bez sebehodnocení, aby to bylo férové */
function pool(s: SubjectId): Question[] {
  if (!pools[s]) {
    // vždy z výchozího obsahu aplikace, ne z upravených knih jednoho hráče
    const books = DEFAULT_LIST_IDS.map((id) => BOOK_DATABASE.find((b) => b.id === id)).filter((b) => !!b).map((b) => seedToBook(b!));
    pools[s] = buildPool(books, books, { subject: s, includeTerms: s === 'cjl', includeGlobal: false }).filter(
      (q) => (q.type === 'abc' || q.type === 'truefalse') && !q.passage && q.prompt.length <= 220,
    );
  }
  return pools[s]!;
}

const MIX: [SubjectId, number][] = [
  ['cjl', 3],
  ['site', 3],
  ['hw', 2],
  ['cloud', 2],
];

/** Otázky pro kvíz nebo duel – z různých knih a témat, nejvýš 40 % pravda/lež */
export function contestQuestions(subject: ContestSubject, n = CONTEST_SIZE): Question[] {
  const plan: [SubjectId, number][] = subject === 'mix' ? MIX : [[subject, n]];
  const maxTf = Math.ceil(n * 0.4);
  const out: Question[] = [];
  let tf = 0;
  for (const [s, k] of plan) {
    const facts = new Set<string>();
    const perItem = new Map<string, number>();
    let got = 0;
    for (const q of shuffle(pool(s))) {
      if (got >= k) break;
      const fk = `${q.bookId}|${q.factKey}`;
      if (facts.has(fk) || (perItem.get(q.bookId) ?? 0) >= 2 || (q.type === 'truefalse' && tf >= maxTf)) continue;
      facts.add(fk);
      perItem.set(q.bookId, (perItem.get(q.bookId) ?? 0) + 1);
      if (q.type === 'truefalse') tf++;
      out.push(q);
      got++;
    }
  }
  return shuffle(out);
}

const isCalc = (q: Question) => q.id.startsWith('gen|') || q.id.startsWith('hwgen|');

/** Čas na odpověď v sekundách */
export function timeLimit(q: Question): number {
  let t = q.type === 'truefalse' ? 15 : 25;
  if (q.prompt.length > 120) t += 5;
  if (isCalc(q)) t += 20;
  return t;
}

/** Body za otázku: správně 50–100 podle rychlosti, špatně 0 */
export function pointsFor(correct: boolean, seconds: number, limit: number): number {
  if (!correct) return 0;
  return 50 + Math.round(50 * Math.max(0, Math.min(1, 1 - seconds / limit)));
}

// ---------- výsledky ----------

/** Jedna otázka: [správně 0/1, body, sekundy] */
export type Mark = [number, number, number];

export interface ContestResult {
  points: number;
  correct: number;
  total: number;
  seconds: number;
  q: Mark[];
}

export function makeResult(marks: Mark[]): ContestResult {
  return {
    points: marks.reduce((s, m) => s + m[1], 0),
    correct: marks.filter((m) => m[0] === 1).length,
    total: marks.length,
    seconds: Math.round(marks.reduce((s, m) => s + m[2], 0) * 10) / 10,
    q: marks,
  };
}

export interface ContestEntry {
  name: string;
  pid: string;
  me: boolean;
  result: ContestResult;
  at: string;
}

export interface DailyContest {
  id: string;
  day: string;
  questions: Question[] | null;
  results: ContestEntry[];
  history: { day: string; results: ContestEntry[] }[];
}

export interface Duel {
  id: string;
  subject: ContestSubject;
  created_at: string;
  questions: Question[];
  from_pid: string;
  to_pid: string;
  from_name: string | null;
  to_name: string | null;
  /** vyzval mě někdo jiný */
  incoming: boolean;
  results: ContestEntry[];
}

export interface ContestStatus {
  daily: number;
  played: boolean;
  /** kdo mě vyzval a čeká na mě */
  waiting: string[];
}

/** Pořadí: víc bodů, při shodě rychlejší; úplná shoda = stejné místo */
export function ranked(entries: ContestEntry[]): (ContestEntry & { rank: number })[] {
  const s = [...entries].sort((a, b) => b.result.points - a.result.points || a.result.seconds - b.result.seconds);
  const out: (ContestEntry & { rank: number })[] = [];
  s.forEach((e, i) => {
    const prev = out[i - 1];
    const same = prev && prev.result.points === e.result.points && prev.result.seconds === e.result.seconds;
    out.push({ ...e, rank: same ? prev.rank : i + 1 });
  });
  return out;
}

export interface DuelView {
  incoming: boolean;
  opponent: string;
  mine?: ContestEntry;
  theirs?: ContestEntry;
  expired: boolean;
  outcome?: DuelLog['res'];
  /** do kdy se dá hrát */
  until: number;
}

/** Jak duel vypadá z mého pohledu */
export function duelView(d: Duel, now = Date.now()): DuelView {
  const mine = d.results.find((r) => r.me);
  const theirs = d.results.find((r) => !r.me);
  const incoming = d.incoming;
  const opponent = (incoming ? d.from_name : d.to_name) ?? theirs?.name ?? 'bývalý člen';
  const until = new Date(d.created_at).getTime() + DUEL_DAYS * 86400000;
  const outcome = mine && theirs ? (mine.result.points > theirs.result.points ? 'win' : mine.result.points < theirs.result.points ? 'loss' : 'draw') : undefined;
  return { incoming, opponent, mine, theirs, outcome, until, expired: !outcome && now > until };
}

// ---------- vyhodnocení (co si zapsat do vlastních dat) ----------

/** Odehrané kvízy dne – dnešek bez pořadí, uzavřené dny i s pořadím */
export function settleDaily(log: ContestLog, d: DailyContest, today = dayKey()): Record<string, DailyLog> {
  const out: Record<string, DailyLog> = {};
  for (const h of [{ day: d.day, results: d.results }, ...d.history]) {
    const r = ranked(h.results);
    const me = r.find((x) => x.me);
    if (!me) continue;
    const final = h.day < today;
    const prev = log.daily[h.day];
    if (prev && (prev.rank !== undefined || !final)) continue;
    out[h.day] = { points: me.result.points, correct: me.result.correct, total: me.result.total, ...(final ? { rank: me.rank, players: r.length } : {}) };
  }
  return out;
}

/** Dokončené duely, které ještě nemám zapsané */
export function settleDuels(log: ContestLog, duels: Duel[]): Record<string, DuelLog> {
  const out: Record<string, DuelLog> = {};
  for (const d of duels) {
    if (log.duels[d.id]) continue;
    const v = duelView(d);
    if (!v.outcome || !v.mine || !v.theirs) continue;
    out[d.id] = { res: v.outcome, vs: v.opponent, me: v.mine.result.points, them: v.theirs.result.points, subject: d.subject, at: Date.now() };
  }
  return out;
}

/** XP v týdnu podle souhrnu člena (0 = nehrál nebo má starou verzi) */
export function weekValue(s: GroupStats, week: string): number {
  const w = s.weekly;
  if (!w) return 0;
  return w.id === week ? w.xp : w.prevId === week ? w.prevXp : 0;
}

/** Vítězové týdne (při shodě všichni); platí jen, když XP sbírali aspoň dva */
export function weekWinners<T extends { stats: GroupStats }>(rows: T[], week: string): T[] {
  const vals = rows.map((r) => ({ r, v: weekValue(r.stats, week) })).filter((x) => x.v > 0);
  if (vals.length < 2) return [];
  const max = Math.max(...vals.map((x) => x.v));
  return vals.filter((x) => x.v === max).map((x) => x.r);
}

/** Vyhrál jsem minulý týden? `rows` = žebříček, kde můj řádek má aktuální souhrn */
export function settleWeek(log: ContestLog, rows: Pick<GroupRow, 'stats' | 'me'>[], now = new Date()): Record<string, number> {
  const prev = weekStart(now, -1);
  if (log.weeks[prev] !== undefined) return {};
  const me = weekWinners(rows, prev).find((r) => r.me);
  return me ? { [prev]: weekValue(me.stats, prev) } : {};
}

// ---------- server ----------

export const CONTESTS_MISSING = 'Soutěže ještě nejsou na serveru zapnuté. Kdo spravuje server, musí v Supabase spustit soubor supabase/souteze.sql.';
let missing = false;
/** Server nemá funkce pro soutěže (zatím nespuštěné SQL) */
export const contestsMissing = () => missing;

async function call<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  try {
    const out = await rpc<T>(fn, body);
    missing = false;
    return out;
  } catch (e) {
    if ((e as Error).message?.startsWith('Na serveru chybí funkce')) {
      missing = true;
      notify();
      throw new Error(CONTESTS_MISSING);
    }
    throw e;
  }
}

const base = (g: GroupMembership) => ({ p_group: g.code, p_member: g.member });

/** Dnešní kvíz skupiny a výsledky posledních dní (otázky = null → zatím ho nikdo nezaložil) */
export async function loadDaily(g: GroupMembership, day = dayKey()): Promise<DailyContest> {
  const d = await call<DailyContest>('contest_daily', { ...base(g), p_day: day, p_questions: null });
  setCache(g.code, { daily: d });
  return d;
}

/** Kvíz dne připravený ke hře – kdo ho otevře první, ten ho založí (ostatní dostanou stejné otázky) */
export async function startDaily(g: GroupMembership, day = dayKey()): Promise<DailyContest> {
  let d = await loadDaily(g, day);
  if (!d.questions?.length) {
    d = await call<DailyContest>('contest_daily', { ...base(g), p_day: day, p_questions: contestQuestions('mix') });
    setCache(g.code, { daily: d });
  }
  return d;
}

export async function loadDuels(g: GroupMembership): Promise<Duel[]> {
  const d = await call<Duel[]>('duel_list', base(g));
  setCache(g.code, { duels: d });
  return d;
}

export async function createDuel(g: GroupMembership, toPid: string, subject: ContestSubject): Promise<{ id: string; questions: Question[] }> {
  const questions = contestQuestions(subject);
  const { id } = await call<{ id: string }>('duel_create', { ...base(g), p_to: toPid, p_subject: subject, p_questions: questions });
  return { id, questions };
}

export async function loadStatus(g: GroupMembership, day = dayKey()): Promise<ContestStatus> {
  const s = await call<ContestStatus>('contest_status', { ...base(g), p_day: day });
  setCache(g.code, { status: s, statusDay: day });
  return s;
}

/** Odešle výsledek; `already` = tenhle hráč už výsledek má (např. z jiného zařízení) */
export async function submitResult(g: GroupMembership, contestId: string, result: ContestResult): Promise<{ already: boolean }> {
  return call<{ ok: boolean; already: boolean }>('contest_submit', { ...base(g), p_contest: contestId, p_result: result });
}

// ---------- poslední načtený stav (pro domovskou stránku a vyhodnocení) ----------

export interface ContestCache {
  code: string;
  daily?: DailyContest;
  duels?: Duel[];
  status?: ContestStatus;
  statusDay?: string;
  at: number;
}

let cache: ContestCache | null = null;
let version = 0;
const listeners = new Set<() => void>();

function notify() {
  version++;
  listeners.forEach((l) => l());
}

function setCache(code: string, patch: Partial<ContestCache>) {
  cache = { ...(cache?.code === code ? cache : { code }), ...patch, at: Date.now() };
  notify();
}

export const cachedContests = (code: string): ContestCache | null => (cache?.code === code ? cache : null);
export const contestsVersion = () => version;

export function subscribeContests(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// ---------- rozehraná hra (přežije zavření aplikace; otázka, která byla vidět bez odpovědi, se počítá jako špatně) ----------

export interface PlayState {
  id: string;
  kind: 'den' | 'duel';
  group: string;
  title: string;
  marks: Mark[];
  answers: string[];
  /** index otázky, která je (nebo byla) zobrazená */
  shown: number;
  startedAt: number;
  result?: ContestResult;
  submitted?: boolean;
}

const PLAY_PREFIX = 'maturitni-trener:contest-play:';

export function readPlay(id: string): PlayState | null {
  try {
    return JSON.parse(localStorage.getItem(PLAY_PREFIX + id) ?? 'null') as PlayState | null;
  } catch {
    return null;
  }
}

export function writePlay(p: PlayState) {
  try {
    localStorage.setItem(PLAY_PREFIX + p.id, JSON.stringify(p));
  } catch {
    /* úložiště nedostupné */
  }
}

function allPlays(): PlayState[] {
  const out: PlayState[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(PLAY_PREFIX)) continue;
      const p = JSON.parse(localStorage.getItem(k) ?? 'null') as PlayState | null;
      if (p) out.push(p);
    }
  } catch {
    /* úložiště nedostupné */
  }
  return out;
}

/** Odešle výsledky, které se dřív nepodařilo poslat (bez připojení), a smaže staré záznamy */
export async function flushPending(g: GroupMembership): Promise<number> {
  let sent = 0;
  for (const p of allPlays()) {
    if (Date.now() - p.startedAt > 20 * 86400000) {
      try {
        localStorage.removeItem(PLAY_PREFIX + p.id);
      } catch {
        /* nevadí */
      }
      continue;
    }
    if (p.group !== g.code || !p.result || p.submitted) continue;
    try {
      await submitResult(g, p.id, p.result);
      writePlay({ ...p, submitted: true });
      sent++;
    } catch (e) {
      // na soutěž je pozdě nebo neexistuje – už to nezkoušet
      if (/pozdě|nenašla/.test((e as Error).message)) writePlay({ ...p, submitted: true });
    }
  }
  return sent;
}
