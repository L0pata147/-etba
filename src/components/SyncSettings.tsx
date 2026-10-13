import { useState, useSyncExternalStore } from 'react';
import { CloudOff, Copy, Link2, RefreshCw, Smartphone } from 'lucide-react';
import { useStore } from '../store';
import { disableSync, enableSync, formatCode, getSyncStatus, joinSync, subscribeSync, syncAvailable, syncCode } from '../lib/sync';
import { Button, Card, Modal, SectionTitle, cx, relativeDays } from './ui';

/** Nastavení synchronizace pokroku mezi zařízeními */
export function SyncSettings() {
  const { runSync, toast } = useStore();
  const status = useSyncExternalStore(subscribeSync, getSyncStatus);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  if (!syncAvailable()) return null;
  const code = syncCode();

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(formatCode(code));
      toast('Kód zkopírován.', 'success');
    } catch {
      toast('Kopírování nejde – opiš kód ručně.', 'info');
    }
  };

  const join = async () => {
    setBusy(true);
    try {
      await joinSync(input);
      setInput('');
      runSync();
      toast('Zařízení je propojené – pokrok se sloučí.', 'success');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const stateText = {
    off: 'Vypnuto',
    syncing: 'Synchronizuji…',
    ok: status.lastSync ? `Synchronizováno ${relativeDays(status.lastSync)} v ${new Date(status.lastSync).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}` : 'Čeká na první synchronizaci',
    error: 'Chyba synchronizace',
    offline: 'Offline',
  }[status.state];

  return (
    <Card className="space-y-4 p-5">
      <SectionTitle sub="Stejný pokrok na mobilu i na počítači. Sloučí se odpovědi ze všech zařízení, nic se nepřepíše.">Synchronizace mezi zařízeními</SectionTitle>

      {code ? (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={cx('h-2.5 w-2.5 rounded-full', status.state === 'ok' ? 'bg-emerald-500' : status.state === 'syncing' ? 'animate-pulse bg-brand-400' : status.state === 'error' ? 'bg-rose-500' : 'bg-amber-500')} />
            <span className="font-semibold">{stateText}</span>
            {status.message && <span className="text-slate-500 dark:text-slate-400">– {status.message}</span>}
          </div>
          <div>
            <div className="label">Kód tvých zařízení</div>
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded-xl bg-slate-900/[0.05] px-3 py-2.5 font-mono text-[15px] tracking-wider dark:bg-white/[0.06]">{formatCode(code)}</code>
              <Button size="sm" variant="secondary" icon={<Copy size={16} />} onClick={copy}>
                Kopírovat
              </Button>
            </div>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Na druhém zařízení otevři Nastavení → Synchronizace → „Mám kód“ a zadej ho. Kód nikomu neposílej, kdo ho zná, vidí tvůj pokrok.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" icon={<RefreshCw size={16} />} onClick={runSync} disabled={status.state === 'syncing'}>
              Synchronizovat teď
            </Button>
            <Button size="sm" variant="ghost" icon={<CloudOff size={16} />} onClick={() => setConfirmOff(true)}>
              Vypnout na tomto zařízení
            </Button>
          </div>
        </>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-slate-900/[0.03] p-4 ring-1 ring-slate-200/70 dark:bg-white/[0.03] dark:ring-white/[0.06]">
            <div className="flex items-center gap-2 font-semibold">
              <Smartphone size={18} className="text-brand-600 dark:text-brand-300" /> První zařízení
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Vytvoří kód a nahraje tvůj pokrok.</p>
            <Button
              size="sm"
              className="mt-3"
              onClick={() => {
                enableSync();
                runSync();
              }}
            >
              Zapnout synchronizaci
            </Button>
          </div>
          <div className="rounded-xl bg-slate-900/[0.03] p-4 ring-1 ring-slate-200/70 dark:bg-white/[0.03] dark:ring-white/[0.06]">
            <label htmlFor="sync-code" className="flex items-center gap-2 font-semibold">
              <Link2 size={18} className="text-brand-600 dark:text-brand-300" /> Mám kód z jiného zařízení
            </label>
            <input id="sync-code" className="input mt-2 font-mono uppercase tracking-wider" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" value={input} onChange={(e) => setInput(e.target.value)} autoComplete="off" spellCheck={false} />
            <Button size="sm" className="mt-3" onClick={join} disabled={busy || !input.trim()}>
              {busy ? 'Připojuji…' : 'Připojit a sloučit pokrok'}
            </Button>
          </div>
        </div>
      )}

      <Modal open={confirmOff} onClose={() => setConfirmOff(false)} title="Vypnout synchronizaci?">
        <p className="text-slate-600 dark:text-slate-300">Pokrok v tomto zařízení zůstane, jen se přestane sdílet s ostatními. Znovu se můžeš kdykoli připojit stejným kódem – proto si ho předtím zkopíruj.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmOff(false)}>
            Zrušit
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              disableSync();
              setConfirmOff(false);
            }}
          >
            Vypnout
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
