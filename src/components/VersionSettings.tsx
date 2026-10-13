import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useStore } from '../store';
import { APP_VERSION, apkUrl, appHost, checkForUpdate, openNewVersionWithProgress, reloadToNewVersion } from '../lib/update';
import { Button, Card, SectionTitle } from './ui';

/** Verze aplikace a ruční kontrola aktualizací */
export function VersionSettings() {
  const { data, toast } = useStore();
  const [busy, setBusy] = useState(false);
  const check = async () => {
    setBusy(true);
    const u = await checkForUpdate();
    setBusy(false);
    if (!u) {
      toast(navigator.onLine === false ? 'Bez připojení – zkus to online.' : 'Máš nejnovější verzi.', 'info');
      return;
    }
    const host = appHost();
    if (host === 'pages') reloadToNewVersion(u.version);
    else if (host === 'android') location.href = apkUrl(u);
    else if (!(await openNewVersionWithProgress(data))) toast('Pokrok se nepodařilo přenést – v nové verzi zadej kód synchronizace nebo importuj zálohu.', 'error');
  };
  return (
    <Card className="flex flex-wrap items-center gap-3 p-5">
      <div className="flex-1">
        <SectionTitle sub="Aplikace sama hlídá nové verze a nabídne aktualizaci.">Verze {APP_VERSION}</SectionTitle>
      </div>
      <Button size="sm" variant="secondary" icon={<RefreshCw size={16} className={busy ? 'animate-spin' : ''} />} onClick={check} disabled={busy}>
        Zkontrolovat aktualizace
      </Button>
    </Card>
  );
}
