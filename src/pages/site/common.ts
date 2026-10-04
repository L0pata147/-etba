import type { Difficulty, Platform, QuestionType } from '../../types';
import type { SessionConfig } from '../../lib/session';
import { platformSubject, type ItSubject, type SitePoolOptions } from '../../lib/topicgen';
import { ALL_TOPIC_MAP } from '../../data/subjects';

export const PLATFORMS: Platform[] = ['cisco', 'linux', 'windows'];

/** Konfigurace tréninku z Počítačových sítí */
export function siteConfig(
  title: string,
  site: SitePoolOptions,
  opts: { mode?: string; difficulty?: Difficulty; types?: QuestionType[]; count?: number; subject?: ItSubject | 'it' } = {},
): SessionConfig {
  return {
    title,
    mode: opts.mode ?? 'site',
    difficulty: opts.difficulty ?? 'medium',
    bookIds: [],
    areas: [],
    types: opts.types ?? [],
    count: opts.count ?? 15,
    subject: opts.subject ?? 'site',
    site,
  };
}

export const TOPIC_TYPES: QuestionType[] = ['flashcard', 'abc', 'truefalse', 'identifyTerm', 'order', 'open'];

export function topicConfig(topicIds: string[], title: string, difficulty: Difficulty = 'medium', count = 15): SessionConfig {
  const types: QuestionType[] =
    difficulty === 'easy' ? ['flashcard', 'abc', 'truefalse'] : difficulty === 'medium' ? ['abc', 'truefalse', 'identifyTerm', 'order', 'flashcard'] : ['open', 'identifyTerm', 'order'];
  const subjects = new Set(topicIds.map((id) => ALL_TOPIC_MAP[id]?.subject ?? 'site'));
  const subject = subjects.size === 1 ? ([...subjects][0] as ItSubject) : 'it';
  return siteConfig(title, { topicIds }, { difficulty, types, count, mode: 'site-temata', subject });
}

export function commandsConfig(platforms: Platform[], title: string, count = 15): SessionConfig {
  return siteConfig(title, { topics: false, commands: platforms }, { types: ['fill', 'abc'], count, mode: 'site-prikazy', subject: platformSubject(platforms[0]) });
}

export function proceduresConfig(platforms: Platform[], title: string, count = 8): SessionConfig {
  return siteConfig(title, { topics: false, commands: platforms, procedures: true }, { types: ['order'], count, mode: 'site-postupy', subject: platformSubject(platforms[0]) });
}

export function calcConfig(count = 12, subject: 'site' | 'hw' = 'site'): SessionConfig {
  return siteConfig(subject === 'site' ? 'Síťové výpočty' : 'Převody a výpočty – hardware', { topics: false, calc: true }, { types: ['fill'], count, mode: `${subject}-vypocty`, subject });
}
