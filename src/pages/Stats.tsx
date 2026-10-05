import { useMemo, useState } from 'react';
import type { SubjectId } from '../types';
import { SUBJECTS, SUBJECT_TOPICS } from '../data/subjects';
import { LEARNED_TARGET, subjectAnswers, subjectForecast, subjectProgress } from '../lib/insights';
import { topicProgress } from '../lib/progress';
import { Segmented } from '../components/ui';
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

      <SubjectStats color={color} grid={grid} axis={axis} tooltipStyle={tooltipStyle} />

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
            <span className="font-medium">{a.area.startsWith('it-') ? `IT – ${AREA_MAP[a.area].label.toLowerCase()}` : AREA_MAP[a.area].label}</span>
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

/** Pokrok po předmětech – vývoj, úspěšnost, nejslabší části a odhad */
function SubjectStats({ color, grid, axis, tooltipStyle }: { color: string; grid: string; axis: string; tooltipStyle: Record<string, string | number> }) {
  const { data } = useStore();
  const [subject, setSubject] = useState<SubjectId>('site');
  const progress = useMemo(() => subjectProgress(data), [data]);
  const answers = useMemo(() => subjectAnswers(data, subject), [data, subject]);
  const forecast = useMemo(() => subjectForecast(data, subject), [data, subject]);
  const history = useMemo(
    () =>
      Object.keys(data.progressHistory)
        .sort()
        .filter((d) => data.progressHistory[d][subject] !== undefined)
        .slice(-60)
        .map((d) => ({ label: `${Number(d.slice(8))}. ${Number(d.slice(5, 7))}.`, zvladnuti: Math.round((data.progressHistory[d][subject] ?? 0) * 100) })),
    [data.progressHistory, subject],
  );
  const parts = useMemo(() => {
    const rows =
      subject === 'cjl'
        ? data.books.map((b) => ({ id: b.id, label: b.title, p: bookProgress(data, b), to: `/knihy/${b.id}` }))
        : SUBJECT_TOPICS[subject].map((t) => ({ id: t.id, label: `${t.number}. ${t.title}`, p: topicProgress(data, t.id), to: `/tema/${t.id}` }));
    return rows.sort((a, b) => a.p - b.p);
  }, [data, subject]);
  const mastered = parts.filter((r) => r.p >= LEARNED_TARGET).length;
  const fc =
    forecast.kind === 'done'
      ? 'Zvládnuto 🎉'
      : forecast.kind === 'wait'
        ? 'Odhad po 3 dnech učení'
        : forecast.kind === 'flat'
          ? 'Zatím bez zlepšení'
          : `${forecast.date!.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })} (za ${forecast.days} ${plural(forecast.days!, 'den', 'dny', 'dní')})`;

  return (
    <Card className="p-5">
      <SectionTitle sub="Zvládnutí, úspěšnost a odhad, kdy budeš mít předmět naučený (cíl 85 %).">Pokrok po předmětech</SectionTitle>
      <Segmented
        className="mb-4"
        value={subject}
        onChange={setSubject}
        options={(Object.keys(SUBJECTS) as SubjectId[]).map((s) => ({ value: s, label: `${SUBJECTS[s].emoji} ${SUBJECTS[s].short}` }))}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon="📈" label="Zvládnutí" value={`${Math.round(progress[subject] * 100)} %`} tone="violet" />
        <Stat icon="❓" label="Odpovědí" value={answers.attempts} />
        <Stat icon="🎯" label="Úspěšnost" value={answers.attempts ? `${Math.round((answers.correct / answers.attempts) * 100)} %` : '–'} tone="emerald" />
        <Stat icon="🏁" label="Odhad naučení" value={fc} sub={`${mastered}/${parts.length} ${subject === 'cjl' ? 'knih' : 'témat'} zvládnuto`} tone="amber" />
      </div>
      <div className="mt-5">
        <div className="mb-2 text-sm font-semibold">Vývoj zvládnutí</div>
        {history.length >= 2 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis dataKey="label" stroke={axis} tick={{ fontSize: 12 }} tickLine={false} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} stroke={axis} tick={{ fontSize: 12 }} tickLine={false} unit=" %" width={56} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} %`, 'Zvládnutí']} />
                <Line type="monotone" dataKey="zvladnuti" stroke={color} strokeWidth={2} dot={{ r: 4, fill: color }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Graf se ukáže, až budeš trénovat aspoň dva různé dny – každý den se uloží snímek pokroku.</p>
        )}
      </div>
      <div className="mt-5">
        <div className="mb-2 text-sm font-semibold">Nejslabší {subject === 'cjl' ? 'knihy' : 'témata'}</div>
        <ul className="space-y-2">
          {parts.slice(0, 6).map((r) => (
            <li key={r.id}>
              <Link to={r.to} className="block hover:opacity-80">
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span className="truncate">{r.label}</span>
                  <span className="shrink-0 tabular-nums text-slate-500">{Math.round(r.p * 100)} %</span>
                </div>
                <ProgressBar value={r.p} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
