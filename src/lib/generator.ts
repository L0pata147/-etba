import type {
  AbcQuestion,
  AreaId,
  Book,
  Difficulty,
  FillQuestion,
  FlashcardQuestion,
  KeyPoint,
  MatchQuestion,
  NonArtText,
  OpenQuestion,
  OrderQuestion,
  Question,
  Term,
  TrueFalseQuestion,
} from '../types';
import { AREA_MAP, CATEGORIES, EXAM_AREAS, KINDS, LITERARY_PERIODS } from '../data/osnova';
import { TERMS, TERM_CATEGORIES } from '../data/terms';
import { NONART_TEXTS } from '../data/nonart';
import { pick, sample, shuffle, uniqueStrings } from './random';
import { autoPoints, firstSentence, listPoints, tokenize, truncate } from './text';

// ---------- pomocné funkce ----------

const FALLBACK_AUTHORS = [
  'Božena Němcová',
  'Jan Neruda',
  'Jaroslav Hašek',
  'Bohumil Hrabal',
  'Vladislav Vančura',
  'William Shakespeare',
  'Victor Hugo',
  'Fjodor Michajlovič Dostojevskij',
  'Alois Jirásek',
  'Karel Čapek',
];
const FALLBACK_TITLES = [
  'Babička',
  'Válka s mloky',
  'Osudy dobrého vojáka Švejka',
  'Romeo a Julie',
  'Bídníci',
  'Zločin a trest',
  'Obsluhoval jsem anglického krále',
  'Maryša',
  '1984',
];
const GENERIC_CHARACTER = /^(vypravěč|otec|matka|chůva|kněz|žalářník|turisté|psi|ovce|tři |posluhovačka|prokurista|bajzovi|učitelé|hamelnští|obři|liliputáni|laputané|žraloci|pilot)/i;

export function titleAccepted(b: Pick<Book, 'title'>): string[] {
  return uniqueStrings([b.title, b.title.replace(/[.,!?–-]/g, ' ')]);
}

export function authorAccepted(b: Pick<Book, 'author'>): string[] {
  if (/nezn[aá]m/i.test(b.author)) return ['neznámý', 'anonym', 'anonymní', 'autor neznámý', 'neznámý autor'];
  const tokens = b.author.split(/\s+/);
  const last = tokens[tokens.length - 1];
  const lastParts = last.split('-');
  return uniqueStrings([b.author, last, lastParts[lastParts.length - 1], tokens.slice(-2).join(' ')]);
}

function nameAccepted(name: string): string[] {
  const main = name.replace(/\(.*?\)/g, '').trim();
  const inParens = [...name.matchAll(/\((.*?)\)/g)].map((m) => m[1]);
  const parts = main.split(/\s+/).filter((p) => p.length >= 3);
  return uniqueStrings([name, main, ...parts, ...inParens]);
}

function isNamedCharacter(name: string): boolean {
  return !GENERIC_CHARACTER.test(name) && !/\(.*,.*\)/.test(name);
}

/** Přibližný rok vzniku (pro řazení) */
export function approxYear(year: string): number {
  const m = year.match(/\d{4}/);
  if (m) return Number(m[0]);
  const c = year.match(/(\d{1,2})\.\s*stolet/);
  if (c) {
    const century = Number(c[1]);
    const half = /2\.\s*polovin/.test(year) ? 75 : /1\.\s*polovin/.test(year) ? 25 : 50;
    return (century - 1) * 100 + half;
  }
  return NaN;
}

interface Base {
  bookId: string;
  area: AreaId;
  factKey: string;
  prompt: string;
  explanation: string;
  difficulty: Difficulty;
  relatedBookIds?: string[];
  passage?: { label: string; text: string }[];
}

const qid = (b: Base, type: string) => `${b.bookId}|${b.factKey}|${type}`;

function makeAbc(
  base: Base,
  correct: string,
  distractors: string[],
  noteFor?: (option: string) => string | undefined,
): AbcQuestion | null {
  const opts = uniqueStrings(distractors, [correct]);
  if (opts.length < 2) return null;
  const chosen = sample(opts, Math.min(3, opts.length));
  const options = shuffle([correct, ...chosen]);
  return {
    ...base,
    id: qid(base, 'abc'),
    type: 'abc',
    options,
    correctIndex: options.indexOf(correct),
    optionNotes: noteFor ? options.map((o) => (o === correct ? undefined : noteFor(o)) ?? '') : undefined,
  };
}

function makeTF(base: Base, trueStatement: string, falseStatements: string[]): TrueFalseQuestion {
  const useTrue = !falseStatements.length || Math.random() < 0.5;
  return {
    ...base,
    id: qid(base, 'truefalse'),
    type: 'truefalse',
    prompt: useTrue ? trueStatement : pick(falseStatements),
    isTrue: useTrue,
  };
}

function makeFlash(base: Base, answer: string): FlashcardQuestion {
  return { ...base, id: qid(base, 'flashcard'), type: 'flashcard', answer };
}

function makeFill(base: Base, type: FillQuestion['type'], answer: string, accepted: string[]): FillQuestion {
  return { ...base, id: qid(base, type), type, answer, accepted };
}

function makeOpen(base: Base, modelAnswer: string, points: KeyPoint[]): OpenQuestion | null {
  if (!modelAnswer.trim() || !points.length) return null;
  return { ...base, id: qid(base, 'open'), type: 'open', modelAnswer, points };
}

function push<T>(arr: T[], item: T | null | undefined) {
  if (item) arr.push(item);
}

// ---------- texty oblastí (pro simulaci a otevřené otázky) ----------

