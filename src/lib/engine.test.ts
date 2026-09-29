import { describe, expect, it } from 'vitest';
import type { AppData, Question } from '../types';
import { defaultData, migrate } from './storage';
import { generateBookQuestions, generateGlobalQuestions, generateNonArtQuestions, generateTermQuestions } from './generator';
import { autoPoints, evaluatePoints, matchesAnswer, splitSentences } from './text';
import { gradeFromScore, updateSrs } from './progress';
import { buildSession } from './session';
import { generatePlan, recommendations } from './insights';
import { recommendedSession } from './quick';
import { EXAM_AREAS } from '../data/osnova';
import { TERMS } from '../data/terms';

function validate(q: Question) {
  expect(q.id).toBeTruthy();
  expect(q.prompt.trim().length).toBeGreaterThan(0);
  switch (q.type) {
    case 'abc':
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.options.length);
      break;
    case 'fill':
    case 'identifyWork':
    case 'identifyAuthor':
    case 'identifyTerm':
      expect(q.accepted.length).toBeGreaterThan(0);
      expect(matchesAnswer(q.answer, q.accepted)).toBe(true);
      break;
    case 'match':
      expect(q.pairs.length).toBeGreaterThanOrEqual(3);
      expect(new Set(q.pairs.map((p) => p.left)).size).toBe(q.pairs.length);
      expect(new Set(q.pairs.map((p) => p.right)).size).toBe(q.pairs.length);
      break;
    case 'order':
      expect(q.items.length).toBeGreaterThanOrEqual(3);
      expect(new Set(q.items).size).toBe(q.items.length);
      break;
    case 'open':
    case 'speech':
      expect(q.points.length).toBeGreaterThan(0);
      q.points.forEach((p) => expect(p.keywords.length).toBeGreaterThan(0));
      break;
  }
}

describe('generátor otázek', () => {
  const data = defaultData();

  it('výchozí seznam obsahuje 19 knih', () => {
    expect(data.books).toHaveLength(19);
  });

  it.each(defaultData().books.map((b) => [b.title, b.id]))('%s – generuje platné otázky všech typů', (_t, id) => {
    const book = data.books.find((b) => b.id === id)!;
    const qs = generateBookQuestions(book, data.books);
    qs.forEach(validate);
    const types = new Set(qs.map((q) => q.type));
    for (const t of ['abc', 'truefalse', 'flashcard', 'fill', 'identifyWork', 'open', 'order']) expect(types).toContain(t);
    // každá oblast osnovy má otevřenou otázku pro simulaci
    for (const a of EXAM_AREAS) expect(qs.some((q) => q.type === 'open' && q.factKey === `exam-${a}`)).toBe(true);
  });

  it('globální, pojmové a neumělecké otázky jsou platné', () => {
    generateGlobalQuestions(data.books).forEach(validate);
    const terms = generateTermQuestions();
    terms.forEach(validate);
    expect(terms.filter((q) => q.type === 'identifyTerm')).toHaveLength(TERMS.length);
    generateNonArtQuestions().forEach(validate);
  });

  it('z jedné informace vzniká více typů otázek (R.U.R. → Karel Čapek)', () => {
    const rur = data.books.find((b) => b.id === 'rur')!;
    const authorQs = generateBookQuestions(rur, data.books).filter((q) => q.factKey === 'author');
    expect(new Set(authorQs.map((q) => q.type))).toEqual(new Set(['abc', 'truefalse', 'flashcard', 'fill']));
  });
});

describe('vyhodnocování odpovědí', () => {
  it('toleruje diakritiku, velikost písmen a překlepy', () => {
    expect(matchesAnswer('karel capek', ['Karel Čapek'])).toBe(true);
    expect(matchesAnswer('Čapek', ['Karel Čapek', 'Čapek'])).toBe(true);
    expect(matchesAnswer('Kafak', ['Kafka'])).toBe(false); // krátké slovo – bez tolerance
    expect(matchesAnswer('Promnena', ['Proměna'])).toBe(true);
    expect(matchesAnswer('RUR', ['R.U.R.'])).toBe(true);
    expect(matchesAnswer('Poláček', ['Karel Čapek'])).toBe(false);
    expect(matchesAnswer('personifikace', ['personifikace (zosobnění)', 'personifikace'])).toBe(true);
  });

  it('dělí věty, ale ne za zkratkami a řadovými číslovkami', () => {
    expect(splitSentences('Buřiči: F. Gellner, F. Šrámek. Česká literatura 20. století; druhá část.')).toEqual([
      'Buřiči: F. Gellner, F. Šrámek.',
      'Česká literatura 20. století',
      'druhá část.',
    ]);
  });

  it('er-forma / ich-forma se rozpozná v různých zápisech', () => {
    const pts = autoPoints('Er-forma; vševědoucí vypravěč, který nahlíží do myšlenek postav.');
    expect(evaluatePoints('Je to er forma a vypravěč je vševědoucí', pts).score).toBe(1);
  });

  it('otevřená odpověď – označí zmíněné a chybějící body', () => {
    const { results, score } = evaluatePoints('Proměna je metafora odcizení, Řehoř živil rodinu a je osamělý.', [
      { label: 'metafora', keywords: ['metafor'] },
      { label: 'užitečnost', keywords: ['živil', 'užiteč'] },
      { label: 'samota', keywords: ['samot', 'osamě'] },
      { label: 'otec', keywords: ['otc', 'otec'] },
    ]);
    expect(results.map((r) => r.hit)).toEqual([true, true, true, false]);
    expect(score).toBe(0.75);
  });
});

