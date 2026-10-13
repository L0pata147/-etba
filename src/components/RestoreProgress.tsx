import { useRef, useState, useSyncExternalStore } from 'react';
import { History, Link2, Upload } from 'lucide-react';
import { useStore } from '../store';
import { getSyncStatus, joinSync, subscribeSync, syncAvailable, syncCode } from '../lib/sync';
import { readImportFile } from '../lib/storage';
import { Button, Card } from './ui';

/** Na úvodní obrazovce: obnovit pokrok z jiného zařízení / starší verze (kód synchronizace nebo záloha) */
export function RestoreProgress() {
  const { runSync, replaceAll, toast } = useStore();
  const status = useSyncExternalStore(subscribeSync, getSyncStatus);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  // kód převzatý z odkazu při přechodu na novou verzi – data se právě stahují
  if (syncCode() && status.state !== 'error') {
    return (
      <Card className="mb-4 flex items-center gap-3 p-4">
        <History size={20} className="shrink-0 animate-pulse text-brand-600 dark:text-brand-300" />
        <div className="text-sm">
          <div className="font-semibold">Stahuji tvůj pokrok…</div>
          <div className="text-slate-500 dark:text-slate-400">Za chvíli se načte z ostatních zařízení.</div>
        </div>
      </Card>
    );
  }

  const join = async () => {
    setBusy(true);
    try {
      await joinSync(code);
      runSync();
      toast('Pokrok se stahuje…', 'success');
    } catch (e) {
      toast(e instanceof TypeError ? 'Server je nedostupný – zkontroluj připojení.' : (e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const importFile = async (f: File) => {
    try {
      const d = await readImportFile(f);
      replaceAll({ ...d, settings: { ...d.settings, onboarded: true } });
      toast('Záloha obnovena.', 'success');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  return (
    <Card className="mb-4 p-4">
      <button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => setOpen((o) => !o)}>
        <History size={20} className="shrink-0 text-brand-600 dark:text-brand-300" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold">Už aplikaci používáš? Obnov svůj pokrok</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Z jiného zařízení nebo starší verze – kódem synchronizace nebo ze zálohy.</div>
        </div>
      </button>
      {open && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {syncAvailable() && (
            <div>
              <label htmlFor="restore-code" className="label">
                Kód synchronizace
              </label>
              <input id="restore-code" className="input font-mono uppercase tracking-wider" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" spellCheck={false} />
              <Button size="sm" className="mt-2" icon={<Link2 size={16} />} onClick={join} disabled={busy || !code.trim()}>
                {busy ? 'Připojuji…' : 'Připojit a stáhnout pokrok'}
              </Button>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Najdeš ho ve staré verzi v Nastavení → Synchronizace.</p>
            </div>
          )}
          <div>
            <div className="label">Záloha (soubor .json)</div>
            <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
            <Button size="sm" variant="secondary" icon={<Upload size={16} />} onClick={() => file.current?.click()}>
              Nahrát zálohu
            </Button>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Zálohu vytvoříš ve staré verzi v Nastavení → Záloha dat → Exportovat.</p>
          </div>
        </div>
      )}
    </Card>
  );
}
