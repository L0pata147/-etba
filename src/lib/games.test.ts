import { describe, expect, it } from 'vitest';
import { defaultData } from './storage';
import { approxYear } from './generator';
import { buildMemory, buildOrder, buildQuiz, checkOrder } from './games';

const books = defaultData().books;

describe('hry', () => {
  it('pexeso má dvojice autor–dílo s různými autory', () => {
    const cards = buildMemory(books, 6);
    expect(cards).toHaveLength(12);
    const authors = cards.filter((c) => c.kind === 'author').map((c) => c.text);
    expect(new Set(authors).size).toBe(6);
    for (const c of cards.filter((x) => x.kind === 'title')) {
      const b = books.find((x) => x.id === c.pairId)!;
      expect(b.title).toBe(c.text);
      expect(cards.find((x) => x.pairId === c.pairId && x.kind === 'author')!.text).toBe(b.author);
    }
  });

  it('řazení vybere díla s různými roky a pozná správné pořadí', () => {
    const items = buildOrder(books, 5);
    expect(items).toHaveLength(5);
    const ys = items.map((x) => x.sortYear).sort((a, b) => a - b);
    for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(3);
    const sorted = [...items].sort((a, b) => a.sortYear - b.sortYear);
    expect(checkOrder(sorted)).toEqual({ ok: true, correctPlaces: 5 });
    expect(checkOrder([...sorted].reverse()).ok).toBe(false);
    for (const x of items) expect(x.sortYear).toBe(approxYear(x.year));
  });

  it('poznej dílo: správná odpověď je mezi 4 možnostmi a nápověda neprozradí název', () => {
    const rounds = buildQuiz(books, 10);
    expect(rounds).toHaveLength(10);
    for (const r of rounds) {
      expect(r.options).toHaveLength(4);
      expect(new Set(r.options).size).toBe(4);
      expect(r.options).toContain(r.answer);
    }
    const all = buildQuiz(books, 9999);
    for (const r of all) expect(r.prompt.toLowerCase(), r.id).not.toContain(r.answer.toLowerCase());
    const perBook = new Map<string, number>();
    for (const r of all) perBook.set(r.answer, (perBook.get(r.answer) ?? 0) + 1);
    expect(Math.max(...perBook.values())).toBeLessThanOrEqual(2);
  });
});
