import { describe, expect, it } from 'vitest';
import { BOOK_DATABASE, seedToBook } from '../data/books';
import { ALL_TOPICS } from '../data/subjects';
import { bookSheet, firstSentences, topicSheet } from './cheatsheet';

describe('Taháky k tisku', () => {
  it('věty se nedělí na iniciálách a zkratkách', () => {
    expect(firstSentences('Převyprávěl to J. V. Pleva. Druhá věta.', 1)).toBe('Převyprávěl to J. V. Pleva.');
    expect(firstSentences('Je to tzv. robinzonáda. Další.', 1)).toBe('Je to tzv. robinzonáda.');
    expect(firstSentences('Jedna! Dvě? Tři.', 2)).toBe('Jedna! Dvě?');
    expect(firstSentences('Bez tečky na konci', 2)).toBe('Bez tečky na konci');
    expect(firstSentences('', 2)).toBe('');
    expect(firstSentences('Monolog: „Zloději! Vrahové!“ Pak pláče. Konec.', 1)).toBe('Monolog: „Zloději! Vrahové!“ Pak pláče.');
  });

  it('každá kniha z databáze má tahák s hlavními částmi', () => {
    for (const seed of BOOK_DATABASE) {
      const s = bookSheet(seedToBook(seed));
      const titles = s.sections.map((x) => x.title);
      for (const t of ['Téma', 'Hlavní myšlenka', 'Kompozice', 'Hlavní postavy', 'Děj v bodech']) expect(titles, `${seed.id}: ${t}`).toContain(t);
      expect(s.subtitle, seed.id).toContain(seed.author);
    }
  });

  it('poznámky jen na přání a prázdné části se vynechají', () => {
    const b = seedToBook(BOOK_DATABASE[0], { notes: 'moje' });
    expect(bookSheet(b).sections.some((x) => x.title === 'Moje poznámky')).toBe(false);
    expect(bookSheet(b, true).sections.find((x) => x.title === 'Moje poznámky')?.text).toBe('moje');
    expect(bookSheet({ ...b, verse: '' }).sections.some((x) => x.title === 'Verš')).toBe(false);
  });

  it('každé téma IT předmětů má tahák s osnovou a pojmy', () => {
    for (const t of ALL_TOPICS) {
      const s = topicSheet(t);
      expect(s.sections.length, t.id).toBeGreaterThanOrEqual(2);
      expect(
        s.sections.some((x) => x.pairs?.length),
        t.id,
      ).toBe(t.terms.length > 0);
    }
  });
});

describe('Tahák literárních pojmů', () => {
  it('skupiny pokryjí všechny pojmy právě jednou', async () => {
    const { TERMS } = await import('../data/terms');
    const { TERM_SHEET_GROUPS, termSheet } = await import('./cheatsheet');
    const all = TERM_SHEET_GROUPS.flatMap((g) =>
      termSheet(g.id)
        .sections.flatMap((s) => s.pairs ?? [])
        .map((p) => p.term),
    );
    expect(all.sort()).toEqual(TERMS.map((t) => t.name).sort());
    for (const g of TERM_SHEET_GROUPS) for (const s of termSheet(g.id).sections) for (const p of s.pairs!) expect(p.def.length, p.term).toBeGreaterThan(10);
  });
});

describe('Kartičky autorů', () => {
  it('každý autor z výchozího seznamu má kartičku se směrem, díly a textem o autorovi', async () => {
    const { defaultData } = await import('./storage');
    const { groupAuthors } = await import('./authors');
    const { authorCard } = await import('./cheatsheet');
    const authors = groupAuthors(defaultData().books);
    expect(authors.length).toBeGreaterThan(10);
    expect(authors.some((a) => /nezn/i.test(a.name))).toBe(false);
    for (const a of authors) {
      const c = authorCard(a);
      const labels = c.rows.map((r) => r.label);
      for (const l of ['Směr', 'O autorovi', 'Ze seznamu']) expect(labels, a.name).toContain(l);
      expect(c.rows.find((r) => r.label === 'Ze seznamu')!.text, a.name).toContain(a.books[0].title);
    }
    // autor s více knihami v seznamu (Čapek) má obě na jedné kartičce
    const capek = authors.find((a) => a.name === 'Karel Čapek')!;
    expect(authorCard(capek).rows.find((r) => r.label === 'Ze seznamu')!.text).toMatch(/R\.U\.R\.[\s\S]*Válka s mloky|Válka s mloky[\s\S]*R\.U\.R\./);
  });
});

