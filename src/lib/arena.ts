import type { AppData, ContestLog, DailyLog } from '../types';
import { dayKey } from './progress';

/** Výsledky soutěží – jen výpočty bez sítě (používají je odznaky, profil i souhrn pro skupinu) */

const EMPTY: ContestLog = Object.freeze({ daily: {}, weeks: {}, duels: {} }) as ContestLog;
export const contestLog = (d: AppData): ContestLog => d.contests ?? EMPTY;

/** Bonusové XP za vítězství */
export const BONUS = { week: 100, daily: 50, duelWin: 30, duelDraw: 10 } as const;

/** Vítězství v kvízu dne platí jen, když hráli aspoň dva */
export const isDailyWin = (x: DailyLog | undefined) => !!x && x.rank === 1 && (x.players ?? 0) >= 2;

export interface ArenaCounts {
  weekWins: number;
  duelWins: number;
  duels: number;
  daily: number;
  dailyWins: number;
}

export function arenaCounts(log: ContestLog): ArenaCounts {
  const duels = Object.values(log.duels);
  const daily = Object.values(log.daily);
  return {
    weekWins: Object.keys(log.weeks).length,
    duelWins: duels.filter((d) => d.res === 'win').length,
    duels: duels.length,
    daily: daily.length,
    dailyWins: daily.filter(isDailyWin).length,
  };
}

const parseDay = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Pondělí týdne jako YYYY-MM-DD (offset -1 = minulý týden) */
export function weekStart(now: Date = new Date(), offset = 0): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7);
  return dayKey(d);
}

/** Dny týdne od pondělí do neděle */
export function weekDays(start: string): string[] {
  const d = parseDay(start);
  return Array.from({ length: 7 }, (_, i) => dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + i)));
}

/** XP získané v týdnu (počítají se od verze 1.27) */
export const weekXp = (data: AppData, start: string) => weekDays(start).reduce((s, k) => s + (data.activity[k]?.xp ?? 0), 0);

/** Kolik zbývá do konce týdne (neděle o půlnoci) */
export function weekLeft(now: Date = new Date()): { days: number; hours: number } {
  const end = parseDay(weekStart(now, 1));
  const ms = Math.max(0, end.getTime() - now.getTime());
  return { days: Math.floor(ms / 86400000), hours: Math.floor((ms % 86400000) / 3600000) };
}

/** „13.–19. 10.“ */
export function weekLabel(start: string): string {
  const a = parseDay(start);
  const b = new Date(a.getFullYear(), a.getMonth(), a.getDate() + 6);
  return a.getMonth() === b.getMonth() ? `${a.getDate()}.–${b.getDate()}. ${b.getMonth() + 1}.` : `${a.getDate()}. ${a.getMonth() + 1}. – ${b.getDate()}. ${b.getMonth() + 1}.`;
}

/** Přičte XP a zapíše je i k dnešnímu dni (kvůli týdenní výzvě) */
export function addXp(d: AppData, xp: number, now = Date.now()): AppData {
  if (!xp) return d;
  const today = dayKey(now);
  const day = d.activity[today] ?? { questions: 0, correct: 0, seconds: 0 };
  return { ...d, xp: d.xp + xp, activity: { ...d.activity, [today]: { ...day, xp: (day.xp ?? 0) + xp } } };
}

const shortDay = (key: string) => {
  const d = parseDay(key);
  return `${d.getDate()}. ${d.getMonth() + 1}.`;
};

/** Zapíše výsledky soutěží; nové výhry přidají bonusové XP. Opakované zapsání nic nezmění. */
export function applyContests(d: AppData, patch: Partial<ContestLog>): AppData {
  const log = contestLog(d);
  const next: ContestLog = { daily: { ...log.daily }, weeks: { ...log.weeks }, duels: { ...log.duels } };
  let bonus = 0;
  let changed = false;
  for (const [k, v] of Object.entries(patch.weeks ?? {})) {
    if (next.weeks[k] !== undefined) continue;
    next.weeks[k] = v;
    bonus += BONUS.week;
    changed = true;
  }
  for (const [k, v] of Object.entries(patch.daily ?? {})) {
    const prev = next.daily[k];
    // dnešek se zapíše jednou, pořadí se doplní až po skončení dne
    if (prev && (prev.rank !== undefined || v.rank === undefined)) continue;
    if (isDailyWin(v)) bonus += BONUS.daily;
    next.daily[k] = v;
    changed = true;
  }
  for (const [k, v] of Object.entries(patch.duels ?? {})) {
    if (next.duels[k]) continue;
    next.duels[k] = v;
    bonus += v.res === 'win' ? BONUS.duelWin : v.res === 'draw' ? BONUS.duelDraw : 0;
    changed = true;
  }
  return changed ? addXp({ ...d, contests: next }, bonus) : d;
}

/** Texty upozornění na nové výsledky */
export function contestMessages(log: ContestLog, patch: Partial<ContestLog>): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(patch.weeks ?? {})) if (log.weeks[k] === undefined) out.push(`👑 Týdenní výzva ${weekLabel(k)} je tvoje (${v} XP)! +${BONUS.week} XP`);
  for (const [k, v] of Object.entries(patch.daily ?? {})) if (isDailyWin(v) && !isDailyWin(log.daily[k])) out.push(`🥇 Kvíz dne ${shortDay(k)}: 1. místo z ${v.players}! +${BONUS.daily} XP`);
  for (const [k, v] of Object.entries(patch.duels ?? {})) {
    if (log.duels[k]) continue;
    const score = `${v.me} : ${v.them}`;
    if (v.res === 'win') out.push(`⚔️ Duel (${v.vs}): výhra ${score}! +${BONUS.duelWin} XP`);
    else if (v.res === 'draw') out.push(`⚔️ Duel (${v.vs}): remíza ${score}. +${BONUS.duelDraw} XP`);
    else out.push(`⚔️ Duel (${v.vs}): tentokrát prohra ${score}. Zkus odvetu!`);
  }
  return out;
}
