import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Check, Copy, Eye, EyeOff, Lock, Pencil, QrCode as QrIcon, Share2 } from 'lucide-react';
import { useStore } from '../store';
import type { Profile as ProfileT } from '../types';
import { AVATARS } from '../data/avatars';
import { BADGES, PLATINUM, badgeFamily, badgeTier, type BadgeDef } from '../lib/insights';
import { cachedGroup, formatGroupCode, groupStats } from '../lib/group';
import {
  BANNERS,
  DEFAULT_PROFILE,
  FRAMES,
  HIDEABLE,
  MOTTO_MAX,
  NAME_COLORS,
  STATUSES,
  TITLES,
  WEEKLY_GOALS,
  cleanMotto,
  displayName,
  isUnlocked,
  myProfile,
  profileCtx,
  unlockProgress,
  type ProfileCtx,
  type Unlockable,
} from '../lib/profile';
import { shareProfileCard } from '../lib/shareCard';
import { PAGES_URL } from '../lib/update';
import { Avatar } from '../components/Avatar';
import { ColoredName, ProfileHero, ProfileStats } from '../components/ProfileCard';
import { QrCode } from '../components/QrCode';
import { Button, Card, Modal, PageHeader, SectionTitle, Toggle, cx, formatDate } from '../components/ui';

type Tab = 'vzhled' | 'titul' | 'trofeje' | 'statistiky' | 'nastaveni';

const FAMILY_LABEL: Record<string, string> = { serie: 'Série dní', otazky: 'Odpovědi', cas: 'Čas učení', uroven: 'Úroveň', simulace: 'Simulace ústní', perfekt: 'Bez chyby' };
const TIER_STYLE = ['', 'from-amber-700 to-orange-400', 'from-slate-300 to-slate-500', 'from-yellow-200 to-amber-500'];
const TIER_LABEL = ['', 'Bronz', 'Stříbro', 'Zlato'];

