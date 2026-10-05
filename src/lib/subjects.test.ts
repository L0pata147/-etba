import { describe, expect, it } from 'vitest';
import type { FillQuestion, Question } from '../types';
import { ALL_TOPICS, SUBJECT_TOPICS } from '../data/subjects';
import { ALL_COMMANDS } from '../data/site/commands';
import { ALL_PROCEDURES } from '../data/site/procedures';
import { WRITING_FORMS, WRITING_PROMPTS } from '../data/writing';
import { HW_GENERATORS, generateHwCalcQuestions } from './hwgen';
import { generateCloudScenario } from './cloudgen';
import { analyzeWriting, countWords } from './writingcheck';
import { checkFillAnswer } from './answers';
import { buildSubjectPool, generateCommandQuestions, generateProcedureQuestions, generateTopicQuestions, itemLabel } from './topicgen';
import { buildSession } from './session';
import { defaultData, migrate } from './storage';

function validate(q: Question) {
  expect(q.prompt.trim().length).toBeGreaterThan(0);
  if (q.type === 'abc') {
    expect(new Set(q.options).size).toBe(q.options.length);
    expect(q.options.length).toBeGreaterThanOrEqual(3);
  }
  if (q.type === 'fill' || q.type === 'identifyTerm') expect(checkFillAnswer(q as FillQuestion, q.answer)).toBe(true);
  if (q.type === 'open') for (const p of q.points) expect(p.keywords.length).toBeGreaterThan(0);
}

describe('Okruhy hardware a cloud', () => {
  it('unikátní id a čísla okruhů', () => {
    expect(new Set(ALL_TOPICS.map((t) => t.id)).size).toBe(ALL_TOPICS.length);
    for (const [subject, list] of Object.entries(SUBJECT_TOPICS)) {
      expect(list.every((t) => t.subject === subject)).toBe(true);
      expect(list.map((t) => t.number)).toEqual(list.map((_, i) => i + 1));
    }
  });
  it('generované otázky jsou platné', () => {
    for (const t of [...SUBJECT_TOPICS.hw, ...SUBJECT_TOPICS.cloud]) {
      const qs = generateTopicQuestions(t);
      expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
      qs.forEach(validate);
      for (const q of t.quiz) expect(q.wrong).not.toContain(q.a);
      expect(itemLabel(t.id)).toContain(t.title);
    }
  });
  it('téma 20 ze sítí je zabezpečení a útoky', () => {
    const t20 = SUBJECT_TOPICS.site.find((t) => t.number === 20)!;
    expect(t20.title).toMatch(/Zabezpečení/);
    expect(t20.title).toMatch(/útok/);
  });
});

describe('Příkazy a postupy cloudu', () => {
  it('unikátní id, všechny zápisy projdou', () => {
    expect(new Set(ALL_COMMANDS.map((c) => c.id)).size).toBe(ALL_COMMANDS.length);
    expect(new Set(ALL_PROCEDURES.map((p) => p.id)).size).toBe(ALL_PROCEDURES.length);
    const qs = generateCommandQuestions(['docker', 'hyperv', 'proxmox']);
    expect(qs.every((q) => q.bookId.startsWith('cloud-prikazy-'))).toBe(true);
    for (const q of qs) {
      validate(q);
      if (q.type === 'fill') for (const a of q.accepted) expect(checkFillAnswer(q, a)).toBe(true);
    }
    expect(itemLabel('cloud-prikazy-docker')).toContain('Docker');
    generateProcedureQuestions(['docker', 'hyperv', 'proxmox']).forEach(validate);
  });
  it('kontrola příkazu docker run podle povinných částí', () => {
    const q = generateCommandQuestions(['docker']).find((x): x is FillQuestion => x.type === 'fill' && x.answer.startsWith('docker run -d -p 8080:80'))!;
    expect(checkFillAnswer(q, 'docker run --name web -d -p 8080:80 nginx')).toBe(true);
    expect(checkFillAnswer(q, 'docker run -d -p 80:8080 --name web nginx')).toBe(false);
  });
  it('scénář cloudu bez chybějících hodnot', () => {
    for (const hv of ['virtualbox', 'hyperv', 'proxmox'] as const) {
      const s = generateCloudScenario(hv);
      expect(s.tasks.length).toBeGreaterThan(6);
      for (const t of s.tasks) expect(`${t.detail}${t.solution}`).not.toMatch(/undefined|NaN/);
    }
  });
});

