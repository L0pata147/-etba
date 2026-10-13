import { Flame } from 'lucide-react';
import { SUBJECTS } from '../data/subjects';
import type { SubjectId } from '../types';
import { statsCtx, type GroupStats } from '../lib/group';
import { BADGE_MAP, TITLE_MAP, safeProfile } from '../lib/profile';
import { levelName } from '../lib/progress';
import { Avatar } from './Avatar';
import { SUBJECT_STYLE, SubjectIcon } from './subjectStyle';
import { Modal, Pct, ProgressBar } from './ui';

const SUBJECT_IDS: SubjectId[] = ['cjl', 'site', 'hw', 'cloud'];

/** Profil člena skupiny ověřený podle jeho souhrnu (zamčené rámečky a tituly se neukážou) */
export const memberProfile = (s: GroupStats) => safeProfile(s.profile, statsCtx(s));
export const memberTitle = (s: GroupStats) => TITLE_MAP[memberProfile(s).title]?.label ?? '';

/** Karta kamaráda – otevře se po kliknutí v žebříčku */
export function FriendProfile({ name, stats, open, onClose, rank }: { name: string; stats: GroupStats | null; open: boolean; onClose: () => void; rank?: number }) {
  if (!stats) return null;
  const p = memberProfile(stats);
  const s = stats;
  return (
    <Modal open={open} onClose={onClose} title="Profil">
      <div className="-mx-5 -mt-5 mb-4 flex items-center gap-4 bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-5 text-white">
        <Avatar name={name} avatar={p.avatar} frame={p.frame} size="lg" />
        <div className="min-w-0">
          <div className="truncate font-display text-xl font-bold">{name}</div>
          <div className="text-sm text-brand-100">{TITLE_MAP[p.title]?.label}</div>
          <div className="mt-0.5 text-xs text-brand-200">
            Úroveň {s.level} · {levelName(s.level)}
            {rank ? ` · ${rank}. místo ve skupině` : ''}
          </div>
        </div>
      </div>

      {p.showcase.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {p.showcase.map((id) => (
            <span key={id} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900/[0.05] px-2.5 py-1.5 text-sm font-semibold dark:bg-white/[0.06]">
              <span className="text-lg">{BADGE_MAP[id].emoji}</span>
              {BADGE_MAP[id].label}
            </span>
          ))}
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        <Box label="XP" value={s.xp} />
        <Box label="Série" value={<span className="inline-flex items-center gap-1"><Flame size={15} className={s.streak ? 'text-orange-500' : ''} />{s.streak}</span>} />
        <Box label="Tento týden" value={s.week} />
        <Box label="Úspěšnost" value={<Pct value={s.accuracy} />} />
      </div>

      <div className="space-y-2">
        {SUBJECT_IDS.map((id) => (
          <div key={id} className="flex items-center gap-2.5">
            <SubjectIcon subject={id} size="sm" />
            <span className="w-20 text-sm">{SUBJECTS[id].short}</span>
            <ProgressBar value={s.subjects?.[id] ?? 0} color={SUBJECT_STYLE[id].bar} className="flex-1" />
            <span className="w-10 text-right text-sm font-semibold">
              <Pct value={s.subjects?.[id] ?? 0} />
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Celkem {s.total} otázek · nejdelší série {s.longest ?? s.streak} dní</p>
    </Modal>
  );
}

function Box({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-900/[0.04] p-2.5 dark:bg-white/[0.05]">
      <div className="font-display text-lg font-bold">{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}
