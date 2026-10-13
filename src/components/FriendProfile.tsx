import { statsCtx, type GroupStats } from '../lib/group';
import { TITLE_MAP, safeProfile } from '../lib/profile';
import { ProfileHero, ProfileStats } from './ProfileCard';
import { Modal } from './ui';

/** Profil člena skupiny ověřený podle jeho souhrnu (zamčené rámečky, pozadí a tituly se neukážou) */
export const memberProfile = (s: GroupStats) => safeProfile(s.profile, statsCtx(s));
export const memberTitle = (s: GroupStats) => TITLE_MAP[memberProfile(s).title]?.label ?? '';

/** Karta kamaráda – otevře se po kliknutí v žebříčku; `mine` = tvoje čísla pro porovnání */
export function FriendProfile({ name, stats, open, onClose, rank, mine }: { name: string; stats: GroupStats | null; open: boolean; onClose: () => void; rank?: number; mine?: GroupStats }) {
  if (!stats) return null;
  return (
    <Modal open={open} onClose={onClose} title="Profil">
      <ProfileHero name={name} profile={memberProfile(stats)} xp={stats.xp} rank={rank} className="-mx-5 -mt-5 mb-4" />
      <ProfileStats stats={stats} mine={mine} name={name} />
    </Modal>
  );
}
