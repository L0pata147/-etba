import type { AppData, GroupMembership, SubjectId } from '../types';
import { subjectProgress } from './insights';
import { dayKey, levelFromXp, streak } from './progress';
import { SYNC_ALPHABET, rpc, syncAvailable } from './sync';

/** Souhrn pokroku, který vidí ostatní ve skupině */
export interface GroupStats {
  xp: number;
  level: number;
  streak: number;
  /** Otázky za posledních 7 dní */
  week: number;
  today: number;
  total: number;
  /** Úspěšnost (0–1) za celou dobu */
  accuracy: number;
  /** Zvládnutí předmětů (0–1) */
  subjects: Record<SubjectId, number>;
  /** Poslední den s aktivitou (YYYY-MM-DD) */
  lastActive: string;
}

export interface GroupRow {
  name: string;
  stats: GroupStats;
  updated_at: string;
  me: boolean;
}

export const GROUP_CODE_LENGTH = 10;

export const groupAvailable = syncAvailable;

function randomCode(n: number): string {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => SYNC_ALPHABET[b % SYNC_ALPHABET.length]).join('');
}

export const normalizeGroupCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
export const formatGroupCode = (c: string) => (c.length === GROUP_CODE_LENGTH ? `${c.slice(0, 5)}-${c.slice(5)}` : c);

const round = (x: number) => Math.round(x * 1000) / 1000;

export function groupStats(data: AppData, now = new Date()): GroupStats {
  const days = Object.entries(data.activity);
  let week = 0;
  let total = 0;
  let correct = 0;
  let lastActive = '';
  const weekAgo = dayKey(new Date(now.getTime() - 6 * 86400000));
  for (const [k, a] of days) {
    total += a.questions;
    correct += a.correct;
    if (k >= weekAgo) week += a.questions;
    if (a.questions > 0 && k > lastActive) lastActive = k;
  }
  const sp = subjectProgress(data);
  return {
    xp: data.xp,
    level: levelFromXp(data.xp).level,
    streak: streak(data, now),
    week,
    today: data.activity[dayKey(now)]?.questions ?? 0,
    total,
    accuracy: total ? round(correct / total) : 0,
    subjects: { cjl: round(sp.cjl), site: round(sp.site), hw: round(sp.hw), cloud: round(sp.cloud) },
    lastActive,
  };
}

/** Odešle vlastní souhrn do skupiny */
export async function publishStats(g: GroupMembership, data: AppData): Promise<void> {
  await rpc('group_put', { p_group: g.code, p_member: g.member, p_name: g.name, p_stats: groupStats(data) });
}

export async function fetchGroup(g: Pick<GroupMembership, 'code' | 'member'>): Promise<GroupRow[]> {
  return rpc<GroupRow[]>('group_list', { p_group: g.code, p_member: g.member });
}

/** Nová skupina – vytvoří kód a hned se do ní zapíše */
export async function createGroup(name: string, data: AppData): Promise<GroupMembership> {
  const g = { code: randomCode(GROUP_CODE_LENGTH), member: randomCode(24), name: name.trim() };
  await publishStats(g, data);
  return g;
}

/** Připojení k existující skupině podle kódu */
export async function joinGroup(code: string, name: string, data: AppData, member?: string): Promise<GroupMembership> {
  const c = normalizeGroupCode(code);
  if (c.length !== GROUP_CODE_LENGTH) throw new Error(`Kód skupiny má ${GROUP_CODE_LENGTH} znaků.`);
  const g = { code: c, member: member ?? randomCode(24), name: name.trim() };
  const rows = await fetchGroup(g);
  if (!rows.length) throw new Error('Skupina s tímto kódem neexistuje. Zkontroluj, že je opsaný správně.');
  await publishStats(g, data);
  return g;
}

export async function leaveGroup(g: GroupMembership): Promise<void> {
  await rpc('group_leave', { p_group: g.code, p_member: g.member });
}

// ---------- automatické odesílání ----------
let lastSent = '';
let sending = false;

/** Odešle souhrn, jen když se od posledního odeslání změnil */
export async function autoPublish(data: AppData): Promise<void> {
  const g = data.settings.group;
  if (!g || !groupAvailable() || sending) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  const key = JSON.stringify([g, groupStats(data)]);
  if (key === lastSent) return;
  sending = true;
  try {
    await publishStats(g, data);
    lastSent = key;
  } catch {
    /* zkusí se příště */
  } finally {
    sending = false;
  }
}