/** Můj profil – vzhled, titul, trofeje, statistiky a nastavení profilu, který vidí kamarádi */
export function ProfilePage() {
  const { data, updateSettings, toast } = useStore();
  const ctx = useMemo(() => profileCtx(data), [data]);
  const profile = myProfile(data);
  const raw = { ...DEFAULT_PROFILE, ...data.settings.profile };
  const g = data.settings.group;
  const name = displayName(data);
  const stats = useMemo(() => groupStats(data), [data]);
  const set = (patch: Partial<ProfileT>) => updateSettings({ profile: { ...raw, ...patch } });
  const [tab, setTab] = useState<Tab>('vzhled');
  const [qr, setQr] = useState(false);
  const [sharing, setSharing] = useState(false);

  const count = (list: Unlockable[], c: ProfileCtx) => list.filter((x) => isUnlocked(x, c)).length;
  const allBadges = [...BADGES, PLATINUM];
  const earnedCount = allBadges.filter((b) => data.badges[b.id]).length;
  const tabs: { id: Tab; label: string }[] = [
    { id: 'vzhled', label: 'Vzhled' },
    { id: 'titul', label: `Titul a motto (${count(TITLES, ctx)}/${TITLES.length})` },
    { id: 'trofeje', label: `Trofeje (${earnedCount}/${allBadges.length})` },
    { id: 'statistiky', label: 'Statistiky' },
    { id: 'nastaveni', label: 'Nastavení' },
  ];

  const share = async () => {
    setSharing(true);
    try {
      const r = await shareProfileCard(name, profile, stats);
      if (r !== 'shared' && r !== 'cancelled') toast(r, 'success');
    } catch (e) {
      toast((e as Error).message || 'Obrázek se nepodařilo vytvořit.', 'error');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div>
      <PageHeader title="Můj profil" sub="Takhle tě uvidí kamarádi ve skupině. Rámečky, pozadí, barvy a tituly si odemykáš učením." />

      <Card className="mb-5 overflow-hidden">
        <ProfileHero name={name} profile={profile} xp={data.xp} week={stats.week}>
          <div className="flex flex-wrap gap-2">
            <NameEditor
              name={name === 'Ty' ? '' : name}
              onSave={(n) => (g ? updateSettings({ group: { ...g, name: n }, profile: { ...raw, nick: n } }) : set({ nick: n }))}
            />
            <button type="button" onClick={share} disabled={sharing} className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-sm font-semibold backdrop-blur hover:bg-white/25 disabled:opacity-60">
              <Share2 size={14} /> {sharing ? 'Připravuji…' : 'Sdílet kartu'}
            </button>
            {g ? (
              <button type="button" onClick={() => setQr(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-sm font-semibold backdrop-blur hover:bg-white/25">
                <QrIcon size={14} /> Pozvat kamarády
              </button>
            ) : (
              <Button size="sm" to="/kamaradi" className="!bg-white !text-brand-800">
                Přidat se do skupiny
              </Button>
            )}
          </div>
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
            <SectionTitle sub={`Rámeček kolem profilovky – odemčeno ${count(FRAMES, ctx)} z ${FRAMES.length}. Rámečky za předměty mají vlastní znak.`}>Rámeček</SectionTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
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
            <SectionTitle sub={`Pozadí profilové karty – odemčeno ${count(BANNERS, ctx)} z ${BANNERS.length}. Pozadí s ✨ se pomalu přelévají.`}>Pozadí</SectionTitle>
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
                    <div className={cx('flex h-16 items-end p-2', b.bg, !open && 'opacity-35 grayscale')}>{sel && <Check size={16} className="text-white" />}</div>
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

          <Card className="p-5">
            <SectionTitle sub={`Barva tvé přezdívky v žebříčku a na kartě – odemčeno ${count(NAME_COLORS, ctx)} z ${NAME_COLORS.length}.`}>Barva jména</SectionTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {NAME_COLORS.map((c) => {
                const open = isUnlocked(c, ctx);
                const sel = (profile.color ?? '') === c.id;
                return (
                  <button
                    key={c.id || 'vychozi'}
                    type="button"
                    disabled={!open}
                    onClick={() => set({ color: c.id })}
                    className={cx('rounded-xl px-3 py-2.5 text-left ring-1 transition', sel ? 'bg-brand-500/10 ring-2 ring-brand-500' : 'ring-slate-200 dark:ring-white/10', !open && 'cursor-not-allowed opacity-50')}
                  >
                    <ColoredName name={name} color={c.id} className="block truncate font-display text-lg font-bold" />
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      {!open && <Lock size={11} />}
                      {open ? c.label : c.how}
                    </span>
                    {!open && <MiniProgress value={unlockProgress(c, ctx)} />}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle sub="Malý status vedle jména – kamarádi uvidí, jak to máš.">Status</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((st) => {
                const sel = (profile.status ?? '') === st.id;
                return (
                  <button
                    key={st.id || 'zadny'}
                    type="button"
                    onClick={() => set({ status: st.id })}
                    className={cx('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm ring-1 transition', sel ? 'bg-brand-500/10 font-semibold ring-2 ring-brand-500' : 'ring-slate-200 dark:ring-white/10')}
                  >
                    {st.emoji && <span>{st.emoji}</span>}
                    {st.label}
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

      {tab === 'trofeje' && <Trophies showcase={profile.showcase} onShowcase={(showcase) => set({ showcase })} groupCode={g?.code} />}

      {tab === 'statistiky' && (
        <Card className="p-5">
          <SectionTitle sub="Tohle uvidí kamarádi na tvé kartě (kromě toho, co si skryješ v Nastavení).">Statistiky</SectionTitle>
          <ProfileStats stats={stats} />
        </Card>
      )}

      {tab === 'nastaveni' && (
        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle sub="Kolik otázek chceš zvládnout za posledních 7 dní. Ukáže se na tvé kartě i kamarádům.">Týdenní cíl</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {WEEKLY_GOALS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set({ goal: n })}
                  className={cx('rounded-full px-3.5 py-1.5 text-sm ring-1 transition', (profile.goal ?? 0) === n ? 'bg-brand-500/10 font-semibold ring-2 ring-brand-500' : 'ring-slate-200 dark:ring-white/10')}
                >
                  {n ? `${n} otázek` : 'Bez cíle'}
                </button>
              ))}
            </div>
          </Card>
          <Card className="space-y-3 p-5">
            <SectionTitle sub="Vypnuté údaje se kamarádům vůbec neodesílají.">Soukromí – co uvidí kamarádi</SectionTitle>
            {HIDEABLE.map((h) => {
              const shown = !(profile.hide ?? []).includes(h.id);
              return (
                <Toggle
                  key={h.id}
                  checked={shown}
                  onChange={(v) => set({ hide: v ? (profile.hide ?? []).filter((x) => x !== h.id) : [...(profile.hide ?? []), h.id] })}
                  label={
                    <span className="inline-flex items-center gap-2">
                      {shown ? <Eye size={16} className="text-slate-400" /> : <EyeOff size={16} className="text-slate-400" />}
                      {h.label}
                    </span>
                  }
                />
              );
            })}
            <p className="text-xs text-slate-500 dark:text-slate-400">Přezdívku, profil, XP, sérii a procenta po předmětech vidí ve skupině vždy – podle nich se řadí žebříček.</p>
          </Card>
        </div>
      )}

      {g && (
        <Modal open={qr} onClose={() => setQr(false)} title="Pozvat kamarády">
          <InviteQr code={g.code} />
        </Modal>
      )}
    </div>
  );
}

/** Pozvánka do skupiny: QR kód a odkaz */
export function InviteQr({ code }: { code: string }) {
  const { toast } = useStore();
  const link = `${PAGES_URL}#/kamaradi?skupina=${code}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast('Odkaz zkopírován.', 'success');
    } catch {
      toast('Kopírování nejde – opiš kód ručně.', 'info');
    }
  };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ text: `Přidej se do mé skupiny v Maturitním trenérovi: ${link}` });
      else await copy();
    } catch {
      /* zrušeno */
    }
  };
  return (
    <div className="text-center">
      <p className="text-sm text-slate-600 dark:text-slate-300">Kamarád naskenuje QR kód telefonem a rovnou se mu otevře připojení do skupiny.</p>
      <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-3 shadow">
        <QrCode text={link} size={220} />
      </div>
      <div className="mt-3 font-mono text-lg font-bold tracking-wider">{formatGroupCode(code)}</div>
      <div className="mt-4 flex justify-center gap-2">
        <Button icon={<Share2 size={16} />} onClick={share}>
          Poslat odkaz
        </Button>
        <Button variant="secondary" icon={<Copy size={16} />} onClick={copy}>
          Kopírovat
        </Button>
      </div>
    </div>
  );
}

function Trophies({ showcase, onShowcase, groupCode }: { showcase: string[]; onShowcase: (ids: string[]) => void; groupCode?: string }) {
  const { data } = useStore();
  const rows = groupCode ? (cachedGroup(groupCode)?.rows ?? []) : [];
  const all = [...BADGES, PLATINUM];
  const earned = (b: BadgeDef) => data.badges[b.id];
  const done = all.filter(earned).length;
  const rarity = (id: string) => (rows.length > 1 ? rows.filter((r) => (r.me ? !!data.badges[id] : r.stats.badges?.includes(id))).length : 0);
  const families = [...new Set(BADGES.map(badgeFamily).filter(Boolean) as string[])];
  const singles = BADGES.filter((b) => !badgeFamily(b));
  const toggle = (id: string) => (showcase.includes(id) ? onShowcase(showcase.filter((x) => x !== id)) : showcase.length < 3 && onShowcase([...showcase, id]));

  const badgeCard = (b: BadgeDef, tier?: number) => {
    const at = earned(b);
    const sel = showcase.includes(b.id);
    const r = rarity(b.id);
    return (
      <div key={b.id} className={cx('flex items-start gap-3 rounded-xl p-3 ring-1', sel ? 'bg-brand-500/10 ring-brand-500' : 'ring-slate-200 dark:ring-white/10', !at && 'opacity-50')}>
        <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl', tier ? `bg-gradient-to-br ${TIER_STYLE[tier]}` : 'bg-slate-900/[0.05] dark:bg-white/[0.06]', !at && 'grayscale')}>{b.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 text-sm font-semibold">
            {b.label}
            {tier ? <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{TIER_LABEL[tier]}</span> : null}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{b.description}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            {at ? <span className="font-medium text-emerald-600 dark:text-emerald-400">✓ získáno {formatDate(at)}</span> : <span className="inline-flex items-center gap-1"><Lock size={11} /> zatím ne</span>}
            {r > 0 && <span>má {r} z {rows.length} ve skupině</span>}
          </div>
        </div>
        {at && (
          <button
            type="button"
            onClick={() => toggle(b.id)}
            disabled={!sel && showcase.length >= 3}
            className={cx('shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ring-1 disabled:opacity-40', sel ? 'bg-brand-500 text-white ring-brand-500' : 'ring-slate-300 dark:ring-white/15')}
          >
            {sel ? 've vitríně' : 'do vitríny'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className={cx('grid h-16 w-16 place-items-center rounded-2xl text-3xl', earned(PLATINUM) ? 'frame-shimmer bg-gradient-to-br from-slate-100 via-cyan-200 to-slate-400' : 'bg-slate-900/[0.05] grayscale dark:bg-white/[0.06]')}>🏆</div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-xl font-bold">
              {done} z {all.length} trofejí ({Math.round((done / all.length) * 100)} %)
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400" style={{ width: `${(done / all.length) * 100}%` }} />
            </div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{earned(PLATINUM) ? 'Platinová trofej získána – máš úplně všechno!' : 'Získej všechny trofeje a odemkneš platinovou.'}</div>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Do vitríny můžeš dát až 3 získané odznaky ({showcase.length}/3) – uvidí je kamarádi na tvé kartě.</p>
      </Card>

      <Card className="p-5">
        <SectionTitle sub="Stupně bronz → stříbro → zlato.">Odznaky se stupni</SectionTitle>
        <div className="space-y-4">
          {families.map((f) => {
            const tiers = BADGES.filter((b) => badgeFamily(b) === f).sort((a, b) => (badgeTier(a) ?? 0) - (badgeTier(b) ?? 0));
            return (
              <div key={f}>
                <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{FAMILY_LABEL[f] ?? f}</div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{tiers.map((b) => badgeCard(b, badgeTier(b)))}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle>Ostatní odznaky</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{singles.map((b) => badgeCard(b))}</div>
      </Card>
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
  useEffect(() => setV(name), [name]);
  if (!edit)
    return (
      <button type="button" onClick={() => setEdit(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-sm font-semibold backdrop-blur hover:bg-white/25">
        <Pencil size={14} /> {name ? 'Změnit přezdívku' : 'Nastavit přezdívku'}
      </button>
    );
  const ok = v.trim().length >= 1 && v.trim().length <= 30;
  return (
    <div className="flex w-full max-w-sm gap-2">
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
