import type { KeyPoint, Topic } from '../../types';

type Outline = [heading: string, points: string[]][];
type Quiz = [q: string, a: string, wrong: string[], why?: string][];
type Deep = { q: string; answer: string; points: [label: string, keywords: string[]][] }[];

/** Zkrácený zápis tématu */
export function topic(
  number: number,
  id: string,
  title: string,
  summary: string,
  outline: Outline,
  terms: [string, string][],
  quiz: Quiz,
  deep: Deep,
): Topic {
  return {
    id: `site-${id}`,
    subject: 'site',
    number,
    title,
    summary,
    outline: outline.map(([heading, points]) => ({ heading, points })),
    terms: terms.map(([term, def]) => ({ term, def })),
    quiz: quiz.map(([q, a, wrong, why]) => ({ q, a, wrong, why })),
    deep: deep.map((d) => ({ q: d.q, answer: d.answer, points: d.points.map(([label, keywords]): KeyPoint => ({ label, keywords })) })),
  };
}