export function areaText(b: Book, area: AreaId): string {
  switch (area) {
    case 'context':
      return b.scenes[0] ? `${b.scenes[0].context} ${b.plot}` : b.plot;
    case 'theme':
      return [b.theme, b.motifs.length ? `Motivy: ${b.motifs.join(', ')}.` : '', b.mainIdea].filter(Boolean).join(' ');
    case 'chronotope':
      return [b.setting, b.time].filter(Boolean).join(' ');
    case 'composition':
      return b.composition;
    case 'genre':
      return `${KINDS[b.kind]} – ${b.genre}.`;
    case 'narrator':
      return b.narrator;
    case 'characters':
      return [...b.mainCharacters, ...b.sideCharacters.slice(0, 3)].map((c) => `${c.name}: ${c.description}`).join('\n');
    case 'narrative':
      return b.narrativeModes;
    case 'speech':
      return b.speechTypes;
    case 'verse':
      return b.verse.trim() || `Dílo je psáno prózou${b.kind === 'drama' ? ' (drama v próze)' : ''}; veršová výstavba se v něm neuplatňuje.`;
    case 'language':
      return b.language;
    case 'tropes':
      return b.tropes;
    case 'authorContext':
      return [b.authorContext, b.otherWorks.length ? `Další díla: ${b.otherWorks.join(', ')}.` : ''].filter(Boolean).join(' ');
    case 'litContext':
      return [`${b.period}; ${b.movement}.`, b.historicalContext].filter(Boolean).join(' ');
    case 'basics':
      return `${b.title} – ${b.author} (${b.authorLife}), ${b.year}. ${KINDS[b.kind]}, ${b.genre}. ${CATEGORIES[b.category].label}.`;
    default:
      return '';
  }
}

export function areaPoints(b: Book, area: AreaId): KeyPoint[] {
  switch (area) {
    case 'characters':
      return listPoints(b.mainCharacters.map((c) => c.name)).concat(
        b.mainCharacters.length < 3 ? listPoints(b.sideCharacters.slice(0, 2).map((c) => c.name)) : [],
      );
    case 'theme': {
      const pts = autoPoints(b.theme, 2);
      return pts.concat(listPoints(b.motifs.slice(0, 4)));
    }
    case 'genre':
      return [
        { label: `Literární druh: ${KINDS[b.kind]}`, keywords: kindKeywords(b.kind) },
        ...autoPoints(b.genre, 2).map((p) => ({ ...p, minHits: 1 })),
      ];
    case 'verse':
      return b.verse.trim()
        ? autoPoints(b.verse, 4)
        : [{ label: 'Dílo je psáno prózou (nejde o verš)', keywords: ['próz', 'nevers', 'bez verš', 'není verš'] }];
    case 'basics':
      return [
        { label: `Autor: ${b.author}`, keywords: authorAccepted(b).slice(1, 2).concat(authorAccepted(b)[0]) },
        { label: `Vznik: ${b.year}`, keywords: tokenize(b.year).filter((t) => /\d/.test(t)).slice(0, 1).concat(['stolet']) },
        { label: `Druh: ${KINDS[b.kind]}`, keywords: kindKeywords(b.kind) },
        { label: `Žánr: ${b.genre}`, keywords: tokenize(b.genre).filter((w) => w.length >= 5).slice(0, 2) },
      ].filter((p) => p.keywords.length);
    default:
      return autoPoints(areaText(b, area), 6);
  }
}

function kindKeywords(kind: Book['kind']): string[] {
  switch (kind) {
    case 'epika':
      return ['epik', 'epick'];
    case 'lyrika':
      return ['lyrik', 'lyrick'];
    case 'drama':
      return ['drama', 'dramat'];
    default:
      return ['lyricko', 'lyrickoepi'];
  }
}

// ---------- otázky ke knize ----------

