import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Trophy, Users, X } from 'lucide-react';
import { useStore } from '../store';
import { cachedGroup, fetchGroup, groupAvailable, groupStats, subscribeGroupCache, type GroupRow, type GroupStats } from '../lib/group';
import { dayKey } from '../lib/progress';
import { Button, Card, Segmented, cx, plural } from './ui';
import { Avatar } from './Avatar';
import { FriendProfile, memberProfile } from './FriendProfile';

type Mode = 'week' | 'xp';
const HIDE_KEY = 'maturitni-trener:friends-card-hidden';
const MODE_KEY = 'maturitni-trener:friends-card-mode';

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* nevadí */
  }
};

const value = (s: GroupStats, m: Mode) => (m === 'week' ? s.week : s.xp);
const unit = (n: number, m: Mode) => (m === 'week' ? plural(n, 'otázka', 'otázky', 'otázek') : 'XP');

/** Jedna věta, která povzbudí – podle pořadí ve skupině */
export function motivation(rows: { name: string; stats: GroupStats; me: boolean }[], mode: Mode, today = dayKey()): string {
  const others = rows.filter((r) => !r.me);
  if (!others.length) return 'Ve skupině zatím nikdo další není – pošli kamarádům kód.';
  const sorted = [...rows].sort((a, b) => value(b.stats, mode) - value(a.stats, mode));
  const i = sorted.findIndex((r) => r.me);
  const me = sorted[i];
  const period = mode === 'week' ? 'tento týden' : 'celkově';
  const busy = others.filter((r) => r.stats.lastActive === today && r.stats.today > 0).sort((a, b) => b.stats.today - a.stats.today)[0];
  if (me && me.stats.today === 0 && busy) return `${busy.name} už má dnes ${busy.stats.today} ${plural(busy.stats.today, 'otázku', 'otázky', 'otázek')} – přidej se.`;
  if (i === 0) {
    const next = sorted[1];
    const diff = value(me.stats, mode) - value(next.stats, mode);
    return diff > 0 ? `Jsi ${period} na 1. místě 🔥 ${next.name} ztrácí ${diff} ${unit(diff, mode)}.` : `Jsi ${period} na 1. místě, ale ${next.name} je hned vedle tebe.`;
  }
  const above = sorted[i - 1];
  const diff = value(above.stats, mode) - value(me.stats, mode) + 1;
  return `Před tebou je ${above.name} – chybí ti ${diff} ${unit(diff, mode)} na ${i}. místo.`;
}

/** Karta „Kamarádi“ na domovské stránce */
export function FriendsCard() {
  const { data } = useStore();
  const g = data.settings.group ?? null;
  const [hidden, setHidden] = useState(() => read(HIDE_KEY) === '1');
  const [mode, setMode] = useState<Mode>(() => (read(MODE_KEY) === 'xp' ? 'xp' : 'week'));
  const [opened, setOpened] = useState<{ name: string; stats: GroupStats; rank: number } | null>(null);
  const cache = useSyncExternalStore(subscribeGroupCache, () => (g ? JSON.stringify(cachedGroup(g.code)) : 'null'));

  useEffect(() => {
    if (!g || !groupAvailable()) return;
    const load = () => void fetchGroup(g).catch(() => undefined);
    load();
    const timer = setInterval(() => document.visibilityState === 'visible' && load(), 60000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- jen při změně skupiny
  }, [g?.code, g?.member]);

  const mine = useMemo(() => groupStats(data), [data]);
  const rows: GroupRow[] = useMemo(() => {
    const c = JSON.parse(cache) as { rows: GroupRow[] } | null;
    // vlastní řádek vždy podle aktuálních dat v zařízení
    return (c?.rows ?? []).map((r) => (r.me ? { ...r, stats: mine } : r));
  }, [cache, mine]);

  if (!groupAvailable()) return null;

  if (!g) {
    if (hidden) return null;
    return (
      <Card className="flex items-center gap-3 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          <Users size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-bold">Uč se s kamarády</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Vytvoř skupinu a porovnávejte si pokrok v žebříčku.</div>
        </div>
        <Button size="sm" to="/kamaradi">
          Začít
        </Button>
        <button
          type="button"
          aria-label="Skrýt kartu"
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-900/5 dark:hover:bg-white/10"
          onClick={() => {
            write(HIDE_KEY, '1');
            setHidden(true);
          }}
        >
          <X size={18} />
        </button>
      </Card>
    );
  }

  const sorted = [...rows].sort((a, b) => value(b.stats, mode) - value(a.stats, mode) || b.stats.xp - a.stats.xp);
  const meIndex = sorted.findIndex((r) => r.me);
  const shown = sorted.slice(0, 3).map((r, i) => ({ r, i }));
  if (meIndex >= 3) shown.push({ r: sorted[meIndex], i: meIndex });
  const today = dayKey();

  return (
    <Card className="p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Users size={19} className="text-brand-600 dark:text-brand-300" /> Kamarádi
        </h2>
        <Segmented
          value={mode}
          onChange={(m) => {
            setMode(m);
            write(MODE_KEY, m);
          }}
          options={[
            { value: 'week', label: 'Tento týden' },
            { value: 'xp', label: 'Celkem' },
          ]}
        />
      </div>
      {!rows.length ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Načítám žebříček…</p>
      ) : (
        <>
          <p className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">{motivation(rows, mode)}</p>
          <ul className="space-y-1.5">
            {shown.map(({ r, i }) => (
              <li
                key={`${r.name}-${i}`}
                onClick={() => setOpened({ name: r.name, stats: r.stats, rank: i + 1 })}
                className={cx('flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 transition hover:brightness-110', r.me ? 'bg-brand-500/10 ring-1 ring-brand-500/30' : 'bg-slate-900/[0.03] dark:bg-white/[0.03]')}
              >
                <span
                  className={cx(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold',
                    i === 0 ? 'bg-amber-400 text-amber-950' : i === 1 ? 'bg-slate-300 text-slate-800' : i === 2 ? 'bg-orange-300 text-orange-950' : 'bg-slate-900/[0.06] dark:bg-white/[0.08]',
                  )}
                >
                  {i === 0 ? <Trophy size={14} /> : i + 1}
                </span>
                <span className="relative">
                  <Avatar name={r.name} avatar={memberProfile(r.stats).avatar} frame={memberProfile(r.stats).frame} size="sm" />
                  <span className={cx('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-ink', r.stats.lastActive === today && r.stats.today > 0 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600')} title={r.stats.lastActive === today ? 'dnes se učil(a)' : 'dnes zatím ne'} />
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {r.name}
                  {r.me && <span className="ml-1.5 text-xs font-bold uppercase text-brand-700 dark:text-brand-300">ty</span>}
                </span>
                <span className="inline-flex items-center gap-0.5 text-xs text-slate-500 dark:text-slate-400">
                  <Flame size={13} className={r.stats.streak ? 'text-orange-500' : ''} />
                  {r.stats.streak}
                </span>
                <span className="w-24 text-right text-sm font-bold tabular-nums">
                  {value(r.stats, mode)} {mode === 'week' ? 'otázek' : 'XP'}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <FriendProfile open={!!opened} onClose={() => setOpened(null)} name={opened?.name ?? ''} stats={opened?.stats ?? null} rank={opened?.rank} mine={opened && opened.stats !== mine ? mine : undefined} />
      <Link to="/kamaradi" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
        Celý žebříček <ArrowRight size={15} />
      </Link>
    </Card>
  );
}
