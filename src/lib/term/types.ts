/** Společné typy simulovaných terminálů (Linux, Cisco IOS) */

export interface TermResult {
  /** Řádky výstupu */
  out: string[];
  /** Otevřít editor souboru (nano/vim) */
  editor?: { path: string; content: string };
  /** Vymazat obrazovku */
  clear?: boolean;
}

export interface CheckItem {
  label: string;
  ok: boolean;
}

export interface Simulator {
  prompt(): string;
  exec(line: string): TermResult;
  /** Uložení souboru z editoru (jen Linux) */
  saveFile?(path: string, content: string): string | null;
}

export interface TermTask<S extends Simulator = Simulator> {
  id: string;
  title: string;
  /** Zadání */
  goal: string;
  /** Kroky zadání (seznam pod zadáním) */
  steps: string[];
  /** Postupné nápovědy */
  hints: string[];
  /** Vzorové řešení */
  solution: string;
  create(): S;
  check(s: S): CheckItem[];
}
