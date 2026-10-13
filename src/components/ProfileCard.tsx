import type { ReactNode } from 'react';
import { CalendarDays, Clock, Flame, Star, Target, Trophy } from 'lucide-react';
import { SUBJECTS } from '../data/subjects';
import type { Profile, SubjectId } from '../types';
import type { GroupStats } from '../lib/group';
import { BADGE_MAP, BANNER_MAP, TITLE_MAP, favoriteSubject } from '../lib/profile';
import { levelFromXp, levelName } from '../lib/progress';
import { Avatar } from './Avatar';
import { SUBJECT_STYLE, SubjectIcon } from './subjectStyle';
import { Pct, ProgressBar, cx, formatDuration, plural } from './ui';

const SUBJECT_IDS: SubjectId[] = ['cjl', 'site', 'hw', 'cloud'];

/** Horní část profilu: pozadí, profilovka s rámečkem, jméno, titul, motto, úroveň a vitrína */
export function ProfileHero({ name, profile, xp, rank, className, children }: { name: string; profile: Profile; xp: number; rank?: number; className?: string; children?: ReactNode }) {
  const lvl = levelFromXp(xp);
  const bg = BANNER_MAP[profile.banner ?? '']?.bg ?? BANNER_MAP.zaklad.bg;
  return (
    <div className={cx('relative overflow-hidden p-5 text-white sm:p-6', bg, className)}>
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-center gap-4 sm:gap-5">
        <Avatar name={name} avatar={profile.avatar} frame={profile.frame} size="xl" className="max-sm:hidden" />
        <Avatar name={name} avatar={profile.avatar} frame={profile.frame} size="lg" className="sm:hidden" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-2xl font-bold leading-tight">{name}</div>
          <div className="font-medium text-white/85">{TITLE_MAP[profile.title]?.label}</div>
          {profile.motto && <div className="mt-1 line-clamp-2 text-sm italic text-white/75">„{profile.motto}“</div>}
          <div className="mt-2 flex items-center gap-2 text-xs text-white/80">
            <span className="rounded-md bg-white/15 px-1.5 py-0.5 font-bold">Úroveň {lvl.level}</span>
            <span>{levelName(lvl.level)}</span>
            {rank ? (
              <span className="inline-flex items-center gap-1">
                · <Trophy size={12} /> {rank}. místo
              </span>
            ) : null}
          </div>
          <div className="mt-1.5 h-1.5 max-w-xs overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white" style={{ width: `${Math.round(Math.max(0, Math.min(1, lvl.progress)) * 100)}%` }} />
          </div>
          <div className="mt-0.5 text-[11px] text-white/70">
            {xp} / {lvl.next} XP
          </div>
        </div>
      </div>
      {profile.showcase.length > 0 && (
        <div className="relative mt-4 flex flex-wrap gap-2">
          {profile.showcase.map((id) =>
            BADGE_MAP[id] ? (
              <span key={id} className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-2.5 py-1.5 text-sm font-semibold backdrop-blur">
                <span className="text-lg leading-none">{BADGE_MAP[id].emoji}</span>
                {BADGE_MAP[id].label}
              </span>
            ) : null,
          )}
        </div>
      )}
      {children && <div className="relative mt-4">{children}</div>}
    </div>
  );
}

function formatSince(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return y && m && d ? `${d}. ${m}. ${y}` : '';
}

/** Statistiky profilu; s `mine` se u kamaráda ukáže i porovnání s tebou */
export function ProfileStats({ stats, mine, name }: { stats: GroupStats; mine?: GroupStats; name?: string }) {
  const fav = favoriteSubject(stats.subjects);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        <Box icon={<Star size={14} />} label="XP" value={stats.xp} vs={mine?.xp} />
        <Box icon={<Flame size={14} className="text-orange-500" />} label="Série" value={stats.streak} vs={mine?.streak} />
        <Box icon={<Target size={14} />} label="Tento týden" value={stats.week} vs={mine?.week} />
        <Box icon={<Trophy size={14} />} label="Úspěšnost" value={<Pct value={stats.accuracy} />} />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
        {fav && (
          <span className="inline-flex items-center gap-1.5">
            <SubjectIcon subject={fav} size="sm" /> Nejsilnější: <b>{SUBJECTS[fav].short}</b>
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <Flame size={15} className="text-slate-400" /> Nejdelší série: <b>{stats.longest ?? stats.streak} {plural(stats.longest ?? stats.streak, 'den', 'dny', 'dní')}</b>
        </span>
        {!!stats.time && (
          <span className="inline-flex items-center gap-1.5">
            <Clock size={15} className="text-slate-400" /> Učení: <b>{formatDuration(stats.time)}</b>
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <Target size={15} className="text-slate-400" /> Otázek celkem: <b>{stats.total}</b>
        </span>
        {stats.since && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={15} className="text-slate-400" /> Učí se od: <b>{formatSince(stats.since)}</b>
          </span>
        )}
      </div>

      <div className="space-y-2">
        {mine && <div className="flex justify-end gap-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"><span className="w-10 truncate text-right">{name?.split(' ')[0] ?? ''}</span><span className="w-10 text-right">ty</span></div>}
        {SUBJECT_IDS.map((id) => (
          <div key={id} className="flex items-center gap-2.5">
            <SubjectIcon subject={id} size="sm" />
            <span className="w-20 text-sm">{SUBJECTS[id].short}</span>
            <ProgressBar value={stats.subjects?.[id] ?? 0} color={SUBJECT_STYLE[id].bar} className="flex-1" />
            <span className="w-10 text-right text-sm font-semibold">
              <Pct value={stats.subjects?.[id] ?? 0} />
            </span>
            {mine && (
              <span className="w-10 text-right text-sm text-slate-500 dark:text-slate-400">
                <Pct value={mine.subjects?.[id] ?? 0} />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Box({ icon, label, value, vs }: { icon: ReactNode; label: string; value: ReactNode; vs?: number }) {
  return (
    <div className="rounded-xl bg-slate-900/[0.04] p-2.5 dark:bg-white/[0.05]">
      <div className="font-display text-lg font-bold">{value}</div>
      <div className="flex items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        {icon} {label}
      </div>
      {vs !== undefined && <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">ty: {vs}</div>}
    </div>
  );
}
