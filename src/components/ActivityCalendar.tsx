import { CALENDAR_DAYS } from '../lib/group';
import { dayKey } from '../lib/progress';
import { cx, plural } from './ui';

const LEVELS = ['bg-slate-900/[0.06] dark:bg-white/[0.06]', 'bg-brand-500/30', 'bg-brand-500/55', 'bg-brand-500/80', 'bg-brand-400'];
const level = (n: number) => (n <= 0 ? 0 : n < 10 ? 1 : n < 25 ? 2 : n < 50 ? 3 : 4);

/** Kalendář aktivity za posledních 12 týdnů (jako na GitHubu) – sloupec = týden od pondělí */
export function ActivityCalendar({ days, now = new Date() }: { days: number[]; now?: Date }) {
  // doplnit na celé týdny: poslední sloupec končí nedělí aktuálního týdne
  const todayIdx = (now.getDay() + 6) % 7; // 0 = pondělí
  const cells: (number | null)[] = [...days.slice(-CALENDAR_DAYS)];
  while (cells.length < CALENDAR_DAYS) cells.unshift(0);
  for (let i = todayIdx + 1; i < 7; i++) cells.push(null); // budoucí dny
  const skip = cells.length % 7;
  const grid = cells.slice(skip);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));
  const total = days.reduce((s, n) => s + n, 0);
  const active = days.filter((n) => n > 0).length;
  const dateOf = (w: number, d: number) => {
    const offset = (weeks.length - 1 - w) * 7 + (todayIdx - d);
    return dayKey(new Date(now.getTime() - offset * 86400000));
  };
  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        <div className="mr-1 grid grid-rows-7 gap-[3px] text-[9px] leading-none text-slate-400">
          {['Po', '', 'St', '', 'Pá', '', 'Ne'].map((l, i) => (
            <span key={i} className="flex h-3 items-center">
              {l}
            </span>
          ))}
        </div>
        {weeks.map((w, wi) => (
          <div key={wi} className="grid grid-rows-7 gap-[3px]">
            {w.map((n, di) =>
              n === null ? (
                <span key={di} className="h-3 w-3" />
              ) : (
                <span key={di} title={`${dateOf(wi, di)}: ${n} ${plural(n, 'otázka', 'otázky', 'otázek')}`} className={cx('h-3 w-3 rounded-[3px]', LEVELS[level(n)])} />
              ),
            )}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>
          {total} {plural(total, 'otázka', 'otázky', 'otázek')} za 12 týdnů · aktivní {active} {plural(active, 'den', 'dny', 'dní')}
        </span>
        <span className="flex items-center gap-1">
          méně {LEVELS.map((c, i) => <span key={i} className={cx('h-2.5 w-2.5 rounded-[2px]', c)} />)} více
        </span>
      </div>
    </div>
  );
}

/** Otázky po týdnech (posledních 12 týdnů) */
export function WeeklyBars({ days }: { days: number[] }) {
  const weeks: number[] = [];
  const d = [...days];
  while (d.length) weeks.unshift(d.splice(-7).reduce((s, n) => s + n, 0));
  const max = Math.max(1, ...weeks);
  return (
    <div>
      <div className="flex h-20 items-end gap-1">
        {weeks.map((n, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-0.5" title={`${n} ${plural(n, 'otázka', 'otázky', 'otázek')}`}>
            <span className="text-[9px] text-slate-400">{n || ''}</span>
            <span className={cx('w-full rounded-t', i === weeks.length - 1 ? 'bg-brand-400' : 'bg-brand-500/50')} style={{ height: `${Math.max(3, (n / max) * 56)}px` }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>před 12 týdny</span>
        <span>posledních 7 dní</span>
      </div>
    </div>
  );
}
