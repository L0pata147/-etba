import type { Topic } from '../../types';
import { SITE_TOPICS_1 } from './topics1';
import { SITE_TOPICS_2 } from './topics2';

/** 20 témat ústní zkoušky z Počítačových sítí a síťových OS */
export const SITE_TOPICS: Topic[] = [...SITE_TOPICS_1, ...SITE_TOPICS_2];
export const TOPIC_MAP: Record<string, Topic> = Object.fromEntries(SITE_TOPICS.map((t) => [t.id, t]));
