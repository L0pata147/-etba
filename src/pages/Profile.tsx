import { useMemo } from 'react';
import { Check, Lock } from 'lucide-react';
import { useStore } from '../store';
import type { Profile as ProfileT } from '../types';
import { AVATARS } from '../data/avatars';
import { BADGES } from '../lib/insights';
import { DEFAULT_PROFILE, FRAMES, TITLES, myProfile, profileCtx } from '../lib/profile';
import { levelFromXp, levelName } from '../lib/progress';
import { Avatar } from '../components/Avatar';
import { Button, Card, PageHeader, SectionTitle, cx } from '../components/ui';

/** Můj profil – profilovka, rámeček, titul a vitrína, které vidí kamarádi */
export function ProfilePage() {
  const { data, updateSettings } = useStore();
  const ctx = useMemo(() => profileCtx(data), [data]);
  const profile = myProfile(data);
  const raw = data.settings.profile ?? DEFAULT_PROFILE;
  const name = data.settings.group?.name ?? 'Ty';
  const lvl = levelFromXp(data.xp);
  const earned = new Set(Object.keys(data.badges));
  const set = (patch: Partial<ProfileT>) => updateSettings({ profile: { ...raw, ...patch } });

  const toggleShowcase = (id: string) => {
    const cur = profile.showcase;
    if (cur.includes(id)) set({ showcase: cur.filter((x) => x !== id) });
    else if (cur.length < 3) set({ showcase: [...cur, id] });
  };

  return (
    <div>
      <PageHeader title="Můj profil" sub="Takhle tě uvidí kamarádi ve skupině. Rámečky a tituly si odemykáš učením." />

      {/* náhled */}
      <Card className="mb-6 flex items-center gap-5 overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-6 text-white">
        <Avatar name={name} avatar={profile.avatar} frame={profile.frame} size="xl" />
        <div className="min-w-0">
          <div className="truncate font-display text-2xl font-bold">{name}</div>
          <div className="text-brand-100">{TITLES.find((t) => t.id === profile.title)?.label}</div>
          <div className="mt-1 text-sm text-brand-200">
            Úroveň {lvl.level} · {levelName(lvl.level)} · {data.xp} XP
          </div>
          {profile.showcase.length > 0 && (
            <div className="mt-2 flex gap-1.5">
              {profile.showcase.map((id) => {
                const b = BADGES.find((x) => x.id === id);
                return b ? (
                  <span key={id} title={b.label} className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-lg">
                    {b.emoji}
                  </span>
                ) : null;
              })}
            </div>
          )}
          {!data.settings.group && (
            <Button size="sm" to="/kamaradi" className="mt-3 !bg-white !text-brand-800">
              Přidat se do skupiny
            </Button>
          )}
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-5">
          <SectionTitle sub={AVATARS.length ? 'Vyber si profilovku.' : 'Profilovky se brzy objeví – zatím máš svoje iniciály.'}>Profilovka</SectionTitle>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
            <Choice selected={!profile.avatar} onClick={() => set({ avatar: '' })} label="Iniciály">
              <Avatar name={name} size="md" />
            </Choice>
            {AVATARS.map((a) => (
              <Choice key={a.id} selected={profile.avatar === a.id} onClick={() => set({ avatar: a.id })} label={a.id}>
                <Avatar name={name} avatar={a.id} size="md" />
              </Choice>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle sub="Rámeček kolem profilovky. Zamčené se odemknou, až splníš podmínku.">Rámeček</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            <Choice selected={!profile.frame} onClick={() => set({ frame: '' })} label="Bez rámečku">
              <Avatar name={name} avatar={profile.avatar} size="md" />
            </Choice>
            {FRAMES.map((f) => {
              const open = f.check(ctx);
              return (
                <Choice key={f.id} selected={profile.frame === f.id} locked={!open} onClick={() => open && set({ frame: f.id })} label={f.label} hint={open ? undefined : f.how}>
                  <Avatar name={name} avatar={profile.avatar} frame={f.id} size="md" className={cx(!open && 'opacity-40 grayscale')} />
                </Choice>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle sub="Titul se ukazuje pod tvým jménem.">Titul</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {TITLES.map((t) => {
              const open = t.check(ctx);
              const sel = profile.title === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={!open}
                  onClick={() => set({ title: t.id })}
                  className={cx(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-left ring-1 transition',
                    sel ? 'bg-brand-500/10 ring-brand-500' : 'ring-slate-200 hover:bg-slate-900/[0.03] dark:ring-white/10 dark:hover:bg-white/[0.04]',
                    !open && 'cursor-not-allowed opacity-50',
                  )}
                >
                  {open ? <Check size={16} className={cx('shrink-0', sel ? 'text-brand-600 dark:text-brand-300' : 'text-transparent')} /> : <Lock size={16} className="shrink-0 text-slate-400" />}
                  <span className="min-w-0">
                    <span className="block font-semibold">{t.label}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{t.how}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle sub={`Vyber až 3 odznaky, které uvidí kamarádi (${profile.showcase.length}/3).`}>Vitrína</SectionTitle>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
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
                  <span className="text-xl">{b.emoji}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{b.label}</span>
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{has ? (sel ? 've vitríně' : 'získáno') : b.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Choice({ selected, locked, onClick, label, hint, children }: { selected: boolean; locked?: boolean; onClick: () => void; label: string; hint?: string; children: React.ReactNode }) {
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
    </button>
  );
}
