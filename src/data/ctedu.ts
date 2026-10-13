import { OTHER_AUTHORS, OTHER_BOOKS } from './videos';

/**
 * Výuková videa ČT edu (edu.ceskatelevize.cz) ke knihám a autorům.
 * Jen odkazy – obsah zůstává na ČT edu. Každý odkaz byl dohledán na webu ČT edu a název odpovídá stránce.
 */
export interface EduLink {
  title: string;
  url: string;
  /** Odkud video je (ČT edu, YouTube – kanál…) */
  source?: string;
}

const v = (id: string, title: string): EduLink => ({ title, url: `https://edu.ceskatelevize.cz/video/${id}`, source: 'ČT edu' });
const n = (slug: string, title: string): EduLink => ({ title, url: `https://edu.ceskatelevize.cz/namet/${slug}`, source: 'ČT edu' });

/** Klíč = název díla (bez diakritiky, malými písmeny) */
const BOOKS: Record<string, EduLink[]> = {
  maj: [v('9134-ukazka-machuv-maj', 'Ukázka: Máchův Máj'), v('7130-dilo-karla-hynka-machy', 'Dílo Karla Hynka Máchy'), v('17155-k-h-macha-v-dobovem-dokumentu', 'K. H. Mácha v dobovém dokumentu')],
  kytice: [v('17631-erbenova-kytice-s-ilustracemi-mily-fuerstove', 'Erbenova Kytice s ilustracemi Míly Fürstové'), v('17101-dramatizace-erbenovy-kytice', 'Dramatizace Erbenovy Kytice'), v('975-karel-jaromir-erben-jeho-zivot-a-doba', 'Karel Jaromír Erben: Jeho život a doba')],
  rur: [v('14264-100-let-od-vzniku-r-u-r', '100 let od vzniku R.U.R.'), v('10963-slovo-robot', 'Slovo robot')],
  'bylo nas pet': [v('14281-karel-polacek-bylo-nas-pet', 'Karel Poláček: Bylo nás pět'), v('17632-bylo-nas-pet-na-divadle', 'Bylo nás pět na divadle'), v('6782-kralovehradeckym-krajem-za-karlem-polackem', 'Královéhradeckým krajem za Karlem Poláčkem')],
  'spalovac mrtvol': [v('2759-dramatizace-romanu-spalovac-mrtvol', 'Dramatizace románu Spalovač mrtvol')],
  'evzen onegin': [v('15334-v-hlavni-roli-maturita-evzen-onegin', 'V hlavní roli: Maturita! – Evžen Oněgin'), v('3277-dramatizace-romanu-evzen-onegin', 'Dramatizace románu Evžen Oněgin')],
  promena: [v('19125-v-hlavni-roli-maturita-kafka', 'V hlavní roli: Maturita! – Kafka (o vzniku Proměny)')],
  lakomec: [v('11935-molieruv-lakomec-v-liberci', 'Molièrův Lakomec v Liberci'), v('12409-harpagon-je-lakomec', 'Harpagon je lakomec?')],
};

/** Klíč = jméno autora (bez diakritiky, malými písmeny) */
const AUTHORS: Record<string, EduLink[]> = {
  'karel hynek macha': [v('9561-karel-hynek-macha', 'Karel Hynek Mácha'), v('6781-machuv-kraj', 'Máchův kraj'), v('12411-machovy-prazske-stopy', 'Máchovy pražské stopy')],
  'karel jaromir erben': [v('10964-karel-jaromir-erben', 'Karel Jaromír Erben'), n('karel-jaromir-erben', 'Velká jména české literatury: Karel Jaromír Erben'), v('17147-k-j-erben-v-dobovem-dokumentu', 'K. J. Erben v dobovém dokumentu')],
  'karel capek': [n('karel-capek', 'Karel Čapek'), v('15967-60-let-capkova-pamatniku', '60 let Čapkova památníku')],
  'ota pavel': [v('9777-ota-pavel', 'Ota Pavel'), v('11486-ota-pavel-zlati-uhori', 'Ota Pavel: Zlatí úhoři')],
  'karel polacek': [v('17566-nedoceneny-karel-polacek', 'Nedoceněný Karel Poláček')],
  'ladislav fuks': [v('15966-100-let-od-narozeni-ladislava-fukse', '100 let od narození Ladislava Fukse'), v('8988-ladislav-fuks-ocima-erika-gilka', 'Ladislav Fuks očima Erika Gilka')],
  'franz kafka': [n('franz-kafka', 'Franz Kafka'), v('11467-jak-cestoval-franz-kafka', 'Jak cestoval Franz Kafka')],
  'george orwell': [v('8702-orwellovy-totalitni-vize-a-soucasnost', 'Orwellovy totalitní vize a současnost'), v('17093-orwellovo-dilo-v-ceskoslovensku', 'Orwellovo dílo v Československu')],
  'ernest hemingway': [v('12471-ernest-hemingway-v-benatkach', 'Ernest Hemingway v Benátkách'), v('12470-kde-zil-hemingway-ostrov-key-west', 'Kde žil Hemingway: Ostrov Key West')],
  moliere: [v('11932-molieruv-pan-z-praseckova', 'Molièrův Pán z Prasečkova')],
};

export const eduKey = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const eduForBook = (title: string): EduLink[] => [...(BOOKS[eduKey(title)] ?? []), ...(OTHER_BOOKS[eduKey(title)] ?? [])];
export const eduForAuthor = (name: string): EduLink[] => [...(AUTHORS[eduKey(name)] ?? []), ...(OTHER_AUTHORS[eduKey(name)] ?? [])];

/** Vyhledávání na ČT edu – pro knihy, ke kterým žádné video v aplikaci nemáme */
export const eduSearchUrl = (q: string) => `https://edu.ceskatelevize.cz/hledani?q=${encodeURIComponent(q)}`;