describe('Převody a výpočty – hardware', () => {
  it('všechny generátory dávají platné otázky', () => {
    for (let r = 0; r < 40; r++) {
      const qs = generateHwCalcQuestions(2);
      expect(qs.length).toBe(Object.keys(HW_GENERATORS).length * 2);
      expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
      for (const q of qs) {
        validate(q);
        expect(`${q.prompt}${(q as FillQuestion).answer}${q.explanation}`).not.toMatch(/undefined|NaN|Infinity/);
      }
    }
  });
  it('konkrétní převody jsou správně', () => {
    for (let r = 0; r < 30; r++) {
      for (const q of generateHwCalcQuestions(1, ['dec-bin', 'bin-dec', 'dec-hex', 'hex-dec', 'bin-hex']) as FillQuestion[]) {
        const num = q.prompt.match(/(?:číslo|soustavy\.?)\s*([0-9A-F]+)/)?.[1] ?? q.prompt.match(/([0-9A-F]+) do/)?.[1];
        expect(num).toBeTruthy();
        const kind = q.factKey.split('-').slice(0, 2).join('-');
        const value = kind === 'dec-bin' || kind === 'dec-hex' ? parseInt(num!, 10) : kind === 'hex-dec' ? parseInt(num!, 16) : parseInt(num!, 2);
        const expected = kind === 'dec-bin' ? value.toString(2) : kind === 'dec-hex' ? value.toString(16).toUpperCase() : kind === 'bin-hex' ? value.toString(16).toUpperCase().padStart(2, '0') : String(value);
        expect(q.answer).toBe(expected);
      }
    }
  });
  it('RAID kapacita', () => {
    for (let r = 0; r < 50; r++) {
      const q = HW_GENERATORS.raid.gen(0) as FillQuestion;
      const [, level, n, size] = q.prompt.match(/RAID (\d+) z (\d+) disků po (\d+) TB/)!.map(Number) as number[];
      const cap = { 0: n * size, 1: size, 5: (n - 1) * size, 6: (n - 2) * size, 10: (n / 2) * size }[level as 0 | 1 | 5 | 6 | 10];
      expect(q.answer).toBe(String(cap));
    }
  });
});

describe('IT trénink a test', () => {
  it('pool podle předmětu', () => {
    const hw = buildSubjectPool('hw', { calc: true });
    expect(hw.every((q) => q.bookId.startsWith('hw-'))).toBe(true);
    expect(hw.some((q) => q.bookId === 'hw-vypocty')).toBe(true);
    const cloud = buildSubjectPool('cloud', { commands: ['docker', 'cisco'], procedures: true });
    expect(cloud.every((q) => q.bookId.startsWith('cloud-'))).toBe(true);
  });
  it('cvičný test z hardwaru má požadovaný počet otázek', () => {
    const qs = buildSession(defaultData(), { title: '', mode: 'hw-test', difficulty: 'medium', bookIds: [], areas: [], types: ['abc', 'truefalse', 'fill', 'identifyTerm'], count: 30, subject: 'hw', site: { calc: true } });
    expect(qs.length).toBe(30);
    expect(new Set(qs.map((q) => q.id)).size).toBe(30);
  });
  it('trénink z více předmětů najednou (it)', () => {
    const ids = [SUBJECT_TOPICS.hw[0].id, SUBJECT_TOPICS.cloud[0].id];
    const qs = buildSession(defaultData(), { title: '', mode: '', difficulty: 'medium', bookIds: [], areas: [], types: [], count: 20, subject: 'it', site: { topicIds: ids } });
    expect(qs.length).toBeGreaterThan(5);
    expect(qs.every((q) => ids.includes(q.bookId))).toBe(true);
  });
});

describe('Písemná práce', () => {
  it('data', () => {
    const forms = new Set(WRITING_FORMS.map((f) => f.id));
    for (const p of WRITING_PROMPTS) expect(forms.has(p.form)).toBe(true);
    expect(new Set(WRITING_PROMPTS.map((p) => p.id)).size).toBe(WRITING_PROMPTS.length);
  });
  it('počítání slov', () => {
    expect(countWords('Ahoj, jak se máš? Dobře – díky.')).toBe(6);
    expect(countWords('')).toBe(0);
    expect(countWords('e-mail a 20. století')).toBe(4);
  });
  it('kontrola chyb', () => {
    const a = analyzeWriting('Aby jsme to stihli, museli sme běžet. kdyby jste přišli dřív, byla by to vyjímka. Myslím že to šlo.');
    const msgs = a.issues.map((i) => i.message).join(' | ');
    expect(msgs).toContain('abychom');
    expect(msgs).toContain('jsme');
    expect(msgs).toContain('kdybyste');
    expect(msgs).toContain('výjimka');
    expect(msgs).toContain('velkým písmenem');
    expect(msgs).toContain('čárku před „že“');
  });
  it('správný text bez falešných chyb pravopisu', () => {
    const a = analyzeWriting('Abychom to stihli, museli jsme běžet. Kdybyste přišli dřív, byla by to výjimka. Myslím, že to šlo, i když pršelo.');
    expect(a.issues.filter((i) => i.kind !== 'styl')).toEqual([]);
  });
  it('migrace starých dat doplní slohovky', () => {
    const old = { ...defaultData() } as Record<string, unknown>;
    delete old.writings;
    expect(migrate(old).writings).toEqual([]);
  });
});

