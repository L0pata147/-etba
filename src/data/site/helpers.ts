import type { KeyPoint, SubjectId, Topic } from '../../types';

type Outline = [heading: string, points: string[]][];
type Quiz = [q: string, a: string, wrong: string[], why?: string][];
type Deep = { q: string; answer: string; points: [label: string, keywords: string[]][] }[];

type TopicFn = (number: number, id: string, title: string, summary: string, outline: Outline, terms: [string, string][], quiz: Quiz, deep: Deep) => Topic;

/** Zkrácený zápis tématu pro daný předmět (id = `${předmět}-${id}`) */
export const topicFor =
  (subject: SubjectId): TopicFn =>
  (...args) =>
    build(subject, ...args);

/** Téma z Počítačových sítí */
export const topic: TopicFn = topicFor('site');

function build(
  subject: SubjectId,
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
    id: `${subject}-${id}`,
    subject,
    number,
    title,
    summary,
    outline: outline.map(([heading, points]) => ({ heading, points })),
    terms: terms.map(([term, def]) => ({ term, def })),
    quiz: quiz.map(([q, a, wrong, why]) => ({ q, a, wrong, why })),
    deep: deep.map((d) => ({ q: d.q, answer: d.answer, points: d.points.map(([label, keywords]): KeyPoint => ({ label, keywords })) })),
  };
}
