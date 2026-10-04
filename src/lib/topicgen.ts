import type { AbcQuestion, Difficulty, FillQuestion, FlashcardQuestion, OpenQuestion, OrderQuestion, Platform, Question, Topic, TrueFalseQuestion } from '../types';
import type { SubjectId } from '../types';
import { SITE_TOPICS } from '../data/site';
import { ALL_TOPIC_MAP, SUBJECT_TOPICS } from '../data/subjects';
import { ALL_COMMANDS, PLATFORM_LABEL } from '../data/site/commands';
import { ALL_PROCEDURES } from '../data/site/procedures';
import { generateHwCalcQuestions } from './hwgen';
import { pick, sample, shuffle, uniqueStrings } from './random';
import { autoPoints } from './text';
import { generateCalcQuestions } from './netgen';

type AreaIt = 'it-pojmy' | 'it-teorie' | 'it-ustni' | 'it-prikazy' | 'it-postupy' | 'it-vypocty';

const mk = (bookId: string, area: AreaIt, factKey: string, difficulty: Difficulty, prompt: string, explanation: string) => ({
  bookId,
  area,
  factKey,
  difficulty,
  prompt,
  explanation,
});

/** Otázka zkoušejícího k celému tématu (simulace ústní zkoušky) */
export function topicExamQuestion(t: Topic): OpenQuestion {
  const model = t.outline.map((o) => `${o.heading}\n${o.points.map((p) => `• ${p}`).join('\n')}`).join('\n\n');
  const points = t.outline.map((o) => {
    const kws = autoPoints(o.points.join('. '), 3).flatMap((p) => p.keywords);
    const uniq = [...new Set(kws)].slice(0, 6);
    return { label: o.heading, keywords: uniq.length ? uniq : [o.heading], minHits: uniq.length >= 4 ? 2 : 1 };
  });
  return {
    ...mk(t.id, 'it-ustni', 'exam', 'maturita', `Vylosoval(a) sis téma ${t.number}: ${t.title}.\nVylož ho tak, jako bys mluvil(a) před komisí.`, t.summary),
    id: `${t.id}|exam|open`,
    type: 'open',
    modelAnswer: `${t.summary}\n\n${model}`,
    points,
  };
}

