import { describe, expect, it } from 'vitest';
import { mergeData } from './merge';
import { groupStats } from './group';
import { newerVersion } from './update';
import { defaultData } from './storage';
import type { AppData, SessionRecord } from '../types';

const clone = (d: AppData): AppData => structuredClone(d);
const session = (id: string, date: number): SessionRecord => ({ id, date, mode: 'm', title: id, difficulty: 'medium', total: 10, score: 0.8, seconds: 60, bookIds: [], sections: {} });

describe('Sloučení dat ze dvou zařízení', () => {
  const base = defaultData();
  base.mastery['maj|basics'] = { c: 2, n: 3, attempts: 3, correct: 2, last: 100 };
  base.activity['2026-10-01'] = { questions: 5, correct: 4, seconds: 100 };
  base.xp = 50;
  base.unknown['q1'] = { question: { id: 'q1' } as never, addedAt: 1, correctStreak: 0 };
  base.sessions = [session('s0', 1)];

  it('odpovědi z obou zařízení se sečtou', () => {
    const local = clone(base);
    const remote = clone(base);
    local.mastery['maj|basics'] = { c: 3, n: 4, attempts: 4, correct: 3, last: 200 };
    remote.mastery['maj|basics'] = { c: 2, n: 5, attempts: 5, correct: 2, last: 300 };
    local.activity['2026-10-01'] = { questions: 7, correct: 6, seconds: 150 };
    remote.activity['2026-10-01'] = { questions: 8, correct: 5, seconds: 160 };
    local.xp = 60;
    remote.xp = 80;
    local.sessions = [session('s1', 5), ...local.sessions];
    remote.sessions = [session('s2', 6), ...remote.sessions];
    const m = mergeData(base, local, remote);
    expect(m.mastery['maj|basics'].attempts).toBe(6);
    expect(m.mastery['maj|basics'].correct).toBe(3);
    expect(m.mastery['maj|basics'].last).toBe(300);
    expect(m.activity['2026-10-01']).toEqual({ questions: 10, correct: 7, seconds: 210 });
    expect(m.xp).toBe(90);
    expect(m.sessions.map((s) => s.id)).toEqual(['s2', 's1', 's0']);
  });

  it('smazání na jednom zařízení se projeví na obou', () => {
    const local = clone(base);
    const remote = clone(base);
    delete local.unknown['q1'];
    local.books = local.books.filter((b) => b.id !== 'rur');
    const m = mergeData(base, local, remote);
    expect(m.unknown['q1']).toBeUndefined();
    expect(m.books.some((b) => b.id === 'rur')).toBe(false);
    // a obráceně
    const m2 = mergeData(base, remote, local);
    expect(m2.unknown['q1']).toBeUndefined();
  });

  it('změna jen na druhém zařízení se převezme, novější úprava knihy vyhraje', () => {
    const local = clone(base);
    const remote = clone(base);
    remote.books = remote.books.map((b) => (b.id === 'maj' ? { ...b, notes: 'z mobilu', updatedAt: b.updatedAt + 10 } : b));
    remote.topicNotes['site-01'] = 'poznámka';
    remote.settings.examDate = '2027-05-20';
    local.settings.theme = 'light';
    local.settings.aiApiKey = 'tajny';
    const m = mergeData(base, local, remote);
    expect(m.books.find((b) => b.id === 'maj')!.notes).toBe('z mobilu');
    expect(m.topicNotes['site-01']).toBe('poznámka');
    expect(m.settings.examDate).toBe('2027-05-20');
    expect(m.settings.theme).toBe('light');
    expect(m.settings.aiApiKey).toBe('tajny');
  });

  it('první propojení bez základu = sjednocení', () => {
    const a = defaultData();
    const b = defaultData();
    a.sessions = [session('a', 1)];
    b.sessions = [session('b', 2)];
    a.unknown['x'] = { question: { id: 'x' } as never, addedAt: 1, correctStreak: 0 };
    b.mastery['k|basics'] = { c: 1, n: 1, attempts: 1, correct: 1, last: 5 };
    b.xp = 30;
    a.xp = 20;
    const m = mergeData(null, a, b);
    expect(m.sessions.map((s) => s.id).sort()).toEqual(['a', 'b']);
    expect(m.unknown['x']).toBeDefined();
    expect(m.mastery['k|basics'].attempts).toBe(1);
    expect(m.xp).toBe(50);
    expect(m.books.length).toBe(a.books.length);
  });

  it('opakované sloučení stejných dat nic nemění', () => {
    const m = mergeData(base, clone(base), clone(base));
    expect(JSON.stringify(m)).toBe(JSON.stringify({ ...base, lastExport: undefined }));
  });
});

describe('skupina kamarádů', () => {
  it('členství ve skupině se přenese na druhé zařízení', () => {
    const base = defaultData();
    const local = { ...base, settings: { ...base.settings, group: { code: 'ABCDEFGHJK', member: 'M'.repeat(24), name: 'Lukáš' } } };
    expect(mergeData(base, base, local).settings.group?.name).toBe('Lukáš');
    expect(mergeData(base, local, base).settings.group?.name).toBe('Lukáš');
  });
  it('souhrn pro skupinu počítá týden, dnešek a úspěšnost', () => {
    const d = defaultData();
    const now = new Date(2026, 9, 13, 12);
    d.xp = 100;
    d.activity = { '2026-10-13': { questions: 10, correct: 8, seconds: 60 }, '2026-10-10': { questions: 5, correct: 2, seconds: 30 }, '2026-09-01': { questions: 5, correct: 5, seconds: 30 } };
    const s = groupStats(d, now);
    expect(s).toMatchObject({ xp: 100, today: 10, week: 15, total: 20, accuracy: 0.75, lastActive: '2026-10-13' });
  });
});

describe('aktualizace', () => {
  it('porovnává verze číselně', () => {
    expect(newerVersion('1.16.0', '1.15.0')).toBe(true);
    expect(newerVersion('1.10.0', '1.9.3')).toBe(true);
    expect(newerVersion('1.15.0', '1.15.0')).toBe(false);
    expect(newerVersion('1.14.2', '1.15.0')).toBe(false);
  });
});

describe('profil', () => {
  it('zamčený rámeček a titul se nezobrazí, odemčený ano', async () => {
    const { safeProfile } = await import('./profile');
    const ctx = { level: 4, longest: 3, total: 50, subjects: { cjl: 0.6, site: 0.1, hw: 0, cloud: 0 }, subnet: 0 };
    expect(safeProfile({ avatar: 'x', frame: 'zlato', title: 'site-80', showcase: [] }, ctx)).toMatchObject({ frame: '', title: 'start' });
    expect(safeProfile({ avatar: 'x', frame: 'bronz', title: 'cjl-50', showcase: ['perfect', 'neexistuje'] }, ctx)).toMatchObject({ frame: 'bronz', title: 'cjl-50', showcase: ['perfect'] });
  });
  it('profil se synchronizuje mezi zařízeními', () => {
    const base = defaultData();
    const local = { ...base, settings: { ...base.settings, profile: { avatar: '', frame: 'bronz', title: 'start', showcase: [] } } };
    expect(mergeData(base, base, local).settings.profile?.frame).toBe('bronz');
  });
});
