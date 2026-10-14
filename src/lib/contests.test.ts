import { describe, expect, it } from 'vitest';
import type { AppData, ContestLog } from '../types';
import { defaultData } from './storage';
import { mergeData } from './merge';
import { groupStats, statsCtx, type GroupStats } from './group';
import { BONUS, addXp, applyContests, arenaCounts, contestLog, contestMessages, weekDays, weekLabel, weekLeft, weekStart, weekXp } from './arena';
import { CONTEST_SIZE, contestQuestions, duelView, makeResult, pointsFor, ranked, settleDaily, settleDuels, settleWeek, timeLimit, weekWinners, type ContestEntry, type Duel } from './contests';
import { CONTEST_BADGES, PLATINUM, BADGES } from './insights';
import { FRAMES, TITLES, isUnlocked, profileCtx, safeProfile } from './profile';
import { subjectOfItem } from './insights';

const entry = (name: string, points: number, seconds: number, me = false): ContestEntry => ({ name, pid: name, me, at: '', result: { points, correct: Math.round(points / 100), total: 10, seconds, q: [] } });

describe('otázky do soutěží', () => {
  it('mix má 10 otázek ze všech předmětů, jen ABC a pravda/lež', () => {
    for (let i = 0; i < 20; i++) {
      const qs = contestQuestions('mix');
      expect(qs).toHaveLength(CONTEST_SIZE);
      expect(qs.every((q) => q.type === 'abc' || q.type === 'truefalse')).toBe(true);
      expect(qs.filter((q) => q.type === 'truefalse').length).toBeLessThanOrEqual(4);
      const by = (s: string) => qs.filter((q) => subjectOfItem(q.bookId) === s).length;
      expect([by('cjl'), by('site'), by('hw'), by('cloud')]).toEqual([3, 3, 2, 2]);
      expect(new Set(qs.map((q) => `${q.bookId}|${q.factKey}`)).size).toBe(qs.length);
      expect(JSON.stringify(qs).length).toBeLessThan(40000);
    }
  });

  it('každý předmět zvlášť', () => {
    for (const s of ['cjl', 'site', 'hw', 'cloud'] as const) {
      const qs = contestQuestions(s);
      expect(qs).toHaveLength(CONTEST_SIZE);
      expect(qs.every((q) => subjectOfItem(q.bookId) === s)).toBe(true);
    }
  });

  it('body a čas', () => {
    expect(pointsFor(false, 1, 20)).toBe(0);
    expect(pointsFor(true, 0, 20)).toBe(100);
    expect(pointsFor(true, 20, 20)).toBe(50);
    expect(pointsFor(true, 99, 20)).toBe(50);
    expect(pointsFor(true, 10, 20)).toBe(75);
    for (const q of contestQuestions('mix')) expect(timeLimit(q)).toBeGreaterThanOrEqual(15);
    const r = makeResult([
      [1, 90, 3],
      [0, 0, 20],
      [1, 60, 12.25],
    ]);
    expect(r).toMatchObject({ points: 150, correct: 2, total: 3, seconds: 35.3 });
  });

  it('pořadí: body, pak čas, úplná shoda = stejné místo', () => {
    const r = ranked([entry('A', 500, 40), entry('B', 700, 60), entry('C', 500, 30), entry('D', 500, 30)]);
    expect(r.map((x) => [x.name, x.rank])).toEqual([
      ['B', 1],
      ['C', 2],
      ['D', 2],
      ['A', 4],
    ]);
  });
});