export function generateBookQuestions(b: Book, all: Book[]): Question[] {
  const qs: Question[] = [];
  const others = all.filter((x) => x.id !== b.id);
  const T = b.title;
  const base = (factKey: string, area: AreaId, difficulty: Difficulty, prompt: string, explanation: string): Base => ({
    bookId: b.id,
    area,
    factKey,
    prompt,
    explanation,
    difficulty,
  });

  // --- Autor ---
  if (b.author.trim()) {
    const authorOthers = uniqueStrings([...others.map((o) => o.author), ...FALLBACK_AUTHORS], [b.author]);
    const explanation = `${T} napsal(a) ${b.author}${b.authorLife ? ` (${b.authorLife})` : ''}. ${firstSentence(b.authorContext, 200)}`;
    push(
      qs,
      makeAbc(base('author', 'basics', 'easy', `Kdo je autorem díla ${T}?`, explanation), b.author, authorOthers, (opt) => {
        const works = all.filter((o) => o.author === opt).map((o) => o.title);
        return works.length ? `${opt} je autorem díla ${works.join(', ')}.` : undefined;
      }),
    );
    qs.push(
      makeTF(
        base('author', 'basics', 'easy', '', explanation),
        `Autorem díla ${T} je ${b.author}.`,
        sample(authorOthers, 3).map((a) => `Autorem díla ${T} je ${a}.`),
      ),
    );
    qs.push(makeFlash(base('author', 'basics', 'easy', `Kdo je autorem díla ${T}?`, explanation), `${b.author}${b.authorLife ? ` (${b.authorLife})` : ''}`));
    qs.push(makeFill(base('author', 'basics', 'medium', `Autorem díla ${T} je ______.`, explanation), 'fill', b.author, authorAccepted(b)));
    qs.push(makeFill(base('author-id', 'basics', 'medium', `Napiš autora díla: ${T}`, explanation), 'identifyAuthor', b.author, authorAccepted(b)));
  }

  // --- Rok ---
  if (b.year.trim()) {
    const y = approxYear(b.year);
    const yearOthers = uniqueStrings(others.map((o) => o.year).filter((oy) => Math.abs(approxYear(oy) - y) > 5 || isNaN(y)));
    const exp = `${T} vzniklo / vyšlo: ${b.year}. Zařazení: ${b.period}.`;
    push(qs, makeAbc(base('year', 'basics', 'easy', `Kdy vzniklo (vyšlo) dílo ${T}?`, exp), b.year, yearOthers));
    qs.push(makeFlash(base('year', 'basics', 'easy', `Kdy vzniklo dílo ${T} a do jakého období patří?`, exp), `${b.year} – ${b.period}`));
  }

  // --- Kategorie ---
  const catExp = `${T} patří do kategorie: ${CATEGORIES[b.category].label}.`;
  push(
    qs,
    makeAbc(
      base('category', 'basics', 'easy', `Do které kategorie maturitního seznamu patří ${T}?`, catExp),
      CATEGORIES[b.category].label,
      Object.values(CATEGORIES).map((c) => c.label),
    ),
  );
  qs.push(
    makeTF(
      base('category', 'basics', 'easy', '', catExp),
      `${T} patří do kategorie „${CATEGORIES[b.category].short}“.`,
      Object.entries(CATEGORIES)
        .filter(([k]) => k !== b.category)
        .map(([, c]) => `${T} patří do kategorie „${c.short}“.`),
    ),
  );

  // --- Druh a žánr ---
  const kindExp = `${T} je ${KINDS[b.kind].toLowerCase()} – ${b.genre}. ${kindReason(b)}`;
  push(qs, makeAbc(base('kind', 'genre', 'easy', `Jaký je literární druh díla ${T}?`, kindExp), KINDS[b.kind], Object.values(KINDS)));
  qs.push(
    makeTF(
      base('kind', 'genre', 'easy', '', kindExp),
      `${T} patří k literárnímu druhu: ${KINDS[b.kind].toLowerCase()}.`,
      Object.entries(KINDS)
        .filter(([k]) => k !== b.kind)
        .map(([, v]) => `${T} patří k literárnímu druhu: ${v.toLowerCase()}.`),
    ),
  );
  if (b.genre.trim()) {
    const genreOthers = others.map((o) => o.genre).filter((g) => tokenize(g)[0] !== tokenize(b.genre)[0] && !similar(g, b.genre));
    push(qs, makeAbc(base('genre', 'genre', 'easy', `Jaký žánr má dílo ${T}?`, kindExp), b.genre, genreOthers));
    qs.push(makeFlash(base('genre', 'genre', 'easy', `Urči literární druh a žánr díla ${T}.`, kindExp), `${KINDS[b.kind]} – ${b.genre}`));
    qs.push(
      makeTF(
        base('genre', 'genre', 'easy', '', kindExp),
        `${T} je z hlediska žánru ${b.genre}.`,
        sample(genreOthers, 2).map((g) => `${T} je z hlediska žánru ${g}.`),
      ),
    );
  }

  // --- Období / směr ---
  if (b.movement.trim() || b.period.trim()) {
    const exp = `${T}: ${b.period}; ${b.movement}. ${firstSentence(b.historicalContext, 220)}`;
    const movOthers = others.map((o) => o.movement).filter((m) => normalizeFirst(m) !== normalizeFirst(b.movement) && !similar(m, b.movement));
    push(qs, makeAbc(base('movement', 'litContext', 'easy', `K jakému literárnímu směru / proudu se řadí ${T}?`, exp), b.movement, movOthers));
    const perOthers = others.filter((o) => o.category !== b.category).map((o) => o.period).filter((p) => !similar(p, b.period));
    push(qs, makeAbc(base('period', 'litContext', 'medium', `Do jakého literárního období patří ${T}?`, exp), b.period, perOthers));
    qs.push(makeFlash(base('movement', 'litContext', 'easy', `Do jakého období a směru patří ${T}?`, exp), `${b.period}; ${b.movement}`));
    qs.push(
      makeTF(base('movement', 'litContext', 'easy', '', exp), `${T} se řadí k proudu: ${b.movement}.`, sample(movOthers, 2).map((m) => `${T} se řadí k proudu: ${m}.`)),
    );
  }

  // --- Vypravěč ---
  if (b.narratorShort.trim()) {
    const exp = b.narrator || b.narratorShort;
    const narrOthers = others.map((o) => o.narratorShort).filter((n) => normalizeFirst(n) !== normalizeFirst(b.narratorShort) && !similar(n, b.narratorShort));
    push(qs, makeAbc(base('narrator', 'narrator', 'easy', `Jaký je vypravěč (forma vyprávění) v díle ${T}?`, exp), b.narratorShort, narrOthers));
    qs.push(makeFlash(base('narrator', 'narrator', 'easy', `Kdo je vypravěčem v díle ${T}? Jaký je to typ vypravěče?`, exp), b.narrator || b.narratorShort));
    qs.push(
      makeTF(
        base('narrator', 'narrator', 'easy', '', exp),
        `V díle ${T}: ${b.narratorShort}.`,
        sample(narrOthers, 2).map((n) => `V díle ${T}: ${n}.`),
      ),
    );
  }

  // --- Prostředí a čas ---
  if (b.settingShort.trim()) {
    const exp = `${b.setting} ${b.time}`.trim();
    push(qs, makeAbc(base('setting', 'chronotope', 'easy', `Kde se odehrává dílo ${T}?`, exp), b.settingShort, others.map((o) => o.settingShort)));
    qs.push(makeFlash(base('setting', 'chronotope', 'easy', `Popiš časoprostor díla ${T}.`, exp), `Místo: ${b.setting}\nČas: ${b.time}`));
  }

  // --- Téma a motivy ---
  if (b.theme.trim()) {
    const exp = `${b.theme} Hlavní myšlenka: ${b.mainIdea}`;
    push(
      qs,
      makeAbc(
        base('theme', 'theme', 'easy', `Které téma odpovídá dílu ${T}?`, exp),
        truncate(firstSentence(b.theme, 400), 170),
        others.map((o) => truncate(firstSentence(o.theme, 400), 170)),
        (opt) => {
          const src = others.find((o) => truncate(firstSentence(o.theme, 400), 170) === opt);
          return src ? `Toto je téma díla ${src.title}.` : undefined;
        },
      ),
    );
    qs.push(makeFlash(base('theme', 'theme', 'medium', `Jaké je téma a hlavní myšlenka díla ${T}?`, exp), `${b.theme}\n\nHlavní myšlenka: ${b.mainIdea}`));
  }
  if (b.motifs.length) {
    const own = new Set(b.motifs.map((m) => m.toLowerCase()));
    const foreign = uniqueStrings(others.flatMap((o) => o.motifs)).filter((m) => !own.has(m.toLowerCase()) && !b.motifs.some((bm) => overlap(bm, m)));
    const motif = pick(b.motifs);
    const exp = `Motivy díla ${T}: ${b.motifs.join(', ')}.`;
    push(qs, makeAbc(base(`motif`, 'theme', 'easy', `Který z těchto motivů je pro dílo ${T} důležitý?`, exp), motif, foreign));
    qs.push(makeTF(base('motif', 'theme', 'easy', '', exp), `Důležitým motivem díla ${T} je motiv: ${motif}.`, sample(foreign, 2).map((m) => `Důležitým motivem díla ${T} je motiv: ${m}.`)));
    qs.push(makeFlash(base('motifs', 'theme', 'easy', `Vyjmenuj hlavní motivy díla ${T}.`, exp), b.motifs.join(', ')));
  }
  if (b.mainIdea.trim()) {
    push(qs, makeOpen(base('mainIdea', 'theme', 'hard', `Jaká je hlavní myšlenka díla ${T}? Svou odpověď zdůvodni.`, b.mainIdea), b.mainIdea, autoPoints(b.mainIdea, 4)));
  }
  if (b.interpretation.trim()) {
    push(
      qs,
      makeOpen(base('interpretation', 'theme', 'hard', `Jak lze dílo ${T} interpretovat? Uveď alespoň dvě možná čtení.`, b.interpretation), b.interpretation, autoPoints(b.interpretation, 5)),
    );
  }

  // --- Postavy ---
  const allChars = [...b.mainCharacters, ...b.sideCharacters];
  const foreignChars = others.flatMap((o) => [...o.mainCharacters, ...o.sideCharacters].map((c) => ({ c, o })));
  b.mainCharacters.forEach((c, i) => {
    const desc = firstSentence(c.description, 150);
    const exp = `${c.name}: ${c.description}`;
    const otherDescs = allChars.filter((x) => x.name !== c.name).map((x) => firstSentence(x.description, 150));
    push(
      qs,
      makeAbc(base(`char-${i}`, 'characters', 'easy', `Kdo je ${c.name} v díle ${T}?`, exp), desc, otherDescs.length >= 2 ? otherDescs : [...otherDescs, ...foreignChars.map((f) => firstSentence(f.c.description, 150))]),
    );
    qs.push(makeFlash(base(`char-${i}`, 'characters', 'easy', `Charakterizuj postavu ${c.name} (${T}).`, exp), c.description));
    if (isNamedCharacter(c.name)) {
      qs.push(
        makeFill(
          base(`char-work-${i}`, 'characters', 'medium', `Ve kterém díle vystupuje postava ${c.name}?`, `${c.name} je postava z díla ${T} (${b.author}). ${desc}`),
          'identifyWork',
          T,
          titleAccepted(b),
        ),
      );
      const foreignTitles = uniqueStrings(others.map((o) => o.title));
      qs.push(
        makeTF(
          base(`char-work-${i}`, 'characters', 'easy', '', `${c.name} je postava z díla ${T}.`),
          `${c.name} je postava z díla ${T}.`,
          sample(foreignTitles, 2).map((t) => `${c.name} je postava z díla ${t}.`),
        ),
      );
    }
  });
  if (b.mainCharacters[0] && isNamedCharacter(b.mainCharacters[0].name)) {
    const c = b.mainCharacters[0];
    qs.push(
      makeFill(
        base('main-char', 'characters', 'medium', `Hlavní postavou díla ${T} je ______.`, `${c.name}: ${firstSentence(c.description, 200)}`),
        'fill',
        c.name,
        nameAccepted(c.name),
      ),
    );
  }
  b.sideCharacters.slice(0, 5).forEach((c, i) => {
    const exp = `${c.name}: ${c.description}`;
    const otherDescs = allChars.filter((x) => x.name !== c.name).map((x) => firstSentence(x.description, 150));
    push(qs, makeAbc(base(`side-${i}`, 'characters', 'medium', `Jakou roli má v díle ${T} postava ${c.name}?`, exp), firstSentence(c.description, 150), otherDescs));
  });
  if (allChars.length) {
    push(
      qs,
      makeOpen(
        base('chars-open', 'characters', 'hard', `Charakterizuj hlavní postavy díla ${T} a vztahy mezi nimi.`, areaText(b, 'characters')),
        areaText(b, 'characters'),
        areaPoints(b, 'characters'),
      ),
    );
  }

  // --- Děj: pořadí událostí ---
  if (b.plotEvents.length >= 4) {
    const ev = b.plotEvents;
    const n = Math.min(5, ev.length);
    const start = Math.floor(Math.random() * (ev.length - n + 1));
    const items = ev.length <= 6 ? ev : ev.slice(start, start + n);
    const order: OrderQuestion = {
      ...base('plot-order', 'context', 'medium', `Seřaď události / části díla ${T} ve správném pořadí.`, `Správné pořadí:\n${items.map((e, i) => `${i + 1}. ${e}`).join('\n')}`),
      id: `${b.id}|plot-order|order`,
      type: 'order',
      items,
    };
    qs.push(order);
    const i = Math.floor(Math.random() * (ev.length - 1));
    push(
      qs,
      makeAbc(
        base(`plot-next-${i}`, 'context', 'medium', `${T}: Co následuje bezprostředně po této události?\n„${ev[i]}“`, `Po události „${ev[i]}“ následuje: „${ev[i + 1]}“.`),
        ev[i + 1],
        ev.filter((_, j) => j !== i && j !== i + 1),
      ),
    );
    const a = Math.floor(Math.random() * (ev.length - 1));
    const later = a + 1 + Math.floor(Math.random() * (ev.length - a - 1));
    const trueOrder = Math.random() < 0.5;
    const first = trueOrder ? ev[a] : ev[later];
    const second = trueOrder ? ev[later] : ev[a];
    qs.push({
      ...base(`plot-before-${a}-${later}`, 'context', 'medium', `${T}: Událost „${first}“ se odehraje DŘÍVE než událost „${second}“.`, `Správné pořadí: nejdřív „${ev[a]}“, potom „${ev[later]}“.`),
      id: `${b.id}|plot-before|truefalse`,
      type: 'truefalse',
      isTrue: trueOrder,
    });
  }
  if (b.plot.trim()) {
    qs.push(makeFlash(base('plot', 'context', 'medium', `Stručně převyprávěj děj díla ${T}.`, b.plot), b.plot));
  }

  // --- Scény (zasazení výňatku) ---
  b.scenes.forEach((s, i) => {
    const exp = s.context;
    push(
      qs,
      makeOpen(
        base(`scene-${i}`, 'context', 'hard', `Zasaď výňatek do kontextu díla ${T}: „${s.scene}“ Co scéně předchází a co následuje?`, exp),
        s.context,
        autoPoints(s.context, 4),
      ),
    );
    qs.push(makeFlash(base(`scene-${i}`, 'context', 'medium', `${T} – kam v díle patří tato scéna?\n„${s.scene}“`, exp), s.context));
    qs.push(makeFill(base(`scene-id-${i}`, 'context', 'medium', `Ze kterého díla je tato scéna?\n„${s.scene}“`, `Scéna je z díla ${T} (${b.author}). ${s.context}`), 'identifyWork', T, titleAccepted(b)));
  });

  // --- Nápovědy (identifikace díla) ---
  b.clues.forEach((clue, i) => {
    const exp = `Jde o dílo ${T} (${b.author}).`;
    qs.push(makeFill(base(`clue-${i}`, 'basics', 'medium', `O jaké dílo jde?\n„${clue}“`, exp), 'identifyWork', T, titleAccepted(b)));
    push(qs, makeAbc(base(`clue-${i}`, 'basics', 'easy', `Které dílo odpovídá popisu?\n„${clue}“`, exp), T, [...others.map((o) => o.title), ...FALLBACK_TITLES]));
  });

  // --- Kompozice, vyprávěcí způsoby, promluvy, jazyk, tropy ---
  const simpleAreas: [AreaId, string, string][] = [
    ['composition', b.composition, `Popiš kompozici díla ${T}.`],
    ['narrative', b.narrativeModes, `Jaké vyprávěcí způsoby převládají v díle ${T}?`],
    ['speech', b.speechTypes, `Jaké typy promluv se objevují v díle ${T}?`],
    ['language', b.language, `Jaké jazykové prostředky jsou typické pro dílo ${T}?`],
    ['tropes', b.tropes, `Jaké tropy a figury se objevují v díle ${T}? Jakou mají funkci?`],
    ['chronotope', `${b.setting} ${b.time}`.trim(), `Kde a kdy se odehrává dílo ${T}? Jakou má prostředí funkci?`],
  ];
  for (const [area, text, prompt] of simpleAreas) {
    if (!text.trim()) continue;
    qs.push(makeFlash(base(`${area}-card`, area, 'medium', prompt, text), text));
  }

  // --- Verš ---
  if (b.verse.trim()) {
    qs.push(makeFlash(base('verse-card', 'verse', 'medium', `Popiš veršovou výstavbu díla ${T}.`, b.verse), b.verse));
    qs.push(makeTF(base('verse-tf', 'verse', 'easy', '', b.verse), `Dílo ${T} je psáno veršem.`, [`Dílo ${T} je psáno prózou.`]));
  } else {
    const exp = `${T} je psáno prózou${b.kind === 'drama' ? ' (drama v próze)' : ''}, veršová výstavba se neuplatňuje.`;
    qs.push(makeTF(base('verse-tf', 'verse', 'easy', '', exp), `Dílo ${T} je psáno prózou.`, [`Dílo ${T} je psáno veršem.`]));
  }

  // --- Kontext autora: další díla ---
  if (b.otherWorks.length && b.author.trim()) {
    const work = pick(b.otherWorks);
    const foreignWorks = others.filter((o) => o.author !== b.author).flatMap((o) => o.otherWorks);
    const exp = `${b.author} napsal(a) také: ${b.otherWorks.join(', ')}.`;
    push(
      qs,
      makeAbc(base('other-work', 'authorContext', 'medium', `Které z těchto děl napsal(a) také ${b.author}?`, exp), work, foreignWorks, (opt) => {
        const src = others.find((o) => o.otherWorks.includes(opt));
        return src ? `${opt} je dílo autora ${src.author}.` : undefined;
      }),
    );
    qs.push(
      makeTF(
        base('other-work', 'authorContext', 'easy', '', exp),
        `${b.author} je také autorem díla ${work}.`,
        sample(foreignWorks, 2).map((w) => `${b.author} je také autorem díla ${w}.`),
      ),
    );
    if (!/nezn[aá]m/i.test(b.author)) {
      qs.push(
        makeFill(
          base('other-work-id', 'authorContext', 'medium', `Kdo je autorem děl: ${b.otherWorks.slice(0, 3).join(', ')}?`, exp),
          'identifyAuthor',
          b.author,
          authorAccepted(b),
        ),
      );
    }
  }
  if (b.authorContext.trim()) {
    qs.push(makeFlash(base('author-context', 'authorContext', 'medium', `Představ autora díla ${T} a zasaď dílo do kontextu jeho tvorby.`, b.authorContext), areaText(b, 'authorContext')));
  }
  if (b.historicalContext.trim()) {
    qs.push(makeFlash(base('lit-context', 'litContext', 'medium', `Popiš literárněhistorický kontext díla ${T}.`, b.historicalContext), areaText(b, 'litContext')));
  }

  // --- Otevřené otázky podle osnovy (simulace, těžká obtížnost) ---
  for (const area of EXAM_AREAS) {
    const text = areaText(b, area);
    if (!text.trim()) continue;
    push(
      qs,
      makeOpen(
        { bookId: b.id, area, factKey: `exam-${area}`, prompt: AREA_MAP[area].examPrompt(b), explanation: text, difficulty: 'maturita' },
        text,
        areaPoints(b, area),
      ),
    );
  }

  // --- Hlubší otázky (porozumění) ---
  b.deepQuestions.forEach((d, i) => {
    push(qs, makeOpen(base(`deep-${i}`, d.area, 'hard', d.q, d.answer), d.answer, d.points));
    qs.push(makeFlash(base(`deep-${i}`, d.area, 'hard', d.q, d.answer), d.answer));
  });

  return qs;
}

