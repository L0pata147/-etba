import type { AppData } from '../types';
import { isAndroidApp } from './native';
import { enableSync, getSyncStatus, syncAvailable, syncCode, syncNow } from './sync';

/** Kde je vždy nejnovější verze (GitHub Pages) */
export const PAGES_URL = 'https://l0pata147.github.io/-etba/';
export const APP_VERSION = __APP_VERSION__;

export interface UpdateInfo {
  version: string;
  /** Co je nového (krátce) */
  notes?: string[];
  apk?: string;
}

/** 1.10.0 > 1.9.2 */
export function newerVersion(a: string, b: string): boolean {
  const pa = a.split('.').map((x) => parseInt(x, 10) || 0);
  const pb = b.split('.').map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0);
  }
  return false;
}

/** Odkud aplikace běží – podle toho se liší způsob aktualizace */
export function appHost(): 'android' | 'pages' | 'other' {
  if (isAndroidApp()) return 'android';
  if (typeof location !== 'undefined' && location.href.startsWith(PAGES_URL)) return 'pages';
  return 'other';
}

/** Zjistí, jestli na GitHub Pages není novější verze (null = není nebo nejde ověřit) */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(`${PAGES_URL}version.json?t=${Date.now()}`, { cache: 'no-store', signal: ctrl.signal });
    if (!res.ok) return null;
    const info = (await res.json()) as UpdateInfo;
    return typeof info.version === 'string' && newerVersion(info.version, APP_VERSION) ? info : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Načte novou verzi webu (obejde mezipaměť prohlížeče) */
export function reloadToNewVersion(version: string) {
  location.replace(`${location.pathname}?v=${encodeURIComponent(version)}${location.hash}`);
}

export const apkUrl = (info: UpdateInfo) => info.apk ?? `${PAGES_URL}maturitni-trener.apk`;

const DISMISS_KEY = 'maturitni-trener:update-dismissed';
export function dismissedVersion(): string {
  try {
    return localStorage.getItem(DISMISS_KEY) ?? '';
  } catch {
    return '';
  }
}
export function dismissVersion(v: string) {
  try {
    localStorage.setItem(DISMISS_KEY, v);
  } catch {
    /* nevadí */
  }
}

/** Parametr v odkazu, kterým nová verze převezme kód synchronizace */
export const HANDOFF_PARAM = 'pripojit';

/**
 * Otevře novou verzi na GitHub Pages a přenese do ní pokrok:
 * nahraje data na server (případně zapne synchronizaci) a předá kód v odkazu (za #, na server se neposílá).
 * Vrátí false, když se data nepodařilo nahrát – nová verze se pak otevře bez pokroku.
 */
export async function openNewVersionWithProgress(data: AppData): Promise<boolean> {
  // okno otevřít hned (kvůli blokování vyskakovacích oken), adresu doplnit po nahrání
  const win = window.open('about:blank', '_blank');
  let ok = false;
  let code: string | null = null;
  if (syncAvailable()) {
    code = syncCode() ?? enableSync();
    await syncNow(data);
    ok = getSyncStatus().state === 'ok' && getSyncStatus().lastSync > 0;
  }
  const url = ok && code ? `${PAGES_URL}#/?${HANDOFF_PARAM}=${code}` : PAGES_URL;
  if (win) win.location.href = url;
  else location.href = url;
  return ok;
}

/** Při startu: převzít kód synchronizace z odkazu a odstranit ho z adresy */
export function takeHandoffCode(adopt: (code: string) => boolean): boolean {
  try {
    const hash = location.hash;
    const i = hash.indexOf('?');
    if (i < 0) return false;
    const params = new URLSearchParams(hash.slice(i + 1));
    const code = params.get(HANDOFF_PARAM);
    if (!code) return false;
    params.delete(HANDOFF_PARAM);
    const rest = params.toString();
    history.replaceState(history.state, '', `${location.pathname}${location.search}${hash.slice(0, i)}${rest ? `?${rest}` : ''}`);
    return adopt(code);
  } catch {
    return false;
  }
}
