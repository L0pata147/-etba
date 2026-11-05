import { BookOpen, Cloud, Cpu, Network, type LucideIcon } from 'lucide-react';
import type { SubjectId } from '../types';
import { cx } from './ui';

/** Barevné odlišení předmětů (ikona, štítek, barva průběhu, okraj karty) – stejné barvy jako čáry na tahácích */
export const SUBJECT_STYLE: Record<SubjectId, { icon: LucideIcon; chip: string; bar: string; text: string; border: string; solid: string }> = {
  cjl: { icon: BookOpen, chip: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', bar: 'bg-sky-500', text: 'text-sky-700 dark:text-sky-300', border: 'border-l-sky-500', solid: 'bg-sky-500 text-white' },
  site: { icon: Network, chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', bar: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-l-emerald-500', solid: 'bg-emerald-500 text-white' },
  hw: { icon: Cpu, chip: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300', bar: 'bg-red-500', text: 'text-red-700 dark:text-red-300', border: 'border-l-red-500', solid: 'bg-red-500 text-white' },
  cloud: { icon: Cloud, chip: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300', bar: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-300', border: 'border-l-orange-500', solid: 'bg-orange-500 text-white' },
};

export function SubjectIcon({ subject, size = 'md', solid, className }: { subject: SubjectId; size?: 'sm' | 'md' | 'lg'; solid?: boolean; className?: string }) {
  const s = SUBJECT_STYLE[subject];
  const box = { sm: 'h-6 w-6 rounded-md', md: 'h-9 w-9 rounded-xl', lg: 'h-11 w-11 rounded-xl' }[size];
  const px = { sm: 14, md: 18, lg: 22 }[size];
  return (
    <span className={cx('grid shrink-0 place-items-center', box, solid ? s.solid : s.chip, className)} aria-hidden="true">
      <s.icon size={px} strokeWidth={2.2} />
    </span>
  );
}
