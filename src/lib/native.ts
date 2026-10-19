import type { AppData } from '../types';
import { itRecommendations, recommendations } from './insights';
import { questionOfDay, questionOfDayText } from './qotd';
import { AREA_MAP } from '../data/osnova';
import { dayKey, dueCount, streak } from './progress';
import { friendsActiveToday } from './group';
import { SYNC_KEY, SYNC_URL } from './syncConfig';

/** Rozhraní, které poskytuje Android aplikace (window.AndroidBridge) */
interface AndroidBridge {
  version(): number;
  notificationsAllowed(): boolean;
  requestNotificationPermission(): void;
  setReminder(enabled: boolean, hour: number, minute: number): void;
  updateStatus(json: string): void;
  testNotification(): void;
  saveFile(name: string, content: string): string;
  /** od verze 1.26: uloží obrázek (base64 PNG) do Stažených souborů */
  saveImage?(name: string, base64: string): string;
  /** od verze 1.37: otevře systémový tisk (i uložení do PDF) aktuální stránky */
  print?(title: string): void;
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
  const itRec = itRecommendations(data, 1)[0];
  // Střídej doporučení z literatury a z IT předmětů podle dne
  const useIt = !!itRec && (!rec || new Date().getDate() % 2 === 0);
  return {
    lastStudyDay: days[days.length - 1] ?? '',
    today: dayKey(),
    streak: streak(data),
    due: dueCount(data),
    unknown: Object.keys(data.unknown).length,
    minutes: data.settings.dailyMinutes,
    examDate: data.settings.examDate,
    rec: useIt ? itRec.topic.title : rec ? `${rec.book.title} – ${AREA_MAP[rec.area].short.toLowerCase()}` : '',
    qotd: questionOfDayText(questionOfDay(data)),
    // kamarádi pro text připomínky (Android si je v čas připomínky načte znovu ze serveru)
    friends: data.settings.group ? friendsActiveToday(data.settings.group.code).map((f) => f.name) : [],
    friendsDay: dayKey(),
    group: data.settings.group && SYNC_URL && SYNC_KEY ? { url: SYNC_URL, key: SYNC_KEY, code: data.settings.group.code, member: data.settings.group.member } : null,
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

/** Uloží obrázek přes Android (Stažené soubory); vrátí umístění nebo null, když to verze aplikace neumí */
export function saveImageNative(name: string, base64: string): string | null {
  const b = androidBridge();
  if (!b || typeof b.saveImage !== 'function') return null;
  return b.saveImage(name, base64) || null;
}

/** Tisk / uložení do PDF: v Android aplikaci přes systémový tisk, jinak tisk prohlížeče. Vrátí false, když tisk nejde otevřít. */
export function printPage(title: string): boolean {
  const b = androidBridge();
  if (b && typeof b.print === 'function') {
    b.print(title);
    return true;
  }
  if (b) return false; // starší Android aplikace tisk neumí
  // název dokumentu = výchozí název PDF souboru
  const prev = document.title;
  document.title = title;
  try {
    window.print();
  } finally {
    setTimeout(() => (document.title = prev), 1000);
  }
  return true;
}
