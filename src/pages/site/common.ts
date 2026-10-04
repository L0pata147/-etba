import type { Difficulty, Platform, QuestionType } from '../../types';
import type { SessionConfig } from '../../lib/session';
import type { SitePoolOptions } from '../../lib/topicgen';

export const PLATFORMS: Platform[] = ['cisco', 'linux', 'windows'];

/** Konfigurace tréninku z Počítačových sítí */
export function siteConfig(
  title: string,
  site: SitePoolOptions,
  opts: { mode?: string; difficulty?: Difficulty; types?: QuestionType[]; count?: number } = {},
): SessionConfig {
  return {
    title,
    mode: opts.mode ?? 'site',
    difficulty: opts.difficulty ?? 'medium',
    bookIds: [],
    areas: [],
    types: opts.types ?? [],
    count: opts.count ?? 15,
    subject: 'site',
    site,
  };
}

export const TOPIC_TYPES: QuestionType[] = ['flashcard', 'abc', 'truefalse', 'identifyTerm', 'order', 'open'];

export function topicConfig(topicIds: string[], title: string, difficulty: Difficulty = 'medium', count = 15): SessionConfig {
  const types: QuestionType[] =
    difficulty === 'easy' ? ['flashcard', 'abc', 'truefalse'] : difficulty === 'medium' ? ['abc', 'truefalse', 'identifyTerm', 'order', 'flashcard'] : ['open', 'identifyTerm', 'order'];
  return siteConfig(title, { topicIds }, { difficulty, types, count, mode: 'site-temata' });
}

export function commandsConfig(platforms: Platform[], title: string, count = 15): SessionConfig {
  return siteConfig(title, { topics: false, commands: platforms }, { types: ['fill', 'abc'], count, mode: 'site-prikazy' });
}

export function proceduresConfig(platforms: Platform[], title: string, count = 8): SessionConfig {
  return siteConfig(title, { topics: false, commands: platforms, procedures: true }, { types: ['order'], count, mode: 'site-postupy' });
}

export function calcConfig(count = 12): SessionConfig {
  return siteConfig('Síťové výpočty', { topics: false, calc: true }, { types: ['fill'], count, mode: 'site-vypocty' });
}
