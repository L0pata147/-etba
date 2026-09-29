import type { KeyPoint } from '../types';

/** Malá písmena, bez diakritiky a interpunkce */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(er|ich)[\s-]+form/g, '$1form')
    .replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function tokenize(s: string): string[] {
  const n = normalize(s);
  return n ? n.split(' ') : [];
}

/** Jednoduchý „stem“ pro češtinu – usekne koncovky (skloňování) */
export function stem(word: string): string {
  if (word.length <= 4) return word;
  return word.slice(0, Math.max(4, Math.round(word.length * 0.7)));
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Porovná krátkou odpověď (doplňovačka) s přijatelnými odpověďmi – toleruje překlepy a diakritiku */
export function matchesAnswer(answer: string, accepted: string[]): boolean {
  const a = normalize(answer);
  if (!a) return false;
  const aCompact = a.replace(/ /g, '');
  return accepted.some((acc) => {
    const n = normalize(acc);
    if (!n) return false;
    const nCompact = n.replace(/ /g, '');
    if (a === n || aCompact === nCompact) return true;
    const tolerance = nCompact.length >= 10 ? 2 : nCompact.length >= 5 ? 1 : 0;
    return levenshtein(aCompact, nCompact) <= tolerance;
  });
}

/** Najde, zda odpověď obsahuje klíčové slovo (stačí shoda kmene; víceslovné musí mít všechna slova) */
export function containsKeyword(tokens: string[], keyword: string): boolean {
  const kwTokens = tokenize(keyword);
  if (!kwTokens.length) return false;
  return kwTokens.every((kw) => {
    const s = stem(kw);
    return tokens.some((t) => t.startsWith(s) || (t.length >= 4 && s.startsWith(t) && t.length >= s.length - 1));
  });
}

export interface PointResult {
  point: KeyPoint;
  hit: boolean;
  matched: string[];
}

/** Vyhodnotí volnou odpověď podle klíčových bodů */
export function evaluatePoints(answer: string, points: KeyPoint[]): { results: PointResult[]; score: number } {
  const tokens = tokenize(answer);
  const results = points.map((point) => {
    const matched = point.keywords.filter((k) => containsKeyword(tokens, k));
    // Ručně psané body (seznamy synonym) stačí trefit jedním slovem, automatické body vyžadují více shod
    const hit = point.keywords.length > 0 && matched.length >= (point.minHits ?? 1);
    return { point, hit, matched };
  });
  const score = points.length ? results.filter((r) => r.hit).length / points.length : 0;
  return { results, score };
}

const STOP = new Set(
  normalize(
    'který která které kterou kterým jejich jeho její protože během mezi podle nebo také však tento tato toto tyto jsou bylo byla byli být jeho svého svoji svými svou sebou jako když kdyby které dílo díla díle dílem autor autora autorem příklad například často zpravidla velmi hlavně především postava postavy postav celého celé celý všechny všech další dalších další jiné jiný jiná takže ještě stále později nakonec potom poté proto přitom oproti zejména přibližně kolem kterých kteří jakož jednotlivé jednotlivých určitý určitá obvykle zároveň včetně hlavní hlavního případně doplň několik několika patřil patří patřila forma literatura literatury století česká český světová převážně mohla mohl může nemůže mnoho velký velká během celý',
  ).split(' '),
);

/** Rozdělí text na věty / části – nedělí za zkratkami („F. Šrámek“, „20. století“, „tzv.“) */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  for (const chunk of text.split(/;|\n/)) {
    let buf = '';
    for (const part of chunk.split(/(?<=\.)\s+/)) {
      buf = buf ? `${buf} ${part}` : part;
      const lastWord = buf.replace(/\.$/, '').split(/\s+/).pop() ?? '';
      const isAbbrev = /^\d+$/.test(lastWord) || lastWord.length <= 2 || /^(tzv|např|stol|vl|jm|pol|resp|mj|tj|aj|atd|str)$/i.test(lastWord);
      if (buf.endsWith('.') && !isAbbrev) {
        out.push(buf.trim());
        buf = '';
      }
    }
    if (buf.trim()) out.push(buf.trim());
  }
  return out.filter(Boolean);
}

/** Automaticky vytvoří klíčové body z delšího textu (věta / středník = jeden bod) */
export function autoPoints(text: string, max = 6): KeyPoint[] {
  if (!text.trim()) return [];
  const segments = splitSentences(text).filter((s) => s.length > 6);
  const points: KeyPoint[] = [];
  for (const seg of segments) {
    const words = tokenize(seg).filter((w) => w.length >= 5 && !STOP.has(w));
    const unique = [...new Set(words)].sort((a, b) => b.length - a.length).slice(0, 4);
    if (!unique.length) continue;
    const minHits = unique.length <= 2 ? 1 : Math.ceil(unique.length * 0.34);
    points.push({ label: seg.length > 110 ? seg.slice(0, 107) + '…' : seg, keywords: unique, minHits });
    if (points.length >= max) break;
  }
  return points;
}

/** Klíčový bod ze seznamu (motivy, postavy) – každá položka = jeden bod */
export function listPoints(items: string[]): KeyPoint[] {
  return items
    .filter(Boolean)
    .map((item) => {
      const main = item.split(/[(:–]/)[0].trim();
      const words = tokenize(main).filter((w) => w.length >= 3 && !STOP.has(w));
      return { label: item, keywords: words.length ? [words.sort((a, b) => b.length - a.length)[0]] : [main] };
    });
}

export function firstSentence(s: string, maxLen = 160): string {
  const m = s.match(/^(.+?[.!?])(\s|$)/);
  const out = (m ? m[1] : s).trim();
  return out.length > maxLen ? out.slice(0, maxLen - 1).trimEnd() + '…' : out;
}

export function truncate(s: string, maxLen: number): string {
  return s.length > maxLen ? s.slice(0, maxLen - 1).trimEnd() + '…' : s;
}