export function generateTopicQuestions(t: Topic, all: Topic[] = t.subject === 'cjl' ? SITE_TOPICS : SUBJECT_TOPICS[t.subject]): Question[] {
  const qs: Question[] = [];
  const otherTerms = all.filter((x) => x.id !== t.id).flatMap((x) => x.terms);

  // Pojmy
  t.terms.forEach((term, i) => {
    const exp = `${term.term}: ${term.def}`;
    const card: FlashcardQuestion = { ...mk(t.id, 'it-pojmy', `term-${i}`, 'easy', `${t.title}: co je „${term.term}“?`, exp), id: `${t.id}|term-${i}|flashcard`, type: 'flashcard', answer: term.def };
    qs.push(card);
    const pool = uniqueStrings([...t.terms.filter((x) => x.term !== term.term), ...shuffle(otherTerms)].map((x) => x.term), [term.term]).slice(0, 3);
    if (pool.length >= 2) {
      const options = shuffle([term.term, ...pool]);
      const abc: AbcQuestion = { ...mk(t.id, 'it-pojmy', `term-${i}`, 'easy', `Který pojem odpovídá popisu?\n„${term.def}“`, exp), id: `${t.id}|term-${i}|abc`, type: 'abc', options, correctIndex: options.indexOf(term.term) };
      qs.push(abc);
    }
    const fill: FillQuestion = {
      ...mk(t.id, 'it-pojmy', `term-${i}`, 'medium', `Jaký pojem je popsán?\n„${term.def}“`, exp),
      id: `${t.id}|term-${i}|identifyTerm`,
      type: 'identifyTerm',
      answer: term.term,
      accepted: uniqueStrings([term.term, term.term.replace(/\(.*?\)/g, '').trim(), ...[...term.term.matchAll(/\((.*?)\)/g)].map((m) => m[1])]),
    };
    qs.push(fill);
  });

  // Teorie – kvízové otázky
  t.quiz.forEach((item, i) => {
    const exp = item.why ? `${item.a}. ${item.why}` : `Správně: ${item.a}.`;
    const options = shuffle([item.a, ...item.wrong.slice(0, 3)]);
    const abc: AbcQuestion = { ...mk(t.id, 'it-teorie', `quiz-${i}`, 'easy', item.q, exp), id: `${t.id}|quiz-${i}|abc`, type: 'abc', options, correctIndex: options.indexOf(item.a) };
    qs.push(abc);
    const useTrue = Math.random() < 0.5;
    const tf: TrueFalseQuestion = {
      ...mk(t.id, 'it-teorie', `quiz-${i}`, 'easy', `${item.q}\nOdpověď: ${useTrue ? item.a : pick(item.wrong)}`, exp),
      id: `${t.id}|quiz-${i}|truefalse`,
      type: 'truefalse',
      isTrue: useTrue,
    };
    qs.push(tf);
    const card: FlashcardQuestion = { ...mk(t.id, 'it-teorie', `quiz-${i}`, 'easy', item.q, exp), id: `${t.id}|quiz-${i}|flashcard`, type: 'flashcard', answer: item.why ? `${item.a}\n\n${item.why}` : item.a };
    qs.push(card);
  });

  // Osnova – kartičky po částech a seřazení osnovy
  t.outline.forEach((o, i) => {
    const card: FlashcardQuestion = {
      ...mk(t.id, 'it-ustni', `outline-${i}`, 'medium', `Téma ${t.number} – ${t.title}\nCo říct k části „${o.heading}“?`, o.points.join('\n')),
      id: `${t.id}|outline-${i}|flashcard`,
      type: 'flashcard',
      answer: o.points.map((p) => `• ${p}`).join('\n'),
    };
    qs.push(card);
    const open: OpenQuestion = {
      ...mk(t.id, 'it-ustni', `outline-${i}`, 'hard', `Téma ${t.number} – ${t.title}: vysvětli „${o.heading}“.`, o.points.join('\n')),
      id: `${t.id}|outline-${i}|open`,
      type: 'open',
      modelAnswer: o.points.map((p) => `• ${p}`).join('\n'),
      points: autoPoints(o.points.join('. '), 5),
    };
    if (open.points.length) qs.push(open);
  });
  if (t.outline.length >= 3) {
    const order: OrderQuestion = {
      ...mk(t.id, 'it-ustni', 'outline-order', 'medium', `Seřaď části výkladu tématu „${t.title}“ v logickém pořadí (jak je projdeš u zkoušky).`, t.outline.map((o, i) => `${i + 1}. ${o.heading}`).join('\n')),
      id: `${t.id}|outline-order|order`,
      type: 'order',
      items: t.outline.map((o) => o.heading),
    };
    qs.push(order);
  }

  // Hlubší otázky
  t.deep.forEach((d, i) => {
    const open: OpenQuestion = { ...mk(t.id, 'it-ustni', `deep-${i}`, 'hard', d.q, d.answer), id: `${t.id}|deep-${i}|open`, type: 'open', modelAnswer: d.answer, points: d.points };
    qs.push(open);
  });

  qs.push(topicExamQuestion(t));
  return qs;
}

const CLOUD_PLATFORMS: Platform[] = ['docker', 'hyperv', 'proxmox'];
/** Předmět, ke kterému platforma patří */
export const platformSubject = (p: Platform): 'site' | 'cloud' => (CLOUD_PLATFORMS.includes(p) ? 'cloud' : 'site');

