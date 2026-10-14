import { AVATAR_MAP } from '../data/avatars';
import { FRAME_MAP } from '../lib/profile';
import { cx } from './ui';

const COLORS = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-teal-500', 'bg-sky-500', 'bg-indigo-500', 'bg-violet-500', 'bg-fuchsia-500'];

function hash(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.codePointAt(0)!) | 0;
  return Math.abs(h);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const a = [...parts[0]][0] ?? '';
  const b = parts.length > 1 ? ([...parts[parts.length - 1]][0] ?? '') : ([...parts[0]][1] ?? '');
  return (a + b).toUpperCase();
}

const SIZES = { xs: 'h-7 w-7 text-[11px]', sm: 'h-9 w-9 text-xs', md: 'h-12 w-12 text-sm', lg: 'h-20 w-20 text-2xl', xl: 'h-28 w-28 text-4xl' } as const;
const EMBLEM = { xs: '', sm: 'h-4 w-4 text-[9px]', md: 'h-5 w-5 text-[11px]', lg: 'h-7 w-7 text-sm', xl: 'h-9 w-9 text-lg' } as const;
const PAD = { xs: 'p-[2px]', sm: 'p-[2px]', md: 'p-[3px]', lg: 'p-1', xl: 'p-[5px]' } as const;

/** Profilovka (nebo iniciály) s volitelným rámečkem */
export function Avatar({ name, avatar, frame, size = 'sm', className }: { name: string; avatar?: string; frame?: string; size?: keyof typeof SIZES; className?: string }) {
  const img = avatar ? AVATAR_MAP[avatar] : undefined;
  const ring = frame ? FRAME_MAP[frame]?.ring : undefined;
  const inner = (
    <span className={cx('grid shrink-0 place-items-center overflow-hidden rounded-full font-display font-bold text-white', SIZES[size], !img && COLORS[hash(name) % COLORS.length], ring && 'ring-2 ring-paper dark:ring-ink')}>
      {img ? <img src={img.url} alt="" className="h-full w-full object-cover" draggable={false} /> : initials(name)}
    </span>
  );
  if (!ring) return <span className={cx('inline-flex shrink-0', className)}>{inner}</span>;
  const emblem = frame ? FRAME_MAP[frame]?.emblem : undefined;
  return (
    <span className={cx('relative inline-flex shrink-0 rounded-full', PAD[size], ring, className)}>
      {inner}
      {emblem && size !== 'xs' && (
        <span className={cx('absolute -bottom-0.5 -right-0.5 grid place-items-center rounded-full bg-white shadow ring-1 ring-black/10 dark:bg-slate-900', EMBLEM[size])} aria-hidden="true">
          {emblem}
        </span>
      )}
    </span>
  );
}
