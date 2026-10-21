import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { syncCode, syncNow } from './lib/sync';
import { autoPublish, cachedGroup, groupStats, subscribeGroupCache } from './lib/group';
import type { AnswerResult, AppData, Book, ContestLog, Question, SessionRecord, Settings, StudyPlan, Writing } from './types';
import { defaultData, loadData, saveData } from './lib/storage';
import { dayKey, gradeFromScore, masteryKey, questionBookIds, updateMastery, updateSrs } from './lib/progress';
import { BADGES, CONTEST_BADGES, PLATINUM, subjectProgress } from './lib/insights';
import { applyReminder, syncNative } from './lib/native';
import { addXp, applyContests, contestLog, contestMessages } from './lib/arena';
import { cachedContests, settleDaily, settleDuels, settleWeek, subscribeContests } from './lib/contests';

export interface Toast {
  id: number;
  text: string;
  tone?: 'success' | 'info' | 'error';
}

interface Store {
  data: AppData;
  addBook: (b: Book) => void;
  updateBook: (id: string, patch: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  /** Vymění knihu v seznamu za jinou na stejném místě (i ve studijním plánu) */
  replaceBook: (oldId: string, b: Book) => void;
  setBooks: (books: Book[]) => void;
  recordAnswer: (q: Question, r: AnswerResult) => void;
  recordSession: (rec: SessionRecord, bonusXp?: number) => void;
  /** Zapíše výsledky soutěží (nové výhry přidají bonusové XP) */
  recordContests: (patch: Partial<ContestLog>) => void;
  addUnknown: (q: Question) => void;
  removeUnknown: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setPlan: (plan: StudyPlan | null) => void;
  saveWriting: (w: Writing) => void;
  deleteWriting: (id: string) => void;
  setTopicNote: (id: string, text: string) => void;
  markExported: () => void;
  replaceAll: (data: AppData) => void;
  /** Okamžitá synchronizace s ostatními zařízeními */
  runSync: () => void;
  resetAll: () => void;
  toasts: Toast[];
  toast: (text: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
}

const Ctx = createContext<Store | null>(null);

function withBadges(d: AppData, notify: (t: string) => void): AppData {
  let badges = d.badges;
  const fresh: typeof BADGES = [];
  for (const b of [...BADGES, ...CONTEST_BADGES]) {
    if (!badges[b.id] && b.check(d)) {
      badges = { ...badges, [b.id]: Date.now() };
      fresh.push(b);
    }
  }
  if (!badges[PLATINUM.id] && PLATINUM.check({ ...d, badges })) {
    badges = { ...badges, [PLATINUM.id]: Date.now() };
    fresh.push(PLATINUM);
  }
  // víc odznaků najednou (např. po aktualizaci aplikace) = jedno upozornění
  if (fresh.length === 1) notify(`${fresh[0].emoji} Nový odznak: ${fresh[0].label}`);
  else if (fresh.length > 1) notify(`🏅 ${fresh.length} nových odznaků: ${fresh.slice(0, 3).map((b) => `${b.emoji} ${b.label}`).join(', ')}${fresh.length > 3 ? '…' : ''}`);
  return badges === d.badges ? d : { ...d, badges };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const first = useRef(true);

  const toast = useCallback((text: string, tone: Toast['tone'] = 'info') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  // Ukládání při každé změně
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!saveData(data)) toast('Data se nepodařilo uložit (plné úložiště prohlížeče?).', 'error');
  }, [data, toast]);

  // Android aplikace: při spuštění obnovit naplánovanou připomínku (vynucené zastavení ji smaže)
  useEffect(() => {
    if (data.settings.reminderEnabled) applyReminder(true, data.settings.reminderTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- jen jednou při startu
  }, []);

  // Android aplikace: stav učení pro text upozornění (s malým zpožděním, ať se nepočítá při každém kliknutí)
  useEffect(() => {
    const t = setTimeout(() => syncNative(data), 1500);
    return () => clearTimeout(t);
  }, [data]);
  // nový žebříček kamarádů → aktualizovat text připomínky
  useEffect(() => subscribeGroupCache(() => syncNative(dataRef.current)), []);

  // Synchronizace mezi zařízeními (Supabase): při startu, po změnách, při návratu do aplikace a každých 5 minut
  const dataRef = useRef(data);
  dataRef.current = data;
  const runSync = useCallback(() => {
    if (!syncCode()) return;
    void syncNow(dataRef.current).then((merged) => {
      if (merged) setData(merged);
    });
  }, []);
  useEffect(() => {
    runSync();
    const onVisible = () => document.visibilityState === 'visible' && runSync();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', runSync);
    const timer = setInterval(() => document.visibilityState === 'visible' && runSync(), 5 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', runSync);
      clearInterval(timer);
    };
  }, [runSync]);
  useEffect(() => {
    const t = setTimeout(runSync, 4000);
    return () => clearTimeout(t);
  }, [data, runSync]);

  // Skupina kamarádů: odeslat souhrn pokroku (po změnách s prodlevou)
  useEffect(() => {
    const t = setTimeout(() => void autoPublish(dataRef.current), 8000);
    return () => clearTimeout(t);
  }, [data]);

  // Synchronizace mezi záložkami
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'maturitni-trener:data' && e.newValue) setData(loadData());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback(
    (fn: (d: AppData) => AppData, checkBadges = false) => {
      setData((d) => {
        const next = fn(d);
        return checkBadges ? withBadges(next, (t) => setTimeout(() => toast(t, 'success'), 0)) : next;
      });
    },
    [toast],
  );

