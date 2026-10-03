import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useStore } from '../store';
import { androidBridge, applyReminder } from '../lib/native';
import { Button, Toggle } from './ui';

/** Nastavení denní připomínky – jen v Android aplikaci */
export function ReminderSettings({ compact }: { compact?: boolean }) {
  const { data, updateSettings, toast } = useStore();
  const bridge = androidBridge();
  const { reminderEnabled, reminderTime } = data.settings;
  const [allowed, setAllowed] = useState(() => bridge?.notificationsAllowed() ?? false);

  useEffect(() => {
    const onResult = (e: Event) => {
      const granted = Boolean((e as CustomEvent<boolean>).detail);
      setAllowed(granted);
      if (!granted) toast('Bez povolení upozornění ti připomínky nepřijdou. Povolíš je v Nastavení telefonu → Aplikace → Maturitní trenér.', 'error');
    };
    window.addEventListener('android-notifications', onResult);
    return () => window.removeEventListener('android-notifications', onResult);
  }, [toast]);

  if (!bridge) return null;

  const set = (enabled: boolean, time = reminderTime) => {
    updateSettings({ reminderEnabled: enabled, reminderTime: time });
    applyReminder(enabled, time);
    if (enabled && !bridge.notificationsAllowed()) bridge.requestNotificationPermission();
    if (enabled) toast(`Připomínka nastavena na ${time}.`, 'success');
  };

  return (
    <div className="space-y-3">
      <Toggle
        checked={reminderEnabled}
        onChange={(v) => set(v)}
        label={
          <span className="inline-flex items-center gap-1.5">
            {reminderEnabled ? <Bell size={15} /> : <BellOff size={15} />} Připomínat mi učení každý den
          </span>
        }
      />
      {reminderEnabled && (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor="reminder-time">
              Čas připomínky
            </label>
            <input id="reminder-time" type="time" className="input w-auto" value={reminderTime} onChange={(e) => e.target.value && set(true, e.target.value)} />
          </div>
          {!compact && (
            <Button
              variant="secondary"
              onClick={() => {
                if (!bridge.notificationsAllowed()) bridge.requestNotificationPermission();
                else bridge.testNotification();
              }}
            >
              Vyzkoušet upozornění
            </Button>
          )}
        </div>
      )}
      {reminderEnabled && !allowed && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Upozornění zatím nejsou povolená.{' '}
          <button className="font-semibold underline" onClick={() => bridge.requestNotificationPermission()}>
            Povolit
          </button>
        </p>
      )}
      {!compact && (
        <p className="text-xs text-slate-500">
          Připomínka přijde jen ve dny, kdy ses ještě neučil(a), a řekne ti, co je dnes na řadě. Před maturitou ti navíc připomene, kolik dní zbývá. Vše běží v telefonu, bez internetu.
        </p>
      )}
    </div>
  );
}
