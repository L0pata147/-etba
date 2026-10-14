import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Crown, ListChecks, Play, RefreshCw, Swords } from 'lucide-react';
import type { ContestSubject } from '../types';
import { useStore } from '../store';
import { cachedGroup, fetchGroup, groupAvailable, groupStats, subscribeGroupCache, type GroupRow } from '../lib/group';
import { BONUS, contestLog, weekLabel, weekLeft, weekStart } from '../lib/arena';
import {
  CONTEST_SUBJECTS,
  CONTEST_SUBJECT_MAP,
  CONTESTS_MISSING,
  DUEL_DAYS,
  createDuel,
  duelView,
  flushPending,
  loadDaily,
  loadDuels,
  ranked,
  readPlay,
  startDaily,
  weekValue,
  weekWinners,
  type ContestEntry,
  type DailyContest,
  type Duel,
} from '../lib/contests';
import { dayKey } from '../lib/progress';
import type { ContestRoute } from './ContestPlay';
import { Avatar } from '../components/Avatar';
import { memberProfile } from '../components/FriendProfile';
import { ColoredName } from '../components/ProfileCard';
import { ContestReview } from '../components/ContestReview';
import { Button, Card, EmptyState, Modal, PageHeader, Segmented, cx, plural } from '../components/ui';
import { FriendsTabs } from './Group';

