import type { Book, Character } from '../../types';

export type BookSeed = Omit<
  Book,
  'notes' | 'favorite' | 'learned' | 'source' | 'createdAt' | 'updatedAt' | 'templateId'
>;

export const ch = (name: string, description: string): Character => ({ name, description });
