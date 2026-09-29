import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AnswerResult, AppData, Book, Question, SessionRecord, Settings, StudyPlan } from './types';
import { defaultData, loadData, saveData } from './lib/storage';
import { dayKey, gradeFromScore, masteryKey, questionBookIds, updateMastery, updateSrs } from './lib/progress';
import { BADGES } from './lib/insights';

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
  setBooks: (books: Book[]) => void;
  recordAnswer: (q: Question, r: AnswerResult) => void;
  recordSession: (rec: SessionRecord, bonusXp?: number) => void;
  addUnknown: (q: Question) => void;
  removeUnknown: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setPlan: (plan: StudyPlan | null) => void;
  replaceAll: (data: AppData) => void;
  resetAll: () => void;
  toasts: Toast[];
  toast: (text: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
}

const Ctx = createContext<Store | null>(null);

function withBadges(d: AppData, notify: (t: string) => void): AppData {
  let badges = d.badges;
  for (const b of BADGES) {
    if (!badges[b.id] && b.check(d)) {
      badges = { ...badges, [b.id]: Date.now() };
      notify(`${b.emoji} Nový odznak: ${b.label}`);
    }
  }
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
          return {
            ...d,
            srs: { ...d.srs, [q.id]: updateSrs(d.srs[q.id], grade, now) },
            mastery,
            unknown,
            activity: {
              ...d.activity,
              [today]: {
                questions: day.questions + 1,
                correct: day.correct + (score >= 0.7 ? 1 : 0),
                seconds: day.seconds + Math.min(600, Math.max(0, Math.round(r.seconds))),
              },
            },
            xp: d.xp + 2 + Math.round(8 * score),
          };
        }),
      recordSession: (rec, bonusXp = 20) => update((d) => ({ ...d, sessions: [rec, ...d.sessions].slice(0, 300), xp: d.xp + bonusXp }), true),
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
      replaceAll: (next) => update(() => next, true),
      resetAll: () => update(() => defaultData()),
    }),
    [data, toasts, toast, dismissToast, update],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore musí být uvnitř StoreProvider');
  return s;
}
