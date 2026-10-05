import type { AppData, Settings } from '../types';
import { BOOK_DATABASE, DEFAULT_LIST_IDS, emptyBook, seedToBook } from '../data/books';
import { saveFileNative } from './native';

export const STORAGE_KEY = 'maturitni-trener:data';
export const DATA_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  examDate: '',
  dailyMinutes: 15,
  onboarded: false,
  aiApiKey: '',
  aiModel: 'claude-opus-5-5',
  speechEnabled: true,
  reminderEnabled: false,
  reminderTime: '18:00',
};

export function defaultData(): AppData {
  const books = DEFAULT_LIST_IDS.map((id, i) => {
    const seed = BOOK_DATABASE.find((b) => b.id === id)!;
    return seedToBook(seed, { createdAt: Date.now() + i });
  });
  return {
    version: DATA_VERSION,
    books,
    srs: {},
    mastery: {},
    sessions: [],
    activity: {},
    unknown: {},
    xp: 0,
    badges: {},
    plan: null,
    settings: { ...DEFAULT_SETTINGS },
    writings: [],
    topicNotes: {},
    progressHistory: {},
  };
}

/** Doplní chybějící pole (starší export, ruční úpravy) */
export function migrate(raw: unknown): AppData {
  if (!raw || typeof raw !== 'object') throw new Error('Soubor neobsahuje platná data.');
  const r = raw as Partial<AppData>;
  if (!Array.isArray(r.books)) throw new Error('V souboru chybí seznam knih.');
  const base = defaultData();
  return {
    version: DATA_VERSION,
    books: r.books.map((b) => ({
      ...emptyBook(),
      ...b,
      motifs: b.motifs ?? [],
      mainCharacters: b.mainCharacters ?? [],
      sideCharacters: b.sideCharacters ?? [],
      plotEvents: b.plotEvents ?? [],
      otherWorks: b.otherWorks ?? [],
      quick: b.quick ?? [],
      clues: b.clues ?? [],
      scenes: b.scenes ?? [],
      deepQuestions: b.deepQuestions ?? [],
    })),
    srs: r.srs ?? {},
    mastery: r.mastery ?? {},
    sessions: r.sessions ?? [],
    activity: r.activity ?? {},
    unknown: Object.fromEntries(Object.entries(r.unknown ?? {}).map(([k, v]) => [k, { ...v, correctStreak: v.correctStreak ?? 0 }])),
    xp: r.xp ?? 0,
    badges: r.badges ?? {},
    plan: r.plan ?? null,
    settings: { ...base.settings, ...(r.settings ?? {}) },
    writings: Array.isArray(r.writings) ? r.writings : [],
    topicNotes: r.topicNotes && typeof r.topicNotes === 'object' ? r.topicNotes : {},
    lastExport: r.lastExport,
    progressHistory: r.progressHistory && typeof r.progressHistory === 'object' ? r.progressHistory : {},
  };
}

/** Lze v tomto okně trvale ukládat data? (v uzavřených náhledech souborů ne) */
export function storageAvailable(): boolean {
  try {
    const k = `${STORAGE_KEY}:test`;
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function loadData(): AppData {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    return migrate(JSON.parse(raw));
  } catch (e) {
    console.error('Nepodařilo se načíst data', e);
    // Poškozená data neztrácíme – uložíme zálohu, aby je šlo obnovit
    try {
      if (raw) localStorage.setItem(`${STORAGE_KEY}:backup-${Date.now()}`, raw);
    } catch {
      /* úložiště nedostupné */
    }
    return defaultData();
  }
}

export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Nepodařilo se uložit data', e);
    return false;
  }
}

/** Vrátí umístění souboru, pokud ho uložila Android aplikace; jinak spustí stažení v prohlížeči */
export function exportJson(data: AppData): string | null {
  const json = JSON.stringify({ app: 'maturitni-trener', exportedAt: new Date().toISOString(), ...data }, null, 2);
  const name = `maturitni-trener-${new Date().toISOString().slice(0, 10)}.json`;
  const nativePath = saveFileNative(name, json);
  if (nativePath) return nativePath;
  const blob = new Blob([json], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return null;
}

export async function readImportFile(file: File): Promise<AppData> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Soubor není platný JSON.');
  }
  return migrate(parsed);
}
