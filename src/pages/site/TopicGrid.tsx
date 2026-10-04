import { Link } from 'react-router-dom';
import type { Topic } from '../../types';
import { Pct, ProgressBar, relativeDays } from '../../components/ui';

/** Mřížka témat s pokrokem */
export function TopicGrid({ rows }: { rows: { t: Topic; p: number; last: number }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map(({ t, p, last }) => (
        <Link key={t.id} to={`/tema/${t.id}`} className="card block p-4 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-100 font-bold text-brand-800 dark:bg-brand-500/20 dark:text-brand-200">{t.number}</div>
            <div className="min-w-0 flex-1">
              <div className="font-bold leading-snug">{t.title}</div>
              <div className="mt-0.5 text-xs text-slate-500">{last ? `naposledy ${relativeDays(last)}` : 'zatím neprocvičeno'}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <ProgressBar value={p} />
            <span className="w-10 shrink-0 text-right text-xs font-semibold">
              <Pct value={p} />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
