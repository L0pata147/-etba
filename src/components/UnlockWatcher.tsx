import { useEffect } from 'react';
import { useStore } from '../store';
import { describeUnlock, profileCtx, unlockedKeys } from '../lib/profile';

const KEY = 'maturitni-trener:unlocked';

/** Hlídá nově odemčené rámečky, pozadí a tituly a ohlásí je (poprvé jen tiše uloží současný stav) */
export function UnlockWatcher() {
  const { data, toast } = useStore();
  useEffect(() => {
    if (!data.settings.onboarded) return;
    const t = setTimeout(() => {
      const now = unlockedKeys(profileCtx(data));
      let prev: string[] | null = null;
      try {
        prev = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      } catch {
        prev = null;
      }
      try {
        localStorage.setItem(KEY, JSON.stringify(now));
      } catch {
        /* nevadí */
      }
      if (!prev) return;
      const fresh = now.filter((k) => !prev!.includes(k));
      if (fresh.length) toast(`🎉 Odemčeno: ${fresh.slice(0, 3).map(describeUnlock).join(', ')}${fresh.length > 3 ? ' a další' : ''} – nastav si to v Můj profil.`, 'success');
    }, 1200);
    return () => clearTimeout(t);
  }, [data, toast]);
  return null;
}
