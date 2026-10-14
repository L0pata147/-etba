import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { describeUnlock, profileCtx, unlockedKeys } from '../lib/profile';
import { levelFromXp, levelName } from '../lib/progress';
import { Button, Modal } from './ui';

const KEY = 'maturitni-trener:unlocked';
const LEVEL_KEY = 'maturitni-trener:level';

const read = <T,>(k: string): T | null => {
  try {
    return JSON.parse(localStorage.getItem(k) ?? 'null') as T | null;
  } catch {
    return null;
  }
};
const write = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* nevadí */
  }
};

const CONFETTI = ['#f43f5e', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#fde047'];

/**
 * Hlídá novou úroveň (oslava s konfetami) a nově odemčené rámečky, pozadí, barvy a tituly.
 * Poprvé jen tiše uloží současný stav, aby po aktualizaci nevyskočila záplava upozornění.
 */
export function UnlockWatcher({ paused = false }: { paused?: boolean }) {
  const { data, toast } = useStore();
  const [party, setParty] = useState<{ level: number; unlocks: string[] } | null>(null);

  useEffect(() => {
    // během tréninku nerušit – oslava i upozornění počkají na konec
    if (!data.settings.onboarded || paused) return;
    const t = setTimeout(() => {
      const now = unlockedKeys(profileCtx(data));
      const level = levelFromXp(data.xp).level;
      const prev = read<string[]>(KEY);
      const prevLevel = read<number>(LEVEL_KEY);
      write(KEY, now);
      write(LEVEL_KEY, level);
      const fresh = prev ? now.filter((k) => !prev.includes(k)) : [];
      if (prevLevel !== null && level > prevLevel) setParty({ level, unlocks: fresh });
      else if (fresh.length) toast(`🎉 Odemčeno: ${fresh.slice(0, 3).map(describeUnlock).join(', ')}${fresh.length > 3 ? ' a další' : ''} – nastav si to v Můj profil.`, 'success');
    }, 1200);
    return () => clearTimeout(t);
  }, [data, toast, paused]);

  if (!party) return null;
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
        {Array.from({ length: 60 }, (_, i) => (
          <span
            key={i}
            className="confetti absolute top-[-20px] block h-3 w-2 rounded-sm"
            style={{ left: `${(i * 37) % 100}%`, background: CONFETTI[i % CONFETTI.length], animationDelay: `${(i % 12) * 0.12}s`, animationDuration: `${2.4 + (i % 5) * 0.35}s` }}
          />
        ))}
      </div>
      <Modal open onClose={() => setParty(null)} title="Nová úroveň!">
        <div className="text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 font-display text-4xl font-bold text-white shadow-lg">{party.level}</div>
          <div className="mt-3 font-display text-2xl font-bold">Úroveň {party.level}</div>
          <div className="text-slate-500 dark:text-slate-400">{levelName(party.level)}</div>
          {party.unlocks.length > 0 && (
            <div className="mt-4 rounded-xl bg-slate-900/[0.04] p-3 text-left text-sm dark:bg-white/[0.05]">
              <div className="mb-1 font-semibold">Odemčeno:</div>
              <ul className="list-disc space-y-0.5 pl-5">
                {party.unlocks.map((u) => (
                  <li key={u}>{describeUnlock(u)}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-5 flex justify-center gap-2">
            {party.unlocks.length > 0 && (
              <Button to="/profil" variant="secondary" onClick={() => setParty(null)}>
                Do profilu
              </Button>
            )}
            <Button onClick={() => setParty(null)}>Super!</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
