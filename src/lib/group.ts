import type { AppData, GroupMembership, Profile, SubjectId } from '../types';
import { subjectProgress } from './insights';
import { areaMastery, dayKey, levelFromXp, longestStreak, streak } from './progress';
import { myProfile, type ProfileCtx } from './profile';
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
  /** Nejdelší série dní */
  longest?: number;
  /** Zvládnutí výpočtů adresace (0–1) */
  subnet?: number;
  /** Profilovka, rámeček, titul, vitrína */
  profile?: Profile;
}

/** Údaje pro kontrolu rámečků a titulů ze souhrnu kamaráda */
export const statsCtx = (s: GroupStats): ProfileCtx => ({
  level: s.level ?? 1,
  longest: s.longest ?? s.streak ?? 0,
  total: s.total ?? 0,
  subjects: { cjl: s.subjects?.cjl ?? 0, site: s.subjects?.site ?? 0, hw: s.subjects?.hw ?? 0, cloud: s.subjects?.cloud ?? 0 },
  subnet: s.subnet ?? 0,
});

export interface GroupRow {
  name: string;
  stats: GroupStats;
  updated_at: string;
  me: boolean;
}

export const GROUP_CODE_LENGTH = 10;

export const groupAvailable = () => syncAvailable();

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
    longest: longestStreak(data),
    subnet: round(areaMastery(data, 'site-vypocty', 'it-vypocty')),
    profile: myProfile(data),
  };
}

/** Odešle vlastní souhrn do skupiny */
export async function publishStats(g: GroupMembership, data: AppData): Promise<void> {
  await rpc('group_put', { p_group: g.code, p_member: g.member, p_name: g.name, p_stats: groupStats(data) });
}

export async function fetchGroup(g: Pick<GroupMembership, 'code' | 'member'>): Promise<GroupRow[]> {
  const rows = await rpc<GroupRow[]>('group_list', { p_group: g.code, p_member: g.member });
  writeCache(g.code, rows);
  return rows;
}

// ---------- poslední načtený žebříček (pro domovskou stránku a upozornění) ----------
const CACHE_KEY = 'maturitni-trener:group-cache';
const cacheListeners = new Set<() => void>();

function writeCache(code: string, rows: GroupRow[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ code, at: Date.now(), rows }));
  } catch {
    /* nevadí */
  }
  cacheListeners.forEach((l) => l());
}

/** Naposledy načtený žebříček skupiny (null = zatím nic) */
export function cachedGroup(code: string): { at: number; rows: GroupRow[] } | null {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as { code: string; at: number; rows: GroupRow[] } | null;
    return c && c.code === code && Array.isArray(c.rows) ? { at: c.at, rows: c.rows } : null;
  } catch {
    return null;
  }
}

export function subscribeGroupCache(fn: () => void) {
  cacheListeners.add(fn);
  return () => {
    cacheListeners.delete(fn);
  };
}

/** Kamarádi (bez tebe), kteří se dnes učili – podle posledního žebříčku */
export function friendsActiveToday(code: string, today = dayKey()): { name: string; today: number }[] {
  return (cachedGroup(code)?.rows ?? []).filter((r) => !r.me && r.stats.lastActive === today && r.stats.today > 0).map((r) => ({ name: r.name, today: r.stats.today }));
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
    await fetchGroup(g); // čerstvý žebříček pro domovskou stránku a upozornění
  } catch {
    /* zkusí se příště */
  } finally {
    sending = false;
  }
}
