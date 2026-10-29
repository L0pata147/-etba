/** Hry na opakování četby – pexeso autor–dílo, řazení podle roku, poznej dílo (bez UI) */
import type { Book } from '../types';
import { approxYear } from './generator';
import { sample, shuffle } from './random';

const UNKNOWN = /nezn[aá]m/i;

export interface MemoryCard {
  /** Jedinečné id karty */
  id: string;
  /** Knihy, ke které karta patří – dvojice mají stejné pairId */
  pairId: string;
  kind: 'author' | 'title';
  text: string;
}

/** Pexeso: n dvojic autor – dílo; každý autor nejvýš jednou (aby dvojice byly jednoznačné) */
export function buildMemory(books: Book[], n = 6): MemoryCard[] {
  const byAuthor = new Map<string, Book>();
  for (const b of shuffle(books)) if (b.title.trim() && b.author.trim() && !UNKNOWN.test(b.author) && !byAuthor.has(b.author)) byAuthor.set(b.author, b);
  const chosen = [...byAuthor.values()].slice(0, n);
  return shuffle(
    chosen.flatMap((b) => [
      { id: `${b.id}-a`, pairId: b.id, kind: 'author' as const, text: b.author },
      { id: `${b.id}-t`, pairId: b.id, kind: 'title' as const, text: b.title },
    ]),
  );
}

export interface OrderItem {
  id: string;
  title: string;
  author: string;
  year: string;
  sortYear: number;
}

/** Řazení: n děl s rozdílnými roky vzniku (aspoň `gap` let od sebe), aby pořadí bylo jednoznačné */
export function buildOrder(books: Book[], n = 5, gap = 3): OrderItem[] {
  const out: OrderItem[] = [];
  for (const b of shuffle(books)) {
    const y = approxYear(b.year);
    if (Number.isNaN(y) || out.some((o) => Math.abs(o.sortYear - y) < gap)) continue;
    out.push({ id: b.id, title: b.title, author: b.author, year: b.year, sortYear: y });
    if (out.length >= n) break;
  }
  return shuffle(out);
}

/** Je pořadí (od nejstaršího) správné? Vrací i počet děl na správném místě */
export function checkOrder(items: OrderItem[]): { ok: boolean; correctPlaces: number } {
  const sorted = [...items].sort((a, b) => a.sortYear - b.sortYear);
  const correctPlaces = items.filter((x, i) => x.id === sorted[i].id).length;
  return { ok: correctPlaces === items.length, correctPlaces };
}

export interface QuizRound {
  id: string;
  /** Druh nápovědy (ukázka, popis, postava) */
  kind: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
}

const GENERIC = /^(vypravěč|otec|matka|chůva|kněz|lyrický subjekt|autor|mloci|horníci)/i;

/** Poznej dílo: náhodné nápovědy ze scén, popisů a postav; možnosti jsou díla ze stejného seznamu */
export function buildQuiz(books: Book[], n = 10): QuizRound[] {
  const titled = books.filter((b) => b.title.trim());
  if (titled.length < 4) return [];
  const pool: QuizRound[] = [];
  const options = (b: Book) =>
    shuffle([
      b.title,
      ...sample(
        titled.filter((x) => x.id !== b.id).map((x) => x.title),
        3,
      ),
    ]);
  for (const b of titled) {
    b.scenes.forEach((s, i) =>
      pool.push({ id: `${b.id}-scene-${i}`, kind: 'Ukázka / scéna', prompt: s.scene, options: options(b), answer: b.title, explanation: `${b.title} (${b.author}): ${s.context}` }),
    );
    b.clues.forEach((c, i) => pool.push({ id: `${b.id}-clue-${i}`, kind: 'Popis díla', prompt: c, options: options(b), answer: b.title, explanation: `${b.title} – ${b.author}.` }));
    b.mainCharacters
      .filter((c) => c.name.trim() && !GENERIC.test(c.name))
      .forEach((c, i) =>
        pool.push({
          id: `${b.id}-char-${i}`,
          kind: 'Postava',
          prompt: `Ve kterém díle vystupuje postava ${c.name}?`,
          options: options(b),
          answer: b.title,
          explanation: `${c.name} – ${b.title} (${b.author}). ${c.description.split(/(?<=[.!?])\s/)[0] ?? ''}`,
        }),
      );
  }
  // nápověda nesmí obsahovat název díla; z každé knihy nejvýš dvě otázky, ať se kola střídají
  const perBook = new Map<string, number>();
  const out: QuizRound[] = [];
  for (const r of shuffle(pool)) {
    if (r.prompt.toLowerCase().includes(r.answer.toLowerCase())) continue;
    const bookId = r.id.split('-').slice(0, -2).join('-');
    if ((perBook.get(bookId) ?? 0) >= 2) continue;
    perBook.set(bookId, (perBook.get(bookId) ?? 0) + 1);
    out.push(r);
    if (out.length >= n) break;
  }
  return out;
}
