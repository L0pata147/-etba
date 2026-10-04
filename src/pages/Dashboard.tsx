import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Dices, GraduationCap, Play, RefreshCw, Timer, TriangleAlert } from 'lucide-react';
import { useStore } from '../store';
import { AREA_MAP, CATEGORIES } from '../data/osnova';
import { areaStats, BADGES, currentWeek, overview, recommendations, staleBooks } from '../lib/insights';
import { bookProgress, daysUntil, levelFromXp, levelName, sitePracticalProgress, topicProgress } from '../lib/progress';
import { SITE_TOPICS } from '../data/site';
import { topicConfig } from './site/common';
import { dueSession, minutesSession, randomSession, recommendedSession, unknownSession } from '../lib/quick';
import { useStartSession } from './SessionPage';
import { Button, Card, EmptyState, ProgressBar, SectionTitle, Stat, Tag, formatDate, plural, relativeDays } from '../components/ui';

export function Dashboard() {
  const { data } = useStore();
  const start = useStartSession();
  const ov = useMemo(() => overview(data), [data]);
  const recs = useMemo(() => recommendations(data, 3), [data]);
  const stale = useMemo(() => staleBooks(data, 4), [data]);
  const weakest = useMemo(
    () =>
      areaStats(data)
        .filter((a) => a.attempts >= 2 && a.area !== 'terms')
        .sort((a, b) => a.mastery - b.mastery)
        .slice(0, 4),
    [data],
  );
  const days = daysUntil(data.settings.examDate);
  const week = currentWeek(data.plan);
  const lvl = levelFromXp(data.xp);
  const unknownCount = Object.keys(data.unknown).length;
  const minutes = data.settings.dailyMinutes || 15;
  const hour = new Date().getHours();
  const greeting = hour < 10 ? 'Dobré ráno' : hour < 18 ? 'Ahoj' : 'Dobrý večer';

  if (!data.books.length) {
    return (
      <EmptyState
        icon="📚"
        title="Zatím nemáš žádné knihy"
        text="Přidej si svůj maturitní seznam – z databáze nebo ručně – a aplikace tě začne učit."
        action={<Button to="/knihy">Přejít na Moje knihy</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {greeting}! {days !== null && days >= 0 && <>Do maturity zbývá <b className="text-slate-800 dark:text-slate-200">{days} {plural(days, 'den', 'dny', 'dní')}</b>.</>}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Dnešní příprava</h1>
        </div>
        <Link to="/pokrok" className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <span className="font-bold">Úroveň {lvl.level}</span>
          <span className="text-slate-500">{levelName(lvl.level)}</span>
          <span className="text-slate-400">·</span>
          <span className="tabular-nums text-slate-500">{data.xp} XP</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat icon="📚" label="Knih" value={ov.bookCount} />
        <Stat icon="🔥" label="Série učení" value={`${ov.streak} ${plural(ov.streak, 'den', 'dny', 'dní')}`} tone="amber" />
        <Stat icon="📈" label="Pokrok" value={`${Math.round(ov.progress * 100)} %`} tone="violet" />
        <Stat icon="✅" label="Naučeno" value={`${ov.learned}/${ov.bookCount}`} tone="emerald" />
        <Stat icon="⚠️" label="Zopakovat" value={`${ov.review} ${plural(ov.review, 'kniha', 'knihy', 'knih')}`} tone="rose" />
      </div>

      <SubjectCards />

      {/* Doporučení */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-5 text-white sm:p-7">
          <div className="text-sm font-semibold uppercase tracking-wide text-brand-100">Dnes doporučujeme zopakovat</div>
          <ol className="mt-3 space-y-2">
            {recs.map((r, i) => (
              <li key={r.book.id + r.area} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/15 text-sm font-bold">{i + 1}</span>
                <div className="min-w-0">
                  <Link to={`/knihy/${r.book.id}`} className="font-bold hover:underline">
                    {r.book.title}
                  </Link>{' '}
                  <span className="text-brand-100">– {AREA_MAP[r.area].label.toLowerCase()}</span>
                  <div className="text-xs text-brand-200">{r.reason}</div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button size="lg" className="bg-white !text-brand-800 hover:bg-brand-50" icon={<Play size={18} />} onClick={() => start(recommendedSession(data, recs).cfg)}>
              Začít dnešní trénink
            </Button>
            <span className="flex items-center gap-1.5 text-sm text-brand-100">
              <Timer size={16} /> Přibližný čas: {minutes} minut
            </span>
          </div>
        </div>
        {week && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-5 py-3 text-sm dark:border-slate-800">
            <span className="font-semibold">Studijní plán – týden {week.index}:</span>
            {week.bookIds.map((id) => {
              const b = data.books.find((x) => x.id === id);
              return b ? <Tag key={id} tone="brand">{b.title}</Tag> : null;
            })}
            {week.extras.map((e) => (
              <Tag key={e}>{e}</Tag>
            ))}
            <Link to="/plan" className="ml-auto font-semibold text-brand-700 hover:underline dark:text-brand-400">
              Celý plán →
            </Link>
          </div>
        )}
      </Card>

      {/* Rychlé režimy */}
      <div>
        <SectionTitle>Rychlý start</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[5, 15, 30, 60].map((m) => (
            <button key={m} onClick={() => start(minutesSession(m))} className="card group p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-2xl">⏱️</div>
              <div className="mt-1 font-bold">Mám {m} minut</div>
              <div className="text-xs text-slate-500">{m <= 5 ? 'rychlé opakování' : m <= 15 ? 'krátký trénink' : m <= 30 ? 'důkladný trénink' : 'velký trénink'}</div>
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction icon={<Dices size={20} />} title="🎲 Náhodný trénink" text="Literatura i sítě napřeskáčku" onClick={() => start(randomSession())} />
          <QuickAction
            icon={<TriangleAlert size={20} />}
            title="🔥 Trénovat, co neumím"
            text={unknownCount ? `${unknownCount} ${plural(unknownCount, 'otázka', 'otázky', 'otázek')} k doučení` : 'Seznam je zatím prázdný'}
            disabled={!unknownCount}
            onClick={() => start(unknownSession())}
          />
          <QuickAction
            icon={<RefreshCw size={20} />}
            title="🔁 Opakování"
            text={ov.due ? `${ov.due} ${plural(ov.due, 'otázka čeká', 'otázky čekají', 'otázek čeká')} na zopakování` : 'Nic nečeká – skvělé!'}
            disabled={!ov.due}
            onClick={() => start(dueSession())}
          />
          <QuickAction icon={<GraduationCap size={20} />} title="🎓 Simulace maturity" text="Celá osnova, vlastní odpovědi" to="/simulace" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle action={<Link to="/knihy" className="text-sm font-semibold text-brand-700 dark:text-brand-400">Všechny knihy</Link>}>
            Dlouho neopakováno
          </SectionTitle>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {stale.map(({ book, last }) => (
              <li key={book.id}>
                <Link to={`/knihy/${book.id}`} className="flex items-center gap-3 py-2.5 hover:opacity-80">
                  <BookOpen size={18} className="shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{book.title}</div>
                    <div className="text-xs text-slate-500">{last ? `Naposledy ${relativeDays(last)}` : 'Zatím neprocvičeno'} · {CATEGORIES[book.category].short}</div>
                  </div>
                  <div className="w-20">
                    <ProgressBar value={bookProgress(data, book)} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <SectionTitle action={<Link to="/pokrok" className="text-sm font-semibold text-brand-700 dark:text-brand-400">Statistiky</Link>}>
            Nejslabší oblasti
          </SectionTitle>
          {weakest.length ? (
            <ul className="space-y-3">
              {weakest.map((w) => (
                <li key={w.area}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{w.area.startsWith('it-') ? `Sítě – ${AREA_MAP[w.area].label.toLowerCase()}` : AREA_MAP[w.area].label}</span>
                    <span className="tabular-nums text-slate-500">{Math.round(w.mastery * 100)} %</span>
                  </div>
                  <ProgressBar value={w.mastery} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Jakmile odpovíš na pár otázek, uvidíš tu oblasti, na kterých je potřeba zapracovat.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle>Poslední výsledky testů</SectionTitle>
          {data.sessions.length ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.sessions.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-2.5">
                  <div className={`grid h-10 w-12 shrink-0 place-items-center rounded-lg text-sm font-bold tabular-nums ${s.score >= 0.75 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' : s.score >= 0.5 ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300'}`}>
                    {Math.round(s.score * 100)}%
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{s.title}</div>
                    <div className="text-xs text-slate-500">
                      {formatDate(s.date)} · {s.total} {plural(s.total, 'otázka', 'otázky', 'otázek')}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Zatím žádný dokončený test. Začni dnešním tréninkem!</p>
          )}
        </Card>
        <Card className="p-5">
          <SectionTitle>Odznaky</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            {BADGES.slice(0, 9).map((b) => {
              const got = !!data.badges[b.id];
              return (
                <div key={b.id} title={b.description} className={`rounded-xl p-2 text-center ${got ? 'bg-amber-50 dark:bg-amber-500/10' : 'opacity-40 grayscale'}`}>
                  <div className="text-2xl">{b.emoji}</div>
                  <div className="mt-0.5 text-[11px] font-semibold leading-tight">{b.label}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function QuickAction({ icon, title, text, onClick, to, disabled }: { icon: ReactNode; title: string; text: string; onClick?: () => void; to?: string; disabled?: boolean }) {
  const inner = (
    <>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="font-bold">{title}</div>
        <div className="truncate text-xs text-slate-500">{text}</div>
      </div>
      <ArrowRight size={18} className="shrink-0 text-slate-400" />
    </>
  );
  const cls = 'card flex items-center gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-50';
  if (to)
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button className={cls} onClick={onClick} disabled={disabled}>
      {inner}
    </button>
  );
}

function SubjectCards() {
  const { data } = useStore();
  const start = useStartSession();
  const ov = useMemo(() => overview(data), [data]);
  const topics = useMemo(() => SITE_TOPICS.map((t) => ({ t, p: topicProgress(data, t.id) })).sort((a, b) => a.p - b.p), [data]);
  const oral = topics.reduce((s, x) => s + x.p, 0) / topics.length;
  const prac = sitePracticalProgress(data);
  const practical = (prac.cisco + (prac.linux + prac.windows) / 2 + prac.postupy + prac.vypocty) / 4;
  const weakest = topics[0];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="font-bold">📚 Čeština – literatura</div>
          <span className="font-bold tabular-nums">{Math.round(ov.progress * 100)} %</span>
        </div>
        <ProgressBar value={ov.progress} className="mt-2" height="h-2.5" />
        <p className="mt-2 text-sm text-slate-500">
          {ov.learned}/{ov.bookCount} knih naučeno
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" to="/knihy">
            Knihy
          </Button>
          <Button size="sm" variant="secondary" to="/simulace">
            Simulace
          </Button>
        </div>
      </Card>
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="font-bold">🌐 Počítačové sítě</div>
          <span className="font-bold tabular-nums">{Math.round(((oral + practical) / 2) * 100)} %</span>
        </div>
        <ProgressBar value={(oral + practical) / 2} className="mt-2" height="h-2.5" />
        <p className="mt-2 text-sm text-slate-500">
          ústní {Math.round(oral * 100)} % · praktická {Math.round(practical * 100)} %
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => start(topicConfig([weakest.t.id], `Téma ${weakest.t.number}: ${weakest.t.title}`))}>
            Nejslabší téma: {weakest.t.number}
          </Button>
          <Button size="sm" variant="secondary" to="/site">
            Všechna témata
          </Button>
          <Button size="sm" variant="secondary" to="/site/prakticka">
            Praktická
          </Button>
        </div>
      </Card>
    </div>
  );
}