function kindReason(b: Book): string {
  switch (b.kind) {
    case 'drama':
      return 'Drama je určeno k divadelnímu provedení, nemá vypravěče a děj se sděluje replikami postav.';
    case 'lyrika':
      return 'Lyrika vyjadřuje pocity a nálady, děj je potlačen.';
    case 'lyricko-epika':
      return 'Lyricko-epické dílo spojuje děj s citovostí a veršovou formou.';
    default:
      return 'Epika vypráví příběh – má děj, postavy a vypravěče.';
  }
}

/** Dvě formulace jsou si příliš podobné (matoucí jako nabízená možnost) */
function similar(a: string, b: string): boolean {
  const ta = new Set(tokenize(a).filter((w) => w.length >= 4).map((w) => w.slice(0, 6)));
  const tb = new Set(tokenize(b).filter((w) => w.length >= 4).map((w) => w.slice(0, 6)));
  if (!ta.size || !tb.size) return false;
  let inter = 0;
  for (const w of ta) if (tb.has(w)) inter++;
  return inter / Math.min(ta.size, tb.size) >= 0.4;
}

function normalizeFirst(s: string): string {
  return tokenize(s).slice(0, 2).join(' ');
}

function overlap(a: string, b: string): boolean {
  const ta = tokenize(a).filter((w) => w.length >= 4);
  const tb = tokenize(b).filter((w) => w.length >= 4);
  return ta.some((w) => tb.some((v) => v.slice(0, 5) === w.slice(0, 5)));
}

