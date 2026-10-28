import { describe, expect, it } from 'vitest';
import { BOOK_DATABASE, seedToBook } from '../data/books';
import { ALL_TOPICS } from '../data/subjects';
import { bookSheet, firstSentences, topicSheet } from './cheatsheet';

describe('Taháky k tisku', () => {
  it('věty se nedělí na iniciálách a zkratkách', () => {
    expect(firstSentences('Převyprávěl to J. V. Pleva. Druhá věta.', 1)).toBe('Převyprávěl to J. V. Pleva.');
    expect(firstSentences('Je to tzv. robinzonáda. Další.', 1)).toBe('Je to tzv. robinzonáda.');
    expect(firstSentences('Jedna! Dvě? Tři.', 2)).toBe('Jedna! Dvě?');
    expect(firstSentences('Bez tečky na konci', 2)).toBe('Bez tečky na konci');
    expect(firstSentences('', 2)).toBe('');
    expect(firstSentences('Monolog: „Zloději! Vrahové!“ Pak pláče. Konec.', 1)).toBe('Monolog: „Zloději! Vrahové!“ Pak pláče.');
  });

  it('každá kniha z databáze má tahák s hlavními částmi', () => {
    for (const seed of BOOK_DATABASE) {
      const s = bookSheet(seedToBook(seed));
      const titles = s.sections.map((x) => x.title);
      for (const t of ['Téma', 'Hlavní myšlenka', 'Kompozice', 'Hlavní postavy', 'Děj v bodech']) expect(titles, `${seed.id}: ${t}`).toContain(t);
      expect(s.subtitle, seed.id).toContain(seed.author);
    }
  });

  it('poznámky jen na přání a prázdné části se vynechají', () => {
    const b = seedToBook(BOOK_DATABASE[0], { notes: 'moje' });
    expect(bookSheet(b).sections.some((x) => x.title === 'Moje poznámky')).toBe(false);
    expect(bookSheet(b, true).sections.find((x) => x.title === 'Moje poznámky')?.text).toBe('moje');
    expect(bookSheet({ ...b, verse: '' }).sections.some((x) => x.title === 'Verš')).toBe(false);
  });

  it('každé téma IT předmětů má tahák s osnovou a pojmy', () => {
    for (const t of ALL_TOPICS) {
      const s = topicSheet(t);
      expect(s.sections.length, t.id).toBeGreaterThanOrEqual(2);
      expect(
        s.sections.some((x) => x.pairs?.length),
        t.id,
      ).toBe(t.terms.length > 0);
    }
  });
});

describe('Tahák literárních pojmů', () => {
  it('skupiny pokryjí všechny pojmy právě jednou', async () => {
    const { TERMS } = await import('../data/terms');
    const { TERM_SHEET_GROUPS, termSheet } = await import('./cheatsheet');
    const all = TERM_SHEET_GROUPS.flatMap((g) => termSheet(g.id).sections.flatMap((s) => s.pairs ?? []).map((p) => p.term));
    expect(all.sort()).toEqual(TERMS.map((t) => t.name).sort());
    for (const g of TERM_SHEET_GROUPS) for (const s of termSheet(g.id).sections) for (const p of s.pairs!) expect(p.def.length, p.term).toBeGreaterThan(10);
  });
});

describe('Kartičky autorů', () => {
  it('každý autor z výchozího seznamu má kartičku se směrem, díly a textem o autorovi', async () => {
    const { defaultData } = await import('./storage');
    const { groupAuthors } = await import('./authors');
    const { authorCard } = await import('./cheatsheet');
    const authors = groupAuthors(defaultData().books);
    expect(authors.length).toBeGreaterThan(10);
    expect(authors.some((a) => /nezn/i.test(a.name))).toBe(false);
    for (const a of authors) {
      const c = authorCard(a);
      const labels = c.rows.map((r) => r.label);
      for (const l of ['Směr', 'O autorovi', 'Ze seznamu']) expect(labels, a.name).toContain(l);
      expect(c.rows.find((r) => r.label === 'Ze seznamu')!.text, a.name).toContain(a.books[0].title);
    }
    // autor s více knihami v seznamu (Čapek) má obě na jedné kartičce
    const capek = authors.find((a) => a.name === 'Karel Čapek')!;
    expect(authorCard(capek).rows.find((r) => r.label === 'Ze seznamu')!.text).toMatch(/R\.U\.R\.[\s\S]*Válka s mloky|Válka s mloky[\s\S]*R\.U\.R\./);
  });
});
