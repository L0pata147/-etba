import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Check, Lock, Pencil } from 'lucide-react';
import { useStore } from '../store';
import type { Profile as ProfileT } from '../types';
import { AVATARS } from '../data/avatars';
import { BADGES } from '../lib/insights';
import { groupStats } from '../lib/group';
import { BANNERS, DEFAULT_PROFILE, FRAMES, MOTTO_MAX, TITLES, cleanMotto, isUnlocked, myProfile, profileCtx, unlockProgress, type ProfileCtx, type Unlockable } from '../lib/profile';
import { Avatar } from '../components/Avatar';
import { ProfileHero, ProfileStats } from '../components/ProfileCard';
import { Button, Card, PageHeader, SectionTitle, cx } from '../components/ui';

type Tab = 'vzhled' | 'titul' | 'vitrina' | 'statistiky';

/** Můj profil – profilovka, rámeček, pozadí, titul, motto a vitrína, které vidí kamarádi */
export function ProfilePage() {
  const { data, updateSettings } = useStore();
  const ctx = useMemo(() => profileCtx(data), [data]);
  const profile = myProfile(data);
  const raw = { ...DEFAULT_PROFILE, ...data.settings.profile };
  const g = data.settings.group;
  const name = g?.name ?? 'Ty';
  const earned = new Set(Object.keys(data.badges));
  const set = (patch: Partial<ProfileT>) => updateSettings({ profile: { ...raw, ...patch } });
  const [tab, setTab] = useState<Tab>('vzhled');

  const toggleShowcase = (id: string) => {
    const cur = profile.showcase;
    if (cur.includes(id)) set({ showcase: cur.filter((x) => x !== id) });
    else if (cur.length < 3) set({ showcase: [...cur, id] });
  };

  const count = (list: Unlockable[], c: ProfileCtx) => list.filter((x) => isUnlocked(x, c)).length;
  const tabs: { id: Tab; label: string }[] = [
    { id: 'vzhled', label: 'Vzhled' },
    { id: 'titul', label: `Titul a motto (${count(TITLES, ctx)}/${TITLES.length})` },
    { id: 'vitrina', label: `Vitrína (${profile.showcase.length}/3)` },
    { id: 'statistiky', label: 'Statistiky' },
  ];

  return (
    <div>
      <PageHeader title="Můj profil" sub="Takhle tě uvidí kamarádi ve skupině. Rámečky, pozadí a tituly si odemykáš učením." />

      <Card className="mb-5 overflow-hidden">
        <ProfileHero name={name} profile={profile} xp={data.xp}>
          {g ? <NameEditor name={g.name} onSave={(n) => updateSettings({ group: { ...g, name: n } })} /> : (
            <Button size="sm" to="/kamaradi" className="!bg-white !text-brand-800">
              Přidat se do skupiny
            </Button>
          )}
        </ProfileHero>
      </Card>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-slate-900/[0.05] p-1 dark:bg-white/[0.06]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cx('shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition', tab === t.id ? 'bg-white font-semibold text-brand-800 shadow-sm dark:bg-ink dark:text-brand-200' : 'text-slate-600 dark:text-slate-400')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'vzhled' && (
        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle sub={AVATARS.length ? 'Vyber si profilovku.' : 'Profilovky se brzy objeví – zatím máš svoje iniciály.'}>Profilovka</SectionTitle>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
              <Choice selected={!profile.avatar} onClick={() => set({ avatar: '' })} label="Iniciály">
                <Avatar name={name} size="md" frame={profile.frame} />
              </Choice>
              {AVATARS.map((a) => (
                <Choice key={a.id} selected={profile.avatar === a.id} onClick={() => set({ avatar: a.id })} label={a.id}>
                  <Avatar name={name} avatar={a.id} frame={profile.frame} size="md" />
                </Choice>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle sub={`Rámeček kolem profilovky – odemčeno ${count(FRAMES, ctx)} z ${FRAMES.length}.`}>Rámeček</SectionTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              <Choice selected={!profile.frame} onClick={() => set({ frame: '' })} label="Bez rámečku">
                <Avatar name={name} avatar={profile.avatar} size="md" />
              </Choice>
              {FRAMES.map((f) => {
                const open = isUnlocked(f, ctx);
                return (
                  <Choice key={f.id} selected={profile.frame === f.id} locked={!open} onClick={() => open && set({ frame: f.id })} label={f.label} hint={open ? undefined : f.how} progress={open ? undefined : unlockProgress(f, ctx)}>
                    <Avatar name={name} avatar={profile.avatar} frame={f.id} size="md" className={cx(!open && 'opacity-40 grayscale')} />
                  </Choice>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle sub={`Pozadí tvé profilové karty – odemčeno ${count(BANNERS, ctx)} z ${BANNERS.length}.`}>Pozadí</SectionTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {BANNERS.map((b) => {
                const open = isUnlocked(b, ctx);
                const sel = profile.banner === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    disabled={!open}
                    onClick={() => set({ banner: b.id })}
                    aria-pressed={sel}
                    className={cx('overflow-hidden rounded-2xl text-left ring-1 transition', sel ? 'ring-2 ring-brand-500' : 'ring-slate-200 dark:ring-white/10', !open && 'cursor-not-allowed')}
                  >
                    <div className={cx('flex h-16 items-end p-2', b.bg, !open && 'opacity-35 grayscale')}>
                      {sel && <Check size={16} className="text-white" />}
                    </div>
                    <div className="p-2">
                      <div className="flex items-center gap-1 text-sm font-semibold">
                        {!open && <Lock size={12} className="text-slate-400" />}
                        {b.label}
                      </div>
                      {!open && (
                        <>
                          <div className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">{b.how}</div>
                          <MiniProgress value={unlockProgress(b, ctx)} />
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === 'titul' && (
        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle sub={`Krátký status pod tvým jménem, nejvýš ${MOTTO_MAX} znaků.`}>Motto</SectionTitle>
            <MottoEditor value={raw.motto ?? ''} onSave={(m) => set({ motto: m })} />
          </Card>
          <Card className="p-5">
            <SectionTitle sub="Titul se ukazuje pod tvým jménem. Zamčené ukazují, kolik ti ještě chybí.">Titul</SectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {TITLES.map((t) => {
                const open = isUnlocked(t, ctx);
                const sel = profile.title === t.id;
                const goal = t.goal?.(ctx);
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={!open}
                    onClick={() => set({ title: t.id })}
                    className={cx(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-left ring-1 transition',
                      sel ? 'bg-brand-500/10 ring-brand-500' : 'ring-slate-200 hover:bg-slate-900/[0.03] dark:ring-white/10 dark:hover:bg-white/[0.04]',
                      !open && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    {open ? <Check size={16} className={cx('shrink-0', sel ? 'text-brand-600 dark:text-brand-300' : 'text-transparent')} /> : <Lock size={16} className="shrink-0 text-slate-400" />}
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{t.label}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">{t.how}</span>
                      {!open && goal && (
                        <span className="mt-1 flex items-center gap-2">
                          <MiniProgress value={unlockProgress(t, ctx)} />
                          <span className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400">
                            {Math.min(goal[0], goal[1])}/{goal[1]}
                          </span>
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === 'vitrina' && (
        <Card className="p-5">
          <SectionTitle sub={`Vyber až 3 odznaky, které uvidí kamarádi. Získáno ${BADGES.filter((b) => earned.has(b.id)).length} z ${BADGES.length}.`}>Vitrína</SectionTitle>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {BADGES.map((b) => {
              const has = earned.has(b.id);
              const sel = profile.showcase.includes(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  disabled={!has || (!sel && profile.showcase.length >= 3)}
                  onClick={() => toggleShowcase(b.id)}
                  className={cx(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left ring-1 transition disabled:cursor-not-allowed',
                    sel ? 'bg-brand-500/10 ring-brand-500' : 'ring-slate-200 dark:ring-white/10',
                    !has && 'opacity-40 grayscale',
                  )}
                >
                  <span className="text-2xl">{b.emoji}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{b.label}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{has ? (sel ? 've vitríně ✓' : 'získáno – klikni a dej do vitríny') : b.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {tab === 'statistiky' && (
        <Card className="p-5">
          <SectionTitle sub="Tohle uvidí kamarádi na tvé kartě.">Statistiky</SectionTitle>
          <ProfileStats stats={groupStats(data)} />
        </Card>
      )}
    </div>
  );
}

function MiniProgress({ value }: { value: number }) {
  return (
    <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
      <span className="block h-full rounded-full bg-brand-500" style={{ width: `${Math.round(value * 100)}%` }} />
    </span>
  );
}

function Choice({ selected, locked, onClick, label, hint, progress, children }: { selected: boolean; locked?: boolean; onClick: () => void; label: string; hint?: string; progress?: number; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={hint}
      className={cx('flex flex-col items-center gap-1.5 rounded-2xl p-2.5 ring-1 transition', selected ? 'bg-brand-500/10 ring-2 ring-brand-500' : 'ring-slate-200 hover:bg-slate-900/[0.03] dark:ring-white/10 dark:hover:bg-white/[0.04]', locked && 'cursor-not-allowed')}
    >
      {children}
      <span className="flex items-center gap-1 text-center text-xs font-semibold">
        {locked && <Lock size={11} className="text-slate-400" />}
        {label}
      </span>
      {hint && <span className="text-center text-[10px] leading-tight text-slate-500 dark:text-slate-400">{hint}</span>}
      {progress !== undefined && <MiniProgress value={progress} />}
    </button>
  );
}

function MottoEditor({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const clean = cleanMotto(v);
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input className="input flex-1" maxLength={MOTTO_MAX} value={v} onChange={(e) => setV(e.target.value)} placeholder="např. Do května to dám!" aria-label="Motto" />
      <div className="flex gap-2">
        <Button onClick={() => onSave(clean)} disabled={clean === value}>
          Uložit
        </Button>
        {value && (
          <Button variant="ghost" onClick={() => onSave('')}>
            Smazat
          </Button>
        )}
      </div>
    </div>
  );
}

function NameEditor({ name, onSave }: { name: string; onSave: (n: string) => void }) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(name);
  if (!edit)
    return (
      <button type="button" onClick={() => setEdit(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-sm font-semibold backdrop-blur hover:bg-white/25">
        <Pencil size={14} /> Změnit přezdívku
      </button>
    );
  const ok = v.trim().length >= 1 && v.trim().length <= 30;
  return (
    <div className="flex max-w-sm gap-2">
      <input className="input flex-1 !text-slate-900 dark:!text-white" maxLength={30} value={v} onChange={(e) => setV(e.target.value)} aria-label="Přezdívka" autoFocus />
      <Button
        size="sm"
        className="!bg-white !text-brand-800"
        disabled={!ok}
        onClick={() => {
          onSave(v.trim());
          setEdit(false);
        }}
      >
        Uložit
      </Button>
    </div>
  );
}
