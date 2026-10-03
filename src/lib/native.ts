import type { AppData } from '../types';
import { recommendations } from './insights';
import { AREA_MAP } from '../data/osnova';
import { dayKey, dueCount, streak } from './progress';

/** Rozhraní, které poskytuje Android aplikace (window.AndroidBridge) */
interface AndroidBridge {
  version(): number;
  notificationsAllowed(): boolean;
  requestNotificationPermission(): void;
  setReminder(enabled: boolean, hour: number, minute: number): void;
  updateStatus(json: string): void;
  testNotification(): void;
  saveFile(name: string, content: string): string;
}

export function androidBridge(): AndroidBridge | null {
  const b = (window as unknown as { AndroidBridge?: AndroidBridge }).AndroidBridge;
  return b && typeof b.setReminder === 'function' ? b : null;
}

export const isAndroidApp = () => androidBridge() !== null;

/** Stav učení, ze kterého Android sestaví text upozornění (série, doporučení…) */
export function buildNativeStatus(data: AppData) {
  const days = Object.keys(data.activity)
    .filter((k) => data.activity[k].questions > 0)
    .sort();
  const rec = recommendations(data, 1)[0];
  return {
    lastStudyDay: days[days.length - 1] ?? '',
    today: dayKey(),
    streak: streak(data),
    due: dueCount(data),
    unknown: Object.keys(data.unknown).length,
    minutes: data.settings.dailyMinutes,
    examDate: data.settings.examDate,
    rec: rec ? `${rec.book.title} – ${AREA_MAP[rec.area].short.toLowerCase()}` : '',
  };
}

export function syncNative(data: AppData) {
  const b = androidBridge();
  if (!b) return;
  try {
    b.updateStatus(JSON.stringify(buildNativeStatus(data)));
  } catch (e) {
    console.error('Synchronizace s Androidem selhala', e);
  }
}

export function applyReminder(enabled: boolean, time: string) {
  const b = androidBridge();
  if (!b) return;
  const [h, m] = time.split(':').map((x) => Number(x));
  b.setReminder(enabled, Number.isFinite(h) ? h : 18, Number.isFinite(m) ? m : 0);
}

/** Uloží soubor přes Android (Stažené soubory); vrátí umístění nebo null */
export function saveFileNative(name: string, content: string): string | null {
  const b = androidBridge();
  if (!b) return null;
  return b.saveFile(name, content) || null;
}
