import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { NAV_SUBJECTS } from '../components/navData';
import { subjectProgress } from '../lib/insights';
import { areaMastery, sitePracticalProgress, subjectTopicsProgress } from '../lib/progress';
import { SUBJECT_TOPICS } from '../data/subjects';
import { Card, PageHeader, Pct, ProgressBar } from '../components/ui';

/** Rozcestník: předměty → zkoušky → co k nim procvičit */
export function Exams() {
  const { data } = useStore();
  const progress = useMemo(() => subjectProgress(data), [data]);
  const examProgress = useMemo<Record<string, number | undefined>>(() => {
    const prac = sitePracticalProgress(data);
    return {
      'site-ustni': subjectTopicsProgress(data, SUBJECT_TOPICS.site.map((t) => t.id)),
      'site-prakticka': (prac.cisco + (prac.linux + prac.windows) / 2 + prac.postupy + prac.vypocty) / 4,
      'cjl-pisemna': areaMastery(data, 'pravopis', 'pravopis'),
    };
  }, [data]);

  return (
    <div>
      <PageHeader title="Zkoušky" emoji="🎓" sub="Všechny maturitní zkoušky na jednom místě – u každé najdeš jen to, co k ní patří." />
      <div className="space-y-5">
        {NAV_SUBJECTS.map((subj) => (
          <Card key={subj.id} className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">
                {subj.emoji} {subj.label}
              </h2>
              <span className="shrink-0 whitespace-nowrap font-bold">
                <Pct value={progress[subj.id]} />
              </span>
            </div>
            <ProgressBar value={progress[subj.id]} className="mt-2" />
            <div className={subj.exams.length > 1 ? 'mt-4 grid gap-4 md:grid-cols-2' : 'mt-4'}>
              {subj.exams.map((ex) => (
                <div key={ex.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-bold">{ex.label}</div>
                    {examProgress[ex.id] !== undefined && (
                      <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-slate-500">
                        <Pct value={examProgress[ex.id]!} />
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{ex.format}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ex.items.map((it) => (
                      <Link
                        key={it.to}
                        to={it.to}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 transition hover:border-brand-400 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-brand-300"
                      >
                        <it.icon size={15} />
                        {it.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
