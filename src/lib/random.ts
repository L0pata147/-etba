export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function sample<T>(arr: readonly T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

/** Vybere n prvků bez opakování podle vah (Efraimidis–Spirakis, O(n log n)) */
export function weightedSample<T>(items: readonly T[], weights: readonly number[], n: number): T[] {
  return items
    .map((item, i) => ({ item, key: Math.log(Math.random()) / Math.max(0.0001, weights[i]) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, n)
    .map((x) => x.item);
}

/** Unikátní hodnoty (podle normalizovaného textu), bez prázdných */
export function uniqueStrings(values: string[], exclude: string[] = []): string[] {
  const seen = new Set(exclude.map((v) => v.trim().toLowerCase()));
  const out: string[] = [];
  for (const v of values) {
    const k = v.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(v.trim());
  }
  return out;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
