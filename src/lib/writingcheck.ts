/** Jednoduchá automatická kontrola slohové práce – jen pomůcka, nenahrazuje opravu učitelem */

export interface WritingIssue {
  kind: 'chyba' | 'čárka' | 'styl';
  message: string;
  excerpt: string;
}

export interface WritingAnalysis {
  words: number;
  paragraphs: number;
  sentences: number;
  avgSentence: number;
  longSentences: number;
  repeated: [string, number][];
  issues: WritingIssue[];
}

export function countWords(text: string): number {
  return (text.match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu) ?? []).length;
}

const RULES: { re: RegExp; kind: WritingIssue['kind']; message: (m: RegExpExecArray) => string }[] = [
  { re: /(?<!\p{L})(a|kdy)?by jsme(?!\p{L})/giu, kind: 'chyba', message: (m) => `„${m[0]}“ → správně „${(m[1] ?? '').toLowerCase()}bychom“` },
  { re: /(?<!\p{L})(a|kdy)?by jste(?!\p{L})/giu, kind: 'chyba', message: (m) => `„${m[0]}“ → správně „${(m[1] ?? '').toLowerCase()}byste“` },
  { re: /(?<!\p{L})(a|kdy)?bysme(?!\p{L})/giu, kind: 'chyba', message: (m) => `„${m[0]}“ je hovorové → „${(m[1] ?? '').toLowerCase()}bychom“` },
  { re: /(?<!\p{L})sme(?!\p{L})/giu, kind: 'chyba', message: () => '„sme“ je hovorové → „jsme“' },
  { re: /(?<!\p{L})vyjím(k|eč)/giu, kind: 'chyba', message: () => '„vyjímka/vyjímečný“ → správně „výjimka/výjimečný“' },
  { re: /(?<!\p{L})dyž(?!\p{L})/giu, kind: 'chyba', message: () => '„dyž“ → „když“' },
  { re: /(?<!\p{L})(dobrej|velkej|malej|novej|starej|hezkej|celej|jinej|takovej|každej|nějakej)(?!\p{L})/giu, kind: 'styl', message: (m) => `„${m[0]}“ je obecná čeština → „${m[0].slice(0, -2)}ý“` },
  { re: /(?<!\p{L})(jo|furt|kámo|dyk)(?!\p{L})/giu, kind: 'styl', message: (m) => `„${m[0]}“ je hovorové – ve slohové práci (mimo přímou řeč) nevhodné` },
  { re: /[.!?]\s+[a-zěščřžýáíéúůďťň]/gu, kind: 'chyba', message: () => 'Věta by měla začínat velkým písmenem' },
  { re: / {2,}/g, kind: 'styl', message: () => 'Dvojitá mezera' },
  { re: /\s+[,.!?;:]/g, kind: 'chyba', message: () => 'Mezera před interpunkčním znaménkem' },
];

/** Spojky a vztažná slova, před kterými obvykle bývá čárka */
const COMMA_WORDS = 'že|protože|který|která|které|kterou|kterého|kterému|kterém|kterým|kteří|kterých|aby|když|jestli|pokud|zatímco|ačkoli|přestože|kde|kdy|proč|jak';
/** Slova, po kterých čárka před spojkou být nemusí */
const NO_COMMA_BEFORE = new Set(['a', 'i', 'ani', 'nebo', 'či', 'jen', 'už', 'až', 'právě', 'hlavně', 'zejména', 'například', 'zvláště', 'teprve', 'ještě', 'tak', 'to', 'než', 'jako', 'ne', 'leda', 'asi', 'snad', 'aspoň', 'alespoň', 'hlavně']);

const STOP = new Set(
  'a i se je to v na že by si do z ze o s k ve pro jak jsem jsou byl byla bylo jako ale tak to ten ta ty tom toho jsme jste mě mi mne mně nás vás jeho její jejich který která které kteří co když aby už jen také ještě není bude být mít má mají může protože nebo ani při po od za před nad pod mezi bez u při však tedy proto tento tato toto tyto'.split(
    ' ',
  ),
);

export function analyzeWriting(text: string): WritingAnalysis {
  const words = countWords(text);
  const paragraphs = text.split(/\n\s*\n|\n/).filter((p) => p.trim().length > 0).length;
  const sentenceList = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => countWords(s) > 0);
  const lens = sentenceList.map(countWords);
  const issues: WritingIssue[] = [];

  for (const r of RULES) {
    r.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    let n = 0;
    while ((m = r.re.exec(text)) && n < 10) {
      n++;
      const from = Math.max(0, m.index - 20);
      issues.push({ kind: r.kind, message: r.message(m), excerpt: `…${text.slice(from, m.index + m[0].length + 15).replace(/\s+/g, ' ')}…` });
    }
  }

  // Možná chybějící čárka před spojkou / vztažným slovem
  const comma = new RegExp(`([\\p{L}]+)\\s+(${COMMA_WORDS})(?!\\p{L})`, 'giu');
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = comma.exec(text)) && n < 12) {
    // mezi slovem a spojkou není čárka (regex vyžaduje jen mezeru); některá slova čárku nevyžadují
    const prev = m[1].toLowerCase();
    if (NO_COMMA_BEFORE.has(prev) || COMMA_WORDS.split('|').includes(prev)) continue;
    n++;
    issues.push({ kind: 'čárka', message: `Zkontroluj čárku před „${m[2]}“`, excerpt: `…${text.slice(Math.max(0, m.index - 15), m.index + m[0].length + 15).replace(/\s+/g, ' ')}…` });
  }

  lens.forEach((l, k) => {
    if (l > 40) issues.push({ kind: 'styl', message: `Velmi dlouhé souvětí (${l} slov) – zvaž rozdělení`, excerpt: `${sentenceList[k].slice(0, 70)}…` });
  });

  const freq = new Map<string, number>();
  for (const w of text.toLowerCase().match(/\p{L}{4,}/gu) ?? []) if (!STOP.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1);
  const repeated = [...freq.entries()].filter(([, c]) => c >= Math.max(4, Math.round(words / 80))).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return {
    words,
    paragraphs,
    sentences: sentenceList.length,
    avgSentence: lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0,
    longSentences: lens.filter((l) => l > 40).length,
    repeated,
    issues,
  };
}