  // Soutěže: zapsat výhry z posledního žebříčku (týdenní výzva), kvízů dne a duelů
  const announced = useRef(new Set<string>());
  const settle = useCallback(() => {
    const d = dataRef.current;
    const g = d.settings.group;
    if (!g) return;
    const log = contestLog(d);
    const c = cachedContests(g.code);
    const rows = cachedGroup(g.code)?.rows;
    const patch: Partial<ContestLog> = {
      daily: c?.daily ? settleDaily(log, c.daily) : {},
      duels: c?.duels ? settleDuels(log, c.duels) : {},
      weeks: rows ? settleWeek(log, rows.map((r) => (r.me ? { ...r, stats: groupStats(d) } : r))) : {},
    };
    if (!Object.values(patch).some((x) => Object.keys(x).length)) return;
    for (const m of contestMessages(log, patch)) {
      if (announced.current.has(m)) continue;
      announced.current.add(m);
      toast(m, 'success');
    }
    update((x) => applyContests(x, patch), true);
  }, [toast, update]);
  useEffect(() => subscribeContests(settle), [settle]);
  useEffect(() => subscribeGroupCache(settle), [settle]);

  // nové odznaky (např. po aktualizaci aplikace) přidělit hned při spuštění, ne až po dalším tréninku
  useEffect(() => {
    const t = setTimeout(() => update((d) => d, true), 1500);
    return () => clearTimeout(t);
  }, [update]);

  const store = useMemo<Store>(
    () => ({
      data,
      toasts,
      toast,
      dismissToast,
      addBook: (b) => update((d) => ({ ...d, books: [...d.books, b] })),
      updateBook: (id, patch) =>
        update((d) => ({ ...d, books: d.books.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: Date.now() } : b)) }), true),
      deleteBook: (id) =>
        update((d) => ({
          ...d,
          books: d.books.filter((b) => b.id !== id),
          plan: d.plan ? { ...d.plan, weeks: d.plan.weeks.map((w) => ({ ...w, bookIds: w.bookIds.filter((x) => x !== id) })) } : null,
        })),
      replaceBook: (oldId, nb) =>
        update((d) => ({
          ...d,
          books: d.books.map((b) => (b.id === oldId ? nb : b)),
          plan: d.plan ? { ...d.plan, weeks: d.plan.weeks.map((w) => ({ ...w, bookIds: w.bookIds.map((x) => (x === oldId ? nb.id : x)) })) } : null,
        })),
      setBooks: (books) => update((d) => ({ ...d, books })),
      recordAnswer: (q, r) =>
        update((d) => {
          const now = Date.now();
          const grade = r.confidence ?? gradeFromScore(r.score);
          const score = r.confidence ? { good: 1, hard: 0.5, again: 0 }[r.confidence] : r.score;
          const mastery = { ...d.mastery };
          for (const bid of questionBookIds(q)) {
            const key = masteryKey(bid, q.area);
            mastery[key] = updateMastery(mastery[key], score, now);
          }
          const today = dayKey(now);
          const day = d.activity[today] ?? { questions: 0, correct: 0, seconds: 0 };
          const unknown = { ...d.unknown };
          const existing = unknown[q.id];
          if (r.dontKnow || score < 0.5) {
            unknown[q.id] = { question: q, addedAt: existing?.addedAt ?? now, correctStreak: 0 };
          } else if (existing && score >= 0.85) {
            if (existing.correctStreak + 1 >= 2) delete unknown[q.id];
            else unknown[q.id] = { ...existing, correctStreak: existing.correctStreak + 1 };
          }
          const next: AppData = {
            ...d,
            srs: { ...d.srs, [q.id]: updateSrs(d.srs[q.id], grade, now) },
            mastery,
            unknown,
            activity: {
              ...d.activity,
              [today]: {
                ...day,
                questions: day.questions + 1,
                correct: day.correct + (score >= 0.7 ? 1 : 0),
                seconds: day.seconds + Math.min(600, Math.max(0, Math.round(r.seconds))),
              },
            },
          };
          return addXp(next, 2 + Math.round(8 * score), now);
        }),
      recordSession: (rec, bonusXp = 20) =>
        update((d) => {
          const next = addXp({ ...d, sessions: [rec, ...d.sessions].slice(0, 300) }, bonusXp);
          // denní snímek zvládnutí předmětů (pro graf a odhad)
          return { ...next, progressHistory: { ...d.progressHistory, [dayKey()]: subjectProgress(next) } };
        }, true),
      recordContests: (patch) => update((d) => applyContests(d, patch), true),
      addUnknown: (q) =>
        update((d) => ({ ...d, unknown: { ...d.unknown, [q.id]: { question: q, addedAt: Date.now(), correctStreak: 0 } } })),
      removeUnknown: (id) =>
        update((d) => {
          const unknown = { ...d.unknown };
          delete unknown[id];
          return { ...d, unknown };
        }),
      updateSettings: (patch) => update((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
      setPlan: (plan) => update((d) => ({ ...d, plan })),
      saveWriting: (w) => update((d) => ({ ...d, writings: [w, ...d.writings.filter((x) => x.id !== w.id)].slice(0, 100) })),
      deleteWriting: (id) => update((d) => ({ ...d, writings: d.writings.filter((x) => x.id !== id) })),
      setTopicNote: (id, text) =>
        update((d) => {
          const topicNotes = { ...d.topicNotes };
          if (text.trim()) topicNotes[id] = text;
          else delete topicNotes[id];
          return { ...d, topicNotes };
        }),
      markExported: () => update((d) => ({ ...d, lastExport: Date.now() })),
      replaceAll: (next) => update(() => next, true),
      runSync,
      resetAll: () => update(() => defaultData()),
    }),
    [data, toasts, toast, dismissToast, update, runSync],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore musí být uvnitř StoreProvider');
  return s;
}
