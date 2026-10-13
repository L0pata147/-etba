import type { AppData } from '../types';
import { forUpload, mergeData } from './merge';
import { migrate } from './storage';
import { SYNC_KEY, SYNC_URL } from './syncConfig';

/** Stav synchronizace uložený v zařízení */
interface SyncState {
  code: string;
  version: number;
  lastSync: number;
}

export type SyncStatus = { state: 'off' | 'syncing' | 'ok' | 'error' | 'offline'; lastSync: number; message: string };

const STATE_KEY = 'maturitni-trener:sync';
const BASE_KEY = 'maturitni-trener:sync-base';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 24;
export const SYNC_ALPHABET = ALPHABET;

export const syncAvailable = (): boolean => !!SYNC_URL && !!SYNC_KEY;

function readState(): SyncState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as SyncState) : null;
  } catch {
    return null;
  }
}
function writeState(s: SyncState | null) {
  try {
    if (s) localStorage.setItem(STATE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STATE_KEY);
  } catch {
    /* úložiště nedostupné */
  }
}
function readBase(): AppData | null {
  try {
    const raw = localStorage.getItem(BASE_KEY);
    return raw ? migrate(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
function writeBase(d: AppData | null) {
  try {
    if (d) localStorage.setItem(BASE_KEY, JSON.stringify(d));
    else localStorage.removeItem(BASE_KEY);
  } catch {
    /* plné úložiště – příště se sloučí bez základu */
  }
}

// ---------- stav pro obrazovku Nastavení ----------
let status: SyncStatus = { state: readState() ? 'ok' : 'off', lastSync: readState()?.lastSync ?? 0, message: '' };
const listeners = new Set<() => void>();
function setStatus(s: Partial<SyncStatus>) {
  status = { ...status, ...s };
  listeners.forEach((l) => l());
}
export const getSyncStatus = () => status;
export function subscribeSync(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export const syncCode = () => readState()?.code ?? null;

/** Nový náhodný kód (120 bitů) */
export function newCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('');
}
/** Kód z uživatelského vstupu (mezery, pomlčky, malá písmena) */
export const normalizeCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
export const formatCode = (c: string) => c.match(/.{1,4}/g)?.join('-') ?? c;

export async function rpc<T>(fn: string, body: unknown): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(`${SYNC_URL.replace(/\/$/, '')}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      // nové klíče (sb_publishable_…) jdou jen v hlavičce apikey, starý anon JWT i jako Bearer
      headers: { apikey: SYNC_KEY, ...(SYNC_KEY.startsWith('eyJ') ? { Authorization: `Bearer ${SYNC_KEY}` } : {}), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const known: Record<string, string> = {
        too_large: 'Data jsou na synchronizaci příliš velká.',
        group_full: 'Skupina je plná (max. 100 členů).',
        invalid_name: 'Přezdívka musí mít 1–30 znaků.',
        invalid_group: 'Neplatný kód skupiny.',
      };
      const hit = Object.keys(known).find((k) => text.includes(k));
      if (!hit && res.status === 404) throw new Error('Na serveru chybí funkce – je potřeba spustit SQL v Supabase.');
      throw new Error(hit ? known[hit] : `Server odpověděl chybou ${res.status}.`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

let running: Promise<AppData | null> | null = null;

/**
 * Sloučí místní data se serverem a nahraje výsledek.
 * Vrátí sloučená data, pokud se místní stav změnil (jinak null).
 */
export function syncNow(local: AppData): Promise<AppData | null> {
  if (running) return running;
  running = doSync(local).finally(() => {
    running = null;
  });
  return running;
}

async function doSync(local: AppData): Promise<AppData | null> {
  const st = readState();
  if (!st || !syncAvailable()) return null;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    setStatus({ state: 'offline', message: 'Bez připojení – synchronizuje se, až budeš online.' });
    return null;
  }
  setStatus({ state: 'syncing', message: '' });
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const remote = await rpc<{ data: unknown; version: number } | null>('sync_get', { p_code: st.code });
      const remoteData = remote ? migrate(remote.data) : null;
      const merged = remoteData ? mergeData(readBase(), local, remoteData) : local;
      const upload = forUpload(merged);
      const needsUpload = !remoteData || JSON.stringify(upload) !== JSON.stringify(forUpload(remoteData));
      let version = remote?.version ?? 0;
      if (needsUpload) {
        const put = await rpc<{ ok: boolean; version: number }>('sync_put', { p_code: st.code, p_data: upload, p_expected_version: version });
        if (!put.ok) continue; // mezitím uložilo jiné zařízení → načíst znovu a sloučit
        version = put.version;
      }
      const now = Date.now();
      writeBase(upload);
      writeState({ ...st, version, lastSync: now });
      setStatus({ state: 'ok', lastSync: now, message: '' });
      return JSON.stringify(merged) === JSON.stringify(local) ? null : merged;
    }
    throw new Error('Data se mezitím měnila na jiném zařízení, zkus to znovu.');
  } catch (e) {
    const offline = e instanceof TypeError || (e as Error).name === 'AbortError';
    setStatus({ state: offline ? 'offline' : 'error', message: offline ? 'Server je nedostupný – zkusí se to znovu později.' : (e as Error).message });
    return null;
  }
}

/** Zapne synchronizaci s novým kódem (první zařízení) */
export function enableSync(): string {
  const code = newCode();
  writeState({ code, version: 0, lastSync: 0 });
  writeBase(null);
  setStatus({ state: 'ok', lastSync: 0, message: '' });
  return code;
}

/** Připojí zařízení ke kódu z jiného zařízení – při první synchronizaci se data sloučí */
export async function joinSync(code: string): Promise<boolean> {
  const c = normalizeCode(code);
  if (c.length !== CODE_LENGTH) throw new Error(`Kód musí mít ${CODE_LENGTH} znaků.`);
  const remote = await rpc<{ data: unknown; version: number } | null>('sync_get', { p_code: c });
  if (!remote) throw new Error('S tímto kódem zatím žádná data nejsou. Zkontroluj, že je opsaný správně.');
  writeState({ code: c, version: 0, lastSync: 0 });
  writeBase(null);
  setStatus({ state: 'ok', lastSync: 0, message: '' });
  return true;
}

/** Vypne synchronizaci na tomto zařízení (data na serveru zůstanou) */
export function disableSync() {
  writeState(null);
  writeBase(null);
  setStatus({ state: 'off', lastSync: 0, message: '' });
}
