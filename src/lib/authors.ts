import type { AbcQuestion, Book, Question } from '../types';
import { generateBookQuestions, generateGlobalQuestions } from './generator';
import { sample, shuffle } from './random';

export interface Author {
  /** id pro adresu (/autori/:id) */
  id: string;
  name: string;
  life: string;
  books: Book[];
  otherWorks: string[];
  movements: string[];
  periods: string[];
}

const UNKNOWN = /nezn[aá]m/i;

export function authorSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const uniq = (xs: string[]) => [...new Set(xs.map((x) => x.trim()).filter(Boolean))];

/** Autoři z knih v seznamu (bez anonymních děl), seřazení podle prvního výskytu v seznamu */
export function groupAuthors(books: Book[]): Author[] {
  const map = new Map<string, Author>();
  for (const b of books) {
    const name = b.author.trim();
    if (!name || UNKNOWN.test(name)) continue;
    const id = authorSlug(name);
    const a = map.get(id) ?? { id, name, life: '', books: [], otherWorks: [], movements: [], periods: [] };
    a.books.push(b);
    if (!a.life && b.authorLife.trim()) a.life = b.authorLife.trim();
    a.otherWorks = uniq([...a.otherWorks, ...b.otherWorks]).filter((w) => !a.books.some((x) => x.title === w));
    a.movements = uniq([...a.movements, b.movement]);
    a.periods = uniq([...a.periods, b.period]);
    map.set(id, a);
  }
  return [...map.values()];
}

/** Druhy otázek generátoru, které se týkají autora */
const AUTHOR_KEYS = /^(author|author-id|author-context|other-work|other-work-id|match-otherwork)(\||$)/;

function abc(id: string, bookId: string, prompt: string, correct: string, wrong: string[], explanation: string): AbcQuestion | null {
  const opts = sample(uniq(wrong.filter((w) => w !== correct)), 3);
  if (opts.length < 2) return null;
  const options = shuffle([correct, ...opts]);
  return { id: `${bookId}|${id}|abc`, factKey: id, type: 'abc', bookId, area: 'authorContext', prompt, explanation, difficulty: 'medium', options, correctIndex: options.indexOf(correct) };
}

/** Otázky jen o autorech – z existujících otázek ke knihám a navíc život a směr autora */
export function authorQuestions(books: Book[], all: Book[], only?: Author[]): Question[] {
  const authors = groupAuthors(all);
  const target = only ?? groupAuthors(books);
  const ids = new Set(target.flatMap((a) => a.books.map((b) => b.id)));
  const own = all.filter((b) => ids.has(b.id)).flatMap((b) => generateBookQuestions(b, all));
  const global = generateGlobalQuestions(all).filter((q) => (q.relatedBookIds ?? []).some((id) => ids.has(id)));
  const out: Question[] = [...own, ...global].filter((q) => AUTHOR_KEYS.test(q.factKey));
  for (const a of target) {
    const bookId = a.books[0].id;
    const others = authors.filter((x) => x.id !== a.id);
    if (a.life) {
      const q = abc('author-life', bookId, `Kdy žil(a) ${a.name}?`, a.life, others.map((o) => o.life), `${a.name} (${a.life}) – ${a.books.map((b) => b.title).join(', ')}.`);
      if (q) out.push(q);
    }
    if (a.movements.length) {
      const mv = a.movements[0];
      const q = abc(
        'author-movement',
        bookId,
        `Ke kterému směru (období) patří dílo autora ${a.name} ${a.books[0].title}?`,
        mv,
        others.flatMap((o) => o.movements).filter((m) => !a.movements.includes(m)),
        `${a.books[0].title} (${a.name}): ${mv}, ${a.periods[0] ?? ''}`.trim(),
      );
      if (q) out.push(q);
    }
    const q = abc(
      'author-of',
      bookId,
      `Který autor napsal ${a.books.length > 1 ? 'tato díla' : 'toto dílo'}: ${a.books.map((b) => b.title).join(', ')}?`,
      a.name,
      others.map((o) => o.name),
      `${a.books.map((b) => b.title).join(', ')} – ${a.name}${a.life ? ` (${a.life})` : ''}.`,
    );
    if (q) out.push(q);
  }
  const seen = new Set<string>();
  return out.filter((q) => (seen.has(q.id) ? false : (seen.add(q.id), true)));
}
