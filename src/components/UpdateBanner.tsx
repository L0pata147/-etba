import { useEffect, useState } from 'react';
import { Download, RefreshCw, Sparkles, X } from 'lucide-react';
import { PAGES_URL, apkUrl, appHost, checkForUpdate, dismissVersion, dismissedVersion, reloadToNewVersion, type UpdateInfo } from '../lib/update';
import { Button } from './ui';

const EVERY = 3 * 60 * 60 * 1000;

/** Lišta s nabídkou nové verze – kontroluje se při spuštění, při návratu do aplikace a každé 3 hodiny */
export function UpdateBanner() {
  const [info, setInfo] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    let last = 0;
    const run = () => {
      if (Date.now() - last < EVERY) return;
      last = Date.now();
      void checkForUpdate().then((u) => u && u.version !== dismissedVersion() && setInfo(u));
    };
    run();
    const onVisible = () => document.visibilityState === 'visible' && run();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  if (!info) return null;
  const host = appHost();

  return (
    <div className="mb-5 rounded-2xl bg-brand-500/10 p-4 ring-1 ring-brand-500/30" role="status">
      <div className="flex items-start gap-3">
        <Sparkles size={20} className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-300" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold">Je k dispozici nová verze {info.version}</div>
          {info.notes && info.notes.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-sm text-slate-600 dark:text-slate-300">
              {info.notes.slice(0, 4).map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
          {host === 'android' && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Stáhne se nové APK – otevři ho a dej Aktualizovat. Pokrok zůstane.</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {host === 'pages' && (
              <Button size="sm" icon={<RefreshCw size={16} />} onClick={() => reloadToNewVersion(info.version)}>
                Aktualizovat teď
              </Button>
            )}
            {host === 'android' && (
              <Button size="sm" icon={<Download size={16} />} onClick={() => (location.href = apkUrl(info))}>
                Stáhnout aktualizaci
              </Button>
            )}
            {host === 'other' && (
              <Button size="sm" icon={<RefreshCw size={16} />} onClick={() => window.open(PAGES_URL, '_blank')}>
                Otevřít novou verzi
              </Button>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-label="Skrýt"
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-900/5 dark:hover:bg-white/10"
          onClick={() => {
            dismissVersion(info.version);
            setInfo(null);
          }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
