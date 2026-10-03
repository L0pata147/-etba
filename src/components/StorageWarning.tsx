import { useState } from 'react';
import { storageAvailable } from '../lib/storage';

/** Upozornění, když okno nedovoluje ukládat (např. náhled souboru v jiné aplikaci) */
export function StorageWarning() {
  const [ok] = useState(storageAvailable);
  const [hidden, setHidden] = useState(false);
  if (ok || hidden) return null;
  return (
    <div role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
      <b>Tady se tvůj pokrok neuloží.</b> Aplikaci máš otevřenou v náhledu, který nedovoluje ukládat data – po zavření okna se všechno ztratí. Ulož si soubor{' '}
      <i>maturitni-trener.html</i> do počítače nebo telefonu a otevři ho v prohlížeči (Chrome, Edge, Safari, Firefox): na počítači pravým tlačítkem → Otevřít v programu → prohlížeč,
      na telefonu přes „Otevřít v…“ → Chrome / Safari.
      <button className="ml-2 font-semibold underline" onClick={() => setHidden(true)}>
        Rozumím
      </button>
    </div>
  );
}