/** Otázky trenažéru příkazů */
export function generateCommandQuestions(platforms: Platform[] = ['cisco', 'linux', 'windows']): Question[] {
  const qs: Question[] = [];
  for (const c of ALL_COMMANDS.filter((x) => platforms.includes(x.platform))) {
    const bookId = `${platformSubject(c.platform)}-prikazy-${c.platform}`;
    const exp = `${c.command}${c.note ? `\n${c.note}` : ''}${c.accepted?.length ? `\nTaké lze: ${c.accepted.slice(0, 3).join(' · ')}` : ''}`;
    const fill: FillQuestion = {
      ...mk(bookId, 'it-prikazy', c.id, 'medium', `${PLATFORM_LABEL[c.platform]} · ${c.group}\n${c.task}`, exp),
      id: `${c.id}|fill`,
      type: 'fill',
      answer: c.command,
      accepted: [c.command, ...(c.accepted ?? [])],
      required: (c as { required?: string[] }).required,
      command: true,
      inputLabel: 'Napiš příkaz',
    };
    qs.push(fill);
    const same = ALL_COMMANDS.filter((x) => x.platform === c.platform && x.id !== c.id).map((x) => x.command);
    const options = shuffle([c.command, ...sample(uniqueStrings(same, [c.command]), 3)]);
    const abc: AbcQuestion = {
      ...mk(bookId, 'it-prikazy', c.id, 'easy', `${PLATFORM_LABEL[c.platform]}: ${c.task}`, exp),
      id: `${c.id}|abc`,
      type: 'abc',
      options,
      correctIndex: options.indexOf(c.command),
    };
    qs.push(abc);
  }
  return qs;
}

/** Seřazování kroků postupů */
export function generateProcedureQuestions(platforms: Platform[] = ['cisco', 'linux', 'windows']): Question[] {
  return ALL_PROCEDURES.filter((p) => platforms.includes(p.platform) && p.steps.length >= 3).map((p): Question => ({
    ...mk(`${platformSubject(p.platform)}-postupy-${p.platform}`, 'it-postupy', p.id, 'medium', `${PLATFORM_LABEL[p.platform]} – ${p.title}\nSeřaď kroky postupu ve správném pořadí.`, p.steps.map((s, i) => `${i + 1}. ${s.text}${s.cmd ? `\n   ${s.cmd.split('\n')[0]}` : ''}`).join('\n')),
    id: `${p.id}|order`,
    type: 'order',
    items: p.steps.map((s) => s.text),
  }));
}

export interface SitePoolOptions {
  topicIds?: string[];
  topics?: boolean;
  commands?: Platform[];
  procedures?: boolean;
  calc?: boolean;
}

export type ItSubject = Exclude<SubjectId, 'cjl'>;

/** Všechny otázky z IT předmětu podle výběru */
export function buildSubjectPool(subject: ItSubject, opts: SitePoolOptions): Question[] {
  const out: Question[] = [];
  const all = SUBJECT_TOPICS[subject];
  if (opts.topics !== false) {
    const topics = opts.topicIds?.length ? all.filter((t) => opts.topicIds!.includes(t.id)) : all;
    // pozn.: když vybraná témata patří jinému předmětu, z tohoto se nevezme žádné
    for (const t of topics) out.push(...generateTopicQuestions(t, all));
  }
  const platforms = opts.commands?.filter((p) => platformSubject(p) === subject) ?? [];
  if (platforms.length) out.push(...generateCommandQuestions(platforms));
  if (opts.procedures && platforms.length) out.push(...generateProcedureQuestions(platforms));
  if (opts.calc) out.push(...(subject === 'hw' ? generateHwCalcQuestions(3) : subject === 'site' ? generateCalcQuestions(3) : []));
  return out;
}

/** Otázky z Počítačových sítí podle výběru */
export const buildSitePool = (opts: SitePoolOptions) => buildSubjectPool('site', opts);

const SUBJECT_SHORT: Record<ItSubject, string> = { site: 'Sítě', hw: 'Hardware', cloud: 'Cloud' };

/** Popisek „knihy“ pro otázky z IT předmětů */
export function itemLabel(id: string): string | null {
  const m = id.match(/^(site|hw|cloud)-(vypocty|prikazy|postupy)(?:-(.+))?$/);
  if (m) {
    const [, subj, kind, platform] = m;
    if (kind === 'vypocty') return `${SUBJECT_SHORT[subj as ItSubject]} – výpočty`;
    return `${kind === 'prikazy' ? 'Příkazy' : 'Postupy'} – ${PLATFORM_LABEL[platform as Platform] ?? platform}`;
  }
  const t = ALL_TOPIC_MAP[id];
  return t ? `${SUBJECT_SHORT[t.subject as ItSubject]} ${t.number}: ${t.title}` : null;
}
