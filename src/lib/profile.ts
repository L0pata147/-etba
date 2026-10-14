import type { AppData, Profile, SubjectId } from '../types';
import { BADGES, PLATINUM, subjectProgress } from './insights';
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
  /** barvy přechodu pro obrázek karty (canvas) */
  stops: string[];
  /** malý symbol na rámečku (rámečky za předměty) */
  emblem?: string;
}

export const FRAMES: FrameDef[] = [
  { id: 'bronz', label: 'Bronz', how: 'Dosáhni úrovně 3.', goal: levelGoal(3), ring: 'bg-gradient-to-br from-amber-700 via-orange-400 to-amber-800', stops: ['#b45309', '#fb923c', '#92400e'] },
  { id: 'stribro', label: 'Stříbro', how: 'Dosáhni úrovně 5.', goal: levelGoal(5), ring: 'bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500', stops: ['#e2e8f0', '#94a3b8', '#64748b'] },
  { id: 'zlato', label: 'Zlato', how: 'Dosáhni úrovně 7.', goal: levelGoal(7), ring: 'bg-gradient-to-br from-yellow-200 via-amber-400 to-yellow-600', stops: ['#fef08a', '#fbbf24', '#ca8a04'] },
  { id: 'diamant', label: 'Diamant', how: 'Dosáhni úrovně 10.', goal: levelGoal(10), ring: 'frame-shimmer bg-gradient-to-br from-cyan-200 via-sky-400 to-violet-500', stops: ['#a5f3fc', '#38bdf8', '#8b5cf6'] },
  { id: 'jiskra', label: 'Jiskra', how: 'Uč se 7 dní v řadě.', goal: streakGoal(7), ring: 'bg-gradient-to-br from-orange-400 via-amber-300 to-orange-500', stops: ['#fb923c', '#fcd34d', '#f97316'] },
  { id: 'plamen', label: 'Plamen', how: 'Uč se 30 dní v řadě.', goal: streakGoal(30), ring: 'frame-shimmer bg-gradient-to-br from-red-600 via-orange-500 to-yellow-300', stops: ['#dc2626', '#f97316', '#fde047'] },
  { id: 'kniha', label: 'Knihomol', how: 'Zvládni češtinu aspoň na 80 %.', goal: subjectGoal('cjl', 0.8), ring: 'bg-gradient-to-br from-rose-300 via-rose-500 to-rose-800', stops: ['#fda4af', '#f43f5e', '#9f1239'], emblem: '📕' },
  { id: 'kabel', label: 'Síťový kabel', how: 'Zvládni sítě aspoň na 80 %.', goal: subjectGoal('site', 0.8), ring: 'bg-gradient-to-br from-sky-300 via-sky-500 to-blue-800', stops: ['#7dd3fc', '#0ea5e9', '#1e40af'], emblem: '🔌' },
  { id: 'cip', label: 'Procesor', how: 'Zvládni hardware aspoň na 80 %.', goal: subjectGoal('hw', 0.8), ring: 'bg-gradient-to-br from-amber-300 via-lime-500 to-emerald-700', stops: ['#fcd34d', '#84cc16', '#047857'], emblem: '🔧' },
  { id: 'mrak', label: 'Mráček', how: 'Zvládni cloud aspoň na 80 %.', goal: subjectGoal('cloud', 0.8), ring: 'bg-gradient-to-br from-violet-200 via-violet-400 to-indigo-700', stops: ['#ddd6fe', '#a78bfa', '#4338ca'], emblem: '☁️' },
  { id: 'maturant', label: 'Maturant', how: 'Zvládni všechny čtyři předměty aspoň na 75 %.', goal: allGoal(0.75), ring: 'frame-shimmer bg-gradient-to-br from-emerald-300 via-teal-400 to-sky-500', stops: ['#6ee7b7', '#2dd4bf', '#0ea5e9'] },
];

export interface BannerDef extends Unlockable {
  /** pozadí karty profilu */
  bg: string;
  /** barvy přechodu pro obrázek karty (canvas) */
  stops: string[];
}