// ---------- globální otázky (více knih) ----------

export function generateGlobalQuestions(books: Book[]): Question[] {
  const qs: Question[] = [];
  if (books.length < 3) return qs;
  const mk = (factKey: string, area: AreaId, prompt: string, explanation: string, related: Book[]) => ({
    bookId: 'global',
    area,
    factKey,
    prompt,
    explanation,
    difficulty: 'medium' as Difficulty,
    relatedBookIds: related.map((b) => b.id),
  });

  const pairsQuestion = (
    key: string,
    area: AreaId,
    prompt: string,
    leftLabel: string,
    rightLabel: string,
    getPair: (b: Book) => [string, string] | null,
    size = 4,
  ) => {
    const candidates = shuffle(books)
      .map((b) => ({ b, p: getPair(b) }))
      .filter((x): x is { b: Book; p: [string, string] } => Boolean(x.p && x.p[0] && x.p[1]));
    const chosen: { b: Book; p: [string, string] }[] = [];
    const usedL = new Set<string>();
    const usedR = new Set<string>();
    for (const c of candidates) {
      if (usedL.has(c.p[0]) || usedR.has(c.p[1])) continue;
      usedL.add(c.p[0]);
      usedR.add(c.p[1]);
      chosen.push(c);
      if (chosen.length >= size) break;
    }
    if (chosen.length < 3) return;
    const q: MatchQuestion = {
      ...mk(key, area, prompt, chosen.map((c) => `${c.p[0]} → ${c.p[1]}`).join('\n'), chosen.map((c) => c.b)),
      id: `global|${key}|match`,
      type: 'match',
      leftLabel,
      rightLabel,
      pairs: chosen.map((c) => ({ left: c.p[0], right: c.p[1] })),
    };
    qs.push(q);
  };

  pairsQuestion('match-author', 'basics', 'Přiřaď k dílům jejich autory.', 'Dílo', 'Autor', (b) => (b.author ? [b.title, b.author] : null));
  pairsQuestion('match-genre', 'genre', 'Přiřaď k dílům jejich žánr.', 'Dílo', 'Žánr', (b) => (b.genre ? [b.title, truncate(b.genre, 60)] : null));
  pairsQuestion('match-period', 'litContext', 'Přiřaď k dílům literární směr / proud.', 'Dílo', 'Směr / proud', (b) => (b.movement ? [b.title, truncate(b.movement, 70)] : null));
  pairsQuestion('match-category', 'basics', 'Přiřaď dílo ke kategorii maturitního seznamu.', 'Dílo', 'Kategorie', (b) => [b.title, CATEGORIES[b.category].short]);
  pairsQuestion('match-character', 'characters', 'Přiřaď postavy k dílům, ve kterých vystupují.', 'Postava', 'Dílo', (b) => {
    const c = b.mainCharacters.find((x) => isNamedCharacter(x.name));
    return c ? [c.name, b.title] : null;
  });
  pairsQuestion('match-otherwork', 'authorContext', 'Přiřaď k autorům jejich další dílo.', 'Autor', 'Další dílo', (b) =>
    b.otherWorks.length && !/nezn[aá]m/i.test(b.author) ? [b.author, b.otherWorks[0]] : null,
  );
  pairsQuestion('match-movement-author', 'litContext', 'Přiřaď autora k literárnímu směru / proudu.', 'Autor', 'Směr / proud', (b) =>
    b.movement && !/nezn[aá]m/i.test(b.author) ? [b.author, truncate(b.movement, 70)] : null,
  );
  pairsQuestion('match-setting', 'chronotope', 'Přiřaď dílo k prostředí, kde se odehrává.', 'Dílo', 'Prostředí', (b) => (b.settingShort ? [b.title, b.settingShort] : null));

  // Seřazení děl podle doby vzniku
  const dated = shuffle(books.filter((b) => !isNaN(approxYear(b.year))));
  const chosen: Book[] = [];
  for (const b of dated) {
    if (chosen.every((c) => Math.abs(approxYear(c.year) - approxYear(b.year)) >= 3)) chosen.push(b);
    if (chosen.length >= 4) break;
  }
  if (chosen.length >= 3) {
    const sorted = [...chosen].sort((a, b) => approxYear(a.year) - approxYear(b.year));
    qs.push({
      ...mk('order-years', 'litContext', 'Seřaď díla podle doby vzniku (od nejstaršího).', sorted.map((b) => `${b.title} – ${b.year}`).join('\n'), sorted),
      id: 'global|order-years|order',
      type: 'order',
      items: sorted.map((b) => `${b.title} (${b.author})`),
    });
  }

  // Seřazení literárních období
  const start = Math.floor(Math.random() * (LITERARY_PERIODS.length - 5));
  const periods = LITERARY_PERIODS.slice(start, start + 5);
  qs.push({
    ...mk('order-periods', 'litContext', 'Seřaď literární období chronologicky.', periods.join(' → '), []),
    bookId: 'global',
    id: 'global|order-periods|order',
    type: 'order',
    items: periods,
  });

  return qs;
}

