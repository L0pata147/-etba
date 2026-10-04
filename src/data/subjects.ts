import type { Platform, SubjectId, Topic } from '../types';
import { SITE_TOPICS } from './site';
import { HW_TOPICS } from './hw/topics';
import { CLOUD_TOPICS } from './cloud/topics';

export interface SubjectInfo {
  id: SubjectId;
  label: string;
  short: string;
  emoji: string;
  /** Kořenová stránka předmětu */
  path: string;
  exam: string;
}

export const SUBJECTS: Record<SubjectId, SubjectInfo> = {
  cjl: { id: 'cjl', label: 'Český jazyk a literatura', short: 'Čeština', emoji: '📚', path: '/knihy', exam: 'písemná práce + ústní zkouška' },
  site: { id: 'site', label: 'Počítačové sítě a síťové OS', short: 'Sítě', emoji: '🌐', path: '/site', exam: 'praktická + ústní zkouška (20 témat)' },
  hw: { id: 'hw', label: 'Technické vybavení počítačů', short: 'Hardware', emoji: '🖥️', path: '/hw', exam: 'písemný test v Moodlu (60 min)' },
  cloud: { id: 'cloud', label: 'Programové vybavení cloudu', short: 'Cloud', emoji: '☁️', path: '/cloud', exam: 'praktická zkouška' },
};

/** Témata / okruhy jednotlivých IT předmětů */
export const SUBJECT_TOPICS: Record<Exclude<SubjectId, 'cjl'>, Topic[]> = {
  site: SITE_TOPICS,
  hw: HW_TOPICS,
  cloud: CLOUD_TOPICS,
};

export const ALL_TOPICS: Topic[] = [...SITE_TOPICS, ...HW_TOPICS, ...CLOUD_TOPICS];
export const ALL_TOPIC_MAP: Record<string, Topic> = Object.fromEntries(ALL_TOPICS.map((t) => [t.id, t]));

/** Platformy příkazů podle předmětu */
export const SUBJECT_PLATFORMS: Record<'site' | 'cloud', Platform[]> = {
  site: ['cisco', 'linux', 'windows'],
  cloud: ['docker', 'hyperv', 'proxmox'],
};
