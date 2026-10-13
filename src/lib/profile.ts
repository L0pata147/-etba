import type { AppData, Profile, SubjectId } from '../types';
import { BADGES, subjectProgress } from './insights';
import { areaMastery, levelFromXp, longestStreak } from './progress';

/** Údaje, podle kterých se odemykají rámečky, pozadí a tituly – spočítají se z vlastních dat i ze souhrnu kamaráda */
export interface ProfileCtx {
  level: number;
  longest: number;
  total: number;
  subjects: Record<SubjectId, number>;
  /** zvládnutí výpočtů adresace (subnetting) 0–1 */
  subnet: number;
}

export function profileCtx(data: AppData): ProfileCtx {
  const total = Object.values(data.activity).reduce((s, a) => s + a.questions, 0);
  return {
    level: levelFromXp(data.xp).level,
    longest: longestStreak(data),
    total,
    subjects: subjectProgress(data),
    subnet: areaMastery(data, 'site-vypocty', 'it-vypocty'),
  };
}

const SUBJECT_IDS: SubjectId[] = ['cjl', 'site', 'hw', 'cloud'];
const minSubject = (c: ProfileCtx) => Math.min(...SUBJECT_IDS.map((s) => c.subjects[s] ?? 0));

/** Postup k odemčení: kolik už mám a kolik je potřeba (procenta jako 0–100) */
export type Goal = (c: ProfileCtx) => [have: number, need: number];

const levelGoal = (n: number): Goal => (c) => [c.level, n];
const streakGoal = (n: number): Goal => (c) => [c.longest, n];
const totalGoal = (n: number): Goal => (c) => [c.total, n];
const pct = (v: number) => Math.round(v * 100);
const subjectGoal = (s: SubjectId, min: number): Goal => (c) => [pct(c.subjects[s] ?? 0), pct(min)];
const allGoal = (min: number): Goal => (c) => [pct(minSubject(c)), pct(min)];

export interface Unlockable {
  id: string;
  label: string;
  /** jak věc získat */
  how: string;
  goal?: Goal;
}

export const isUnlocked = (u: Unlockable, c: ProfileCtx) => !u.goal || u.goal(c)[0] >= u.goal(c)[1];

/** 0–1, jak daleko jsem od odemčení */
export function unlockProgress(u: Unlockable, c: ProfileCtx): number {
  if (!u.goal) return 1;
  const [have, need] = u.goal(c);
  return need > 0 ? Math.min(1, have / need) : 1;
}

export interface FrameDef extends Unlockable {
  /** třídy pro barevný okraj */
  ring: string;
}

export const FRAMES: FrameDef[] = [
  { id: 'bronz', label: 'Bronz', how: 'Dosáhni úrovně 3.', goal: levelGoal(3), ring: 'bg-gradient-to-br from-amber-700 via-orange-400 to-amber-800' },
  { id: 'stribro', label: 'Stříbro', how: 'Dosáhni úrovně 5.', goal: levelGoal(5), ring: 'bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500' },
  { id: 'zlato', label: 'Zlato', how: 'Dosáhni úrovně 7.', goal: levelGoal(7), ring: 'bg-gradient-to-br from-yellow-200 via-amber-400 to-yellow-600' },
  { id: 'diamant', label: 'Diamant', how: 'Dosáhni úrovně 10.', goal: levelGoal(10), ring: 'frame-shimmer bg-gradient-to-br from-cyan-200 via-sky-400 to-violet-500' },
  { id: 'jiskra', label: 'Jiskra', how: 'Uč se 7 dní v řadě.', goal: streakGoal(7), ring: 'bg-gradient-to-br from-orange-400 via-amber-300 to-orange-500' },
  { id: 'plamen', label: 'Plamen', how: 'Uč se 30 dní v řadě.', goal: streakGoal(30), ring: 'frame-shimmer bg-gradient-to-br from-red-600 via-orange-500 to-yellow-300' },
  { id: 'maturant', label: 'Maturant', how: 'Zvládni všechny čtyři předměty aspoň na 75 %.', goal: allGoal(0.75), ring: 'frame-shimmer bg-gradient-to-br from-emerald-300 via-teal-400 to-sky-500' },
];

export interface BannerDef extends Unlockable {
  /** pozadí karty profilu */
  bg: string;
}

