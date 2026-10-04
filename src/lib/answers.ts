import type { FillQuestion } from '../types';
import { matchesAnswer } from './text';

/** Normalizace příkazu: malá písmena, bez sudo, uvozovek a nadbytečných mezer */
export function normalizeCommand(s: string): string {
  return s
    .trim()
    .replace(/^\$\s*/, '')
    .replace(/^sudo\s+/i, '')
    .replace(/["'„“]/g, '')
    .replace(/\s*,\s*/g, ',')
    .replace(/\s+/g, ' ')
    .replace(/;$/, '')
    .toLowerCase();
}

/** Přesné porovnání (adresy, čísla) – jen velikost písmen a mezery okolo */
const normalizeExact = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

/** Vyhodnotí odpověď na doplňovací otázku podle jejího typu */
export function checkFillAnswer(q: FillQuestion, value: string): boolean {
  if (!value.trim()) return false;
  if (q.command) {
    const v = normalizeCommand(value);
    if (q.accepted.some((a) => normalizeCommand(a) === v)) return true;
    if (q.required?.length) return q.required.every((t) => v.includes(normalizeCommand(t)));
    return false;
  }
  const v = normalizeExact(value);
  if (q.exact) return q.accepted.some((a) => normalizeExact(a) === v);
  // doslovná shoda (i pro odpovědi jen ze symbolů, např. „::“)
  if (q.accepted.some((a) => normalizeExact(a) === v)) return true;
  return matchesAnswer(value, q.accepted);
}
