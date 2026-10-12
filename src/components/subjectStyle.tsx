import { BookOpen, Cloud, Cpu, Network, type LucideIcon } from 'lucide-react';
import type { SubjectId } from '../types';
import { cx } from './ui';

/** Barevné odlišení předmětů (ikona, štítek, barva průběhu) */
export const SUBJECT_STYLE: Record<SubjectId, { icon: LucideIcon; chip: string; bar: string; text: string }> = {
  cjl: { icon: BookOpen, chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', bar: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300' },
  site: { icon: Network, chip: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', bar: 'bg-sky-500', text: 'text-sky-700 dark:text-sky-300' },
  hw: { icon: Cpu, chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', bar: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300' },
  cloud: { icon: Cloud, chip: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300', bar: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-300' },
};

export function SubjectIcon({ subject, size = 'md', className }: { subject: SubjectId; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const s = SUBJECT_STYLE[subject];
  const box = { sm: 'h-6 w-6 rounded-md', md: 'h-9 w-9 rounded-xl', lg: 'h-11 w-11 rounded-xl' }[size];
  const px = { sm: 14, md: 18, lg: 22 }[size];
  return (
    <span className={cx('grid shrink-0 place-items-center', box, s.chip, className)} aria-hidden="true">
      <s.icon size={px} strokeWidth={2.2} />
    </span>
  );
}
