import type { Book } from '../../types';
import { BOOKS_DO18 } from './do18';
import { BOOKS_ST19 } from './st19';
import { BOOKS_SVET20 } from './svet20';
import { BOOKS_CZ20 } from './cz20';
import type { BookSeed } from './helpers';

/** Databáze předvyplněných děl */
export const BOOK_DATABASE: BookSeed[] = [...BOOKS_DO18, ...BOOKS_ST19, ...BOOKS_SVET20, ...BOOKS_CZ20];

/** Pořadí maturitního seznamu uživatele */
export const DEFAULT_LIST_IDS = [
  'podkoni-a-zak',
  'gulliverovy-cesty',
  'lakomec',
  'evzen-onegin',
  'kytice',
  'maj',
  'farma-zvirat',
  'maly-princ',
  'starec-a-more',
  'o-mysich-a-lidech',
  'na-zapadni-fronte-klid',
  'mechanicky-pomeranc',
  'sbohem-armado',
  'promena',
  'krysar',
  'smrt-krasnych-srncu',
  'bylo-nas-pet',
  'spalovac-mrtvol',
  'rur',
];

export function seedToBook(seed: BookSeed, overrides: Partial<Book> = {}): Book {
  const now = Date.now();
  return {
    ...structuredClone(seed),
    notes: '',
    favorite: false,
    learned: false,
    source: 'database',
    templateId: seed.id,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function emptyBook(): Book {
  const now = Date.now();
  return {
    id: `kniha-${now.toString(36)}`,
    title: '',
    author: '',
    authorLife: '',
    year: '',
    category: 'cz20',
    kind: 'epika',
    genre: '',
    period: '',
    movement: '',
    narratorShort: '',
    settingShort: '',
    theme: '',
    motifs: [],
    mainIdea: '',
    mainCharacters: [],
    sideCharacters: [],
    plot: '',
    plotEvents: [],
    setting: '',
    time: '',
    composition: '',
    narrator: '',
    narrativeModes: '',
    speechTypes: '',
    verse: '',
    language: '',
    tropes: '',
    authorContext: '',
    historicalContext: '',
    otherWorks: [],
    interpretation: '',
    examTips: '',
    quick: [],
    clues: [],
    scenes: [],
    deepQuestions: [],
    notes: '',
    favorite: false,
    learned: false,
    source: 'custom',
    createdAt: now,
    updatedAt: now,
  };
}

/** Šablony pro rychlé založení vlastní knihy */
export const BOOK_TEMPLATES: { id: string; label: string; description: string; patch: Partial<Book> }[] = [
  {
    id: 'roman',
    label: 'Próza – román / novela',
    description: 'Epické dílo v próze, s vypravěčem.',
    patch: {
      kind: 'epika',
      genre: 'román',
      verse: '',
      narrator: 'Er-forma / ich-forma – doplň typ vypravěče (vševědoucí, personální, vnější…).',
      narrativeModes: 'Vyprávění, popis, charakteristika, úvahy.',
      speechTypes: 'Pásmo vypravěče, přímá řeč, nepřímá / polopřímá řeč, vnitřní monolog.',
      composition: 'Chronologická / retrospektivní; členění na kapitoly…',
    },
  },
  {
    id: 'drama',
    label: 'Drama',
    description: 'Divadelní hra – bez vypravěče, dějství a scény.',
    patch: {
      kind: 'drama',
      genre: 'drama (tragédie / komedie / činohra)',
      verse: '',
      narrator: 'Drama nemá vypravěče; děj se sděluje replikami postav a scénickými poznámkami.',
      narratorShort: 'drama – bez vypravěče',
      narrativeModes: 'Dialog, monolog, scénické poznámky.',
      speechTypes: 'Dialogy, monology, řeč stranou (aside), scénické poznámky.',
      composition: 'Dějství a výstupy; expozice – kolize – krize – peripetie – katastrofa.',
    },
  },
  {
    id: 'poezie',
    label: 'Poezie / lyrika',
    description: 'Básnická sbírka nebo lyrická báseň – lyrický subjekt a verš.',
    patch: {
      kind: 'lyrika',
      genre: 'básnická sbírka',
      narrator: 'Lyrický subjekt – doplň, kdo a jak mluví.',
      narratorShort: 'lyrický subjekt',
      verse: 'Vázaný / volný verš; rým (sdružený, střídavý, obkročný); rytmus (trochej, jamb, daktyl); strofy.',
      speechTypes: 'Monolog lyrického subjektu, oslovení (apostrofa).',
      composition: 'Členění sbírky na oddíly, řazení básní…',
    },
  },
  {
    id: 'balada',
    label: 'Lyricko-epické dílo (balada, poema)',
    description: 'Veršované dílo s dějem.',
    patch: {
      kind: 'lyricko-epika',
      genre: 'balada / poema',
      verse: 'Vázaný verš; rým a rytmus – doplň.',
      narrator: 'Er-forma s lyrickým subjektem…',
      speechTypes: 'Pásmo vypravěče, přímá řeč, dialogy.',
    },
  },
];