export const BANNERS: BannerDef[] = [
  { id: 'zaklad', label: 'Tyrkys', how: 'Máš hned od začátku.', bg: 'bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950', stops: ['#0f5f71', '#0b4655', '#082a34'] },
  { id: 'noc', label: 'Noc', how: 'Máš hned od začátku.', bg: 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950', stops: ['#334155', '#1e293b', '#020617'] },
  { id: 'fialova', label: 'Fialka', how: 'Máš hned od začátku.', bg: 'bg-gradient-to-br from-violet-700 via-indigo-800 to-slate-950', stops: ['#6d28d9', '#3730a3', '#020617'] },
  { id: 'les', label: 'Les', how: 'Dosáhni úrovně 3.', goal: levelGoal(3), bg: 'bg-gradient-to-br from-emerald-600 via-teal-800 to-slate-950', stops: ['#059669', '#115e59', '#020617'] },
  { id: 'zapad', label: 'Západ slunce', how: 'Uč se 7 dní v řadě.', goal: streakGoal(7), bg: 'bg-gradient-to-br from-orange-500 via-rose-600 to-purple-900', stops: ['#f97316', '#e11d48', '#581c87'] },
  { id: 'ocean', label: 'Oceán', how: 'Odpověz celkem na 500 otázek.', goal: totalGoal(500), bg: 'bg-gradient-to-br from-sky-500 via-blue-700 to-indigo-950', stops: ['#0ea5e9', '#1d4ed8', '#1e1b4b'] },
  { id: 'zlata', label: 'Zlatá', how: 'Dosáhni úrovně 7.', goal: levelGoal(7), bg: 'bg-gradient-to-br from-amber-400 via-yellow-700 to-stone-900', stops: ['#fbbf24', '#a16207', '#1c1917'] },
  { id: 'galaxie', label: 'Galaxie', how: 'Zvládni všechny čtyři předměty aspoň na 50 %.', goal: allGoal(0.5), bg: 'bg-gradient-to-br from-fuchsia-600 via-violet-800 to-indigo-950', stops: ['#c026d3', '#5b21b6', '#1e1b4b'] },
  { id: 'aurora', label: 'Polární záře ✨', how: 'Dosáhni úrovně 8. Pozadí se pomalu přelévá.', goal: levelGoal(8), bg: 'banner-anim bg-gradient-to-br from-emerald-500 via-cyan-600 to-violet-800', stops: ['#10b981', '#0891b2', '#5b21b6'] },
  { id: 'neon', label: 'Neon ✨', how: 'Odpověz celkem na 2 000 otázek. Pozadí se pomalu přelévá.', goal: totalGoal(2000), bg: 'banner-anim bg-gradient-to-br from-pink-500 via-fuchsia-700 to-cyan-700', stops: ['#ec4899', '#a21caf', '#0e7490'] },
  { id: 'magma', label: 'Magma ✨', how: 'Uč se 30 dní v řadě. Pozadí se pomalu přelévá.', goal: streakGoal(30), bg: 'banner-anim bg-gradient-to-br from-red-600 via-orange-600 to-stone-950', stops: ['#dc2626', '#ea580c', '#0c0a09'] },
];

/** Barva přezdívky v žebříčku a na kartě */
export interface NameColorDef extends Unlockable {
  /** třída pro text (u přechodů s bg-clip-text) */
  cls: string;
}

export const NAME_COLORS: NameColorDef[] = [
  { id: '', label: 'Výchozí', how: 'Máš hned od začátku.', cls: '' },
  { id: 'tyrkys', label: 'Tyrkysová', how: 'Máš hned od začátku.', cls: 'text-teal-500 dark:text-teal-300' },
  { id: 'ruzova', label: 'Růžová', how: 'Máš hned od začátku.', cls: 'text-pink-500 dark:text-pink-300' },
  { id: 'modra', label: 'Modrá', how: 'Dosáhni úrovně 2.', goal: levelGoal(2), cls: 'text-sky-500 dark:text-sky-300' },
  { id: 'zelena', label: 'Zelená', how: 'Dosáhni úrovně 3.', goal: levelGoal(3), cls: 'text-emerald-500 dark:text-emerald-300' },
  { id: 'oranzova', label: 'Oranžová', how: 'Uč se 7 dní v řadě.', goal: streakGoal(7), cls: 'text-orange-500 dark:text-orange-300' },
  { id: 'zlata', label: 'Zlatá', how: 'Dosáhni úrovně 5.', goal: levelGoal(5), cls: 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent' },
  { id: 'duha', label: 'Duhová ✨', how: 'Dosáhni úrovně 10.', goal: levelGoal(10), cls: 'banner-anim bg-gradient-to-r from-rose-400 via-amber-300 via-emerald-400 to-sky-400 bg-clip-text text-transparent' },
];

/** Status vedle jména */
export const STATUSES: { id: string; emoji: string; label: string }[] = [
  { id: '', emoji: '', label: 'Žádný' },
  { id: 'uci', emoji: '📚', label: 'Učím se' },
  { id: 'raz', emoji: '🔥', label: 'V ráži' },
  { id: 'cil', emoji: '🎯', label: 'Jedu na maturitu' },
  { id: 'mozek', emoji: '🧠', label: 'Šprtám' },
  { id: 'kava', emoji: '☕', label: 'Na kafi' },
  { id: 'pauza', emoji: '😴', label: 'Pauza' },
  { id: 'hraju', emoji: '🎮', label: 'Hraju' },
];
export const STATUS_MAP = Object.fromEntries(STATUSES.map((x) => [x.id, x]));

/** Týdenní cíl otázek */
export const WEEKLY_GOALS = [0, 50, 100, 200, 300, 500];

/** Co lze skrýt před kamarády */
export const HIDEABLE: { id: 'accuracy' | 'time' | 'calendar' | 'since'; label: string }[] = [
  { id: 'accuracy', label: 'Úspěšnost' },
  { id: 'time', label: 'Čas učení' },
  { id: 'calendar', label: 'Kalendář aktivity' },
  { id: 'since', label: 'Od kdy se učíš' },
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
export const BADGE_MAP = Object.fromEntries([...BADGES, PLATINUM].map((b) => [b.id, b]));
export const NAME_COLOR_MAP = Object.fromEntries(NAME_COLORS.map((c) => [c.id, c]));

export const DEFAULT_PROFILE: Profile = { avatar: '', frame: '', title: 'start', showcase: [], banner: 'zaklad', motto: '', color: '', status: '', goal: 0, hide: [], nick: '' };
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
  const ok = <T extends Unlockable>(map: Record<string, T>, id: string | undefined) => !!id && !!map[id] && isUnlocked(map[id], ctx);
  const frame = ok(FRAME_MAP, p?.frame) ? p!.frame! : '';
  const banner = ok(BANNER_MAP, p?.banner) ? p!.banner! : 'zaklad';
  const title = ok(TITLE_MAP, p?.title) ? p!.title! : 'start';
  const color = ok(NAME_COLOR_MAP, p?.color) ? p!.color! : '';
  const showcase = [...new Set(p?.showcase ?? [])].filter((id) => BADGE_MAP[id] && (!badges || badges.includes(id))).slice(0, 3);
  const status = p?.status && STATUS_MAP[p.status] ? p.status : '';
  const goal = WEEKLY_GOALS.includes(Number(p?.goal)) ? Number(p?.goal) : 0;
  const hide = (Array.isArray(p?.hide) ? p!.hide! : []).filter((h) => HIDEABLE.some((x) => x.id === h));
  const nick = typeof p?.nick === 'string' ? p.nick.trim().slice(0, 30) : '';
  return { avatar: typeof p?.avatar === 'string' ? p.avatar.slice(0, 40) : '', frame, title, showcase, banner, motto: cleanMotto(p?.motto), color, status, goal, hide, nick };
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
    ...NAME_COLORS.filter((x) => x.goal && isUnlocked(x, c)).map((x) => `color:${x.id}`),
    ...TITLES.filter((t) => t.goal && isUnlocked(t, c)).map((t) => `title:${t.id}`),
  ];
}

export function describeUnlock(key: string): string {
  const [kind, id] = key.split(':');
  if (kind === 'frame') return `rámeček ${FRAME_MAP[id]?.label ?? id}`;
  if (kind === 'banner') return `pozadí ${BANNER_MAP[id]?.label ?? id}`;
  if (kind === 'color') return `barva jména ${NAME_COLOR_MAP[id]?.label ?? id}`;
  return `titul „${TITLE_MAP[id]?.label ?? id}“`;
}

/** Jméno pro profil: přezdívka ve skupině, jinak vlastní přezdívka, jinak „Ty“ */
export const displayName = (data: AppData) => data.settings.group?.name || data.settings.profile?.nick?.trim() || 'Ty';
