import type { AppData, Profile, SubjectId } from '../types';
import { BADGES, subjectProgress } from './insights';
import { areaMastery, levelFromXp, longestStreak } from './progress';

/** Údaje, podle kterých se odemykají rámečky a tituly – spočítají se z vlastních dat i ze souhrnu kamaráda */
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

const allSubjects = (c: ProfileCtx, min: number) => (Object.values(c.subjects) as number[]).every((v) => v >= min);

export interface FrameDef {
  id: string;
  label: string;
  /** jak rámeček získat */
  how: string;
  /** třídy pro barevný okraj */
  ring: string;
  check: (c: ProfileCtx) => boolean;
}

export const FRAMES: FrameDef[] = [
  { id: 'bronz', label: 'Bronz', how: 'Dosáhni úrovně 3.', ring: 'bg-gradient-to-br from-amber-700 via-orange-400 to-amber-800', check: (c) => c.level >= 3 },
  { id: 'stribro', label: 'Stříbro', how: 'Dosáhni úrovně 5.', ring: 'bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500', check: (c) => c.level >= 5 },
  { id: 'zlato', label: 'Zlato', how: 'Dosáhni úrovně 7.', ring: 'bg-gradient-to-br from-yellow-200 via-amber-400 to-yellow-600', check: (c) => c.level >= 7 },
  { id: 'diamant', label: 'Diamant', how: 'Dosáhni úrovně 10.', ring: 'bg-gradient-to-br from-cyan-200 via-sky-400 to-violet-500', check: (c) => c.level >= 10 },
  { id: 'plamen', label: 'Plamen', how: 'Uč se 30 dní v řadě.', ring: 'bg-gradient-to-br from-red-600 via-orange-500 to-yellow-300', check: (c) => c.longest >= 30 },
  { id: 'maturant', label: 'Maturant', how: 'Zvládni všechny čtyři předměty aspoň na 75 %.', ring: 'bg-gradient-to-br from-emerald-300 via-teal-400 to-sky-500', check: (c) => allSubjects(c, 0.75) },
];

export interface TitleDef {
  id: string;
  label: string;
  how: string;
  check: (c: ProfileCtx) => boolean;
}

const SUBJECT_TITLES: [SubjectId, string][] = [
  ['cjl', 'Literární'],
  ['site', 'Síťová'],
  ['hw', 'Hardwarová'],
  ['cloud', 'Cloudová'],
];
const SUBJECT_NAME: Record<SubjectId, string> = { cjl: 'češtinu', site: 'sítě', hw: 'hardware', cloud: 'cloud' };

export const TITLES: TitleDef[] = [
  { id: 'start', label: 'Na startu', how: 'Máš hned od začátku.', check: () => true },
  ...SUBJECT_TITLES.flatMap(([s, adj]): TitleDef[] => [
    { id: `${s}-50`, label: `${adj} hvězda`, how: `Zvládni ${SUBJECT_NAME[s]} aspoň na 50 %.`, check: (c) => c.subjects[s] >= 0.5 },
    { id: `${s}-80`, label: `${adj} legenda`, how: `Zvládni ${SUBJECT_NAME[s]} aspoň na 80 %.`, check: (c) => c.subjects[s] >= 0.8 },
  ]),
  { id: 'subnet', label: 'Esko subnettingu', how: 'Zvládni výpočty adresace aspoň na 80 %.', check: (c) => c.subnet >= 0.8 },
  { id: 'vule', label: 'Železná vůle', how: 'Uč se 14 dní v řadě.', check: (c) => c.longest >= 14 },
  { id: 'tisic', label: 'Tisíc otázek', how: 'Odpověz celkem na 1 000 otázek.', check: (c) => c.total >= 1000 },
  { id: 'esko', label: 'Maturitní esko', how: 'Dosáhni úrovně 7.', check: (c) => c.level >= 7 },
  { id: 'pripraveno', label: 'Připraveno k maturitě', how: 'Zvládni všechny čtyři předměty aspoň na 75 %.', check: (c) => allSubjects(c, 0.75) },
];

export const FRAME_MAP = Object.fromEntries(FRAMES.map((f) => [f.id, f]));
export const TITLE_MAP = Object.fromEntries(TITLES.map((t) => [t.id, t]));
export const BADGE_MAP = Object.fromEntries(BADGES.map((b) => [b.id, b]));

export const DEFAULT_PROFILE: Profile = { avatar: '', frame: '', title: 'start', showcase: [] };

/**
 * Profil očištěný o to, co si dotyčný ještě neodemkl (platí pro vlastní profil i pro kamarády –
 * rámeček nebo titul bez splněné podmínky se nezobrazí).
 */
export function safeProfile(p: Partial<Profile> | undefined, ctx: ProfileCtx, badges?: string[]): Profile {
  const frame = p?.frame && FRAME_MAP[p.frame]?.check(ctx) ? p.frame : '';
  const title = p?.title && TITLE_MAP[p.title]?.check(ctx) ? p.title : 'start';
  const showcase = (p?.showcase ?? []).filter((id) => BADGE_MAP[id] && (!badges || badges.includes(id))).slice(0, 3);
  return { avatar: typeof p?.avatar === 'string' ? p.avatar.slice(0, 40) : '', frame, title, showcase };
}

/** Vlastní profil (s odemčenými věcmi podle aktuálních dat) */
export function myProfile(data: AppData): Profile {
  return safeProfile(data.settings.profile ?? DEFAULT_PROFILE, profileCtx(data), Object.keys(data.badges));
}