// ---------- literární pojmy ----------

export function generateTermQuestions(terms: Term[] = TERMS, filterIds?: string[]): Question[] {
  const qs: Question[] = [];
  const list = filterIds ? terms.filter((t) => filterIds.includes(t.id)) : terms;
  for (const t of list) {
    const sameCat = terms.filter((x) => x.category === t.category && x.id !== t.id);
    const otherPool = sameCat.length >= 3 ? sameCat : terms.filter((x) => x.id !== t.id);
    const exp = `${t.name}: ${t.short} ${t.detail} Příklad: ${t.example}${t.bookExample ? ` Z maturitní četby: ${t.bookExample}` : ''}`;
    const base = (difficulty: Difficulty, prompt: string): Base => ({
      bookId: 'terms',
      area: 'terms',
      factKey: t.id,
      prompt,
      explanation: exp,
      difficulty,
    });
    qs.push(makeFlash(base('easy', `Co je ${t.name}?`), `${t.short}\n\nPříklad: ${t.example}${t.bookExample ? `\nZ četby: ${t.bookExample}` : ''}`));
    push(
      qs,
      makeAbc(base('easy', `Který pojem odpovídá popisu?\n„${t.short}“`), t.name, otherPool.map((x) => x.name), (opt) => {
        const o = terms.find((x) => x.name === opt);
        return o ? `${o.name} = ${o.short}` : undefined;
      }),
    );
    push(qs, makeAbc(base('easy', `Co je ${t.name}?`), t.short, otherPool.map((x) => x.short)));
    const wrong = pick(otherPool);
    const isTrue = Math.random() < 0.5;
    qs.push({
      ...base('easy', `${t.name} = ${isTrue ? t.short : wrong.short}`),
      id: `terms|${t.id}|truefalse`,
      type: 'truefalse',
      isTrue,
    });
    const main = t.name.replace(/\(.*?\)/g, '').trim();
    const paren = [...t.name.matchAll(/\((.*?)\)/g)].map((m) => m[1]);
    qs.push(makeFill({ ...base('medium', `Jaký pojem je popsán?\n„${t.short}“`) }, 'identifyTerm', t.name, uniqueStrings([t.name, main, ...paren, ...main.split(' / ')])));
    push(
      qs,
      makeOpen(base('hard', `Vysvětli pojem „${t.name}“ a uveď příklad${t.bookExample ? ' (ideálně z maturitní četby)' : ''}.`), `${t.short} ${t.detail}\nPříklad: ${t.example}${t.bookExample ? `\nZ četby: ${t.bookExample}` : ''}`, [
        ...autoPoints(t.short, 2),
        ...autoPoints(t.detail, 1),
      ]),
    );
  }
  // Přiřazování pojem → definice
  for (let k = 0; k < 3; k++) {
    const chosen = sample(list.length >= 4 ? list : terms, 4);
    qs.push({
      bookId: 'terms',
      area: 'terms',
      factKey: `match-terms-${k}`,
      id: `terms|match-${chosen.map((c) => c.id).join('-')}|match`,
      type: 'match',
      prompt: 'Přiřaď k pojmům jejich definice.',
      explanation: chosen.map((c) => `${c.name} → ${c.short}`).join('\n'),
      difficulty: 'medium',
      leftLabel: 'Pojem',
      rightLabel: 'Definice',
      pairs: chosen.map((c) => ({ left: c.name, right: truncate(c.short, 110) })),
    });
  }
  return qs;
}

