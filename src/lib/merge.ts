import type { AppData, MasteryItem, SrsItem, Writing } from '../types';
import { DATA_VERSION } from './storage';

/**
 * Tříbodové sloučení dat ze dvou zařízení.
 * base = stav po poslední synchronizaci (null = zařízení se teprve propojují),
 * local = tento stav, remote = stav ze serveru.
 * Co změnilo jen jedno zařízení, se převezme; co změnila obě, se sloučí (počty se sečtou).
 */
export function mergeData(base: AppData | null, local: AppData, remote: AppData): AppData {
  const b = base;
  const settings: AppData['settings'] = {
    ...local.settings,
    examDate: pick3(b?.settings.examDate, local.settings.examDate, remote.settings.examDate, (l, r) => l || r),
    dailyMinutes: pick3(b?.settings.dailyMinutes, local.settings.dailyMinutes, remote.settings.dailyMinutes, (l) => l),
    onboarded: local.settings.onboarded || remote.settings.onboarded,
  };
  const group = pick3(b?.settings.group ?? null, local.settings.group ?? null, remote.settings.group ?? null, (l) => l);
  if (group || local.settings.group !== undefined) settings.group = group;
  return {
    version: DATA_VERSION,
    books: mergeList(b?.books, local.books, remote.books, (_, l, r) => (r.updatedAt > l.updatedAt ? r : l)),
    srs: mergeMap(b?.srs, local.srs, remote.srs, (_, l, r) => newerSrs(l, r)),
    mastery: mergeMap(b?.mastery, local.mastery, remote.mastery, addMastery),
    sessions: mergeList(b?.sessions, local.sessions, remote.sessions, (_, l) => l)
      .sort((x, y) => y.date - x.date)
      .slice(0, 300),
    activity: mergeMap(b?.activity, local.activity, remote.activity, (bv, l, r) => ({
      questions: sum3(bv?.questions, l.questions, r.questions),
      correct: sum3(bv?.correct, l.correct, r.correct),
      seconds: sum3(bv?.seconds, l.seconds, r.seconds),
    })),
    unknown: mergeMap(b?.unknown, local.unknown, remote.unknown, (_, l, r) => (r.addedAt > l.addedAt ? r : l)),
    xp: sum3(b?.xp, local.xp, remote.xp),
    badges: mergeMap(b?.badges, local.badges, remote.badges, (_, l, r) => Math.min(l, r)),
    plan: pick3(b?.plan ?? null, local.plan, remote.plan, (l, r) => ((r?.createdAt ?? 0) > (l?.createdAt ?? 0) ? r : l)),
    settings,
    writings: mergeList<Writing>(b?.writings, local.writings, remote.writings, (_, l, r) => (r.updatedAt > l.updatedAt ? r : l))
      .sort((x, y) => y.updatedAt - x.updatedAt)
      .slice(0, 100),
    topicNotes: mergeMap(b?.topicNotes, local.topicNotes, remote.topicNotes, (_, l) => l),
    lastExport: Math.max(local.lastExport ?? 0, remote.lastExport ?? 0) || undefined,
    progressHistory: mergeMap(b?.progressHistory, local.progressHistory, remote.progressHistory, (_, l, r) => {
      const out = { ...r, ...l };
      for (const k of Object.keys(r) as (keyof typeof r)[]) out[k] = Math.max(l[k] ?? 0, r[k] ?? 0);
      return out;
    }),
  };
}

const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

/** Jedna hodnota: změnilo ji jen jedno zařízení → ta změna, jinak rozhodne resolve */
function pick3<T>(b: T | undefined, l: T, r: T, resolve: (l: T, r: T) => T): T {
  if (same(l, r)) return l;
  if (b !== undefined && same(l, b)) return r;
  if (b !== undefined && same(r, b)) return l;
  return resolve(l, r);
}

/** Počítadlo: přírůstky z obou zařízení se sečtou */
function sum3(b: number | undefined, l: number, r: number): number {
  return Math.max(0, l + r - (b ?? 0)) || Math.max(l, r);
}

function mergeMap<V>(
  base: Record<string, V> | undefined,
  local: Record<string, V>,
  remote: Record<string, V>,
  resolve: (b: V | undefined, l: V, r: V) => V,
): Record<string, V> {
  const out: Record<string, V> = {};
  const keys = new Set([...Object.keys(local), ...Object.keys(remote)]);
  for (const k of keys) {
    const bv = base?.[k];
    const lv = local[k];
    const rv = remote[k];
    let v: V | undefined;
    if (lv === undefined && rv === undefined) v = undefined;
    else if (same(lv, rv)) v = lv;
    else if (base && same(lv, bv)) v = rv; // změna (nebo smazání) jen na druhém zařízení
    else if (base && same(rv, bv)) v = lv; // změna jen tady
    // smazané na jednom zařízení a změněné na druhém → smazání vyhrává; bez společného základu se nic nemaže
    else if (lv === undefined) v = base && bv !== undefined ? undefined : rv;
    else if (rv === undefined) v = base && bv !== undefined ? undefined : lv;
    else v = resolve(bv, lv, rv);
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function mergeList<T extends { id: string }>(base: T[] | undefined, local: T[], remote: T[], resolve: (b: T | undefined, l: T, r: T) => T): T[] {
  const toMap = (xs: T[]) => Object.fromEntries(xs.map((x) => [x.id, x]));
  const merged = mergeMap(base ? toMap(base) : undefined, toMap(local), toMap(remote), resolve);
  // pořadí: nejdřív podle tohoto zařízení, nové z druhého na konec
  const order = [...local.map((x) => x.id), ...remote.map((x) => x.id)];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const id of order) {
    if (seen.has(id) || !merged[id]) continue;
    seen.add(id);
    out.push(merged[id]);
  }
  return out;
}

function newerSrs(l: SrsItem, r: SrsItem): SrsItem {
  return r.last > l.last ? { ...r, seen: Math.max(l.seen, r.seen) } : { ...l, seen: Math.max(l.seen, r.seen) };
}

function addMastery(b: MasteryItem | undefined, l: MasteryItem, r: MasteryItem): MasteryItem {
  return {
    c: Math.max(0, l.c + r.c - (b?.c ?? 0)),
    n: Math.max(0, l.n + r.n - (b?.n ?? 0)),
    attempts: sum3(b?.attempts, l.attempts, r.attempts),
    correct: Math.min(sum3(b?.attempts, l.attempts, r.attempts), sum3(b?.correct, l.correct, r.correct)),
    last: Math.max(l.last, r.last),
  };
}

/** Data k odeslání – bez AI klíče */
export function forUpload(d: AppData): AppData {
  return { ...d, settings: { ...d.settings, aiApiKey: '' } };
}