const shortDay = (key: string) => {
  const [, m, d] = key.split('-').map(Number);
  return `${d}. ${m}.`;
};
const medal = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`);

/** Soutěže ve skupině: kvíz dne, týdenní výzva a duely */
export function Contests() {
  const { data, toast } = useStore();
  const g = data.settings.group ?? null;
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [daily, setDaily] = useState<DailyContest | null>(null);
  const [duels, setDuels] = useState<Duel[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [challenge, setChallenge] = useState<string | null>(params.get('duel'));
  const [review, setReview] = useState<{ title: string; entries: ContestEntry[]; questions: NonNullable<DailyContest['questions']>; id: string } | null>(null);
  const cache = useSyncExternalStore(subscribeGroupCache, () => (g ? JSON.stringify(cachedGroup(g.code)) : 'null'));

  const mine = useMemo(() => groupStats(data), [data]);
  const rows: GroupRow[] = useMemo(() => {
    const c = JSON.parse(cache) as { rows: GroupRow[] } | null;
    return (c?.rows ?? []).map((r) => (r.me ? { ...r, stats: mine } : r));
  }, [cache, mine]);
  const byPid = useMemo(() => new Map(rows.filter((r) => r.pid).map((r) => [r.pid!, r])), [rows]);

  const load = useCallback(async () => {
    if (!g) return;
    setLoading(true);
    try {
      await flushPending(g).catch(() => 0);
      const [d, du] = await Promise.all([loadDaily(g), loadDuels(g), fetchGroup(g).catch(() => null)]);
      setDaily(d);
      setDuels(du);
      setError('');
    } catch (e) {
      setError(e instanceof TypeError ? 'Server je nedostupný – zkontroluj připojení.' : (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [g]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => document.visibilityState === 'visible' && void load(), 60000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- jen při změně skupiny
  }, [g?.code, g?.member]);

  useEffect(() => {
    const pid = params.get('duel');
    if (pid) {
      setChallenge(pid);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  if (!groupAvailable()) return <EmptyState icon={<Swords size={36} />} title="Soutěže nejsou dostupné" text="Tato verze aplikace nemá nastavený server." />;
  if (!g)
    return (
      <EmptyState
        icon={<Swords size={36} />}
        title="Soutěže jsou pro skupinu kamarádů"
        text="Nejdřív si vytvoř skupinu nebo se připoj ke kamarádům. Pak spolu můžete hrát kvíz dne, týdenní výzvu a duely."
        action={<Button to="/kamaradi">Do Kamarádů</Button>}
      />
    );

  const today = dayKey();
  const playDaily = async () => {
    setStarting(true);
    try {
      const d = await startDaily(g, today);
      setDaily(d);
      if (d.results.some((r) => r.me)) {
        toast('Dnešní kvíz už máš odehraný.', 'info');
        return;
      }
      navigate('/souteze/hra', { state: { id: d.id, kind: 'den', title: `Kvíz dne ${shortDay(today)}`, questions: d.questions! } satisfies ContestRoute });
    } catch (e) {
      toast(e instanceof TypeError ? 'Server je nedostupný – zkontroluj připojení.' : (e as Error).message, 'error');
    } finally {
      setStarting(false);
    }
  };

  const playDuel = (d: Duel) => {
    const v = duelView(d);
    navigate('/souteze/hra', {
      state: { id: d.id, kind: 'duel', title: `Duel · ${CONTEST_SUBJECT_MAP[d.subject]?.label ?? 'Mix'}`, questions: d.questions, vs: v.opponent, vsPid: v.incoming ? d.from_pid : d.to_pid, theirs: v.theirs?.result } satisfies ContestRoute,
    });
  };

  const missing = error === CONTESTS_MISSING;

  return (
    <div>
      <PageHeader
        title="Soutěže"
        sub="Kvíz dne, týdenní výzva a duely s kamarády ze skupiny. Všechno se počítá i do tvého pokroku."
        action={
          <Button variant="secondary" icon={<RefreshCw size={16} className={cx(loading && 'animate-spin')} />} onClick={() => void load()} disabled={loading}>
            Obnovit
          </Button>
        }
      />
      <FriendsTabs />

      {missing ? (
        <Card className="mb-5 border-amber-500/40 bg-amber-500/10 p-5 text-sm">
          <div className="mb-1 font-bold">Soutěže ještě nejsou na serveru zapnuté</div>
          <p>
            Kdo spravuje server (Supabase), musí jednou spustit soubor <code className="font-mono">supabase/souteze.sql</code> – stejně jako předtím <code className="font-mono">group.sql</code>: SQL Editor → New query → vložit → Run. Týdenní výzva níže funguje už teď.
          </p>
        </Card>
      ) : (
        error && <Card className="mb-4 p-4 text-sm text-rose-600 dark:text-rose-300">{error}</Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {!missing && <DailyCard daily={daily} today={today} starting={starting} onPlay={playDaily} onReview={(r) => setReview(r)} />}
        <WeekCard rows={rows} />
        {!missing && (
          <div className="lg:col-span-2">
            <DuelsCard duels={duels} byPid={byPid} onPlay={playDuel} onChallenge={() => setChallenge('')} onReview={(r) => setReview(r)} />
          </div>
        )}
      </div>

      <ChallengeModal
        open={challenge !== null && !missing}
        preselect={challenge ?? ''}
        rows={rows}
        onClose={() => setChallenge(null)}
        onCreated={(id, questions, vs, vsPid, subject) => {
          setChallenge(null);
          navigate('/souteze/hra', { state: { id, kind: 'duel', title: `Duel · ${CONTEST_SUBJECT_MAP[subject].label}`, questions, vs, vsPid } satisfies ContestRoute });
        }}
      />

      {review && (
        <ContestReview
          open
          onClose={() => setReview(null)}
          title={review.title}
          questions={review.questions}
          marks={review.entries.find((e) => e.me)?.result.q}
          answers={readPlay(review.id)?.answers}
          others={review.entries.filter((e) => !e.me)}
        />
      )}
    </div>
  );
}

// ---------- kvíz dne ----------

function DailyCard({ daily, today, starting, onPlay, onReview }: { daily: DailyContest | null; today: string; starting: boolean; onPlay: () => void; onReview: (r: { title: string; entries: ContestEntry[]; questions: NonNullable<DailyContest['questions']>; id: string }) => void }) {
  const { data } = useStore();
  const played = daily?.results.find((r) => r.me);
  const id = daily?.id ?? '';
  const local = id ? readPlay(id) : null;
  const inProgress = !played && local && !local.result && local.marks.length > 0;
  const board = ranked(daily?.results ?? []);
  const log = contestLog(data);
  const wins = Object.values(log.daily).filter((x) => x.rank === 1 && (x.players ?? 0) >= 2).length;
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">🧠 Kvíz dne</h2>
            <p className="mt-1 text-sm text-white/85">10 stejných otázek pro celou skupinu: 3× čeština, 3× sítě, 2× hardware, 2× cloud. Čím rychleji odpovíš, tím víc bodů.</p>
          </div>
          {played && <div className="shrink-0 rounded-xl bg-white/15 px-3 py-1.5 text-center font-display text-lg font-bold">{played.result.points}</div>}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {played ? (
            <HeroButton className="bg-white/20 text-white hover:bg-white/30" icon={<ListChecks size={18} />} onClick={() => daily?.questions && onReview({ title: `Kvíz dne ${shortDay(today)}`, entries: daily.results, questions: daily.questions, id })}>
              Projít otázky
            </HeroButton>
          ) : (
            <HeroButton className="text-fuchsia-700" icon={<Play size={18} />} onClick={onPlay} disabled={starting || !daily}>
              {starting ? 'Připravuji…' : inProgress ? `Pokračovat (${local!.marks.length}/10)` : 'Hrát kvíz dne'}
            </HeroButton>
          )}
        </div>
      </div>
      <div className="p-5">
        {!daily ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Načítám…</p>
        ) : board.length ? (
          <>
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Dnešní pořadí</div>
            <ol className="space-y-1">
              {board.map((e, i) => (
                <li key={i} className={cx('flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm', e.me ? 'bg-brand-500/10 font-semibold ring-1 ring-brand-500/30' : 'bg-slate-900/[0.03] dark:bg-white/[0.04]')}>
                  <span className="w-7 text-center font-display font-bold">{medal(e.rank)}</span>
                  <span className="flex-1 truncate">
                    {e.name}
                    {e.me && <span className="ml-1.5 text-xs font-bold uppercase text-brand-700 dark:text-brand-300">ty</span>}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{e.result.correct}/{e.result.total}</span>
                  <span className="w-12 text-right font-bold tabular-nums">{e.result.points}</span>
                </li>
              ))}
            </ol>
            {!played && <p className="mt-2 text-sm font-medium text-fuchsia-700 dark:text-fuchsia-300">Překonáš je?</p>}
          </>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Dnes ještě nikdo nehrál – buď první!</p>
        )}

        {daily && daily.history.length > 0 && (
          <div className="mt-4">
            <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Minulé dny</div>
            <ul className="space-y-1 text-sm">
              {daily.history.map((h) => {
                const r = ranked(h.results);
                const top = r.filter((x) => x.rank === 1);
                const me = r.find((x) => x.me);
                return (
                  <li key={h.day} className="flex flex-wrap items-center gap-x-2">
                    <span className="w-12 text-slate-500 dark:text-slate-400">{shortDay(h.day)}</span>
                    <span className="min-w-0 flex-1 truncate">
                      🥇 {top.map((x) => x.name).join(', ')} <span className="text-slate-500 dark:text-slate-400">({top[0]?.result.points ?? 0})</span>
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{me ? `ty: ${me.rank}. z ${r.length}` : 'nehrál(a) jsi'}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Vítěz dne dostane +{BONUS.daily} XP (hrát musí aspoň dva). Tvoje vítězství: {wins}.
        </p>
      </div>
    </Card>
  );
}

// ---------- týdenní výzva ----------

function WeekCard({ rows }: { rows: GroupRow[] }) {
  const now = new Date();
  const week = weekStart(now);
  const prev = weekStart(now, -1);
  const left = weekLeft(now);
  const standing = [...rows].map((r) => ({ r, xp: weekValue(r.stats, week), old: !r.stats.weekly })).sort((a, b) => b.xp - a.xp);
  const max = Math.max(1, ...standing.map((x) => x.xp));
  const winners = weekWinners(rows, prev);
  const fame = rows.filter((r) => (r.stats.arena?.weekWins ?? 0) > 0).sort((a, b) => (b.stats.arena?.weekWins ?? 0) - (a.stats.arena?.weekWins ?? 0));
  let rank = 0;
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 p-5 text-white">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold">
          <Crown size={22} /> Týdenní výzva
        </h2>
        <p className="mt-1 text-sm text-white/90">
          Kdo nasbírá od pondělí do neděle nejvíc XP? Vítěz dostane +{BONUS.week} XP, odznak a rámeček Koruna.
        </p>
        <div className="mt-3 inline-flex rounded-lg bg-black/15 px-2.5 py-1 text-sm font-semibold">
          {weekLabel(week)} · končí za {left.days ? `${left.days} ${plural(left.days, 'den', 'dny', 'dní')} ` : ''}
          {left.hours} h
        </div>
      </div>
      <div className="p-5">
        {!rows.length ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Načítám žebříček…</p>
        ) : (
          <ol className="space-y-2">
            {standing.map(({ r, xp, old }, i) => {
              if (i === 0 || xp !== standing[i - 1].xp) rank = i + 1;
              const p = memberProfile(r.stats);
              return (
                <li key={`${r.name}-${i}`} className={cx('rounded-xl px-3 py-2', r.me ? 'bg-brand-500/10 ring-1 ring-brand-500/30' : 'bg-slate-900/[0.03] dark:bg-white/[0.04]')}>
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-display text-sm font-bold">{xp > 0 && rank === 1 ? '👑' : rank}</span>
                    <Avatar name={r.name} avatar={p.avatar} frame={p.frame} size="sm" />
                    <ColoredName name={r.name} color={p.color} className="min-w-0 flex-1 truncate font-semibold" />
                    {r.me && <span className="text-xs font-bold uppercase text-brand-700 dark:text-brand-300">ty</span>}
                    <span className="w-20 text-right font-bold tabular-nums">{old ? <span className="text-xs font-medium text-slate-400">stará verze</span> : `${xp} XP`}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500" style={{ width: `${(xp / max) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <div className="mt-4 rounded-xl bg-slate-900/[0.04] p-3 text-sm dark:bg-white/[0.05]">
          <span className="text-slate-500 dark:text-slate-400">Minulý týden ({weekLabel(prev)}): </span>
          {winners.length ? (
            <b>
              👑 {winners.map((w) => w.name).join(', ')} – {weekValue(winners[0].stats, prev)} XP
            </b>
          ) : (
            <span>bez vítěze (XP musí sbírat aspoň dva)</span>
          )}
        </div>
        {fame.length > 0 && (
          <div className="mt-3 text-sm">
            <span className="text-slate-500 dark:text-slate-400">Síň slávy: </span>
            {fame.map((r) => `${r.name} 👑×${r.stats.arena!.weekWins}`).join(' · ')}
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">XP se počítají za otázky, tréninky i soutěže. Kamarádi se starší verzí aplikace se do výzvy započítají po aktualizaci.</p>
      </div>
    </Card>
  );
}

// ---------- duely ----------

function DuelsCard({
  duels,
  byPid,
  onPlay,
  onChallenge,
  onReview,
}: {
  duels: Duel[] | null;
  byPid: Map<string, GroupRow>;
  onPlay: (d: Duel) => void;
  onChallenge: () => void;
  onReview: (r: { title: string; entries: ContestEntry[]; questions: Duel['questions']; id: string }) => void;
}) {
  const { data } = useStore();
  const now = Date.now();
  const views = (duels ?? []).map((d) => ({ d, v: duelView(d, now) }));
  const waiting = views.filter(({ v }) => !v.mine && !v.expired && (!v.incoming || v.theirs));
  const sent = views.filter(({ v }) => v.mine && !v.theirs && !v.expired);
  const done = views.filter(({ v }) => v.outcome || v.expired);
  const log = Object.values(contestLog(data).duels);
  const count = (res: string) => log.filter((x) => x.res === res).length;
  const daysLeft = (until: number) => Math.max(1, Math.ceil((until - now) / 86400000));
  const avatarOf = (pid: string, name: string) => {
    const r = byPid.get(pid);
    const p = r ? memberProfile(r.stats) : null;
    return <Avatar name={name} avatar={p?.avatar} frame={p?.frame} size="sm" />;
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-rose-600 via-red-600 to-orange-500 p-5 text-white">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <Swords size={22} /> Duely
          </h2>
          <p className="mt-1 text-sm text-white/90">
            Vyzvi kamaráda na 10 stejných otázek. Kdo dá víc bodů, vyhrává (+{BONUS.duelWin} XP). Soupeř má na odehrání {DUEL_DAYS} dní.
          </p>
        </div>
        <HeroButton className="text-rose-700" icon={<Swords size={18} />} onClick={onChallenge}>
          Vyzvat kamaráda
        </HeroButton>
      </div>
      <div className="space-y-5 p-5">
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-lg bg-emerald-500/15 px-2.5 py-1 font-semibold text-emerald-700 dark:text-emerald-300">{count('win')} {plural(count('win'), 'výhra', 'výhry', 'výher')}</span>
          <span className="rounded-lg bg-rose-500/15 px-2.5 py-1 font-semibold text-rose-700 dark:text-rose-300">{count('loss')} {plural(count('loss'), 'prohra', 'prohry', 'proher')}</span>
          <span className="rounded-lg bg-slate-500/15 px-2.5 py-1 font-semibold">{count('draw')} {plural(count('draw'), 'remíza', 'remízy', 'remíz')}</span>
        </div>

        {!duels && <p className="text-sm text-slate-500 dark:text-slate-400">Načítám…</p>}
        {duels && !duels.length && <p className="text-sm text-slate-500 dark:text-slate-400">Zatím žádné duely. Vyzvi někoho ze skupiny!</p>}

        {waiting.length > 0 && (
          <Section title="Čeká na tebe">
            {waiting.map(({ d, v }) => (
              <li key={d.id} className="flex items-center gap-3 rounded-xl bg-rose-500/10 px-3 py-2.5 ring-1 ring-rose-500/30">
                {avatarOf(v.incoming ? d.from_pid : d.to_pid, v.opponent)}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{v.incoming ? `Výzva od: ${v.opponent}` : `Tvoje výzva: ${v.opponent}`}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {CONTEST_SUBJECT_MAP[d.subject]?.emoji} {CONTEST_SUBJECT_MAP[d.subject]?.label} · {v.theirs ? `soupeř má ${v.theirs.result.points} bodů` : 'nedohráno'} · zbývá {daysLeft(v.until)} {plural(daysLeft(v.until), 'den', 'dny', 'dní')}
                  </div>
                </div>
                <Button size="sm" icon={<Play size={15} />} onClick={() => onPlay(d)}>
                  Hrát
                </Button>
              </li>
            ))}
          </Section>
        )}

        {sent.length > 0 && (
          <Section title="Čeká na soupeře">
            {sent.map(({ d, v }) => (
              <li key={d.id} className="flex items-center gap-3 rounded-xl bg-slate-900/[0.03] px-3 py-2.5 dark:bg-white/[0.04]">
                {avatarOf(v.incoming ? d.from_pid : d.to_pid, v.opponent)}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{v.opponent}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {CONTEST_SUBJECT_MAP[d.subject]?.emoji} {CONTEST_SUBJECT_MAP[d.subject]?.label} · ty máš {v.mine!.result.points} bodů · zbývá {daysLeft(v.until)} {plural(daysLeft(v.until), 'den', 'dny', 'dní')}
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">ještě nehrál(a)</span>
              </li>
            ))}
          </Section>
        )}

        {done.length > 0 && (
          <Section title="Dokončené">
            {done.slice(0, 12).map(({ d, v }) => (
              <li
                key={d.id}
                onClick={() => v.mine && onReview({ title: `Duel · ${v.opponent}`, entries: d.results, questions: d.questions, id: d.id })}
                className={cx('flex items-center gap-3 rounded-xl bg-slate-900/[0.03] px-3 py-2.5 dark:bg-white/[0.04]', v.mine && 'cursor-pointer hover:brightness-110')}
              >
                <span className="text-xl">{v.outcome === 'win' ? '🏆' : v.outcome === 'loss' ? '💔' : v.outcome === 'draw' ? '🤝' : '⌛'}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">
                    {v.outcome === 'win' ? 'Výhra' : v.outcome === 'loss' ? 'Prohra' : v.outcome === 'draw' ? 'Remíza' : 'Propadlo'} · {v.opponent}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {CONTEST_SUBJECT_MAP[d.subject]?.label} · {shortDay(dayKey(new Date(d.created_at)))}
                    {v.outcome ? ` · ${v.mine!.result.points} : ${v.theirs!.result.points}` : v.mine ? ' · soupeř to nestihl odehrát' : v.theirs ? ' · nestihl(a) jsi odehrát' : ' · nikdo neodehrál'}
                  </div>
                </div>
                {v.mine && <ListChecks size={18} className="text-slate-400" />}
              </li>
            ))}
          </Section>
        )}
      </div>
    </Card>
  );
}

/** Bílé tlačítko na barevné hlavičce karty */
function HeroButton({ icon, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ReactNode }) {
  return (
    <button
      type="button"
      className={cx('inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-semibold shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60', /bg-/.test(className ?? '') ? '' : 'bg-white hover:bg-white/90', className)}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</div>
      <ul className="space-y-1.5">{children}</ul>
    </div>
  );
}

function ChallengeModal({
  open,
  preselect,
  rows,
  onClose,
  onCreated,
}: {
  open: boolean;
  preselect: string;
  rows: GroupRow[];
  onClose: () => void;
  onCreated: (id: string, questions: Duel['questions'], vs: string, vsPid: string, subject: ContestSubject) => void;
}) {
  const { data, toast } = useStore();
  const g = data.settings.group!;
  const [to, setTo] = useState(preselect);
  const [subject, setSubject] = useState<ContestSubject>('mix');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setTo(preselect);
  }, [open, preselect]);
  const friends = rows.filter((r) => !r.me && r.pid);
  const target = friends.find((r) => r.pid === to);

  const go = async () => {
    if (!target) return;
    setBusy(true);
    try {
      const { id, questions } = await createDuel(g, target.pid!, subject);
      onCreated(id, questions, target.name, target.pid!, subject);
    } catch (e) {
      toast(e instanceof TypeError ? 'Server je nedostupný – zkontroluj připojení.' : (e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Vyzvat na duel">
      {!friends.length ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {rows.some((r) => !r.me) ? 'Žebříček se ještě načítá, zkus to za chvilku.' : 'Ve skupině zatím nikdo další není.'}{' '}
          <Link to="/kamaradi" className="font-semibold text-brand-700 underline dark:text-brand-300">
            Pozvat kamarády
          </Link>
        </div>
      ) : (
        <>
          <div className="label">Koho vyzveš</div>
          <ul className="mb-4 max-h-64 space-y-1.5 overflow-y-auto">
            {friends.map((r) => {
              const p = memberProfile(r.stats);
              return (
                <li key={r.pid}>
                  <button
                    type="button"
                    onClick={() => setTo(r.pid!)}
                    className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left ring-1 transition', to === r.pid ? 'bg-rose-500/10 ring-rose-500' : 'ring-slate-200 hover:bg-slate-900/[0.03] dark:ring-white/10 dark:hover:bg-white/[0.04]')}
                  >
                    <Avatar name={r.name} avatar={p.avatar} frame={p.frame} size="sm" />
                    <ColoredName name={r.name} color={p.color} className="min-w-0 flex-1 truncate font-semibold" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">{r.stats.xp} XP</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="label">Z čeho</div>
          <Segmented className="mb-4" value={subject} onChange={setSubject} options={CONTEST_SUBJECTS.map((s) => ({ value: s.id, label: s.label }))} />
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Nejdřív hraješ ty, potom dostane výzvu {target ? <b>{target.name}</b> : 'kamarád'} – stejné otázky, stejný čas.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Zrušit
            </Button>
            <Button icon={<Swords size={18} />} disabled={!target || busy} onClick={go}>
              {busy ? 'Připravuji…' : 'Vyzvat a hrát'}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

/** Odkaz na soutěže pro domovskou stránku: stav kvízu dne a čekající duely */
export function ContestStrip({ daily, waiting }: { daily: { played: boolean; players: number } | null; waiting: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Link to="/souteze" className="inline-flex items-center gap-1.5 rounded-xl bg-fuchsia-500/10 px-3 py-1.5 text-sm font-semibold text-fuchsia-700 ring-1 ring-fuchsia-500/30 hover:bg-fuchsia-500/15 dark:text-fuchsia-300">
        🧠 {daily?.played ? 'Kvíz dne odehrán' : `Kvíz dne${daily?.players ? ` (hráčů: ${daily.players})` : ''} – zahraj si`}
      </Link>
      {waiting.length > 0 && (
        <Link to="/souteze" className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 px-3 py-1.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-500/30 hover:bg-rose-500/15 dark:text-rose-300">
          <Swords size={15} /> {waiting.length === 1 ? `Výzva od: ${waiting[0]}` : `${waiting.length} výzvy na duel`}
        </Link>
      )}
    </div>
  );
}