// ---------- neumělecký text ----------

const STYLES = ['publicistický', 'odborný', 'administrativní', 'řečnický', 'prostěsdělovací', 'umělecký'];
const PROCEDURES = ['informační', 'vyprávěcí', 'popisný', 'výkladový', 'úvahový'];

export function generateNonArtQuestions(texts: NonArtText[] = NONART_TEXTS): Question[] {
  const qs: Question[] = [];
  for (const t of texts) {
    const bookId = `nonart:${t.id}`;
    const passage = t.excerpts;
    const base = (factKey: string, area: AreaId, difficulty: Difficulty, prompt: string, explanation: string): Base => ({
      bookId,
      area,
      factKey,
      prompt,
      explanation,
      difficulty,
      passage,
    });
    const styleWord = t.style.split(/[ (]/)[0];
    if (STYLES.includes(styleWord)) {
      push(qs, makeAbc(base('style', 'nonart2', 'easy', 'Jaký funkční styl má text?', `Funkční styl: ${t.style}.`), styleWord, STYLES));
    }
    const procWord = t.procedure.split(/[ (,]/)[0];
    if (PROCEDURES.includes(procWord)) {
      push(qs, makeAbc(base('procedure', 'nonart2', 'easy', 'Jaký slohový postup v textu převládá?', `Slohový postup: ${t.procedure}.`), procWord, PROCEDURES));
    }
    push(
      qs,
      makeAbc(
        base('form', 'nonart2', 'medium', 'O jaký slohový útvar jde?', `Slohový útvar: ${t.form}.`),
        t.form,
        texts.filter((x) => x.id !== t.id).map((x) => x.form),
      ),
    );
    t.factsVsOpinions.forEach((f, i) => {
      qs.push({
        ...base(`fact-${i}`, 'nonart1', 'easy', `Výrok z textu: „${f.statement}“\nJe to FAKT (ověřitelná informace)?`, f.why),
        id: `${bookId}|fact-${i}|truefalse`,
        type: 'truefalse',
        isTrue: f.isFact,
      });
    });
    const opens: [string, AreaId, string, string][] = [
      ['mainIdea', 'nonart1', 'Jaká je hlavní myšlenka textu?', t.mainIdea],
      ['communication', 'nonart1', 'Popiš komunikační situaci: jaký je účel textu, kdo je adresát a kdo autor?', t.communication],
      ['essential', 'nonart1', 'Které informace v textu jsou podstatné a které méně podstatné?', t.essential],
      ['interpretations', 'nonart1', 'Jaké jsou možné způsoby čtení a interpretace textu?', t.interpretations],
      ['composition', 'nonart2', 'Popiš kompoziční výstavbu výňatku.', t.composition],
      ['language', 'nonart2', 'Jaké jazykové prostředky se v textu uplatňují a jakou mají funkci?', t.language],
      ['styleAll', 'nonart2', 'Urči funkční styl, slohový postup a slohový útvar textu. Zdůvodni.', `Funkční styl: ${t.style}. Slohový postup: ${t.procedure}. Útvar: ${t.form}.`],
    ];
    if (t.relation) opens.unshift(['relation', 'nonart1', 'Jaká je souvislost mezi výňatky?', t.relation]);
    for (const [key, area, prompt, answer] of opens) {
      if (!answer.trim()) continue;
      const points =
        key === 'styleAll'
          ? [
              { label: `Styl: ${t.style}`, keywords: [styleWord] },
              { label: `Postup: ${t.procedure}`, keywords: [procWord] },
              { label: `Útvar: ${t.form}`, keywords: [tokenize(t.form)[0] ?? t.form] },
            ]
          : autoPoints(answer, 4);
      push(qs, makeOpen(base(key, area, 'hard', prompt, answer), answer, points));
      qs.push(makeFlash(base(key, area, 'medium', prompt, answer), answer));
    }
  }
  return qs;
}

export const TERM_CATEGORY_LABELS = TERM_CATEGORIES;
