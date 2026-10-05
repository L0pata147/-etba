import type { AbcQuestion, FlashcardQuestion, MatchQuestion, Question } from '../types';
import { FUNCTIONAL_STYLES } from '../data/styles';
import { pick, sample, shuffle } from './random';

const base = (factKey: string, prompt: string, explanation: string) => ({
  bookId: 'nonart:styly',
  area: 'nonart2' as const,
  factKey,
  prompt,
  explanation,
  difficulty: 'medium' as const,
});

const names = FUNCTIONAL_STYLES.map((s) => s.name);

/** Otázky na funkční styly podle školní tabulky */
export function generateStyleQuestions(): Question[] {
  const qs: Question[] = [];
  // útvary, které patří jen do jednoho stylu (recenze a kritika jsou odborné i publicistické)
  const formCount = new Map<string, number>();
  for (const s of FUNCTIONAL_STYLES) for (const f of s.forms) formCount.set(f, (formCount.get(f) ?? 0) + 1);

  for (const s of FUNCTIONAL_STYLES) {
    const summary = `Styl ${s.name}\nRysy: ${s.features.join(', ')}\nPostup: ${s.procedures.join(', ')}\nÚtvary: ${s.forms.join(', ')}`;
    const card: FlashcardQuestion = { ...base(`styl-${s.id}`, `Funkční styl ${s.name}: jaké má rysy, převažující slohový postup a útvary?`, summary), id: `styl-${s.id}|flashcard`, type: 'flashcard', answer: summary };
    qs.push(card);

    // podle rysů poznej styl (3 náhodné rysy)
    const options = shuffle(names);
    const feat: AbcQuestion = {
      ...base(`styl-${s.id}-rysy`, `Který funkční styl má tyto rysy?\n${sample(s.features, Math.min(3, s.features.length)).join(', ')}`, summary),
      id: `styl-${s.id}-rysy|abc`,
      type: 'abc',
      options,
      correctIndex: options.indexOf(s.name),
    };
    qs.push(feat);

    s.forms
      .filter((f) => formCount.get(f) === 1)
      .forEach((f, i) => {
        const opts = shuffle(names);
        const q: AbcQuestion = {
          ...base(`utvar-${s.id}-${i}`, `Do kterého funkčního stylu patří útvar „${f}“?`, `${f} → styl ${s.name}`),
          id: `utvar-${s.id}-${i}|abc`,
          type: 'abc',
          options: opts,
          correctIndex: opts.indexOf(s.name),
        };
        qs.push(q);
      });
  }

  // přiřazování styl → typický útvar
  const match: MatchQuestion = {
    ...base('styly-match', 'Přiřaď ke každému funkčnímu stylu typický slohový útvar.', FUNCTIONAL_STYLES.map((s) => `${s.name}: ${s.forms.join(', ')}`).join('\n')),
    id: 'styly-match|match',
    type: 'match',
    leftLabel: 'Funkční styl',
    rightLabel: 'Útvar',
    pairs: FUNCTIONAL_STYLES.map((s) => ({ left: s.name, right: pick(s.forms.filter((f) => formCount.get(f) === 1)) })),
  };
  qs.push(match);
  return qs;
}
