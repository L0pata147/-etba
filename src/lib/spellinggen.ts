import type { AbcQuestion, Question } from '../types';
import { SPELLING, type SpellingCategory } from '../data/spelling';
import { shuffle } from './random';

/** Pravopisná cvičení jako otázky s výběrem */
export function generateSpellingQuestions(categories?: SpellingCategory[]): Question[] {
  return SPELLING.filter((x) => !categories?.length || categories.includes(x.category)).map((x): AbcQuestion => {
    const options = shuffle([...x.options]);
    const filled = x.category === 'carky' ? `Správně: ${x.answer}` : x.sentence.replace('___', x.answer);
    return {
      id: `${x.id}|abc`,
      bookId: 'pravopis',
      area: 'pravopis',
      factKey: x.id,
      difficulty: 'medium',
      type: 'abc',
      prompt: `Doplň správně:\n${x.sentence}`,
      explanation: `${filled}\n${x.rule}`,
      options,
      correctIndex: options.indexOf(x.answer),
    };
  });
}