describe('opakování (spaced repetition)', () => {
  it('správná odpověď prodlužuje interval, špatná ho zkracuje', () => {
    const now = Date.now();
    let s = updateSrs(undefined, 'good', now);
    expect(s.interval).toBe(1);
    s = updateSrs(s, 'good', now);
    expect(s.interval).toBe(3);
    s = updateSrs(s, 'good', now);
    expect(s.interval).toBeGreaterThan(3);
    const wrong = updateSrs(s, 'again', now);
    expect(wrong.interval).toBe(0);
    expect(wrong.due - now).toBeLessThan(60 * 60 * 1000);
    expect(gradeFromScore(1)).toBe('good');
    expect(gradeFromScore(0.5)).toBe('hard');
    expect(gradeFromScore(0)).toBe('again');
  });
});

describe('sestavení tréninku', () => {
  const data: AppData = defaultData();
  it('vrátí požadovaný počet otázek bez opakování stejného faktu', () => {
    const qs = buildSession(data, { title: 't', mode: 't', difficulty: 'easy', bookIds: [], areas: [], types: ['abc', 'truefalse', 'flashcard'], count: 20 });
    expect(qs).toHaveLength(20);
    expect(new Set(qs.map((q) => `${q.bookId}|${q.factKey}`)).size).toBe(20);
  });
  it('filtruje podle knihy a oblasti', () => {
    const qs = buildSession(data, { title: 't', mode: 't', difficulty: 'medium', bookIds: ['promena'], areas: ['characters'], types: ['abc', 'fill', 'flashcard', 'identifyWork', 'truefalse'], count: 50 });
    expect(qs.length).toBeGreaterThan(3);
    qs.forEach((q) => {
      expect(q.bookId).toBe('promena');
      expect(q.area).toBe('characters');
    });
  });
  it('časový režim se vejde do rozpočtu', () => {
    const qs = buildSession(data, { title: 't', mode: 't', difficulty: 'medium', bookIds: [], areas: [], types: ['abc', 'truefalse', 'open'], count: 50, minutes: 5 });
    const secs = qs.reduce((s, q) => s + (q.type === 'open' ? 150 : q.type === 'truefalse' ? 12 : 20), 0);
    expect(secs).toBeLessThanOrEqual(300);
    expect(qs.length).toBeGreaterThan(5);
  });
  it('adaptivita – slabá oblast dostává více otázek', () => {
    const d: AppData = structuredClone(data);
    for (const b of d.books) for (const a of EXAM_AREAS) d.mastery[`${b.id}|${a}`] = { c: 9, n: 9.5, attempts: 20, correct: 19, last: Date.now() };
    d.mastery['promena|characters'] = { c: 0, n: 5, attempts: 5, correct: 0, last: Date.now() };
    let hits = 0;
    for (let i = 0; i < 20; i++) {
      const qs = buildSession(d, { title: 't', mode: 't', difficulty: 'easy', bookIds: ['promena'], areas: [], types: ['abc', 'truefalse', 'flashcard'], count: 5 });
      hits += qs.filter((q) => q.area === 'characters').length;
    }
    expect(hits / 20).toBeGreaterThan(1);
  });
  it('doporučení a dnešní trénink', () => {
    const recs = recommendations(data, 3);
    expect(recs).toHaveLength(3);
    expect(new Set(recs.map((r) => r.book.id)).size).toBe(3);
    const { cfg } = recommendedSession(data, recs);
    expect(cfg.questions!.length).toBeGreaterThan(5);
  });
  it('studijní plán pokryje všechny knihy', () => {
    const plan = generatePlan(data, '2027-05-20', new Date('2026-09-29T12:00:00'));
    const covered = new Set(plan.weeks.flatMap((w) => w.bookIds));
    data.books.forEach((b) => expect(covered).toContain(b.id));
    expect(plan.weeks.at(-1)!.extras).toContain('Simulace ústní maturity');
  });
});

describe('export / import', () => {
  it('data projdou exportem a importem beze ztráty', () => {
    const d = defaultData();
    d.books[0].notes = 'Učitel se často ptá na kompozici.';
    d.xp = 123;
    d.srs['x'] = { due: 1, interval: 1, ease: 2.3, reps: 1, lapses: 0, last: 1, seen: 1 };
    const back = migrate(JSON.parse(JSON.stringify(d)));
    expect(back.books[0].notes).toBe('Učitel se často ptá na kompozici.');
    expect(back.xp).toBe(123);
    expect(back.srs['x'].interval).toBe(1);
  });
  it('odmítne neplatný soubor', () => {
    expect(() => migrate({ foo: 1 })).toThrow();
    expect(() => migrate(null)).toThrow();
  });
});