describe('Novinky 1.3', () => {
  it('úlohy najdi chybu', async () => {
    const { TROUBLE } = await import('../data/troubleshoot');
    const { generateTroubleQuestions } = await import('./topicgen');
    expect(new Set(TROUBLE.map((t) => t.id)).size).toBe(TROUBLE.length);
    for (const t of TROUBLE) {
      expect(t.wrong).not.toContain(t.answer);
      expect(new Set([t.answer, ...t.wrong]).size).toBe(t.wrong.length + 1);
    }
    const qs = generateTroubleQuestions(['cisco', 'linux', 'windows', 'docker', 'hyperv', 'proxmox', 'virtualbox']);
    expect(qs.length).toBe(TROUBLE.length);
    qs.forEach(validate);
    expect(buildSubjectPool('cloud', { commands: ['docker'], procedures: true }).some((q) => q.factKey === 'tr-dk-port')).toBe(true);
  });
  it('pravopisná cvičení', async () => {
    const { SPELLING } = await import('../data/spelling');
    const { generateSpellingQuestions } = await import('./spellinggen');
    expect(new Set(SPELLING.map((x) => x.id)).size).toBe(SPELLING.length);
    for (const x of SPELLING) {
      expect(x.sentence).toContain('___');
      expect(x.options).toContain(x.answer);
      expect(new Set(x.options).size).toBe(x.options.length);
    }
    const qs = generateSpellingQuestions();
    expect(qs.every((q) => q.type === 'abc' && q.options[q.correctIndex] !== undefined)).toBe(true);
    const pool = buildSession(defaultData(), { title: '', mode: '', difficulty: 'medium', bookIds: [], areas: ['pravopis'], types: ['abc'], count: 10, includeSpelling: true });
    expect(pool.length).toBe(10);
  });
  it('doporučení z IT předmětů a dnešní trénink napříč předměty', async () => {
    const { itRecommendations, recommendations } = await import('./insights');
    const { recommendedSession } = await import('./quick');
    const data = defaultData();
    const it2 = itRecommendations(data, 2);
    expect(it2).toHaveLength(2);
    expect(new Set(it2.map((r) => r.topic.subject)).size).toBe(2);
    const { cfg } = recommendedSession(data, recommendations(data, 2), it2);
    const ids = new Set(cfg.questions!.map((q) => q.bookId));
    expect(it2.some((r) => ids.has(r.topic.id))).toBe(true);
    expect(cfg.title).toContain(it2[0].topic.title);
  });
  it('migrace doplní poznámky k tématům', () => {
    const old = { ...defaultData() } as Record<string, unknown>;
    delete old.topicNotes;
    expect(migrate(old).topicNotes).toEqual({});
  });
});

describe('Podle školního cvičení – Windows Server ve VirtualBoxu', () => {
  it('zadání Windows: server ds, síť 192.168.100.0/24, role, doména, klient', async () => {
    const { generateScenario } = await import('./netgen');
    for (let i = 0; i < 20; i++) {
      const sc = generateScenario('windows');
      expect(sc.server.host).toBe('ds');
      expect(sc.server.net).toBe('192.168.100.0/24');
      expect(sc.server.ip).toMatch(/^192\.168\.100\.\d+$/);
      const all = sc.osTasks.map((t) => `${t.detail}\n${t.solution}`).join('\n');
      expect(all).toContain('Install-ADDSForest -DomainName ' + sc.domain);
      expect(all).toContain('AD-Domain-Services, DNS');
      expect(all).toContain('Vnitřní síť');
      expect(all).not.toMatch(/undefined|NaN|\$\{/);
      const ips = [...all.matchAll(/192\.168\.100\.(\d+)(?!\/)/g)].map((m) => Number(m[1]));
      expect(ips.every((n) => n >= 1 && n <= 254)).toBe(true);
    }
  });
  it('VirtualBox příkazy a postupy', () => {
    const qs = generateCommandQuestions(['virtualbox']);
    expect(qs.length).toBeGreaterThan(10);
    expect(qs.every((q) => q.bookId === 'cloud-prikazy-virtualbox')).toBe(true);
    expect(generateProcedureQuestions(['virtualbox']).length).toBeGreaterThan(0);
    expect(buildSubjectPool('cloud', { commands: ['virtualbox'], procedures: true }).some((q) => q.factKey === 'tr-vb-intnet')).toBe(true);
  });
});