describe('Taháky na praktickou zkoušku a sloh', () => {
  it('příkazy Cisco a Linux: všechny příkazy, skupiny, neproporcionální písmo', async () => {
    const { ALL_COMMANDS } = await import('../data/site/commands');
    const { commandSheets } = await import('./cheatsheet');
    for (const p of ['cisco', 'linux'] as const) {
      const [s] = commandSheets(p, p, ALL_COMMANDS);
      expect(s.pack).toBe(true);
      expect(s.sections.every((x) => x.mono)).toBe(true);
      expect(s.sections.flatMap((x) => x.pairs!).length).toBe(ALL_COMMANDS.filter((c) => c.platform === p).length);
    }
    const [one] = commandSheets('cisco', 'Cisco', ALL_COMMANDS, ['VLAN']);
    expect(one.sections.map((x) => x.title)).toEqual(['VLAN']);
  });
  it('postupy, sloh a funkční styly mají všechny části', async () => {
    const { ALL_PROCEDURES } = await import('../data/site/procedures');
    const { WRITING_FORMS } = await import('../data/writing');
    const { FUNCTIONAL_STYLES } = await import('../data/styles');
    const { procedureSheets, writingSheets, stylesSheet } = await import('./cheatsheet');
    const cisco = ALL_PROCEDURES.filter((p) => p.platform === 'cisco');
    expect(procedureSheets('cisco', 'Cisco', cisco)[0].sections.map((s) => s.title)).toEqual(cisco.map((p) => p.title));
    expect(writingSheets(WRITING_FORMS)[0].sections.length).toBe(WRITING_FORMS.length);
    expect(stylesSheet(FUNCTIONAL_STYLES).sections.length).toBe(FUNCTIONAL_STYLES.length);
  });
  it('chronologie řadí knihy podle roku a dělí je podle století', async () => {
    const { defaultData } = await import('./storage');
    const { chronologySheet } = await import('./cheatsheet');
    const books = defaultData().books;
    const s = chronologySheet(books);
    const titles = s.sections.flatMap((x) => x.pairs!.map((p) => p.def.split(' – ')[0]));
    expect(titles.length).toBe(books.length);
    expect(titles[0]).toBe('Podkoní a žák');
    expect(titles.indexOf('Lakomec')).toBeLessThan(titles.indexOf('Máj'));
    expect(new Set(s.sections.map((x) => x.title)).size).toBe(s.sections.length); // žádný nadpis dvakrát
    expect(s.sections.map((x) => x.title)).toContain('20. století (do roku 1945)');
  });
});

describe('Barvy taháků podle předmětu', () => {
  it('sítě zelená, cloud oranžová, HW červená, pojmy světle modrá, knihy bez barvy', async () => {
    const m = await import('./cheatsheet');
    const { ALL_TOPICS } = await import('../data/subjects');
    const { ALL_COMMANDS } = await import('../data/site/commands');
    const { ALL_PROCEDURES } = await import('../data/site/procedures');
    const { BOOK_DATABASE, seedToBook } = await import('../data/books');
    const want = { site: '#22c55e', cloud: '#f97316', hw: '#ef4444' } as const;
    for (const t of ALL_TOPICS) if (t.subject !== 'cjl') expect(m.topicSheet(t).accent, t.id).toBe(want[t.subject]);
    expect(m.commandSheets('cisco', 'Cisco', ALL_COMMANDS)[0].accent).toBe(want.site);
    expect(
      m.procedureSheets(
        'linux',
        'Linux',
        ALL_PROCEDURES.filter((p) => p.platform === 'linux'),
      )[0].accent,
    ).toBe(want.site);
    expect(
      m.procedureSheets(
        'storage',
        'Úložiště',
        ALL_PROCEDURES.filter((p) => p.platform === 'storage'),
      )[0].accent,
    ).toBe(want.cloud);
    expect(m.termSheet('sloh').accent).toBe('#38bdf8');
    expect(m.bookSheet(seedToBook(BOOK_DATABASE[0])).accent).toBeUndefined();
  });
});

describe('Šablony slohových útvarů', () => {
  it('každý útvar má šablonu a úřední dopis odpovídá ČSN 01 6910', async () => {
    const { WRITING_FORMS } = await import('../data/writing');
    const { WRITING_TEMPLATES, templateFor } = await import('../data/writingTemplates');
    const { countWords, analyzeWriting } = await import('./writingcheck');
    for (const f of WRITING_FORMS) expect(templateFor(f.id), f.id).toBeTruthy();
    for (const t of WRITING_TEMPLATES) for (const v of t.variants) expect(countWords(v.text), v.id).toBeLessThan(25);
    const dopis = templateFor('dopis')!.variants.find((v) => v.id === 'dopis-uredni')!.text;
    expect(dopis).not.toMatch(/Věc:/);
    expect(dopis).toMatch(/^Vážená paní, vážený pane,\n\n\[[a-zěščřžýáíéůú]/m);
    expect(dopis).toMatch(/^S pozdravem$/m);
    expect(analyzeWriting(dopis).issues.some((i) => i.message.includes('nevyplněné místo'))).toBe(true);
    expect(countWords('[doplň] Ahoj světe')).toBe(2);
  });
});

describe('Schémata k sítím', () => {
  it('řádky hlaviček mají 32 bitů a témata existují', async () => {
    const { TOPIC_DIAGRAMS } = await import('../data/site/diagrams');
    for (const [id, ds] of Object.entries(TOPIC_DIAGRAMS)) {
      expect(ALL_TOPICS.some((t) => t.id === id), id).toBe(true);
      for (const d of ds) if (d.kind === 'fields' && d.words) for (const r of d.rows) expect(r.reduce((a, x) => a + x.span, 0), `${d.title}`).toBe(32);
    }
    const s = topicSheet(ALL_TOPICS.find((t) => t.id === 'site-tcp')!);
    expect(s.sections.filter((x) => x.diagram)).toHaveLength(2);
  });
});
