import type { ReactNode } from 'react';
import type { SubjectId } from '../types';
import { Card, Pct, ProgressBar, cx } from './ui';
import { SUBJECT_STYLE } from './subjectStyle';

/** Karta jedné zkoušky (nebo části) na stránce předmětu – všude stejná kostra */
export function ExamCard({ subject, title, value, info, children }: { subject: SubjectId; title: string; value: number | null; info: ReactNode; children: ReactNode }) {
  return (
    <Card className={cx('flex flex-col border-l-4 p-5', SUBJECT_STYLE[subject].border)}>
      <div className="flex items-center justify-between gap-3">
        <div className="font-bold">{title}</div>
        {value !== null && (
          <span className="text-lg font-bold">
            <Pct value={value} />
          </span>
        )}
      </div>
      {value !== null && <ProgressBar value={value} className="mt-2" height="h-2" color={SUBJECT_STYLE[subject].bar} />}
      <p className="mt-2 flex-1 text-sm text-slate-500 dark:text-slate-400">{info}</p>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </Card>
  );
}

/** Mřížka karet zkoušek */
export function ExamCards({ children }: { children: ReactNode }) {
  return <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