export const BANNERS: BannerDef[] = [
  { id: 'zaklad', label: 'Tyrkys', how: 'Máš hned od začátku.', bg: 'bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950' },
  { id: 'noc', label: 'Noc', how: 'Máš hned od začátku.', bg: 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950' },
  { id: 'fialova', label: 'Fialka', how: 'Máš hned od začátku.', bg: 'bg-gradient-to-br from-violet-700 via-indigo-800 to-slate-950' },
  { id: 'les', label: 'Les', how: 'Dosáhni úrovně 3.', goal: levelGoal(3), bg: 'bg-gradient-to-br from-emerald-600 via-teal-800 to-slate-950' },
  { id: 'zapad', label: 'Západ slunce', how: 'Uč se 7 dní v řadě.', goal: streakGoal(7), bg: 'bg-gradient-to-br from-orange-500 via-rose-600 to-purple-900' },
  { id: 'ocean', label: 'Oceán', how: 'Odpověz celkem na 500 otázek.', goal: totalGoal(500), bg: 'bg-gradient-to-br from-sky-500 via-blue-700 to-indigo-950' },
  { id: 'zlata', label: 'Zlatá', how: 'Dosáhni úrovně 7.', goal: levelGoal(7), bg: 'bg-gradient-to-br from-amber-400 via-yellow-700 to-stone-900' },
  { id: 'galaxie', label: 'Galaxie', how: 'Zvládni všechny čtyři předměty aspoň na 50 %.', goal: allGoal(0.5), bg: 'bg-gradient-to-br from-fuchsia-600 via-violet-800 to-indigo-950' },
];

export type TitleDef = Unlockable;

const SUBJECT_TITLES: [SubjectId, string][] = [
  ['cjl', 'Literární'],
  ['site', 'Síťová'],
  ['hw', 'Hardwarová'],
  ['cloud', 'Cloudová'],
];
const SUBJECT_NAME: Record<SubjectId, string> = { cjl: 'češtinu', site: 'sítě', hw: 'hardware', cloud: 'cloud' };

export const TITLES: TitleDef[] = [
  { id: 'start', label: 'Nováček', how: 'Máš hned od začátku.' },
  ...SUBJECT_TITLES.flatMap(([s, adj]): TitleDef[] => [
    { id: `${s}-50`, label: `${adj} hvězda`, how: `Zvládni ${SUBJECT_NAME[s]} aspoň na 50 %.`, goal: subjectGoal(s, 0.5) },
    { id: `${s}-80`, label: `${adj} legenda`, how: `Zvládni ${SUBJECT_NAME[s]} aspoň na 80 %.`, goal: subjectGoal(s, 0.8) },
  ]),
  { id: 'subnet', label: 'Esko subnettingu', how: 'Zvládni výpočty adresace aspoň na 80 %.', goal: (c) => [pct(c.subnet), 80] },
  { id: 'vule', label: 'Železná vůle', how: 'Uč se 14 dní v řadě.', goal: streakGoal(14) },
  { id: 'stovka', label: 'První stovka', how: 'Odpověz celkem na 100 otázek.', goal: totalGoal(100) },
  { id: 'tisic', label: 'Tisíc otázek', how: 'Odpověz celkem na 1 000 otázek.', goal: totalGoal(1000) },
  { id: 'esko', label: 'Maturitní esko', how: 'Dosáhni úrovně 7.', goal: levelGoal(7) },
  { id: 'pripraveno', label: 'Připraveno k maturitě', how: 'Zvládni všechny čtyři předměty aspoň na 75 %.', goal: allGoal(0.75) },
];

export const FRAME_MAP = Object.fromEntries(FRAMES.map((f) => [f.id, f]));
export const BANNER_MAP = Object.fromEntries(BANNERS.map((b) => [b.id, b]));
export const TITLE_MAP = Object.fromEntries(TITLES.map((t) => [t.id, t]));
export const BADGE_MAP = Object.fromEntries(BADGES.map((b) => [b.id, b]));

export const DEFAULT_PROFILE: Profile = { avatar: '', frame: '', title: 'start', showcase: [], banner: 'zaklad', motto: '' };
export const MOTTO_MAX = 60;

/** Motto bez řídicích znaků a odřádkování, nejvýš 60 znaků */
export const cleanMotto = (s: unknown) =>
  typeof s === 'string'
    ? s
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, MOTTO_MAX)
    : '';

/**
 * Profil očištěný o to, co si dotyčný ještě neodemkl (platí pro vlastní profil i pro kamarády –
 * rámeček, pozadí nebo titul bez splněné podmínky se nezobrazí).
 */
export function safeProfile(p: Partial<Profile> | undefined, ctx: ProfileCtx, badges?: string[]): Profile {
  const frame = p?.frame && FRAME_MAP[p.frame] && isUnlocked(FRAME_MAP[p.frame], ctx) ? p.frame : '';
  const banner = p?.banner && BANNER_MAP[p.banner] && isUnlocked(BANNER_MAP[p.banner], ctx) ? p.banner : 'zaklad';
  const title = p?.title && TITLE_MAP[p.title] && isUnlocked(TITLE_MAP[p.title], ctx) ? p.title : 'start';
  const showcase = [...new Set(p?.showcase ?? [])].filter((id) => BADGE_MAP[id] && (!badges || badges.includes(id))).slice(0, 3);
  return { avatar: typeof p?.avatar === 'string' ? p.avatar.slice(0, 40) : '', frame, title, showcase, banner, motto: cleanMotto(p?.motto) };
}

/** Vlastní profil (s odemčenými věcmi podle aktuálních dat) */
export function myProfile(data: AppData): Profile {
  return safeProfile(data.settings.profile ?? DEFAULT_PROFILE, profileCtx(data), Object.keys(data.badges));
}

/** Předmět, ve kterém je člověk nejlepší (nic, dokud nemá aspoň 5 %) */
export function favoriteSubject(subjects: Partial<Record<SubjectId, number>> | undefined): SubjectId | null {
  let best: SubjectId | null = null;
  let max = 0.05;
  for (const s of SUBJECT_IDS) {
    const v = subjects?.[s] ?? 0;
    if (v >= max) {
      max = v;
      best = s;
    }
  }
  return best;
}

/** Všechny odemčené věci (rámečky, pozadí, tituly) – pro upozornění na nové */
export function unlockedKeys(c: ProfileCtx): string[] {
  return [
    ...FRAMES.filter((f) => isUnlocked(f, c)).map((f) => `frame:${f.id}`),
    ...BANNERS.filter((b) => b.goal && isUnlocked(b, c)).map((b) => `banner:${b.id}`),
    ...TITLES.filter((t) => t.goal && isUnlocked(t, c)).map((t) => `title:${t.id}`),
  ];
}

export function describeUnlock(key: string): string {
  const [kind, id] = key.split(':');
  if (kind === 'frame') return `rámeček ${FRAME_MAP[id]?.label ?? id}`;
  if (kind === 'banner') return `pozadí ${BANNER_MAP[id]?.label ?? id}`;
  return `titul „${TITLE_MAP[id]?.label ?? id}“`;
}