describe('týdny', () => {
  it('pondělí, dny a zbývající čas', () => {
    expect(weekStart(new Date(2026, 9, 14, 12))).toBe('2026-10-12');
    expect(weekStart(new Date(2026, 9, 18, 23, 59))).toBe('2026-10-12');
    expect(weekStart(new Date(2026, 9, 19, 0, 1))).toBe('2026-10-19');
    expect(weekStart(new Date(2026, 9, 14), -1)).toBe('2026-10-05');
    expect(weekStart(new Date(2026, 10, 2), -1)).toBe('2026-10-26');
    expect(weekDays('2026-10-26')).toEqual(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']);
    expect(weekLabel('2026-10-12')).toBe('12.–18. 10.');
    expect(weekLabel('2026-10-26')).toBe('26. 10. – 1. 11.');
    expect(weekLeft(new Date(2026, 9, 18, 22, 0))).toEqual({ days: 0, hours: 2 });
  });

  it('XP se zapisují ke dni a sčítají za týden', () => {
    let d = defaultData();
    d = addXp(d, 30, new Date(2026, 9, 12, 10).getTime());
    d = addXp(d, 12, new Date(2026, 9, 18, 10).getTime());
    d = addXp(d, 50, new Date(2026, 9, 19, 10).getTime());
    expect(d.xp).toBe(92);
    expect(weekXp(d, '2026-10-12')).toBe(42);
    expect(weekXp(d, '2026-10-19')).toBe(50);
    // den jen s XP (bez otázek) nepřidá den do série
    expect(d.activity['2026-10-19'].questions).toBe(0);
  });
});

const row = (name: string, weekly: GroupStats['weekly'], me = false) => ({ name, me, stats: { weekly } as GroupStats });

describe('vyhodnocení', () => {
  it('týdenní výzva: vítěz jen když hráli aspoň dva, při shodě oba', () => {
    const now = new Date(2026, 9, 14);
    const prev = '2026-10-05';
    const empty: ContestLog = { daily: {}, weeks: {}, duels: {} };
    expect(settleWeek(empty, [row('Já', { id: '2026-10-12', xp: 10, prevId: prev, prevXp: 300 }, true)], now)).toEqual({});
    const rows = [row('Já', { id: '2026-10-12', xp: 10, prevId: prev, prevXp: 300 }, true), row('Petr', { id: prev, xp: 200, prevId: '2026-09-28', prevXp: 999 })];
    expect(settleWeek(empty, rows, now)).toEqual({ [prev]: 300 });
    expect(settleWeek({ ...empty, weeks: { [prev]: 300 } }, rows, now)).toEqual({});
    const tie = [rows[0], row('Jana', { id: prev, xp: 300, prevId: '', prevXp: 0 })];
    expect(weekWinners(tie, prev).map((r) => r.name)).toEqual(['Já', 'Jana']);
    // starší verze bez týdenních XP se nepočítá
    expect(weekWinners([rows[0], { name: 'Old', me: false, stats: {} as GroupStats }], prev)).toEqual([]);
  });

  it('kvíz dne: dnešek bez pořadí, uzavřené dny s pořadím', () => {
    const log: ContestLog = { daily: {}, weeks: {}, duels: {} };
    const daily = {
      id: 'den:X:2026-10-14',
      day: '2026-10-14',
      questions: null,
      results: [entry('Petr', 800, 50), entry('Já', 700, 40, true)],
      history: [
        { day: '2026-10-13', results: [entry('Já', 900, 30, true), entry('Petr', 600, 30)] },
        { day: '2026-10-12', results: [entry('Já', 900, 30, true)] },
        { day: '2026-10-11', results: [entry('Petr', 900, 30)] },
      ],
    };
    const out = settleDaily(log, daily, '2026-10-14');
    expect(out['2026-10-14']).toEqual({ points: 700, correct: 7, total: 10 });
    expect(out['2026-10-13']).toEqual({ points: 900, correct: 9, total: 10, rank: 1, players: 2 });
    expect(out['2026-10-12']).toMatchObject({ rank: 1, players: 1 });
    expect(out['2026-10-11']).toBeUndefined();
    // podruhé už nic nového
    const d = applyContests(defaultData(), { daily: out });
    expect(settleDaily(contestLog(d), daily, '2026-10-14')).toEqual({});
    // druhý den se dnešek uzavře
    const next = settleDaily(contestLog(d), { ...daily, day: '2026-10-15', results: [], history: [{ day: '2026-10-14', results: daily.results }] }, '2026-10-15');
    expect(next['2026-10-14']).toMatchObject({ rank: 2, players: 2 });
  });

  it('duely: výsledek z mého pohledu, propadnutí po 7 dnech', () => {
    const base: Duel = { id: 'duel:1', subject: 'site', created_at: new Date(2026, 9, 10).toISOString(), questions: [], from_pid: 'a', to_pid: 'b', from_name: 'Petr', to_name: 'Já', incoming: true, results: [entry('Petr', 640, 50)] };
    expect(duelView(base, new Date(2026, 9, 12).getTime())).toMatchObject({ incoming: true, opponent: 'Petr', expired: false });
    expect(duelView(base, new Date(2026, 9, 18).getTime()).expired).toBe(true);
    const done = { ...base, results: [entry('Já', 820, 40, true), entry('Petr', 640, 50)] };
    expect(duelView(done).outcome).toBe('win');
    const log: ContestLog = { daily: {}, weeks: {}, duels: {} };
    const s = settleDuels(log, [done, base, { ...done, id: 'duel:2', results: [entry('Já', 500, 40, true), entry('Petr', 500, 10)] }]);
    expect(Object.keys(s)).toEqual(['duel:1', 'duel:2']);
    expect(s['duel:1']).toMatchObject({ res: 'win', vs: 'Petr', me: 820, them: 640, subject: 'site' });
    expect(s['duel:2'].res).toBe('draw');
  });

  it('zapsání výher přidá bonusové XP jen jednou', () => {
    let d = defaultData();
    const patch: Partial<ContestLog> = {
      weeks: { '2026-10-05': 300 },
      daily: { '2026-10-13': { points: 900, correct: 9, total: 10, rank: 1, players: 2 } },
      duels: { 'duel:1': { res: 'win', vs: 'Petr', me: 820, them: 640, subject: 'site', at: 1 } },
    };
    expect(contestMessages(contestLog(d), patch)).toHaveLength(3);
    d = applyContests(d, patch);
    expect(d.xp).toBe(BONUS.week + BONUS.daily + BONUS.duelWin);
    expect(applyContests(d, patch)).toBe(d);
    expect(contestMessages(contestLog(d), patch)).toEqual([]);
    expect(arenaCounts(contestLog(d))).toEqual({ weekWins: 1, duelWins: 1, duels: 1, daily: 1, dailyWins: 1 });
  });
});

describe('odměny a souhrn pro skupinu', () => {
  it('odznaky za soutěže se nepočítají do platiny', () => {
    const d = defaultData();
    d.badges = Object.fromEntries(BADGES.map((b) => [b.id, 1]));
    expect(PLATINUM.check(d)).toBe(true);
    expect(CONTEST_BADGES.every((b) => !b.check(d))).toBe(true);
    const won = applyContests(d, { duels: { x: { res: 'win', vs: 'P', me: 1, them: 0, subject: 'mix', at: 1 } } });
    expect(CONTEST_BADGES.filter((b) => b.check(won)).map((b) => b.id)).toEqual(['duel-1']);
  });

  it('rámeček a titul za výhry se ověří i u kamaráda', () => {
    let d = defaultData();
    d = applyContests(d, { weeks: { '2026-10-05': 100 } });
    const koruna = FRAMES.find((f) => f.id === 'koruna')!;
    expect(isUnlocked(koruna, profileCtx(defaultData()))).toBe(false);
    expect(isUnlocked(koruna, profileCtx(d))).toBe(true);
    d.settings.profile = { avatar: '', frame: 'koruna', title: 'jednicka', showcase: [] };
    const s = groupStats(d);
    expect(s.arena?.weekWins).toBe(1);
    expect(safeProfile(s.profile, statsCtx(s))).toMatchObject({ frame: 'koruna', title: 'jednicka' });
    // bez výhry (podvržený souhrn) se rámeček neukáže
    expect(safeProfile(s.profile, statsCtx({ ...s, arena: undefined }))).toMatchObject({ frame: '', title: 'start' });
    expect(TITLES.some((t) => t.id === 'postrach')).toBe(true);
  });

  it('souhrn obsahuje týdenní XP a vejde se do limitu', () => {
    let d = defaultData();
    const now = new Date();
    d = addXp(d, 40, now.getTime());
    for (let i = 0; i < 40; i++) d = applyContests(d, { duels: { [`duel:${i}`]: { res: 'win', vs: 'P', me: 1, them: 0, subject: 'mix', at: 1 } } });
    d.badges = Object.fromEntries([...BADGES, ...CONTEST_BADGES, PLATINUM].map((b) => [b.id, 1]));
    for (let i = 0; i < 84; i++) d.activity[new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10)] = { questions: 120, correct: 100, seconds: 3600, xp: 900 };
    const s = groupStats(d, now);
    expect(s.weekly?.id).toBe(weekStart(now));
    expect(s.weekly!.xp).toBeGreaterThan(0);
    expect(JSON.stringify(s).length).toBeLessThan(4000);
  });

  it('synchronizace sloučí výsledky soutěží a XP po dnech', () => {
    const base = defaultData();
    base.activity['2026-10-14'] = { questions: 1, correct: 1, seconds: 5, xp: 10 };
    const a: AppData = structuredClone(base);
    const b: AppData = structuredClone(base);
    a.activity['2026-10-14'] = { questions: 3, correct: 2, seconds: 15, xp: 40 };
    b.activity['2026-10-14'] = { questions: 2, correct: 2, seconds: 10, xp: 25 };
    a.contests = { daily: { '2026-10-14': { points: 700, correct: 7, total: 10 } }, weeks: {}, duels: { d1: { res: 'win', vs: 'P', me: 1, them: 0, subject: 'mix', at: 1 } } };
    b.contests = { daily: { '2026-10-14': { points: 700, correct: 7, total: 10, rank: 1, players: 3 } }, weeks: { '2026-10-05': 300 }, duels: {} };
    const m = mergeData(base, a, b);
    expect(m.activity['2026-10-14']).toEqual({ questions: 4, correct: 3, seconds: 20, xp: 55 });
    expect(m.contests?.daily['2026-10-14'].rank).toBe(1);
    expect(Object.keys(m.contests!.duels)).toEqual(['d1']);
    expect(m.contests?.weeks['2026-10-05']).toBe(300);
    // bez soutěží na obou zařízeních pole nevznikne
    expect(mergeData(null, defaultData(), defaultData()).contests).toBeUndefined();
  });
});
