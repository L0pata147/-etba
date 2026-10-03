import { useRef, useState } from 'react';
import { Download, Eye, EyeOff, RotateCcw, Upload } from 'lucide-react';
import type { AppData } from '../types';
import { useStore } from '../store';
import { exportJson, readImportFile } from '../lib/storage';
import { isAndroidApp } from '../lib/native';
import { ReminderSettings } from '../components/ReminderSettings';
import { Button, Card, Modal, PageHeader, Segmented, SectionTitle, Toggle } from '../components/ui';

export function SettingsPage() {
  const { data, updateSettings, replaceAll, resetAll, toast } = useStore();
  const s = data.settings;
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<AppData | null>(null);
  const [confirm, setConfirm] = useState<'progress' | 'all' | null>(null);
  const [showKey, setShowKey] = useState(false);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      setPending(await readImportFile(f));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Import se nezdařil.', 'error');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Nastavení" emoji="⚙️" />

      <Card className="space-y-4 p-5">
        <SectionTitle>Vzhled a učení</SectionTitle>
        <div>
          <div className="label">Motiv</div>
          <Segmented
            value={s.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { value: 'light', label: '☀️ Světlý' },
              { value: 'dark', label: '🌙 Tmavý' },
              { value: 'system', label: '💻 Podle systému' },
            ]}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="set-exam">
              Datum ústní maturity
            </label>
            <input id="set-exam" type="date" className="input" value={s.examDate} onChange={(e) => updateSettings({ examDate: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="set-daily">
              Denní čas na učení
            </label>
            <select id="set-daily" className="input" value={s.dailyMinutes} onChange={(e) => updateSettings({ dailyMinutes: Number(e.target.value) })}>
              {[5, 15, 30, 45, 60].map((m) => (
                <option key={m} value={m}>
                  {m} minut
                </option>
              ))}
            </select>
          </div>
        </div>
        <Toggle checked={s.speechEnabled} onChange={(v) => updateSettings({ speechEnabled: v })} label="Nabízet diktování odpovědí mikrofonem" />
      </Card>

      {isAndroidApp() && (
        <Card className="space-y-3 p-5">
          <SectionTitle>Upozornění</SectionTitle>
          <ReminderSettings />
        </Card>
      )}

      <Card className="space-y-4 p-5">
        <SectionTitle sub="Nepovinné. Bez klíče aplikace funguje, jen bez AI učitele.">AI učitel (Claude API)</SectionTitle>
        <div>
          <label className="label" htmlFor="set-key">
            API klíč
          </label>
          <div className="flex gap-2">
            <input
              id="set-key"
              className="input font-mono"
              type={showKey ? 'text' : 'password'}
              placeholder="sk-ant-…"
              autoComplete="off"
              value={s.aiApiKey}
              onChange={(e) => updateSettings({ aiApiKey: e.target.value })}
            />
            <Button variant="secondary" onClick={() => setShowKey(!showKey)} aria-label={showKey ? 'Skrýt klíč' : 'Zobrazit klíč'}>
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </Button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Klíč je uložen jen v úložišti tohoto prohlížeče a odesílá se pouze do API Anthropic. Není součástí exportu dat. Používej ho jen na svém zařízení.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="set-model">
            Model
          </label>
          <select id="set-model" className="input" value={s.aiModel} onChange={(e) => updateSettings({ aiModel: e.target.value })}>
            <option value="claude-opus-5-5">Claude Opus 5.5 (doporučeno)</option>
            <option value="claude-sonnet-5-5">Claude Sonnet 5.5 (levnější)</option>
          </select>
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <SectionTitle sub="Všechna data (knihy, pokrok, výsledky, poznámky, nastavení) jsou uložena v prohlížeči. Zálohuj si je.">Záloha dat</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Button
            icon={<Download size={18} />}
            onClick={() => {
              const where = exportJson({ ...data, settings: { ...data.settings, aiApiKey: '' } });
              toast(where ? `Záloha uložena: ${where}` : 'Data byla exportována do souboru JSON.', 'success');
            }}
          >
            Exportovat data (JSON)
          </Button>
          <Button variant="secondary" icon={<Upload size={18} />} onClick={() => fileRef.current?.click()}>
            Importovat data
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} data-testid="import-input" />
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <SectionTitle>Obnovení</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => updateSettings({ onboarded: false })}>
            Znovu spustit úvodního průvodce
          </Button>
          <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={() => setConfirm('progress')}>
            Vynulovat pokrok (knihy zůstanou)
          </Button>
          <Button variant="danger" onClick={() => setConfirm('all')}>
            Smazat všechna data
          </Button>
        </div>
      </Card>

      <p className="px-1 text-xs text-slate-500">
        Informace o dílech v databázi slouží k přípravě; nejasnosti vždy ověř se svým vyučujícím nebo v čítance. Cvičné neumělecké texty jsou vytvořeny pro aplikaci.
      </p>

      <Modal open={!!pending} onClose={() => setPending(null)} title="Importovat data?">
        <p>
          Soubor obsahuje <b>{pending?.books.length}</b> knih, <b>{pending?.sessions.length}</b> výsledků testů a <b>{Object.keys(pending?.srs ?? {}).length}</b> záznamů opakování.
        </p>
        <p className="mt-2 text-sm text-rose-600">Současná data v aplikaci budou nahrazena. Doporučujeme je nejdřív exportovat.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setPending(null)}>
            Zrušit
          </Button>
          <Button
            onClick={() => {
              if (pending) {
                replaceAll({ ...pending, settings: { ...pending.settings, aiApiKey: pending.settings.aiApiKey || s.aiApiKey, onboarded: true } });
                toast('Data byla importována.', 'success');
              }
              setPending(null);
            }}
          >
            Importovat
          </Button>
        </div>
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={confirm === 'all' ? 'Smazat všechna data?' : 'Vynulovat pokrok?'}>
        <p>
          {confirm === 'all'
            ? 'Smažou se knihy, poznámky, pokrok, výsledky i nastavení a aplikace se vrátí do výchozího stavu. Tuto akci nelze vrátit.'
            : 'Smaže se pokrok, výsledky testů, opakování, XP a odznaky. Knihy, poznámky a nastavení zůstanou.'}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(null)}>
            Zrušit
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm === 'all') resetAll();
              else replaceAll({ ...data, srs: {}, mastery: {}, sessions: [], activity: {}, unknown: {}, xp: 0, badges: {} });
              toast(confirm === 'all' ? 'Data byla smazána.' : 'Pokrok byl vynulován.');
              setConfirm(null);
            }}
          >
            Potvrdit
          </Button>
        </div>
      </Modal>
    </div>
  );
}
