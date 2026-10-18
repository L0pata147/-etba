/** Klikací trénink Windows Serveru – typy úloh a vyhodnocení kroků (bez UI) */

export type ClickKind = 'menu' | 'list' | 'tree' | 'context' | 'tabs' | 'buttons' | 'radio' | 'check' | 'input' | 'shot';

export interface ClickStep {
  /** Titulek okna, ve kterém se krok odehrává */
  window: string;
  kind: ClickKind;
  /** Co má uživatel v kroku udělat */
  ask: string;
  /** Položky, které jsou v okně vidět (skutečné popisky) */
  options?: string[];
  /** Správná položka; u kind 'check' všechny položky, které mají být zaškrtnuté */
  answer: string | string[];
  /** Strom: už rozbalené nadřazené uzly */
  path?: string[];
  /** Strom: na uzel se kliká pravým tlačítkem (otevře se místní nabídka) */
  right?: boolean;
  /** Vstup: popisek pole */
  label?: string;
  /** Vstup: přijímané hodnoty ('*' = cokoli neprázdného) */
  accept?: string[];
  /** Vysvětlení po chybném kliknutí */
  hint?: string;
  /** Snímek obrazovky (id souboru) a místa, kam je správné kliknout – v pixelech snímku 1024 × 768 */
  shot?: string;
  spots?: [number, number, number, number][];
}

export interface ClickTask {
  id: string;
  title: string;
  goal: string;
  group: string;
  /** Úloha ze skutečných snímků z hodiny */
  shots?: boolean;
  steps: ClickStep[];
}

export const SHOT_W = 1024;
export const SHOT_H = 768;

/** Normalizace zadané hodnoty: velikost písmen, mezery a uvozovky nehrají roli */
export const normalizeClickInput = (s: string) => s.trim().replace(/["„“]/g, '').replace(/\s+/g, ' ').toLowerCase();

export function checkInput(step: ClickStep, value: string): boolean {
  const v = normalizeClickInput(value);
  if (!v) return false;
  return (step.accept ?? []).some((a) => a === '*' || normalizeClickInput(a) === v);
}

export function checkChoice(step: ClickStep, value: string): boolean {
  return typeof step.answer === 'string' && step.answer === value;
}

export function checkChecks(step: ClickStep, values: string[]): boolean {
  const want = new Set(Array.isArray(step.answer) ? step.answer : [step.answer]);
  return values.length === want.size && values.every((v) => want.has(v));
}

/** Kliknutí do snímku: x, y v pixelech snímku; kolem cíle je malá rezerva kvůli mobilu */
export function checkShot(step: ClickStep, x: number, y: number, pad = 10): boolean {
  return (step.spots ?? []).some(([sx, sy, w, h]) => x >= sx - pad && x <= sx + w + pad && y >= sy - pad && y <= sy + h + pad);
}

/** Popis správné odpovědi do souhrnu */
export function answerLabel(step: ClickStep): string {
  if (step.kind === 'input') return `${step.label ?? ''} ${step.accept?.[0] === '*' ? '(libovolný název)' : (step.accept?.[0] ?? '')}`.trim();
  return Array.isArray(step.answer) ? step.answer.join(' + ') : step.answer;
}

/** Skóre úlohy: podíl kroků splněných napoprvé */
export const clickScore = (mistakes: number[]) => (mistakes.length ? mistakes.filter((m) => m === 0).length / mistakes.length : 0);
