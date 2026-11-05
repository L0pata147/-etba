import { Link } from 'react-router-dom';
import type { Topic } from '../../types';
import { Pct, ProgressBar, cx, relativeDays } from '../../components/ui';
import { SUBJECT_STYLE } from '../../components/subjectStyle';

/** Mřížka témat s pokrokem */
export function TopicGrid({ rows }: { rows: { t: Topic; p: number; last: number }[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
      {rows.map(({ t, p, last }) => (
        <Link key={t.id} to={`/tema/${t.id}`} className="card flex items-center gap-3 p-3 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-xl font-bold', SUBJECT_STYLE[t.subject].chip)}>{t.number}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate font-bold leading-snug">{t.title}</span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-500">
                <Pct value={p} />
              </span>
            </div>
            <ProgressBar value={p} className="mt-1.5" height="h-1.5" />
            <div className="mt-1 text-[11px] text-slate-500">{last ? `naposledy ${relativeDays(last)}` : 'zatím neprocvičeno'}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
