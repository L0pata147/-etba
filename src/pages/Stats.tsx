import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '../store';
import { AREA_MAP, SECTIONS } from '../data/osnova';
import { areaStats, BADGES, overview, sectionStats } from '../lib/insights';
import { bookProgress, dayKey, levelFromXp, levelName, longestStreak } from '../lib/progress';
import { useTheme } from '../components/Layout';
import { Card, EmptyState, PageHeader, ProgressBar, SectionTitle, Stat, formatDate, formatDuration, plural } from '../components/ui';

export function Stats() {
  const { data } = useStore();
  const { dark } = useTheme();
  const ov = useMemo(() => overview(data), [data]);
  const areas = useMemo(() => areaStats(data).filter((a) => a.attempts > 0), [data]);
  const sections = useMemo(() => sectionStats(data).filter((s) => s.attempts > 0), [data]);
  const lvl = levelFromXp(data.xp);

  const daily = useMemo(() => {
    const out: { day: string; label: string; otazky: number; spravne: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      const a = data.activity[k];
      out.push({ day: k, label: `${d.getDate()}. ${d.getMonth() + 1}.`, otazky: a?.questions ?? 0, spravne: a?.correct ?? 0 });
    }
    return out;
  }, [data.activity]);

  const sessionsSeries = useMemo(
    () =>
      data.sessions
        .slice(0, 20)
        .reverse()
        .map((s, i) => ({ i: i + 1, label: formatDate(s.date), uspesnost: Math.round(s.score * 100), title: s.title })),
    [data.sessions],
  );

  const color = dark ? '#60a5fa' : '#2563eb';
  const grid = dark ? '#1e293b' : '#e2e8f0';
  const axis = dark ? '#94a3b8' : '#64748b';
  const tooltipStyle = {
    background: dark ? '#0f172a' : '#ffffff',
    border: `1px solid ${grid}`,
    borderRadius: 12,
    color: dark ? '#e2e8f0' : '#0f172a',
    fontSize: 13,
  };

  const sortedAreas = [...areas].sort((a, b) => b.mastery - a.mastery);
  const strongest = sortedAreas.slice(0, 4);
  const weakest = sortedAreas.slice(-4).reverse();
  const accuracy = ov.questions ? ov.correct / ov.questions : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Můj pokrok" emoji="📊" sub={`Úroveň ${lvl.level} – ${levelName(lvl.level)} · ${data.xp} XP`} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon="❓" label="Otázek celkem" value={ov.questions} />
        <Stat icon="✅" label="Správně" value={ov.correct} tone="emerald" />
        <Stat icon="❌" label="Špatně" value={ov.questions - ov.correct} tone="rose" />
        <Stat icon="🎯" label="Úspěšnost" value={`${Math.round(accuracy * 100)} %`} tone="violet" />
        <Stat icon="📚" label="Naučené knihy" value={`${ov.learned}/${ov.bookCount}`} tone="emerald" />
        <Stat icon="⏱️" label="Čas učení" value={formatDuration(ov.seconds)} tone="amber" />
        <Stat icon="🏁" label="Dokončené testy" value={ov.sessions} />
        <Stat icon="🔥" label="Série dní" value={`${ov.streak} ${plural(ov.streak, 'den', 'dny', 'dní')}`} sub={`nejdelší: ${longestStreak(data)}`} tone="amber" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle sub="Počet zodpovězených otázek za posledních 30 dní">Aktivita</SectionTitle>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barCategoryGap={2}>
                <CartesianGrid vertical={false} stroke={grid} />
                <XAxis dataKey="label" tick={{ fill: axis, fontSize: 11 }} tickLine={false} axisLine={false} interval={6} />
                <YAxis allowDecimals={false} tick={{ fill: axis, fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: dark ? 'rgba(148,163,184,0.08)' : 'rgba(100,116,139,0.08)' }}
                  contentStyle={tooltipStyle}
                  formatter={(v, _n, p) => [`${v} otázek (${(p.payload as { spravne: number }).spravne} správně)`, 'Aktivita']}
                />
                <Bar dataKey="otazky" fill={color} radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle sub="Úspěšnost posledních 20 testů">Výsledky testů</SectionTitle>
          {sessionsSeries.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sessionsSeries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={grid} />
                  <XAxis dataKey="i" tick={{ fill: axis, fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: axis, fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(_l, p) => (p?.[0]?.payload as { title?: string; label?: string } | undefined)?.title ?? ''}
                    formatter={(v) => [`${v} %`, 'Úspěšnost']}
                  />
                  <Line type="monotone" dataKey="uspesnost" stroke={color} strokeWidth={2} dot={{ r: 4, fill: color, strokeWidth: 2, stroke: dark ? '#0f172a' : '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">Zatím žádný dokončený test.</p>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle sub="Průměr zvládnutí jednotlivých částí maturitní osnovy">Podle osnovy</SectionTitle>
        {sections.length ? (
          <div className="space-y-3">
            {sections.map((s) => (
              <div key={s.section}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-semibold">{SECTIONS[s.section].label}</span>
                  <span className="tabular-nums text-slate-500">{Math.round(s.mastery * 100)} %</span>
                </div>
                <ProgressBar value={s.mastery} height="h-3" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Zatím bez dat.</p>
        )}
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-5">
          <SectionTitle>💪 Nejsilnější témata</SectionTitle>
          <AreaList items={strongest} />
        </Card>
        <Card className="p-5">
          <SectionTitle>🎯 Nejslabší témata</SectionTitle>
          <AreaList items={weakest} />
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle>Pokrok jednotlivých knih</SectionTitle>
        {data.books.length ? (
          <ul className="space-y-2.5">
            {[...data.books]
              .sort((a, b) => bookProgress(data, b) - bookProgress(data, a))
              .map((b) => {
                const p = bookProgress(data, b);
                return (
                  <li key={b.id}>
                    <Link to={`/knihy/${b.id}`} className="grid grid-cols-[minmax(0,9rem)_1fr_3rem] items-center gap-3 hover:opacity-80 sm:grid-cols-[minmax(0,14rem)_1fr_3rem]">
                      <span className="truncate text-sm font-medium">{b.title}</span>
                      <ProgressBar value={p} height="h-3" />
                      <span className="text-right text-sm font-semibold tabular-nums">{Math.round(p * 100)} %</span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        ) : (
          <EmptyState icon="📚" title="Žádné knihy" />
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle sub={`Naučené otázky (opakovaně správně): ${ov.learnedQuestions}`}>Odznaky</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {BADGES.map((b) => {
            const got = data.badges[b.id];
            return (
              <div key={b.id} className={`rounded-xl border p-3 text-center ${got ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-500/10' : 'border-slate-200 opacity-50 grayscale dark:border-slate-800'}`}>
                <div className="text-3xl">{b.emoji}</div>
                <div className="mt-1 text-sm font-bold">{b.label}</div>
                <div className="text-xs text-slate-500">{got ? `získáno ${formatDate(got)}` : b.description}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function AreaList({ items }: { items: { area: keyof typeof AREA_MAP; mastery: number; attempts: number }[] }) {
  if (!items.length) return <p className="text-sm text-slate-500">Zatím bez dat – začni trénovat.</p>;
  return (
    <ul className="space-y-3">
      {items.map((a) => (
        <li key={a.area}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium">{AREA_MAP[a.area].label}</span>
            <span className="tabular-nums text-slate-500">
              {Math.round(a.mastery * 100)} % · {a.attempts}×
            </span>
          </div>
          <ProgressBar value={a.mastery} />
        </li>
      ))}
    </ul>
  );
}
